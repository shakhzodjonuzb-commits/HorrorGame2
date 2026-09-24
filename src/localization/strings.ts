export type Language = 'en' | 'uz' | 'ru';

export interface Translations {
  gameTitle: string;
  gameSubtitle: string;
  singleplayer: string;
  localMultiplayer: string;
  settings: string;
  howToPlay: string;
  credits: string;
  exit: string;

  // Multiplayer
  hostGame: string;
  joinGame: string;
  roomCode: string;
  enterCodeOrIp: string;
  connect: string;
  searchingHosts: string;
  noHostsFound: string;
  availableLobbies: string;
  directJoin: string;
  lobbyTitle: string;
  playerName: string;
  ready: string;
  notReady: string;
  startGame: string;
  waitingForHost: string;
  playersConnected: string;
  maxPlayers: string;
  difficulty: string;
  escapeRule: string;
  ruleAll: string;
  ruleAny: string;
  ruleMajority: string;

  // Difficulties
  easy: string;
  normal: string;
  hard: string;
  nightmare: string;

  // In-Game HUD
  interact: string;
  crouch: string;
  sprint: string;
  flashlight: string;
  drop: string;
  hiding: string;
  exitHiding: string;
  noiseMeter: string;
  stamina: string;
  battery: string;
  objective: string;
  objectiveText: string;

  // Interaction prompts
  openDoor: string;
  closeDoor: string;
  doorLocked: string;
  needKey: string;
  pickUp: string;
  hideInCloset: string;
  hideUnderBed: string;
  insertFuse: string;
  cutChains: string;
  installBattery: string;
  installSparkPlug: string;
  turnValve: string;
  readNote: string;
  escapeCar: string;
  escapeFrontDoor: string;
  escapeTunnel: string;

  // Notifications
  noiseMade: string;
  caretakerAlerted: string;
  caretakerSearching: string;
  caretakerChasing: string;
  itemFound: string;
  chainCut: string;
  powerRestored: string;
  carFixed: string;
  tunnelDrained: string;
  playerCaught: string;
  playerEscaped: string;

  // Quick Pings
  pingEnemy: string;
  pingKey: string;
  pingHelp: string;
  pingDoor: string;
  pingHere: string;

  // Items
  itemMasterKey: string;
  itemBasementKey: string;
  itemGarageKey: string;
  itemBoltCutters: string;
  itemFuse: string;
  itemCarBattery: string;
  itemSparkPlug: string;
  itemCrowbar: string;
  itemValveWheel: string;
  itemFlashlight: string;
  itemNote: string;

  // End screens
  escapedTitle: string;
  escapedSubtitle: string;
  caughtTitle: string;
  caughtSubtitle: string;
  playAgain: string;
  backToMenu: string;
  timeSurvived: string;
  escapeRouteUsed: string;

  // Settings
  language: string;
  graphicsQuality: string;
  qualityLow: string;
  qualityMed: string;
  qualityHigh: string;
  fpsLimit: string;
  lookSensitivity: string;
  fieldOfView: string;
  soundVolume: string;
  ambientVolume: string;
  headBob: string;
  on: string;
  off: string;
  saveSettings: string;

  // Guide
  guideLoreTitle: string;
  guideLore: string;
  guideRulesTitle: string;
  guideRules: string;
  guideEnemyTitle: string;
  guideEnemy: string;
  guideEscapesTitle: string;
  guideEscapes: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    gameTitle: 'THE SILENT HOUSE',
    gameSubtitle: 'A Stealth Horror Survival Game',
    singleplayer: 'PLAY SINGLEPLAYER',
    localMultiplayer: 'LOCAL MULTIPLAYER (LAN)',
    settings: 'SETTINGS',
    howToPlay: 'SURVIVAL GUIDE',
    credits: 'CREDITS',
    exit: 'EXIT GAME',

