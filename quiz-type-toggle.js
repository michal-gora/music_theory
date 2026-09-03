/**
 * quiz-type-toggle.js
 * Reusable two-way (or more) toggle for choosing what to quiz on.
 * Thin wrapper around the generic button-group component.
 */
import { createButtonGroup } from './button-group.js';

const DEFAULT_TYPES = [
    { value: 'chord', label: 'Chords' },
    { value: 'scale', label: 'Scales' },
];

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {{value:string,label:string}[]} [options.types]
 * @param {(type: string) => void} [options.onChange]
 * @param {string} [options.initial]
 */
export function createQuizTypeToggle(container, { types = DEFAULT_TYPES, onChange, initial } = {}) {
  const values = types.map((t) => t.value);
  const initialIndex = initial ? values.indexOf(initial) : 0;
  return createButtonGroup(container, {
    items: values,
    labels: (value) => types.find((t) => t.value === value)?.label ?? value,
    className: 'quiz-type-toggle',
    buttonClassName: 'quiz-type-btn',
    initialIndex: initialIndex === -1 ? 0 : initialIndex,
    onChange: (type) => { if (onChange) onChange(type); },
  });
}