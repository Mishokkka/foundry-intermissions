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
- Safe background overscan and character boundary clamping.
- Crossfaded double-buffered visual layers.
- Lazy image decoding: current and next slides only.
- Optional timer with selectable corner.
- Local minimize/restore. A minimized client remains synchronized and jumps to the current slide when restored.
- Players can be forbidden from minimizing; GMs can always minimize.
- F5/reconnect recovery through a hidden world setting containing the active session state.
- GM-only local preview that does not pause or broadcast.
- Local Reduced Motion option.
- Playlist/audio state is never modified.

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

## Notes

The module uses Foundry's module socket namespace and public v13 APIs. It does not include or require any GTA artwork, logos, music, or other proprietary assets.
