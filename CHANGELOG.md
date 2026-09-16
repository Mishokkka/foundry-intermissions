# Changelog

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
