/**
 * difficulty-selector.js
 * Reusable button row for choosing a difficulty/scope preset (see
 * DIFFICULTY_PRESETS in quiz-engine.js for what a preset actually
 * contains). Thin wrapper around the generic button-group component.
 */
import { createButtonGroup } from './button-group.js';

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {object[]} options.presets array of { id, shortLabel, label, ... }
 * @param {(preset: object) => void} [options.onChange]
 * @param {string} [options.initialId]
 */
export function createDifficultySelector(container, { presets, onChange, initialId } = {}) {
  const initialIndex = initialId ? presets.findIndex((p) => p.id === initialId) : 0;
  return createButtonGroup(container, {
    items: presets,
    labels: (preset) => preset.shortLabel ?? preset.label,
    className: 'difficulty-selector',
    buttonClassName: 'difficulty-btn',
    initialIndex: initialIndex === -1 ? 0 : initialIndex,
    onChange: (preset) => { if (onChange) onChange(preset); },
  });
}