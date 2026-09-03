/**
 * octave-transpose.js
 * Reusable "◀ Octave N ▶" control. Emits an integer offset (0 = default,
 * -1 = one octave down, +1 = one octave up, etc.) via onChange. It knows
 * nothing about keyboards, scales or chords — callers decide what an
 * offset of +1 actually means (shift the visible keyboard window,
 * shift a chord's base octave, both at once, ...).
 */

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {number} [options.min] lowest allowed offset (inclusive)
 * @param {number} [options.max] highest allowed offset (inclusive)
 * @param {number} [options.initial] starting offset
 * @param {(offset: number) => void} options.onChange
 */
export function createOctaveTranspose(container, { min = -2, max = 2, initial = 0, onChange } = {}) {
  container.innerHTML = '';
  container.classList.add('octave-transpose');

  let offset = initial;

  const leftBtn = document.createElement('button');
  leftBtn.type = 'button';
  leftBtn.textContent = '\u25C0'; // ◀
  leftBtn.classList.add('octave-btn', 'octave-btn-left');
  leftBtn.setAttribute('aria-label', 'Transpose down one octave');

  const label = document.createElement('span');
  label.classList.add('octave-label');

  const rightBtn = document.createElement('button');
  rightBtn.type = 'button';
  rightBtn.textContent = '\u25B6'; // ▶
  rightBtn.classList.add('octave-btn', 'octave-btn-right');
  rightBtn.setAttribute('aria-label', 'Transpose up one octave');

  function refresh() {
    const sign = offset > 0 ? '+' : '';
    label.textContent = `Octave ${sign}${offset}`;
    leftBtn.disabled = offset <= min;
    rightBtn.disabled = offset >= max;
  }

  function setOffset(next) {
    const clamped = Math.max(min, Math.min(max, next));
    if (clamped === offset) return;
    offset = clamped;
    refresh();
    if (onChange) onChange(offset);
  }

  leftBtn.addEventListener('click', () => setOffset(offset - 1));
  rightBtn.addEventListener('click', () => setOffset(offset + 1));

  container.appendChild(leftBtn);
  container.appendChild(label);
  container.appendChild(rightBtn);
  refresh();

  return {
    getOffset: () => offset,
    setOffset,
  };
}