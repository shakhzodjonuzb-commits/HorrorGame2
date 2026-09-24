package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.util.Log
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import kotlin.concurrent.thread

class MainActivity : ComponentActivity() {

  private var webView: WebView? = null
  private val TAG = "TheSilentHouse"

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    hideSystemUI()

    // Automatically export own APK to /sdcard/games/TheSilentHouse/game.apk on startup
    thread(start = true) {
      exportOwnApkToStorage()
    }

    val wv = WebView(this)
    webView = wv

    val settings: WebSettings = wv.settings
    settings.javaScriptEnabled = true
    settings.domStorageEnabled = true
    settings.databaseEnabled = true
    settings.allowFileAccess = true
    settings.allowContentAccess = true
    settings.mediaPlaybackRequiresUserGesture = false
    settings.loadWithOverviewMode = true
    settings.useWideViewPort = true
    settings.setSupportZoom(false)

    // Hardware accelerated 60 FPS
    wv.setLayerType(View.LAYER_TYPE_HARDWARE, null)

    // Expose native APK exporter bridge to JavaScript
    wv.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

    wv.webViewClient = object : WebViewClient() {
      override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        hideSystemUI()
      }
    }

    wv.loadUrl("file:///android_asset/dist/index.html")
    setContentView(wv)
  }

  /**
   * Copies the application's own APK file (applicationInfo.sourceDir)
   * to /sdcard/games/TheSilentHouse/game.apk
   */
  fun exportOwnApkToStorage(): String {
    try {
      val sourceDir = applicationInfo.sourceDir
      val sourceApk = File(sourceDir)

      if (!sourceApk.exists()) {
        Log.e(TAG, "Source APK not found at: $sourceDir")
        return "Source APK missing"
      }

      // Primary target: /sdcard/games/TheSilentHouse/game.apk
      val targetDir = File("/sdcard/games/TheSilentHouse")
      if (!targetDir.exists()) {
        targetDir.mkdirs()
      }

      val targetFile = File(targetDir, "game.apk")

      FileInputStream(sourceApk).use { input ->
        FileOutputStream(targetFile).use { output ->
          input.copyTo(output)
        }
      }

      Log.i(TAG, "Successfully created own APK at ${targetFile.absolutePath} (${targetFile.length()} bytes)")

      // Also copy to secondary external storage as fallback for Android 11+ scoped storage
      try {
        val appExtDir = File(getExternalFilesDir(null), "games/TheSilentHouse")
        appExtDir.mkdirs()
        val appExtFile = File(appExtDir, "game.apk")
        sourceApk.copyTo(appExtFile, overwrite = true)
      } catch (ignored: Exception) {}

      runOnUiThread {
        Toast.makeText(
          this,
          "APK created at /sdcard/games/TheSilentHouse/game.apk",
          Toast.LENGTH_LONG
        ).show()
      }

      return targetFile.absolutePath
    } catch (e: Exception) {
      Log.e(TAG, "Error creating APK at /sdcard/games/TheSilentHouse/game.apk", e)
      return "Error: ${e.localizedMessage}"
    }
  }

  inner class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun exportApk(): String {
      return exportOwnApkToStorage()
    }

    @JavascriptInterface
    fun isNativeApp(): Boolean {
      return true
    }
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      hideSystemUI()
    }
  }

  private fun hideSystemUI() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      window.insetsController?.let { controller ->
        controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
        controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      }
    } else {
      @Suppress("DEPRECATION")
      window.decorView.systemUiVisibility = (
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
          or View.SYSTEM_UI_FLAG_FULLSCREEN
          or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      )
    }
  }

  override fun onDestroy() {
    webView?.destroy()
    super.onDestroy()
  }
}
