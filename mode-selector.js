/**
 * mode-selector.js
 * Reusable button row for choosing a scale/chord mode. Defaults to
 * major/minor, but is written generically so adding dorian, pentatonic,
 * etc. later just means adding entries to SCALE_INTERVALS/CHORD_INTERVALS
 * in music-theory.js and passing a longer `modes` list here. Thin
 * wrapper around the generic button-group component.
 */
import { createButtonGroup } from './button-group.js';
import { MODE_LABELS } from './music-theory.js';

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {string[]} [options.modes]
 * @param {(mode: string) => void} [options.onChange]
 * @param {string} [options.initial]
 */
export function createModeSelector(container, { modes = ['minor', 'major'], onChange, initial } = {}) {
  const initialIndex = initial ? modes.indexOf(initial) : 0;
  return createButtonGroup(container, {
    items: modes,
    labels: (mode) => MODE_LABELS[mode] ?? mode,
    className: 'mode-selector',
    buttonClassName: 'mode-btn',
    initialIndex: initialIndex === -1 ? 0 : initialIndex,
    onChange: (mode) => { if (onChange) onChange(mode); },
  });
}