/**
 * stepper.js
 * Generic "◀ label ▶" numeric stepper, shared by octave-transpose.js
 * and range-control.js.
 */
export function createStepper(container, {
  min,
  max,
  initial = min,
  step = 1,
  formatLabel = (value) => String(value),
  className = 'stepper',
  buttonClassName = 'stepper-btn',
  labelClassName = 'stepper-label',
  onChange,
} = {}) {
  container.innerHTML = '';
  container.classList.add(className);

  let value = initial;

  const decBtn = document.createElement('button');
  decBtn.type = 'button';
  decBtn.textContent = '\u25C0';
  decBtn.classList.add(buttonClassName, `${buttonClassName}-dec`);
  decBtn.setAttribute('aria-label', 'Decrease');

  const label = document.createElement('span');
  label.classList.add(labelClassName);

  const incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.textContent = '\u25B6';
  incBtn.classList.add(buttonClassName, `${buttonClassName}-inc`);
  incBtn.setAttribute('aria-label', 'Increase');

  function refresh() {
    label.textContent = formatLabel(value);
    decBtn.disabled = value <= min;
    incBtn.disabled = value >= max;
  }

  function setValue(next) {
    const clamped = Math.max(min, Math.min(max, next));
    if (clamped === value) return;
    value = clamped;
    refresh();
    if (onChange) onChange(value);
  }

  decBtn.addEventListener('click', () => setValue(value - step));
  incBtn.addEventListener('click', () => setValue(value + step));

  container.appendChild(decBtn);
  container.appendChild(label);
  container.appendChild(incBtn);
  refresh();

  return { getValue: () => value, setValue };
}