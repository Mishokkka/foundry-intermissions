# Testing notes

Static validation performed for 1.0.0:

- `module.json`, `lang/ru.json`, and `lang/en.json` parse as valid JSON.
- `scripts/main.js` passes `node --check`.
- The module script can be evaluated against a minimal mocked Foundry namespace without top-level initialization errors.
- Implementation was cross-checked against Foundry VTT v13 public API shapes for `ClientKeybindings`, `DialogV2`, `ApplicationV2`, `FilePicker`, `ClientSettings`, `Game.togglePause`, synchronized world settings, and v13 Scene Controls.

A real Foundry client is still required for integration testing of rendering, FilePicker storage backends, browser image decoding, world-setting synchronization timing, and multi-client behavior. The intended target is Foundry VTT 13.351 with Forbidden Lands 13.0.5.

## Recommended first live test

1. Create two Data folders with 3+ backgrounds and 3+ transparent character PNG/WebP files.
2. Enable the module as GM and set both folders.
3. Run the 20-second local preview.
4. Connect one player browser and start a 30-second intermission.
5. Minimize on the player only, then restore after several slides and verify it rejoins the current synchronized frame.
6. Refresh the player browser during an active intermission and verify recovery.
7. Start an intermission while the world is already paused and confirm the world remains paused after it finishes.
8. Repeat while the world is unpaused and confirm it returns to unpaused.
## Animation pacing

For each **Motion pacing** mode, use Preview and watch both a moving background and a moving character:

- **Smooth acceleration and stop** should match the previous 1.0.3 behavior and visibly ease at both ends.
- **Gradually accelerate toward the end** should begin nearly still, continuously gain speed, and not decelerate before the slide changes.
- **Constant speed** should move at a visually uniform rate for the whole slide.

The chosen mode must also be identical on GM and player clients during a synchronized intermission.

