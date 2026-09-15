# Changelog

## 1.0.2

- Replaced the launch `DialogV2.wait` workflow with a dedicated ApplicationV2 launch window.
- Added guarded Scene Controls/keybinding dispatch so callback errors are surfaced as a notification and console error instead of failing silently.
- Scene Controls remain implemented using the Foundry v13 record-based `getSceneControlButtons` API.

## 1.0.1

- Fixed the settings window on shorter displays: the content now scrolls inside the window.
- The Preview and Save controls stay reachable in a sticky footer.

## 1.0.0

Initial release.
