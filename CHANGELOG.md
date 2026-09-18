# Changelog

## 1.0.10

- Added an automatic Firefox/WebRender workaround for very slow fractional transforms: motion uses 2D transforms and, on Firefox only, a visually negligible fixed 0.05° rotation to prevent pixel-snapped staircase movement.
- Removed persistent `will-change` and `backface-visibility` hints from the fullscreen image layers; Web Animations can promote active transforms without keeping large textures permanently forced into compositor layers.
- Replaced per-pair `contain: layout paint` with layout-only containment on the stage to avoid an extra paint-clipping/compositing boundary around each moving pair.
- Chrome/Chromium keeps the same visual motion and timing; the Firefox workaround is automatic and requires no user setting.

## 1.0.9

- Reduced unnecessary overlay repaints on slower clients: countdown and minimized-label DOM are now updated only when their displayed value actually changes.
- Removed live `backdrop-filter` blur from overlay controls and the audio-volume widget because it forces recompositing against the continuously animated background on some browsers/GPUs.
- Added paint/layout containment and compositor hints to the fullscreen animation layers to improve smoothness on player clients without changing animation timing or synchronization.

## 1.0.8

- Fixed early manual Finish before `startedAt`: pending intermission audio is now treated as not yet playing, so the normal short stop path cancels delayed playback instead of allowing the sound to start during its own fade-out window.

## 1.0.7

- Added a per-user intermission sound volume setting (0–100%) and live volume sliders on both the full overlay and minimized pill.
- Added a persistent GM sound history with the 10 most recently used audio files available directly in the launch window.
- Audio history is world-scoped, while volume is user-scoped so each participant can keep their own preferred level.

## 1.0.6

- Added an optional per-launch intermission sound picker.
- Added a **Match sound duration** launch mode that uses the loaded audio file duration as the intermission duration.
- Added optional sound looping until the intermission ends.
- Added configurable end fade-out; the sound can fade while mid-track and is forcibly stopped at the effective intermission end.
- Manual Finish honors the configured audio fade-out when sound is still expected to be playing, without extending beyond an already-earlier scheduled end.
- Intermission audio is synchronized from the existing `activeSession` world state; reconnecting clients resume from the corresponding playback offset.
- Existing Foundry playlists are not modified and minimizing the visual overlay does not stop the intermission sound.

## 1.0.5

- Accelerating and linear motion now continues throughout the outgoing crossfade instead of visibly freezing at the slide boundary.
- Smooth ease-in/ease-out mode keeps its existing behavior and still settles to a stop before the transition.
- The outgoing background and character animation remains active until its fade-out completes; the incoming slide begins its own motion normally at the same time.

## 1.0.4

- Added a GM setting for animation pacing.
- Three pacing modes are available for both background and character motion: the existing smooth ease-in/ease-out behavior, acceleration toward the end, and constant linear speed.
- The selected pacing mode is stored in the synchronized session, so every client uses the same animation curve.

## 1.0.3

- Removed the custom module socket layer; `activeSession` world-setting synchronization is now the single session transport and authority.
- Fixed invalid custom-duration submissions so the launch window remains open.
- Fixed timeline wrapping for very long finite intermissions after the generated slide list reaches its safety cap.
- Localized all settings section headings in English and Russian.

## 1.0.2

- Replaced the launch `DialogV2.wait` workflow with a dedicated ApplicationV2 launch window.
- Added guarded Scene Controls/keybinding dispatch so callback errors are surfaced as a notification and console error instead of failing silently.
- Scene Controls remain implemented using the Foundry v13 record-based `getSceneControlButtons` API.

## 1.0.1

- Fixed the settings window on shorter displays: the content now scrolls inside the window.
- The Preview and Save controls stay reachable in a sticky footer.

## 1.0.0

Initial release.
