/**
 * keyboard-config.js
 * Single source of truth for the "standard" keyboard window shared by
 * every page (currently scales and chords). Both pages show the same
 * fixed 5-octave range with the same key width, so it lives here once
 * instead of being duplicated (and risking drifting out of sync) in
 * every page script.
 *
 * If a future page needs a different range/size, it can still import
 * PianoKeyboard directly and pass its own options - this config is a
 * convenience default, not a hard requirement.
 */

export const KEYBOARD_START_MIDI = 48; // C2
export const KEYBOARD_END_MIDI = 96;   // C7
export const KEYBOARD_WHITE_KEY_WIDTH = 26;

/**
 * Ready-to-spread options object for `new PianoKeyboard(container, ...)`.
 * @param {object} [overrides] any of the standard options, to override
 *   on a per-page basis if needed (e.g. a different whiteKeyWidth).
 */
export function getStandardKeyboardOptions(overrides = {}) {
  return {
    startMidi: KEYBOARD_START_MIDI,
    endMidi: KEYBOARD_END_MIDI,
    whiteKeyWidth: KEYBOARD_WHITE_KEY_WIDTH,
    ...overrides,
  };
}