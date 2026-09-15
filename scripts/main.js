const MODULE_ID = "foundry-intermission";
const SESSION_SCHEMA = 1;
const IMAGE_EXTENSIONS = [".apng", ".avif", ".bmp", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".tiff", ".webp"];
const CHARACTER_POSITIONS = ["left", "mid-left", "center", "mid-right", "right"];
const CHARACTER_MOTIONS = ["slide-left", "slide-right", "zoom-in", "zoom-out", "still"];
const BACKGROUND_MOTIONS = ["pan-left", "pan-right", "pan-up", "pan-down", "zoom-in", "zoom-out", "diag-a", "diag-b"];
const POSITION_RATIOS = {
  left: 0.22,
  "mid-left": 0.36,
  center: 0.5,
  "mid-right": 0.64,
  right: 0.78
};

const WORLD_SETTING_KEYS = [
  "characterFolder",
  "characterSource",
  "characterBucket",
  "backgroundFolder",
  "backgroundSource",
  "backgroundBucket",
  "charactersRecursive",
  "backgroundsRecursive",
  "slideMin",
  "slideMax",
  "crossfade",
  "motionIntensity",
  "defaultDuration",
  "allowPlayerMinimize",
  "timerMode",
  "timerLastSeconds",
  "timerPosition"
];

function localize(key) {
  return game.i18n.localize(`FOUNDRY_INTERMISSION.${key}`);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function shuffle(array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

class ShuffleBag {
  constructor(items) {
    this.items = [...items];
    this.bag = [];
    this.last = undefined;
  }

  next() {
    if (!this.items.length) return undefined;
    if (!this.bag.length) {
      this.bag = shuffle(this.items);
      if (this.bag.length > 1 && this.last !== undefined && this.bag[0] === this.last) {
        const swapIndex = this.bag.findIndex(value => value !== this.last);
        if (swapIndex > 0) [this.bag[0], this.bag[swapIndex]] = [this.bag[swapIndex], this.bag[0]];
      }
    }
    const value = this.bag.shift();
    this.last = value;
    return value;
  }
}

function getSettingsSnapshot() {
  const snapshot = {};
  for (const key of WORLD_SETTING_KEYS) snapshot[key] = game.settings.get(MODULE_ID, key);
  return normalizeSettings(snapshot);
}

function normalizeSettings(raw) {
  const settings = {
    characterFolder: String(raw.characterFolder ?? "").trim(),
    characterSource: String(raw.characterSource ?? "data") || "data",
    characterBucket: String(raw.characterBucket ?? ""),
    backgroundFolder: String(raw.backgroundFolder ?? "").trim(),
    backgroundSource: String(raw.backgroundSource ?? "data") || "data",
    backgroundBucket: String(raw.backgroundBucket ?? ""),
    charactersRecursive: Boolean(raw.charactersRecursive),
    backgroundsRecursive: Boolean(raw.backgroundsRecursive),
    slideMin: Number(raw.slideMin ?? 10),
    slideMax: Number(raw.slideMax ?? 14),
    crossfade: Number(raw.crossfade ?? 2),
    motionIntensity: Number(raw.motionIntensity ?? 1),
    defaultDuration: Number(raw.defaultDuration ?? 300),
    allowPlayerMinimize: Boolean(raw.allowPlayerMinimize),
    timerMode: ["never", "always", "last"].includes(raw.timerMode) ? raw.timerMode : "last",
    timerLastSeconds: Number(raw.timerLastSeconds ?? 30),
    timerPosition: ["top-left", "top-right", "bottom-left", "bottom-right"].includes(raw.timerPosition) ? raw.timerPosition : "bottom-right"
  };

  settings.slideMin = clamp(Number.isFinite(settings.slideMin) ? settings.slideMin : 10, 4, 60);
  settings.slideMax = clamp(Number.isFinite(settings.slideMax) ? settings.slideMax : 14, settings.slideMin, 60);
  settings.crossfade = clamp(Number.isFinite(settings.crossfade) ? settings.crossfade : 2, 0.2, Math.max(0.2, settings.slideMin * 0.45));
  settings.motionIntensity = clamp(Number.isFinite(settings.motionIntensity) ? settings.motionIntensity : 1, 0, 2);
  settings.defaultDuration = clamp(Number.isFinite(settings.defaultDuration) ? settings.defaultDuration : 300, 10, 86400);
  settings.timerLastSeconds = clamp(Number.isFinite(settings.timerLastSeconds) ? settings.timerLastSeconds : 30, 5, 3600);
  return settings;
}

async function saveSettings(settings) {
  const normalized = normalizeSettings(settings);
  for (const key of WORLD_SETTING_KEYS) await game.settings.set(MODULE_ID, key, normalized[key]);
  return normalized;
}

function settingsFromForm(form) {
  const value = name => form.elements[name]?.value;
  return normalizeSettings({
    characterFolder: value("characterFolder"),
    characterSource: value("characterSource") ?? "data",
    characterBucket: value("characterBucket") ?? "",
    backgroundFolder: value("backgroundFolder"),
    backgroundSource: value("backgroundSource") ?? "data",
    backgroundBucket: value("backgroundBucket") ?? "",
    charactersRecursive: form.elements.charactersRecursive?.checked ?? false,
    backgroundsRecursive: form.elements.backgroundsRecursive?.checked ?? false,
    slideMin: value("slideMin"),
    slideMax: value("slideMax"),
    crossfade: value("crossfade"),
    motionIntensity: value("motionIntensity"),
    defaultDuration: value("defaultDuration"),
    allowPlayerMinimize: form.elements.allowPlayerMinimize?.checked ?? false,
    timerMode: value("timerMode"),
    timerLastSeconds: value("timerLastSeconds"),
    timerPosition: value("timerPosition")
  });
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;


class IntermissionLaunchApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-launch`,
    classes: [MODULE_ID, "intermission-launch"],
    tag: "form",
    position: { width: 420 },
    window: {
      title: "FOUNDRY_INTERMISSION.Launch.Title",
      icon: "fa-solid fa-person-walking-arrow-right"
    },
    form: {
      closeOnSubmit: true,
      handler: this.#onSubmit
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/launch.hbs`
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const settings = getSettingsSnapshot();
    const presets = [30, 60, 120, 300, 600];
    const selectedPreset = presets.includes(settings.defaultDuration) ? String(settings.defaultDuration) : "custom";
    const durationOptions = [
      { value: "30", label: localize("Launch.Seconds30") },
      { value: "60", label: localize("Launch.Minute1") },
      { value: "120", label: localize("Launch.Minutes2") },
      { value: "300", label: localize("Launch.Minutes5") },
      { value: "600", label: localize("Launch.Minutes10") },
      { value: "custom", label: localize("Launch.Custom") },
      { value: "infinite", label: localize("Launch.Infinite") }
    ].map(option => ({ ...option, selected: option.value === selectedPreset }));
    return { ...context, settings, durationOptions };
  }

  static async #onSubmit(event, form) {
    const mode = String(form.elements.durationMode?.value ?? "custom");
    const customSeconds = Number(form.elements.customSeconds?.value);
    let durationSeconds = null;

    if (mode !== "infinite") {
      durationSeconds = mode === "custom" ? customSeconds : Number(mode);
      if (!Number.isFinite(durationSeconds) || durationSeconds < 10) {
        ui.notifications.error(localize("Notify.InvalidDuration"));
        throw new Error(localize("Notify.InvalidDuration"));
      }
    }

    await IntermissionManager.instance.startSession(durationSeconds, getSettingsSnapshot());
    return true;
  }
}

class IntermissionSettingsApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-settings`,
    classes: [MODULE_ID, "intermission-settings"],
    tag: "form",
    position: { width: 650 },
    window: {
      title: "FOUNDRY_INTERMISSION.Settings.Title",
      icon: "fa-solid fa-sliders"
    },
    form: {
      closeOnSubmit: true,
      handler: this.#onSubmit
    },
    actions: {
      pickCharacters: this.#pickCharacters,
      pickBackgrounds: this.#pickBackgrounds,
      preview: this.#preview
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/settings.hbs`
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const settings = getSettingsSnapshot();
    return {
      ...context,
      settings,
      timerModes: [
        { value: "never", label: localize("Settings.TimerNever"), selected: settings.timerMode === "never" },
        { value: "always", label: localize("Settings.TimerAlways"), selected: settings.timerMode === "always" },
        { value: "last", label: localize("Settings.TimerLast"), selected: settings.timerMode === "last" }
      ],
      timerPositions: [
        { value: "top-left", label: localize("Settings.TopLeft"), selected: settings.timerPosition === "top-left" },
        { value: "top-right", label: localize("Settings.TopRight"), selected: settings.timerPosition === "top-right" },
        { value: "bottom-left", label: localize("Settings.BottomLeft"), selected: settings.timerPosition === "bottom-left" },
        { value: "bottom-right", label: localize("Settings.BottomRight"), selected: settings.timerPosition === "bottom-right" }
      ]
    };
  }

  static async #onSubmit(event, form) {
    const settings = settingsFromForm(form);
    await saveSettings(settings);
    ui.notifications.info(localize("Notify.Saved"));
  }

  static #pickCharacters() {
    openSettingsFolderPicker(this, "character");
  }

  static #pickBackgrounds() {
    openSettingsFolderPicker(this, "background");
  }

  static async #preview() {
    if (!this.form) return;
    const settings = settingsFromForm(this.form);
    await saveSettings(settings);
    await this.close();
    await IntermissionManager.instance.startPreview(settings);
  }
}


function openSettingsFolderPicker(app, kind) {
  const folderInput = app.form?.elements[`${kind}Folder`];
  const sourceInput = app.form?.elements[`${kind}Source`];
  const bucketInput = app.form?.elements[`${kind}Bucket`];
  if (!folderInput || !sourceInput || !bucketInput) return;

  let picker;
  picker = new foundry.applications.apps.FilePicker({
    type: "folder",
    current: folderInput.value,
    activeSource: sourceInput.value || "data",
    allowUpload: false,
    callback: path => {
      folderInput.value = path;
      sourceInput.value = picker.activeSource || "data";
      bucketInput.value = picker.sources?.[picker.activeSource]?.bucket ?? "";
    }
  });
  picker.render({ force: true });
}

class IntermissionManager {
  static instance = new IntermissionManager();

  constructor() {
    this.session = null;
    this.preview = false;
    this.minimized = false;
    this.root = null;
    this.pill = null;
    this.pairs = [];
    this.activePair = 0;
    this.slideTimer = null;
    this.clockInterval = null;
    this.finalizeTimer = null;
    this.previewClearTimer = null;
    this.endingStarted = false;
    this.finalizeScheduledFor = null;
    this.renderGeneration = 0;
    this.imagePromises = new Map();
  }

