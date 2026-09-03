/**
 * inversion-selector.js
 * Reusable button row for choosing root/1st/2nd (/nth) inversion.
 * Kept generic on purpose so it also works for 7th chords later
 * (root, 1st, 2nd, 3rd inversion) just by passing a longer `labels`
 * list. Thin wrapper around the generic button-group component.
 */
import { createButtonGroup } from './button-group.js';

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {string[]} [options.labels]
 * @param {(inversion: number) => void} [options.onChange]
 * @param {number} [options.initial]
 */
export function createInversionSelector(container, {
  labels = ['Root Position', '1st Inversion', '2nd Inversion'],
  onChange,
  initial = 0,
} = {}) {
  const inversions = labels.map((_, i) => i);
  return createButtonGroup(container, {
    items: inversions,
    labels,
    className: 'inversion-selector',
    buttonClassName: 'inversion-btn',
    initialIndex: initial,
    onChange: (inversion) => { if (onChange) onChange(inversion); },
  });
}