    hostGame: 'HOST NEW GAME',
    joinGame: 'JOIN LOCAL GAME',
    roomCode: 'ROOM CODE / IP',
    enterCodeOrIp: 'Enter Room Code (e.g. DARK) or IP',
    connect: 'CONNECT',
    searchingHosts: 'Scanning local network for hosts...',
    noHostsFound: 'No games discovered on local Wi-Fi. Create one or join by IP/Code.',
    availableLobbies: 'LOCAL LOBBIES FOUND',
    directJoin: 'DIRECT CONNECT',
    lobbyTitle: 'LAN LOBBY',
    playerName: 'SURVIVOR NAME',
    ready: 'READY',
    notReady: 'NOT READY',
    startGame: 'START ESCAPE',
    waitingForHost: 'Waiting for host to start...',
    playersConnected: 'Survivors Connected',
    maxPlayers: 'Max Players',
    difficulty: 'DIFFICULTY',
    escapeRule: 'ESCAPE RULE',
    ruleAll: 'All Survivors Must Escape',
    ruleAny: 'Any Survivor Can Escape',
    ruleMajority: 'Majority Must Escape',

    easy: 'EASY (Dull Senses)',
    normal: 'NORMAL (Balanced)',
    hard: 'HARD (Acute Hearing)',
    nightmare: 'NIGHTMARE (Relentless Stalker)',

    interact: 'INTERACT',
    crouch: 'CROUCH',
    sprint: 'SPRINT',
    flashlight: 'LIGHT',
    drop: 'DROP',
    hiding: 'HIDING INSIDE',
    exitHiding: 'LEAVE HIDING SPOT',
    noiseMeter: 'NOISE LEVEL',
    stamina: 'STAMINA',
    battery: 'BATTERY',
    objective: 'CURRENT OBJECTIVE',
    objectiveText: 'Find escape items. Do not let The Caretaker hear or see you.',

    openDoor: 'Open Door',
    closeDoor: 'Close Door',
    doorLocked: 'Locked Door',
    needKey: 'Requires Key or Tool',
    pickUp: 'Pick Up',
    hideInCloset: 'Hide in Closet',
    hideUnderBed: 'Crawl Under Bed',
    insertFuse: 'Insert Fuse into Breaker',
    cutChains: 'Cut Heavy Chains',
    installBattery: 'Install Car Battery',
    installSparkPlug: 'Install Spark Plug',
    turnValve: 'Turn Drainage Valve',
    readNote: 'Read Scrawled Note',
    escapeCar: 'Escape in Car!',
    escapeFrontDoor: 'Escape through Front Door!',
    escapeTunnel: 'Escape through Secret Tunnel!',

    noiseMade: 'You made a noise!',
    caretakerAlerted: 'The Caretaker is investigating a sound...',
    caretakerSearching: 'The Caretaker is searching nearby!',
    caretakerChasing: 'THE CARETAKER HAS SPOTTED YOU! RUN!',
    itemFound: 'Picked up',
    chainCut: 'Chains cut from the Front Door!',
    powerRestored: 'Power restored to electronic keypad!',
    carFixed: 'Car engine started! Garage door open!',
    tunnelDrained: 'Floodwater drained! Secret tunnel open!',
    playerCaught: 'A survivor was caught by The Caretaker!',
    playerEscaped: 'A survivor reached safety!',

    pingEnemy: 'CARETAKER HERE!',
    pingKey: 'KEY / ITEM HERE!',
    pingHelp: 'I NEED HELP!',
    pingDoor: 'DOOR IS UNLOCKED!',
    pingHere: 'COME OVER HERE!',

    itemMasterKey: 'Front Door Key',
    itemBasementKey: 'Basement Key',
    itemGarageKey: 'Garage Key',
    itemBoltCutters: 'Heavy Bolt Cutters',
    itemFuse: 'Electrical Fuse',
    itemCarBattery: '12V Car Battery',
    itemSparkPlug: 'Car Spark Plug',
    itemCrowbar: 'Heavy Iron Crowbar',
    itemValveWheel: 'Brass Valve Wheel',
    itemFlashlight: 'Flashlight',
    itemNote: 'Survivor Note',

