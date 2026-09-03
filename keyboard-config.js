/**
 * keyboard-config.js
 * Single source of truth for the "standard" keyboard window shared by
 * every page.
 */

export const KEYBOARD_HOME_MIDI = 60;
export const DEFAULT_OCTAVE_SPAN = 3;
export const MIN_OCTAVE_SPAN = 2;
export const MAX_OCTAVE_SPAN = 7;
export const KEYBOARD_WHITE_KEY_WIDTH = 26;

export function computeKeyboardWindow(octaveSpan, homeMidi = KEYBOARD_HOME_MIDI) {
  const totalSemitones = octaveSpan * 12;
  const half = totalSemitones / 2;
  const startMidi = Math.round((homeMidi - half) / 12) * 12;
  return { startMidi, endMidi: startMidi + totalSemitones };
}

export function getStandardKeyboardOptions(octaveSpan = DEFAULT_OCTAVE_SPAN, overrides = {}) {
  const { startMidi, endMidi } = computeKeyboardWindow(octaveSpan);
  return { startMidi, endMidi, whiteKeyWidth: KEYBOARD_WHITE_KEY_WIDTH, ...overrides };
}