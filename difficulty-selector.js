/**
 * difficulty-selector.js
 * Reusable dropdown for choosing a course preset. It keeps the same API as
 * the earlier selector so the quiz page does not need to change.
 */
export function createDifficultySelector(container, { presets, onChange, initialId } = {}) {
  if (!Array.isArray(presets) || presets.length === 0) return {
    getSelected: () => null,
    getSelectedIndex: () => -1,
    setSelectedIndex: () => {},
    setSelected: () => {},
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'difficulty-selector';

  const select = document.createElement('select');
  select.className = 'course-select';

  const initialIndex = initialId ? presets.findIndex((p) => p.id === initialId) : 0;
  const safeInitialIndex = initialIndex === -1 ? 0 : initialIndex;
  let selectedIndex = safeInitialIndex;

  presets.forEach((preset, index) => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.shortLabel ?? preset.label;
    if (index === safeInitialIndex) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    const selectedPreset = presets.find((preset) => preset.id === select.value) ?? presets[0];
    const nextIndex = presets.findIndex((preset) => preset.id === selectedPreset.id);
    selectedIndex = nextIndex === -1 ? 0 : nextIndex;
    if (onChange) onChange(selectedPreset);
  });

  wrapper.appendChild(select);
  container.innerHTML = '';
  container.appendChild(wrapper);

  return {
    getSelected: () => presets[selectedIndex] ?? presets[safeInitialIndex] ?? null,
    getSelectedIndex: () => selectedIndex,
    setSelectedIndex: (index) => {
      const normalized = Math.max(0, Math.min(index, presets.length - 1));
      selectedIndex = normalized;
      select.value = presets[normalized].id;
    },
    setSelected: (preset) => {
      const matchIndex = presets.findIndex((item) => item === preset || item.id === preset?.id);
      if (matchIndex !== -1) {
        selectedIndex = matchIndex;
        select.value = presets[matchIndex].id;
      }
    },
  };
}