    escapedTitle: 'YOU ESCAPED THE SILENT HOUSE',
    escapedSubtitle: 'You survived the dark halls and slipped away into the night.',
    caughtTitle: 'CAUGHT BY THE CARETAKER',
    caughtSubtitle: 'Your footsteps echoed too loudly. There was nowhere left to run.',
    playAgain: 'TRY AGAIN',
    backToMenu: 'MAIN MENU',
    timeSurvived: 'Time Elapsed',
    escapeRouteUsed: 'Escape Route',

    language: 'LANGUAGE',
    graphicsQuality: 'GRAPHICS QUALITY',
    qualityLow: 'LOW (Fastest, Smooth 60 FPS)',
    qualityMed: 'MEDIUM (Balanced Shadows)',
    qualityHigh: 'HIGH (Horror Atmospheric)',
    fpsLimit: 'FPS TARGET',
    lookSensitivity: 'LOOK SENSITIVITY',
    fieldOfView: 'CAMERA FOV',
    soundVolume: 'SOUND EFFECTS',
    ambientVolume: 'AMBIENCE & MUSIC',
    headBob: 'HEAD BOBBING',
    on: 'ON',
    off: 'OFF',
    saveSettings: 'SAVE & RETURN',

    guideLoreTitle: 'THE SILENT HOUSE LORE',
    guideLore: 'An ancient, rotting manor long abandoned at the edge of the woods. Whispers say The Caretaker—a pale, towering figure clad in moth-eaten garments—still watches the corridors, listening for the faintest sound of trespassers.',
    guideRulesTitle: 'SURVIVAL RULES',
    guideRules: '• Noise attracts the Caretaker: Running creates loud noise, dropping items clatters, and old floorboards creak.\n• Crouch to move silently.\n• Flashlight illuminates the dark, but makes you visible from far away.\n• Hide in wardrobes or under beds when the enemy is nearby. Stay silent until footsteps fade.',
    guideEnemyTitle: 'THE CARETAKER AI',
    guideEnemy: 'The Caretaker does not cheat. He patrols the house, remembers routes, investigates noises, and sets alarm traps in doorways. If he catches sight of you, he will sprint in pursuit!',
    guideEscapesTitle: 'THREE ESCAPE ROUTES',
    guideEscapes: '1. FRONT DOOR: Find Master Key, Bolt Cutters to cut chains, and a Fuse to power the electric keypad.\n2. GARAGE CAR: Find Car Battery, Spark Plug, and Car Key to start the car and smash through the garage door.\n3. SECRET TUNNEL: Find Crowbar to open the lab hatch, and the Valve Wheel to drain the flooded tunnel.'
  },

  uz: {
    gameTitle: 'JIMJIT UY',
    gameSubtitle: 'Yashirin Qorquv va Omon Qolish O\'yini',
    singleplayer: 'YAKKA O\'YIN (BIR KISHILIK)',
    localMultiplayer: 'MAHALLIY MULTIPLAYER (LAN)',
    settings: 'SOZLAMALAR',
    howToPlay: 'OMON QOLISH QO\'LLANMASI',
    credits: 'MUALLIFLAR',
    exit: 'CHIQISH',

    hostGame: 'YANGI XONA OCHISH (HOST)',
    joinGame: 'XONAGA QO\'SHILISH (LAN)',
    roomCode: 'XONA KODI / IP',
    enterCodeOrIp: 'Xona kodi (masalan: DARK) yoki IP kiriting',
    connect: 'ULANISH',
    searchingHosts: 'Mahalliy Wi-Fi tarmog\'idan o\'yinlar qidirilmoqda...',
    noHostsFound: 'Mahalliy Wi-Fi orqali o\'yin topilmadi. Yangi o\'yin oching yoki IP/kod orqali kiring.',
    availableLobbies: 'TOPILGAN O\'YINLAR',
    directJoin: 'TO\'G\'RIDAN-TO\'G\'RI ULANISH',
    lobbyTitle: 'LAN LOBBI',
    playerName: 'O\'YINCHI NOMI',
    ready: 'TAYYOR',
    notReady: 'TAYYOR EMAS',
    startGame: 'O\'YINNI BOSHLASH',
    waitingForHost: 'Host o\'yinni boshlashini kuting...',
    playersConnected: 'Uланган Omon Qoluvchilar',
    maxPlayers: 'Maksimal O\'yinchilar',
    difficulty: 'QIYINLIK DARAJASI',
    escapeRule: 'QOCHISH QOIDASI',
    ruleAll: 'Barcha O\'yinchilar Qochishi Kerak',
    ruleAny: 'Istalgan Bitta O\'yinchi Qochsa Yetarli',
    ruleMajority: 'Ko\'pchilik Qochishi Kerak',

    easy: 'OSON (Eshitishi zaif)',
    normal: 'ODATIY (Muvozanatli)',
    hard: 'QIYIN (O\'tkir eshitish)',
    nightmare: 'DAHSHAT (To\'xtamas Qorovul)',

    interact: 'HARAKAT',
    crouch: 'EGILISH',
    sprint: 'YUGURISH',
    flashlight: 'CHIROQ',
    drop: 'TASHLASH',
    hiding: 'YASHIRINGANSIZ',
    exitHiding: 'CHIQISH',
    noiseMeter: 'SHOVQIN DARAJASI',
    stamina: 'CHIDAMLILIK',
    battery: 'BATARYA',
    objective: 'JORIY MAQSAD',
    objectiveText: 'Qochish buyumlarini toping. Qorovul sizni ko\'rib yoki eshitib qolmasin.',

    openDoor: 'Eshikni ochish',
    closeDoor: 'Eshikni yopish',
    doorLocked: 'Qulflangan eshik',
    needKey: 'Kalit yoki asbob kerak',
    pickUp: 'Olish',
    hideInCloset: 'Shkafga yashirinish',
    hideUnderBed: 'Karovot tagiga kirish',
    insertFuse: 'Saqlagichni (Fuse) o\'rnatish',
    cutChains: 'Zanjirlarni kesish',
    installBattery: 'Akkumulyatorni o\'rnatish',
    installSparkPlug: 'Svechani (Spark Plug) o\'rnatish',
    turnValve: 'Suv jo\'mragini burash',
    readNote: 'Xatni o\'qish',
    escapeCar: 'Mashinada qochish!',
    escapeFrontDoor: 'Asosiy eshikdan qochish!',
    escapeTunnel: 'Yashirin tunnildan qochish!',

    noiseMade: 'Siz shovqin qildingiz!',
    caretakerAlerted: 'Qorovul tovushni tekshirishga bormoqda...',
    caretakerSearching: 'Qorovul yaqin atrofni qidirmoqda!',
    caretakerChasing: 'QOROVUL SIZNI KO\'RIB QOLDI! QOCHING!',
    itemFound: 'Buyum olindi',
    chainCut: 'Bosh eshik zanjirlari kesildi!',
    powerRestored: 'Elektr ta\'minoti tiklandi!',
    carFixed: 'Mashina o\'t oldi! Garaj ochildi!',
    tunnelDrained: 'Suv to\'kildi! Yashirin tunnel ochiq!',
    playerCaught: 'Omon qoluvchi Qorovul qo\'liga tushdi!',
    playerEscaped: 'Omon qoluvchi qochib ketdi!',

    pingEnemy: 'QOROVUL SHU YERDA!',
    pingKey: 'KALIT / BUYUM BU YERDA!',
    pingHelp: 'YORDAM BERING!',
    pingDoor: 'ESHIK OCHILDI!',
    pingHere: 'BU YERGA KELING!',

    itemMasterKey: 'Bosh Eshik Kaliti',
    itemBasementKey: 'Yerto\'la Kaliti',
    itemGarageKey: 'Garaj Kaliti',
    itemBoltCutters: 'Katta Temir Qaychi',
    itemFuse: 'Elektr Saqlagich',
    itemCarBattery: '12V Akkumulyator',
    itemSparkPlug: 'Mashina Svechasi',
    itemCrowbar: 'Lom (Crowbar)',
    itemValveWheel: 'Jo\'mrak G\'ildiragi',
    itemFlashlight: 'Fonar',
    itemNote: 'Qolgan Yozuv',

    escapedTitle: 'SIZ JIMJIT UYDAN QOCHIB QUTULDINGIZ',
    escapedSubtitle: 'Qorong\'u zallardan omon o\'tib, tunda g\'oyib bo\'ldingiz.',
    caughtTitle: 'QOROVUL SIZNI USHLADI',
    caughtSubtitle: 'Qadamlaringiz juda qattiq yangradi. Qochishga joy qolmadi.',
    playAgain: 'QAYTA O\'YNASH',
    backToMenu: 'ASOSIY MENYU',
    timeSurvived: 'Ketgan Vaqt',
    escapeRouteUsed: 'Qochish Yo\'li',

    language: 'TIL (LANGUAGE)',
    graphicsQuality: 'GRAFIKA SIFATI',
    qualityLow: 'PAST (Juda tez, 60 FPS)',
    qualityMed: 'O\'RTA (Muvozanatli)',
    qualityHigh: 'YUQORI (To\'liq Qorong\'u Atmosfera)',
    fpsLimit: 'FPS CHEGARASI',
    lookSensitivity: 'BURILISH TEZLIGI',
    fieldOfView: 'KAMERA FOV',
    soundVolume: 'TOVUSH EFFEKTLARI',
    ambientVolume: 'MUSIQA VA SHOVQIN',
    headBob: 'QADAMDA TEBRANISH',
    on: 'YOQILGAN',
    off: 'O\'CHIRILGAN',
    saveSettings: 'SAQLASH VA CHIQISH',

    guideLoreTitle: 'JIMJIT UY TARIXI',
    guideLore: 'O\'rmon chetidagi tashlandiq, qadimiy va chirigan uy. Aytishlaricha, uning g\'amxo\'r Qorovuli—uzun bo\'yli, oqarib ketgan va eskirgan chopon kiygan dahshatli mavjudot—hali ham yo\'laklarni aylanib, mayda shitirlashni ham eshitadi.',
    guideRulesTitle: 'OMON QOLISH QOIDALARI',
    guideRules: '• Shovqin Qorovulni tortadi: Yugursangiz, narsa tashlasangiz yoki eski taxtalarni bossangiz qattiq tovush chiqadi.\n• Egilib yursangiz qadam tovushingiz eshitilmaydi.\n• Fonar qorong\'uni yoritadi, lekin Qorovul uzoqdan ko\'rib qoladi.\n• Shkaflarga yoki karavot ostiga yashirining.',
    guideEnemyTitle: 'QOROVULNING SUN\'IY INTELLEKTI',
    guideEnemy: 'Qorovul aldamaydi. U uyni patrullaydi, marshrutlarni eslaydi, shovqin chiqqan joylarni tekshiradi va eshiklar oldiga qo\'ng\'iroqli tuzoqlar qo\'yadi. Sizni ko\'rsa yugurib quvib keladi!',
    guideEscapesTitle: 'UCHTA QOCHISH YO\'LI',
    guideEscapes: '1. BOSH ESHIK: Bosh kalitni toping, zanjirni temir qaychi bilan kesing, yerto\'ladagi saqlagichni almashtirib elektr qulfni yoqing.\n2. GARAJ MASHINASI: Akkumulyator, svecha va kalitni topib mashinani o\'t oldiring va garaj eshigini yorib chiqing.\n3. YASHIRIN TUNNEL: Laboratoriya lyukini lom bilan oching va suvni jo\'mrak orqali to\'kib tunneldan chiqing.'
  },

  ru: {
    gameTitle: 'ТИХИЙ ДОМ',
    gameSubtitle: 'Стелс-хоррор на выживание',
    singleplayer: 'ОДИНОЧНАЯ ИГРА',
    localMultiplayer: 'ЛОКАЛЬНЫЙ МУЛЬТИПЛЕЕР (LAN)',
    settings: 'НАСТРОЙКИ',
    howToPlay: 'РУКОВОДСТВО ПО ВЫЖИВАНИЮ',
    credits: 'АВТОРЫ',
    exit: 'ВЫХОД',

    hostGame: 'СОЗДАТЬ СЕРВЕР (HOST)',
    joinGame: 'ПОДКЛЮЧИТЬСЯ (LAN)',
    roomCode: 'КОД КОМНАТЫ / IP',
    enterCodeOrIp: 'Введите код (например, DARK) или IP',
    connect: 'ВОЙТИ',
    searchingHosts: 'Поиск серверов в локальной сети Wi-Fi...',
    noHostsFound: 'Игры в локальной сети не найдены. Создайте сервер или войдите по коду.',
    availableLobbies: 'НАЙДЕННЫЕ СЕРВЕРЫ',
    directJoin: 'ПРЯМОЕ ПОДКЛЮЧЕНИЕ',
    lobbyTitle: 'LAN ЛОББИ',
    playerName: 'ИМЯ ВЫЖИВШЕГО',
    ready: 'ГОТОВ',
    notReady: 'НЕ ГОТОВ',
    startGame: 'НАЧАТЬ ПОБЕГ',
    waitingForHost: 'Ожидание запуска игры хостом...',
    playersConnected: 'Выживших в лобби',
    maxPlayers: 'Максимум игроков',
    difficulty: 'СЛОЖНОСТЬ',
    escapeRule: 'УСЛОВИЕ ПОБЕДЫ',
    ruleAll: 'Все должны сбежать',
    ruleAny: 'Хотя бы один сбежал',
    ruleMajority: 'Большинство сбежало',

    easy: 'ЛЕГКО (Плохой слух)',
    normal: 'НОРМАЛЬНО (Баланс)',
    hard: 'СЛОЖНО (Чуткий слух)',
    nightmare: 'КОШМАР (Неумолимый Смотритель)',

    interact: 'ДЕЙСТВИЕ',
    crouch: 'ПРИСЕСТЬ',
    sprint: 'БЕГ',
    flashlight: 'ФОНАРЬ',
    drop: 'БРОСИТЬ',
    hiding: 'ВЫ СПРЯТАЛИСЬ',
    exitHiding: 'ВЫЙТИ ИЗ УКРЫТИЯ',
    noiseMeter: 'УРОВЕНЬ ШУМА',
    stamina: 'ВЫНОСЛИВОСТЬ',
    battery: 'ЗАРЯД',
    objective: 'ТЕКУЩАЯ ЦЕЛЬ',
    objectiveText: 'Найдите предметы для побега. Не дайте Смотрителю услышать или заметить вас.',

    openDoor: 'Открыть дверь',
    closeDoor: 'Закрыть дверь',
    doorLocked: 'Дверь заперта',
    needKey: 'Требуется ключ или инструмент',
    pickUp: 'Подобрать',
    hideInCloset: 'Спрятаться в шкафу',
    hideUnderBed: 'Залезть под кровать',
    insertFuse: 'Вставить предохранитель',
    cutChains: 'Перекусить цепи болторезом',
    installBattery: 'Установить аккумулятор',
    installSparkPlug: 'Вкрутить свечу зажигания',
    turnValve: 'Повернуть вентиль слива',
    readNote: 'Прочитать записку',
    escapeCar: 'Сбежать на машине!',
    escapeFrontDoor: 'Сбежать через главную дверь!',
    escapeTunnel: 'Сбежать через тайный туннель!',

    noiseMade: 'Вы издали шум!',
    caretakerAlerted: 'Смотритель идет на шум...',
    caretakerSearching: 'Смотритель ищет поблизости!',
    caretakerChasing: 'СМОТРИТЕЛЬ ЗАМЕТИЛ ВАС! БЕГИТЕ!',
    itemFound: 'Подобран предмет',
    chainCut: 'Цепи на входной двери перекушены!',
    powerRestored: 'Питание кодового замка включено!',
    carFixed: 'Двигатель заведен! Ворота гаража открыты!',
    tunnelDrained: 'Вода откачана! Тайный туннель открыт!',
    playerCaught: 'Один из выживших схвачен Смотрителем!',
    playerEscaped: 'Выживший выбрался на свободу!',

    pingEnemy: 'СМОТРИТЕЛЬ ЗДЕСЬ!',
    pingKey: 'КЛЮЧ / ПРЕДМЕТ ЗДЕСЬ!',
    pingHelp: 'МНЕ НУЖНА ПОМОЩЬ!',
    pingDoor: 'ДВЕРЬ ОТКРЫТА!',
    pingHere: 'ИДИТЕ СЮДА!',

    itemMasterKey: 'Ключ от парадной двери',
    itemBasementKey: 'Ключ от подвала',
    itemGarageKey: 'Ключ от гаража',
    itemBoltCutters: 'Мощный болторез',
    itemFuse: 'Электрический предохранитель',
    itemCarBattery: 'Автомобильный аккумулятор',
    itemSparkPlug: 'Свеча зажигания',
    itemCrowbar: 'Тяжелый железный лом',
    itemValveWheel: 'Латунный вентиль',
    itemFlashlight: 'Фонарик',
    itemNote: 'Записка жертвы',

    escapedTitle: 'ВЫ СБЕЖАЛИ ИЗ ТИХОГО ДОМА',
    escapedSubtitle: 'Вы преодолели мрак заброшенного поместья и растворились в ночи.',
    caughtTitle: 'ВАС СХВАТИЛ СМОТРИТЕЛЬ',
    caughtSubtitle: 'Ваши шаги прозвучали слишком громко. Бежать было некуда.',
    playAgain: 'ИГРАТЬ СНОВА',
    backToMenu: 'ГЛАВНОЕ МЕНЮ',
    timeSurvived: 'Время выживания',
    escapeRouteUsed: 'Путь побега',

    language: 'ЯЗЫК (LANGUAGE)',
    graphicsQuality: 'КАЧЕСТВО ГРАФИКИ',
    qualityLow: 'НИЗКОЕ (Быстро, 60 FPS)',
    qualityMed: 'СРЕДНЕЕ (Баланс)',
    qualityHigh: 'ВЫСОКОЕ (Полная атмосфера)',
    fpsLimit: 'ЦЕЛЕВОЙ FPS',
    lookSensitivity: 'ЧУВСТВИТЕЛЬНОСТЬ',
    fieldOfView: 'УГОЛ ОБЗОРА (FOV)',
    soundVolume: 'ЗВУКОВЫЕ ЭФФЕКТЫ',
    ambientVolume: 'МУЗЫКА И ЭМБИЕНТ',
    headBob: 'ПОКАЧИВАНИЕ ГОЛОВЫ',
    on: 'ВКЛ',
    off: 'ВЫКЛ',
    saveSettings: 'СОХРАНИТЬ И ВЫЙТИ',

    guideLoreTitle: 'ИСТОРИЯ ТИХОГО ДОМА',
    guideLore: 'Старинный полуразрушенный особняк на краю леса. Поговаривают, что его бессменный Смотритель — высокое бледное существо в старых лохмотьях — все еще бродит по комнатам, чутко вслушиваясь в любой шорох.',
    guideRulesTitle: 'ПРАВИЛА ВЫЖИВАНИЯ',
    guideRules: '• Шум привлекает врага: Бег, бросание предметов и скрип старых досок слышны издалека.\n• Передвигайтесь крадучись, чтобы шаги были бесшумными.\n• Фонарик спасает от тьмы, но выдает вас на большом расстоянии.\n• Прячьтесь в шкафах или под кроватями, когда Смотритель рядом.',
    guideEnemyTitle: 'ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ',
    guideEnemy: 'Смотритель не телепортируется. Он методично обходит дом, проверяет звуки, осматривает углы и ставит колокольные ловушки в дверных проемах. Заметив игрока, он переходит на быстрый бег!',
    guideEscapesTitle: 'ТРИ ПУТИ ПОБЕГА',
    guideEscapes: '1. ПАРАДНАЯ ДВЕРЬ: Найдите ключ, болторез для цепей и предохранитель для кодовой панели в подвале.\n2. МАШИНА В ГАРАЖЕ: Найдите аккумулятор, свечу и ключ зажигания, чтобы завести авто и пробить ворота.\n3. ТАЙНЫЙ ТУННЕЛЬ: Вскройте люк ломом в лаборатории и слейте воду вентилем.'
  }
};
