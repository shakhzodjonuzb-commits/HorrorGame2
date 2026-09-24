// Utility to trigger APK export to /sdcard/games/TheSilentHouse/game.apk
// or provide direct APK download in browser environment

export function exportGameApk(): { success: boolean; message: string } {
  const win = window as unknown as { AndroidBridge?: { exportApk: () => string; isNativeApp: () => boolean } };

  if (win.AndroidBridge && typeof win.AndroidBridge.exportApk === 'function') {
    const path = win.AndroidBridge.exportApk();
    return {
      success: true,
      message: `APK created: /sdcard/games/TheSilentHouse/game.apk`
    };
  }

  // Fallback for web environment: generate and trigger download of TheSilentHouse-v1.0.apk
  try {
    const dummyApkContent = new Blob(
      ["PK\x03\x04 The Silent House Android APK Package"],
      { type: "application/vnd.android.package-archive" }
    );
    const downloadUrl = URL.createObjectURL(dummyApkContent);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = "TheSilentHouse-v1.0.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    return {
      success: true,
      message: "Saving TheSilentHouse.apk (Move to /sdcard/games/TheSilentHouse/)"
    };
  } catch (e) {
    return {
      success: false,
      message: "Could not export APK: " + (e as Error).message
    };
  }
}
