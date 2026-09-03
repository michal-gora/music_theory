/**
 * button-group.js
 * Generic "pick one of N" button row. This is the single implementation
 * behind key-selector.js, mode-selector.js, inversion-selector.js,
 * quiz-type-toggle.js and difficulty-selector.js - they're all just this
 * component with different items/labels/CSS classes. Centralizing it
 * here means a fix or behavior change (keyboard nav, accessibility,
 * styling hook, etc.) only has to happen once.
 */

/**
 * @param {HTMLElement} container
 * @param {object} options
 * @param {any[]} options.items the values this group picks between
 * @param {string[]|(item:any, index:number)=>string} options.labels
 *   either a parallel array of button labels, or a function mapping
 *   an item (and its index) to a label
 * @param {string} [options.className] class added to the container
 * @param {string} [options.buttonClassName] class added to each button
 * @param {number} [options.initialIndex]
 * @param {(item:any, index:number) => void} [options.onChange]
 */
export function createButtonGroup(container, {
  items,
  labels,
  className = 'btn-group',
  buttonClassName = 'btn-group-item',
  initialIndex = 0,
  onChange,
} = {}) {
  container.innerHTML = '';
  container.classList.add(className);

  const getLabel = typeof labels === 'function' ? labels : (item, i) => labels[i];
  let selectedIndex = initialIndex;

  const buttons = items.map((item, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = getLabel(item, i);
    btn.classList.add(buttonClassName);
    if (i === initialIndex) btn.classList.add('active');
    btn.addEventListener('click', () => {
      selectedIndex = i;
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (onChange) onChange(item, i);
    });
    container.appendChild(btn);
    return btn;
  });

  return {
    getSelected: () => items[selectedIndex],
    getSelectedIndex: () => selectedIndex,
    setSelectedIndex: (i) => {
      selectedIndex = i;
      buttons.forEach((b, idx) => b.classList.toggle('active', idx === i));
    },
    setSelected: (value) => {
      const i = items.indexOf(value);
      if (i !== -1) {
        selectedIndex = i;
        buttons.forEach((b, idx) => b.classList.toggle('active', idx === i));
      }
    },
  };
}