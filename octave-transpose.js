import { createStepper } from './stepper.js';

export function createOctaveTranspose(container, { min = -2, max = 2, initial = 0, onChange } = {}) {
  return createStepper(container, {
    min,
    max,
    initial,
    className: 'octave-transpose',
    buttonClassName: 'octave-btn',
    labelClassName: 'octave-label',
    formatLabel: (offset) => `Octave ${offset > 0 ? '+' : ''}${offset}`,
    onChange,
  });
}