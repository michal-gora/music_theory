/**
 * mode-selector.js
 * Reusable button row for choosing a scale/chord mode. Defaults to
 * minor/major, but is written generically so adding dorian, pentatonic,
 * etc. later just means adding entries to SCALE_INTERVALS/CHORD_INTERVALS
 * in music-theory.js and passing a longer `modes` list here.
 */
import { MODE_LABELS } from './music-theory.js';

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {string[]} [options.modes] e.g. ['minor', 'major']
 * @param {(mode: string) => void} options.onChange
 * @param {string} [options.initial]
 */
export function createModeSelector(container, { modes = ['minor', 'major'], onChange, initial } = {}) {
  container.innerHTML = '';
  container.classList.add('mode-selector');

  let selected = initial ?? modes[0];
  const buttons = modes.map((mode) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = MODE_LABELS[mode] ?? mode;
    btn.classList.add('mode-btn');
    if (mode === selected) btn.classList.add('active');
    btn.addEventListener('click', () => {
      selected = mode;
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (onChange) onChange(selected);
    });
    container.appendChild(btn);
    return btn;
  });

  return {
    getSelected: () => selected,
    setSelected: (mode) => {
      selected = mode;
      buttons.forEach((b, i) => b.classList.toggle('active', modes[i] === mode));
    },
  };
}
