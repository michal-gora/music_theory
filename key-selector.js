/**
 * key-selector.js
 * Reusable button row for choosing one of the 12 pitch classes.
 * (Note: a chromatic octave has 12 semitones/named pitch classes — C, C#/Db,
 * D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B — so this renders 12 buttons.)
 */
import { NOTE_NAMES_SHARP } from './music-theory.js';

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {(pitchClass: number) => void} options.onChange
 * @param {string[]} [options.names] labels to use, defaults to sharp spelling
 * @param {number} [options.initial] initially selected pitch class
 */
export function createKeySelector(container, { onChange, names = NOTE_NAMES_SHARP, initial = 0 } = {}) {
  container.innerHTML = '';
  container.classList.add('key-selector');

  let selected = initial;
  const buttons = names.map((name, pc) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = name;
    btn.classList.add('key-btn');
    if (pc === initial) btn.classList.add('active');
    btn.addEventListener('click', () => {
      selected = pc;
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (onChange) onChange(selected);
    });
    container.appendChild(btn);
    return btn;
  });

  return {
    getSelected: () => selected,
    setSelected: (pc) => {
      selected = pc;
      buttons.forEach((b, i) => b.classList.toggle('active', i === pc));
    },
  };
}
