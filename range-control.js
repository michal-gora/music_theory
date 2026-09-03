/**
 * range-control.js
 * "◀ N Octaves ▶" control for growing/shrinking the visible keyboard
 * window. Thin wrapper around stepper.js.
 */
import { createStepper } from './stepper.js';

export function createRangeControl(container, { min = 2, max = 7, initial = 3, onChange } = {}) {
  return createStepper(container, {
    min,
    max,
    initial,
    className: 'range-control',
    buttonClassName: 'range-btn',
    labelClassName: 'range-label',
    formatLabel: (span) => `${span} Octaves`,
    onChange,
  });
}