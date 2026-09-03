/**
 * key-selector.js
 * Reusable button row for choosing one of the 12 pitch classes.
 * (A chromatic octave has 12 semitones/named pitch classes — C, C#/Db,
 * D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B — so this renders 12
 * buttons.) Thin wrapper around the generic button-group component.
 */
import { createButtonGroup } from './button-group.js';
import { NOTE_NAMES_SHARP } from './music-theory.js';

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {(pitchClass: number) => void} [options.onChange]
 * @param {string[]} [options.names] labels to use, defaults to sharp spelling
 * @param {number} [options.initial] initially selected pitch class
 */
export function createKeySelector(container, { onChange, names = NOTE_NAMES_SHARP, initial = 0 } = {}) {
  const pitchClasses = names.map((_, pc) => pc);
  return createButtonGroup(container, {
    items: pitchClasses,
    labels: names,
    className: 'key-selector',
    buttonClassName: 'key-btn',
    initialIndex: initial,
    onChange: (pc) => { if (onChange) onChange(pc); },
  });
}