  async ready() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.session && !this.minimized && !this.endingStarted) this.#renderCurrent(false);
    });

    const stored = game.settings.get(MODULE_ID, "activeSession");
    await this.syncFromWorld(stored);
  }

  async syncFromWorld(value) {
    const session = this.#validateSession(value);
    if (!session) {
      if (!this.preview) this.#clearLocal();
      return;
    }

    if (this.preview) this.#clearLocal();

    if (this.session?.id === session.id && !this.preview) {
      this.session = session;
      this.#scheduleLifecycle();
      this.#updateClockDisplay();
      return;
    }

    await this.#startLocal(session, { preview: false });
  }

  async triggerPrimaryAction() {
    if (this.session) {
      if (this.preview || game.user.isGM || this.session.allowPlayerMinimize) this.toggleMinimize();
      return;
    }
    if (!game.user.isGM) {
      ui.notifications.warn(localize("Notify.NeedGM"));
      return;
    }
    await this.openLaunchDialog();
  }

  async openLaunchDialog() {
    if (!game.user.isGM) return ui.notifications.warn(localize("Notify.NeedGM"));
    const active = this.#validateSession(game.settings.get(MODULE_ID, "activeSession"));
    if (active) return ui.notifications.warn(localize("Notify.AlreadyActive"));

    try {
      const existing = foundry.applications.instances?.get?.(`${MODULE_ID}-launch`);
      if (existing) {
        existing.bringToFront?.();
        return existing;
      }
      const app = new IntermissionLaunchApp();
      app.render({ force: true });
      return app;
    } catch (error) {
      console.error(`${MODULE_ID} | Failed to open launch window`, error);
      ui.notifications.error(localize("Notify.ActionError"));
      return null;
    }
  }

  async startSession(durationSeconds, settings = getSettingsSnapshot()) {
    if (!game.user.isGM) return ui.notifications.warn(localize("Notify.NeedGM"));
    if (this.#validateSession(game.settings.get(MODULE_ID, "activeSession"))) {
      return ui.notifications.warn(localize("Notify.AlreadyActive"));
    }

    const normalized = normalizeSettings(settings);
    if (!normalized.characterFolder || !normalized.backgroundFolder) {
      ui.notifications.warn(localize("Notify.FoldersMissing"));
      new IntermissionSettingsApp().render({ force: true });
      return;
    }

    ui.notifications.info(localize("Notify.Preparing"));
    let assets;
    try {
      assets = await this.#loadConfiguredAssets(normalized);
    } catch (error) {
      console.error(`${MODULE_ID} | Failed to browse configured folders`, error);
      ui.notifications.error(localize("Notify.BrowseError"));
      return;
    }

    if (!assets.characters.length) return ui.notifications.error(localize("Notify.NoCharacters"));
    if (!assets.backgrounds.length) return ui.notifications.error(localize("Notify.NoBackgrounds"));

    const durationMs = durationSeconds == null ? null : Math.round(durationSeconds * 1000);
    const startedAt = Date.now() + 700;
    const slides = this.#buildSlides(assets, normalized, durationMs);
    const session = {
      schema: SESSION_SCHEMA,
      id: foundry.utils.randomID(16),
      createdAt: Date.now(),
      startedAt,
      endsAt: durationMs == null ? null : startedAt + durationMs,
      stoppingAt: null,
      infinite: durationMs == null,
      initiatorId: game.user.id,
      moduleSetPause: !game.paused,
      backgrounds: assets.backgrounds,
      characters: assets.characters,
      slides,
      crossfadeMs: Math.round(normalized.crossfade * 1000),
      motionIntensity: normalized.motionIntensity,
      allowPlayerMinimize: normalized.allowPlayerMinimize,
      timerMode: normalized.timerMode,
      timerLastSeconds: normalized.timerLastSeconds,
      timerPosition: normalized.timerPosition
    };

    // Decode the first pair on the GM client before broadcasting. This catches broken first assets early.
    const first = session.slides[0];
    await Promise.allSettled([
      this.#preloadImage(session.backgrounds[first.background]),
      this.#preloadImage(session.characters[first.character])
    ]);

    await game.settings.set(MODULE_ID, "activeSession", session);
    if (session.moduleSetPause) game.togglePause(true, { broadcast: true });
    await this.#startLocal(session, { preview: false });
  }

  async startPreview(settings = getSettingsSnapshot()) {
    if (!game.user.isGM) return;
    if (this.#validateSession(game.settings.get(MODULE_ID, "activeSession"))) {
      ui.notifications.warn(localize("Notify.AlreadyActive"));
      return;
    }

    const normalized = normalizeSettings(settings);
    if (!normalized.characterFolder || !normalized.backgroundFolder) {
      ui.notifications.warn(localize("Notify.FoldersMissing"));
      return;
    }

    let assets;
    try {
      assets = await this.#loadConfiguredAssets(normalized);
    } catch (error) {
      console.error(`${MODULE_ID} | Failed to browse configured folders`, error);
      ui.notifications.error(localize("Notify.BrowseError"));
      return;
    }
    if (!assets.characters.length) return ui.notifications.error(localize("Notify.NoCharacters"));
    if (!assets.backgrounds.length) return ui.notifications.error(localize("Notify.NoBackgrounds"));

    const startedAt = Date.now() + 100;
    const durationMs = 20_000;
    const session = {
      schema: SESSION_SCHEMA,
      id: `preview-${foundry.utils.randomID(12)}`,
      createdAt: Date.now(),
      startedAt,
      endsAt: startedAt + durationMs,
      stoppingAt: null,
      infinite: false,
      initiatorId: game.user.id,
      moduleSetPause: false,
      backgrounds: assets.backgrounds,
      characters: assets.characters,
      slides: this.#buildSlides(assets, normalized, durationMs),
      crossfadeMs: Math.round(normalized.crossfade * 1000),
      motionIntensity: normalized.motionIntensity,
      allowPlayerMinimize: true,
      timerMode: normalized.timerMode,
      timerLastSeconds: normalized.timerLastSeconds,
      timerPosition: normalized.timerPosition
    };

    await this.#startLocal(session, { preview: true });
  }

  async requestStop() {
    if (!this.session) return;
    if (this.preview) {
      this.session.stoppingAt = Date.now();
      this.#scheduleLifecycle();
      return;
    }
    if (!game.user.isGM) return;

    const current = this.#validateSession(game.settings.get(MODULE_ID, "activeSession"));
    if (!current || current.id !== this.session.id) return;
    if (current.stoppingAt) return;

    const updated = { ...current, stoppingAt: Date.now() + 100 };
    await game.settings.set(MODULE_ID, "activeSession", updated);
    this.session = updated;
    this.#scheduleLifecycle();
  }

  toggleMinimize() {
    if (!this.session) return;
    if (!this.preview && !game.user.isGM && !this.session.allowPlayerMinimize) return;
    if (this.minimized) this.#restoreOverlay();
    else this.#minimizeOverlay();
  }

  openSettings() {
    if (game.user.isGM) new IntermissionSettingsApp().render({ force: true });
  }

  #validateSession(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (value.schema !== SESSION_SCHEMA || typeof value.id !== "string") return null;
    if (!Array.isArray(value.backgrounds) || !value.backgrounds.length) return null;
    if (!Array.isArray(value.characters) || !value.characters.length) return null;
    if (!Array.isArray(value.slides) || !value.slides.length) return null;
    if (!Number.isFinite(Number(value.startedAt))) return null;
    return value;
  }

  async #loadConfiguredAssets(settings) {
    const [characters, backgrounds] = await Promise.all([
      this.#browseImages(settings.characterSource, settings.characterFolder, settings.characterBucket, settings.charactersRecursive),
      this.#browseImages(settings.backgroundSource, settings.backgroundFolder, settings.backgroundBucket, settings.backgroundsRecursive)
    ]);
    return {
      characters: [...new Set(characters)].sort((a, b) => a.localeCompare(b)),
      backgrounds: [...new Set(backgrounds)].sort((a, b) => a.localeCompare(b))
    };
  }

  async #browseImages(source, folder, bucket, recursive) {
    const FilePicker = foundry.applications.apps.FilePicker;
    const files = [];
    const queue = [folder];
    const visited = new Set();

    while (queue.length) {
      const target = queue.shift();
      if (!target || visited.has(target)) continue;
      visited.add(target);
      const result = await FilePicker.browse(source || "data", target, {
        bucket: bucket || undefined,
        extensions: IMAGE_EXTENSIONS
      });
      for (const file of result.files ?? []) {
        const bare = String(file).split(/[?#]/, 1)[0].toLowerCase();
        if (IMAGE_EXTENSIONS.some(ext => bare.endsWith(ext))) files.push(file);
      }
      if (recursive) {
        for (const dir of result.dirs ?? []) if (!visited.has(dir)) queue.push(dir);
      }
    }
    return files;
  }

  #buildSlides(assets, settings, durationMs) {
    const backgroundBag = new ShuffleBag(assets.backgrounds.map((_, i) => i));
    const characterBag = new ShuffleBag(assets.characters.map((_, i) => i));
    const positionBag = new ShuffleBag(CHARACTER_POSITIONS);
    const characterMotionBag = new ShuffleBag(CHARACTER_MOTIONS);
    const backgroundMotionBag = new ShuffleBag(BACKGROUND_MOTIONS);
    const minMs = Math.round(settings.slideMin * 1000);
    const maxMs = Math.round(settings.slideMax * 1000);
    const slides = [];
    let total = 0;
    const target = durationMs == null ? null : durationMs + maxMs;
    const infiniteCount = 256;

    while ((target != null && total < target) || (target == null && slides.length < infiniteCount)) {
      const duration = Math.round(randomBetween(minMs, maxMs));
      slides.push({
        background: backgroundBag.next(),
        character: characterBag.next(),
        position: positionBag.next(),
        backgroundMotion: backgroundMotionBag.next(),
        characterMotion: characterMotionBag.next(),
        durationMs: duration
      });
      total += duration;
      if (slides.length > 2048) break;
    }
    return slides;
  }

  async #startLocal(session, { preview }) {
    if (this.session?.id === session.id && this.preview === preview) {
      this.session = session;
      this.#scheduleLifecycle();
      return;
    }

    this.#clearLocal();
    this.session = session;
    this.preview = preview;
    this.minimized = false;
    this.endingStarted = false;
    this.finalizeScheduledFor = null;
    this.#buildOverlay();
    this.#startClock();
    this.#scheduleLifecycle();
    await this.#renderCurrent(false);
  }

  #buildOverlay() {
    this.#destroyOverlayOnly();
    if (!this.session || this.minimized) return;

    const root = document.createElement("div");
    root.id = `${MODULE_ID}-overlay`;
    root.className = "fi-overlay";
    root.setAttribute("role", "presentation");

    const stage = document.createElement("div");
    stage.className = "fi-stage";
    root.append(stage);

    this.pairs = [0, 1].map(index => {
      const pair = document.createElement("div");
      pair.className = "fi-pair";
      pair.dataset.slot = String(index);
      const background = document.createElement("img");
      background.className = "fi-background";
      background.alt = "";
      background.draggable = false;
      const plane = document.createElement("div");
      plane.className = "fi-character-plane";
      const wrap = document.createElement("div");
      wrap.className = "fi-character-wrap";
      const character = document.createElement("img");
      character.className = "fi-character";
      character.alt = "";
      character.draggable = false;
      wrap.append(character);
      plane.append(wrap);
      pair.append(background, plane);
      pair._fi = { background, wrap, character, animations: [] };
      stage.append(pair);
      return pair;
    });

    const endingMask = document.createElement("div");
    endingMask.className = "fi-ending-mask";
    root.append(endingMask);

    const timer = document.createElement("div");
    timer.className = "fi-timer";
    timer.dataset.position = this.session.timerPosition || "bottom-right";
    timer.setAttribute("aria-live", "off");
    root.append(timer);
    root._fiTimer = timer;

    const controls = document.createElement("div");
    controls.className = "fi-overlay-controls";
    const canMinimize = this.preview || game.user.isGM || this.session.allowPlayerMinimize;
    if (canMinimize) {
      const minimize = document.createElement("button");
      minimize.type = "button";
      minimize.innerHTML = `<i class="fa-solid fa-window-minimize"></i> ${localize("Overlay.Minimize")}`;
      minimize.addEventListener("click", event => {
        event.stopPropagation();
        this.toggleMinimize();
      });
      controls.append(minimize);
    }
    if (this.preview || game.user.isGM) {
      const finish = document.createElement("button");
      finish.type = "button";
      finish.innerHTML = `<i class="fa-solid fa-stop"></i> ${localize("Overlay.Finish")}`;
      finish.addEventListener("click", event => {
        event.stopPropagation();
        this.requestStop();
      });
      controls.append(finish);
    }
    root.append(controls);

    if (this.preview) {
      const badge = document.createElement("div");
      badge.className = "fi-preview-badge";
      badge.textContent = localize("Overlay.Preview");
      root.append(badge);
    }

    document.body.append(root);
    this.root = root;
    this.activePair = 0;
    this.renderGeneration += 1;
    if (this.#isEnding()) {
      root.classList.add("fi-ending");
      this.endingStarted = true;
    }
    this.#updateClockDisplay();
  }

  #destroyOverlayOnly() {
    this.renderGeneration += 1;
    clearTimeout(this.slideTimer);
    this.slideTimer = null;
    for (const pair of this.pairs) this.#cancelPairAnimations(pair);
    this.pairs = [];
    this.root?.remove();
    this.root = null;
  }

  #minimizeOverlay() {
    if (!this.session || this.minimized) return;
    this.minimized = true;
    this.#destroyOverlayOnly();
    this.#buildPill();
    this.#updateClockDisplay();
  }

  #restoreOverlay() {
    if (!this.session || !this.minimized) return;
    this.minimized = false;
    this.pill?.remove();
    this.pill = null;
    this.endingStarted = false;
    this.#buildOverlay();
    if (!this.#isEnding()) this.#renderCurrent(false);
  }

  #buildPill() {
    this.pill?.remove();
    if (!this.session) return;
    const pill = document.createElement("div");
    pill.className = "fi-mini-pill";
    const label = document.createElement("span");
    label.className = "fi-mini-label";
    pill.append(label);
    pill._fiLabel = label;

    const restore = document.createElement("button");
    restore.type = "button";
    restore.innerHTML = `<i class="fa-solid fa-expand"></i> ${localize("Overlay.Restore")}`;
    restore.addEventListener("click", () => this.toggleMinimize());
    pill.append(restore);

    if (this.preview || game.user.isGM) {
      const finish = document.createElement("button");
      finish.type = "button";
      finish.title = localize("Overlay.Finish");
      finish.innerHTML = '<i class="fa-solid fa-stop"></i>';
      finish.addEventListener("click", () => this.requestStop());
      pill.append(finish);
    }

    document.body.append(pill);
    this.pill = pill;
  }

  #startClock() {
    clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      if (!this.session) return;
      this.#updateClockDisplay();
      this.#scheduleLifecycle();
    }, 250);
  }

  #updateClockDisplay() {
    if (!this.session) return;
    const end = this.#effectiveEnd();
    const now = Date.now();
    const remainingMs = end == null ? null : Math.max(0, end - now);
    const text = remainingMs == null ? "∞" : this.#formatRemaining(remainingMs);

    if (this.root?._fiTimer) {
      const timer = this.root._fiTimer;
      timer.textContent = text;
      let visible = false;
      if (remainingMs != null && !this.endingStarted) {
        if (this.session.timerMode === "always") visible = true;
        else if (this.session.timerMode === "last") visible = remainingMs <= (Number(this.session.timerLastSeconds) || 30) * 1000;
      }
      timer.classList.toggle("fi-timer-visible", visible);
    }

    if (this.pill?._fiLabel) {
      const prefix = this.preview ? localize("Overlay.Preview") : localize("Overlay.Pause");
      this.pill._fiLabel.textContent = `${prefix} · ${text}`;
    }
  }

  #formatRemaining(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  #effectiveEnd() {
    if (!this.session) return null;
    return Number(this.session.stoppingAt) || Number(this.session.endsAt) || null;
  }

  #isEnding() {
    const end = this.#effectiveEnd();
    return end != null && Date.now() >= end;
  }

  #scheduleLifecycle() {
    if (!this.session) return;
    const end = this.#effectiveEnd();
    if (end == null) return;
    const now = Date.now();

    if (now >= end && !this.endingStarted) this.#beginEndingLocal();

    if (now >= end) {
      if (this.preview) {
        if (!this.previewClearTimer) {
          this.previewClearTimer = setTimeout(() => this.#clearLocal(), Math.max(0, end + 950 - now));
        }
      } else if (this.#isAuthority(this.session)) {
        this.#scheduleFinalize(end);
      } else if (now >= end + 950) {
        // A player cannot unpause or clear a world setting. Do not leave them on a
        // permanent black screen if every GM browser is background-throttled.
        this.#destroyOverlayOnly();
        this.pill?.remove();
        this.pill = null;
      }
    }
  }

  #beginEndingLocal() {
    if (!this.session || this.endingStarted) return;
    this.endingStarted = true;
    clearTimeout(this.slideTimer);
    this.slideTimer = null;
    this.root?.classList.add("fi-ending");
    this.#updateClockDisplay();
  }

  #isAuthority(session) {
    // Any connected GM may finalize. Duplicate finalize attempts are guarded by the
    // active-session id check and are harmless, while this avoids a hidden/throttled
    // initiating GM trapping every player on a completed intermission.
    return Boolean(game.user.isGM && session);
  }

  #scheduleFinalize(end) {
    const finalizeAt = end + 950;
    if (this.finalizeScheduledFor === finalizeAt) return;
    clearTimeout(this.finalizeTimer);
    this.finalizeScheduledFor = finalizeAt;
    this.finalizeTimer = setTimeout(() => this.#finalizeWorldSession(), Math.max(0, finalizeAt - Date.now()));
  }

  async #finalizeWorldSession() {
    if (!this.session || this.preview || !game.user.isGM) return;
    const current = this.#validateSession(game.settings.get(MODULE_ID, "activeSession"));
    if (!current || current.id !== this.session.id) return;
    if (!this.#isAuthority(current)) return;

    if (current.moduleSetPause && game.paused) game.togglePause(false, { broadcast: true });
    await game.settings.set(MODULE_ID, "activeSession", {});
    this.#clearLocal();
  }

  #timelineInfo(now = Date.now()) {
    if (!this.session) return null;
    const slides = this.session.slides;
    const durations = slides.map(slide => Math.max(100, Number(slide.durationMs) || 10_000));
    const cycleDuration = durations.reduce((sum, value) => sum + value, 0);
    if (!cycleDuration) return null;

    const elapsed = Math.max(0, now - Number(this.session.startedAt));
    const cycle = Math.floor(elapsed / cycleDuration);
    const within = elapsed % cycleDuration;

    let cumulative = 0;
    for (let index = 0; index < slides.length; index += 1) {
      const duration = durations[index];
      if (within < cumulative + duration || index === slides.length - 1) {
        const elapsedInSlide = clamp(within - cumulative, 0, duration);
        const cycleStart = Number(this.session.startedAt) + cycle * cycleDuration;
        return {
          index,
          slide: slides[index],
          elapsedInSlide,
          nextAt: cycleStart + cumulative + duration,
          cycleDuration
        };
      }
      cumulative += duration;
    }
    return null;
  }

  async #renderCurrent(crossfade) {
    if (!this.session || this.minimized || this.endingStarted || !this.root) return;
    const info = this.#timelineInfo();
    if (!info) return;
    const generation = this.renderGeneration;
    const targetPair = crossfade ? 1 - this.activePair : this.activePair;
    const ok = await this.#configurePair(targetPair, info, generation);
    if (!ok) {
      clearTimeout(this.slideTimer);
      this.slideTimer = setTimeout(() => this.#renderCurrent(true), Math.max(100, info.nextAt - Date.now()));
      return;
    }
    if (generation !== this.renderGeneration || !this.root || this.minimized) return;

    const crossfadeMs = clamp(Number(this.session.crossfadeMs) || 2000, 100, Math.max(100, info.slide.durationMs * 0.45));
    const next = this.pairs[targetPair];
    const prev = this.pairs[this.activePair];
    next.style.transitionDuration = `${crossfade ? crossfadeMs : Math.min(crossfadeMs, 500)}ms`;
    prev.style.transitionDuration = `${crossfadeMs}ms`;

    if (crossfade && targetPair !== this.activePair) {
      next.classList.remove("fi-visible");
      void next.offsetWidth;
      next.classList.add("fi-visible");
      prev.classList.remove("fi-visible");
      this.activePair = targetPair;
    } else {
      next.classList.add("fi-visible");
      this.activePair = targetPair;
    }

    this.#preloadNext(info.index);
    clearTimeout(this.slideTimer);
    const delay = Math.max(40, info.nextAt - Date.now());
    this.slideTimer = setTimeout(() => this.#renderCurrent(true), delay);
  }

  async #configurePair(pairIndex, info, generation) {
    const pair = this.pairs[pairIndex];
    if (!pair?._fi || !this.session) return false;
    this.#cancelPairAnimations(pair);

    let backgroundAsset;
    let characterAsset;
    try {
      [backgroundAsset, characterAsset] = await Promise.all([
        this.#resolveAsset(this.session.backgrounds, info.slide.background),
        this.#resolveAsset(this.session.characters, info.slide.character)
      ]);
    } catch (error) {
      console.error(`${MODULE_ID} | No usable image remained for a slide`, error);
      return false;
    }
    if (generation !== this.renderGeneration || !this.root) return false;

    const { background, wrap, character, animations } = pair._fi;
    background.src = backgroundAsset.url;
    character.src = characterAsset.url;

    const viewportWidth = Math.max(1, window.innerWidth);
    const viewportHeight = Math.max(1, window.innerHeight);
    const reducedMotion = Boolean(game.settings.get(MODULE_ID, "reducedMotion")) || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const intensity = reducedMotion ? 0 : clamp(Number(this.session.motionIntensity) || 0, 0, 2);

    const aspect = characterAsset.meta.width > 0 && characterAsset.meta.height > 0
      ? characterAsset.meta.width / characterAsset.meta.height
      : 0.75;
    let charHeight = viewportHeight * 0.92;
    let charWidth = charHeight * aspect;
    const maxWidth = viewportWidth * 0.54;
    if (charWidth > maxWidth) {
      charWidth = maxWidth;
      charHeight = charWidth / Math.max(aspect, 0.01);
    }

    const slidePx = viewportWidth * 0.018 * intensity;
    const maxScale = 1 + 0.045 * intensity;
    const safeHalf = (charWidth * maxScale) / 2 + slidePx + 8;
    const desired = (POSITION_RATIOS[info.slide.position] ?? 0.5) * viewportWidth;
    const center = safeHalf * 2 < viewportWidth
      ? clamp(desired, safeHalf, viewportWidth - safeHalf)
      : viewportWidth / 2;

    wrap.style.left = `${center}px`;
    wrap.style.width = `${charWidth}px`;
    wrap.style.height = `${charHeight}px`;

    if (reducedMotion || intensity <= 0) {
      background.style.transform = "scale(1.04)";
      character.style.transform = "translate3d(0,0,0) scale(1)";
      return true;
    }

    background.style.transform = "";
    character.style.transform = "";
    const backgroundKeyframes = this.#backgroundKeyframes(info.slide.backgroundMotion, viewportWidth, viewportHeight, intensity);
    const characterKeyframes = this.#characterKeyframes(info.slide.characterMotion, slidePx, intensity);
    const duration = Math.max(100, Number(info.slide.durationMs) || 10_000);
    const timing = { duration, easing: "ease-in-out", fill: "both" };
    const bgAnimation = background.animate(backgroundKeyframes, timing);
    const charAnimation = character.animate(characterKeyframes, timing);
    bgAnimation.currentTime = clamp(info.elapsedInSlide, 0, duration);
    charAnimation.currentTime = clamp(info.elapsedInSlide, 0, duration);
    animations.push(bgAnimation, charAnimation);
    return true;
  }

  #backgroundKeyframes(motion, viewportWidth, viewportHeight, intensity) {
    const panRatio = 0.024 * intensity;
    const panX = viewportWidth * panRatio;
    const panY = viewportHeight * panRatio;
    const minScale = 1 + 2 * panRatio + 0.035;
    const zoom = 0.045 * intensity;
    const t = (x, y, scale) => `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

    switch (motion) {
      case "pan-right": return [{ transform: t(-panX, 0, minScale) }, { transform: t(panX, 0, minScale + 0.008) }];
      case "pan-up": return [{ transform: t(0, panY, minScale) }, { transform: t(0, -panY, minScale + 0.008) }];
      case "pan-down": return [{ transform: t(0, -panY, minScale) }, { transform: t(0, panY, minScale + 0.008) }];
      case "zoom-in": return [{ transform: t(0, 0, minScale) }, { transform: t(0, 0, minScale + zoom) }];
      case "zoom-out": return [{ transform: t(0, 0, minScale + zoom) }, { transform: t(0, 0, minScale) }];
      case "diag-a": return [{ transform: t(panX, panY, minScale) }, { transform: t(-panX, -panY, minScale + 0.01) }];
      case "diag-b": return [{ transform: t(-panX, panY, minScale) }, { transform: t(panX, -panY, minScale + 0.01) }];
      case "pan-left":
      default: return [{ transform: t(panX, 0, minScale) }, { transform: t(-panX, 0, minScale + 0.008) }];
    }
  }

  #characterKeyframes(motion, slidePx, intensity) {
    const zoom = 0.035 * intensity;
    const t = (x, scale) => `translate3d(${x}px, 0, 0) scale(${scale})`;
    switch (motion) {
      case "slide-right": return [{ transform: t(-slidePx, 1) }, { transform: t(slidePx, 1 + zoom * 0.2) }];
      case "zoom-in": return [{ transform: t(0, 1) }, { transform: t(0, 1 + zoom) }];
      case "zoom-out": return [{ transform: t(0, 1 + zoom) }, { transform: t(0, 1) }];
      case "still": return [{ transform: t(0, 1) }, { transform: t(0, 1.005) }];
      case "slide-left":
      default: return [{ transform: t(slidePx, 1) }, { transform: t(-slidePx, 1 + zoom * 0.2) }];
    }
  }

  #cancelPairAnimations(pair) {
    if (!pair?._fi) return;
    for (const animation of pair._fi.animations ?? []) {
      try { animation.cancel(); } catch (_) { /* no-op */ }
    }
    pair._fi.animations = [];
  }

  #preloadNext(index) {
    if (!this.session) return;
    const nextIndex = (index + 1) % this.session.slides.length;
    const slide = this.session.slides[nextIndex];
    this.#preloadImage(this.session.backgrounds[slide.background]).catch(() => {});
    this.#preloadImage(this.session.characters[slide.character]).catch(() => {});
  }

  async #resolveAsset(list, preferredIndex) {
    if (!Array.isArray(list) || !list.length) throw new Error("Empty asset list");
    const start = Math.abs(Number(preferredIndex) || 0) % list.length;
    for (let offset = 0; offset < list.length; offset += 1) {
      const index = (start + offset) % list.length;
      const url = list[index];
      try {
        const meta = await this.#preloadImage(url);
        return { url, meta };
      } catch (_) {
        // Keep the shared timeline intact. Only this client substitutes a broken asset.
      }
    }
    throw new Error("All assets in the list failed to decode");
  }

  #preloadImage(url) {
    if (!url) return Promise.reject(new Error("Missing image URL"));
    if (this.imagePromises.has(url)) return this.imagePromises.get(url);

    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = async () => {
        try {
          if (typeof image.decode === "function") await image.decode().catch(() => {});
          resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error(`Failed to load ${url}`));
      image.src = url;
    });

    this.imagePromises.set(url, promise);
    return promise;
  }

  #clearLocal() {
    clearTimeout(this.slideTimer);
    clearInterval(this.clockInterval);
    clearTimeout(this.finalizeTimer);
    clearTimeout(this.previewClearTimer);
    this.slideTimer = null;
    this.clockInterval = null;
    this.finalizeTimer = null;
    this.previewClearTimer = null;
    this.finalizeScheduledFor = null;
    this.#destroyOverlayOnly();
    this.pill?.remove();
    this.pill = null;
    this.session = null;
    this.preview = false;
    this.minimized = false;
    this.endingStarted = false;
  }
}

function registerSettings() {
  game.settings.registerMenu(MODULE_ID, "settingsMenu", {
    name: "FOUNDRY_INTERMISSION.Settings.MenuName",
    label: "FOUNDRY_INTERMISSION.Settings.MenuLabel",
    hint: "FOUNDRY_INTERMISSION.Settings.MenuHint",
    icon: "fa-solid fa-person-walking-arrow-right",
    type: IntermissionSettingsApp,
    restricted: true
  });

  const worldSetting = (key, data) => game.settings.register(MODULE_ID, key, {
    scope: "world",
    config: false,
    name: `${MODULE_ID}.${key}`,
    hint: "",
    ...data
  });

  worldSetting("characterFolder", { type: String, default: "" });
  worldSetting("characterSource", { type: String, default: "data" });
  worldSetting("characterBucket", { type: String, default: "" });
  worldSetting("backgroundFolder", { type: String, default: "" });
  worldSetting("backgroundSource", { type: String, default: "data" });
  worldSetting("backgroundBucket", { type: String, default: "" });
  worldSetting("charactersRecursive", { type: Boolean, default: true });
  worldSetting("backgroundsRecursive", { type: Boolean, default: true });
  worldSetting("slideMin", { type: Number, default: 10 });
  worldSetting("slideMax", { type: Number, default: 14 });
  worldSetting("crossfade", { type: Number, default: 2 });
  worldSetting("motionIntensity", { type: Number, default: 1 });
  worldSetting("defaultDuration", { type: Number, default: 300 });
  worldSetting("allowPlayerMinimize", { type: Boolean, default: true });
  worldSetting("timerMode", { type: String, default: "last" });
  worldSetting("timerLastSeconds", { type: Number, default: 30 });
  worldSetting("timerPosition", { type: String, default: "bottom-right" });
  worldSetting("activeSession", {
    type: Object,
    default: {},
    onChange: value => {
      if (game.ready) IntermissionManager.instance.syncFromWorld(value);
    }
  });

  game.settings.register(MODULE_ID, "reducedMotion", {
    scope: "client",
    config: true,
    name: "FOUNDRY_INTERMISSION.Settings.ReducedMotion",
    hint: "FOUNDRY_INTERMISSION.Settings.ReducedMotionHint",
    type: Boolean,
    default: false
  });
}

function registerKeybindings() {
  game.keybindings.register(MODULE_ID, "toggleIntermission", {
    name: "FOUNDRY_INTERMISSION.Keybind.Name",
    hint: "FOUNDRY_INTERMISSION.Keybind.Hint",
    editable: [{ key: "KeyP", modifiers: ["Control", "Shift"] }],
    restricted: true,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
    onDown: () => {
      runPrimaryAction("keybinding");
      return true;
    }
  });
}


function runPrimaryAction(source = "unknown") {
  try {
    const result = IntermissionManager.instance.triggerPrimaryAction();
    if (result && typeof result.catch === "function") {
      result.catch(error => {
        console.error(`${MODULE_ID} | Primary action failed from ${source}`, error);
        ui.notifications.error(localize("Notify.ActionError"));
      });
    }
  } catch (error) {
    console.error(`${MODULE_ID} | Primary action failed from ${source}`, error);
    ui.notifications.error(localize("Notify.ActionError"));
  }
}

Hooks.once("init", () => {
  registerSettings();
  registerKeybindings();

  const module = game.modules.get(MODULE_ID);
  if (module) {
    module.api = {
      start: durationSeconds => IntermissionManager.instance.startSession(durationSeconds),
      stop: () => IntermissionManager.instance.requestStop(),
      toggle: () => IntermissionManager.instance.triggerPrimaryAction(),
      preview: () => IntermissionManager.instance.startPreview(),
      settings: () => IntermissionManager.instance.openSettings()
    };
  }
});

Hooks.once("ready", () => IntermissionManager.instance.ready());

Hooks.on("getSceneControlButtons", controls => {
  if (!game.user?.isGM) return;
  const tokens = controls.tokens;
  if (!tokens?.tools) return;
  tokens.tools[MODULE_ID] = {
    name: MODULE_ID,
    title: "FOUNDRY_INTERMISSION.Controls.Button",
    icon: "fa-solid fa-person-walking-arrow-right",
    order: Object.keys(tokens.tools).length + 100,
    button: true,
    visible: true,
    onChange: () => runPrimaryAction("scene-controls")
  };
});
