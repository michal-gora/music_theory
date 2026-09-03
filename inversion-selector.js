/**
 * inversion-selector.js
 * Reusable button row for choosing root/1st/2nd (/nth) inversion.
 * Kept generic on purpose so it also works for 7th chords later
 * (root, 1st, 2nd, 3rd inversion) just by passing a longer `labels` list.
 */

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {string[]} [options.labels]
 * @param {(inversion: number) => void} options.onChange
 * @param {number} [options.initial]
 */
export function createInversionSelector(container, {
  labels = ['Root Position', '1st Inversion', '2nd Inversion'],
  onChange,
  initial = 0,
} = {}) {
  container.innerHTML = '';
  container.classList.add('inversion-selector');

  let selected = initial;
  const buttons = labels.map((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.classList.add('inversion-btn');
    if (i === initial) btn.classList.add('active');
    btn.addEventListener('click', () => {
      selected = i;
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (onChange) onChange(selected);
    });
    container.appendChild(btn);
    return btn;
  });

  return {
    getSelected: () => selected,
    setSelected: (i) => {
      selected = i;
      buttons.forEach((b, idx) => b.classList.toggle('active', idx === i));
    },
  };
}
