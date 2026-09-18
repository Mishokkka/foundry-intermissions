# Foundry Intermission

A lightweight, system-agnostic Foundry VTT v13 module for synchronized full-screen intermissions inspired by stylized videogame loading screens.

Target environment: Foundry VTT 13.351. Tested architecture is compatible with Forbidden Lands 13.0.5 because the module does not touch the game system, Actor sheets, Items, Canvas rendering, playlists, or document data.

## Features

- GM-only launch from Scene Controls or a configurable Foundry keybinding.
- Finite intermissions or "until manually stopped".
- True Foundry world pause, preserving whether the world was already paused before the intermission.
- One synchronized sequence for all clients.
- Randomized background + transparent PNG/WebP character combinations.
- Shuffle-bag selection to avoid ugly immediate repetition.
- Slow background pan/zoom and character slide/zoom presets.
- Selectable motion pacing: smooth start/stop, accelerating toward the transition, or constant linear speed. Accelerating and linear motion continues through the outgoing crossfade so the old image never visibly freezes before disappearing.
- Safe background overscan and character boundary clamping.
- Crossfaded double-buffered visual layers.
- Cross-browser motion path tuned for Chromium and Firefox/WebRender, including an automatic workaround for Firefox fractional-pixel transform snapping.
- Lazy image decoding: current and next slides only.
- Optional timer with selectable corner.
- Local minimize/restore. A minimized client remains synchronized and jumps to the current slide when restored.
- Players can be forbidden from minimizing; GMs can always minimize.
- F5/reconnect recovery through a hidden world setting containing the active session state.
- GM-only local preview that does not pause or broadcast.
- Local Reduced Motion option.
- Optional launch sound: choose an audio file per intermission, optionally loop it, use its duration as the intermission duration, and fade it out toward the end.
- Existing Foundry playlists/music are never modified; the intermission sound is an additional temporary Sound and is always stopped when the intermission ends.

## Installation

Copy the `foundry-intermission` folder into:

`<Foundry User Data>/Data/modules/`

Restart Foundry, enable **Foundry Intermission** in the world, then configure it under Module Settings.

## Media recommendations

Characters should be PNG or WebP with alpha transparency. For the most consistent framing, keep character canvases at a similar aspect ratio and use similar head/waist placement.

Backgrounds can use PNG, WebP, JPG/JPEG, AVIF, APNG, BMP, GIF, TIFF, or SVG. WebP is usually the best practical choice for static backgrounds.

## Controls

The default keybinding is `Ctrl+Shift+P`. It can be changed in Foundry's **Configure Controls** screen.

- No intermission active: opens the start dialog.
- Intermission visible: minimizes it locally.
- Intermission minimized: restores it locally.

The GM also gets an Intermission button in the Token scene controls.

## Intermission sound

The launch dialog can optionally attach one audio file to that intermission. The GM can:

- keep a normal/custom intermission duration and play the sound once;
- loop the sound until the intermission ends;
- choose **Match sound duration** so the loaded audio duration becomes the intermission duration;
- choose a fade-out duration. The fade begins that many seconds before the effective end, even if the track is currently mid-playback, and the sound is stopped at the end.

The audio configuration is stored in the synchronized active-session state. Each client plays the sound locally using the same session timestamps, so reconnecting during an intermission resumes from the corresponding offset. Minimizing the overlay does not stop the sound. Existing playlists continue unchanged.

## Notes

The module uses Foundry's synchronized world settings and public v13 APIs. It does not include or require any GTA artwork, logos, music, or other proprietary assets.


## Audio comfort and history

Intermission audio has a per-user volume control. Each participant can set their own level in Foundry settings or adjust it live from the intermission overlay/minimized pill; changing it does not affect anyone else. The launch window also keeps the 10 most recently used intermission sounds as a world-level GM history for quick reuse.
