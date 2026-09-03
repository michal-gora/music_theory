/**
 * scales-page.js
 * Page-specific wiring: keyboard + key selector + mode selector +
 * octave transpose + range control -> highlight every occurrence of the
 * scale's notes across the currently visible keyboard window, with a
 * single root marker on whichever occurrence falls closest to the
 * window's center (or the transposed target, if transposed).
 */
import { PianoKeyboard } from './keyboard.js';
import { createKeySelector } from './key-selector.js';
import { createModeSelector } from './mode-selector.js';
import { createOctaveTranspose } from './octave-transpose.js';
import { createRangeControl } from './range-control.js';
import {
  computeKeyboardWindow,
  getStandardKeyboardOptions,
  DEFAULT_OCTAVE_SPAN,
  MIN_OCTAVE_SPAN,
  MAX_OCTAVE_SPAN,
} from './keyboard-config.js';
import {
  getScalePitchClasses,
  getNotesInRangeMatchingPitchClasses,
  findNoteNearestTarget,
  NOTE_NAMES_SHARP,
} from './music-theory.js';

let octaveSpan = DEFAULT_OCTAVE_SPAN;
let octaveOffset = 0;

const keyboard = new PianoKeyboard(
  document.getElementById('keyboard-container'),
  getStandardKeyboardOptions(octaveSpan)
);

function update() {
  const pc = keySelector.getSelected();
  const mode = modeSelector.getSelected();
  const { startMidi, endMidi } = computeKeyboardWindow(octaveSpan);

  const scalePitchClasses = getScalePitchClasses(pc, mode);
  const scaleNotes = getNotesInRangeMatchingPitchClasses(scalePitchClasses, startMidi, endMidi);

  const center = (startMidi + endMidi) / 2;
  const targetMidi = Math.min(endMidi, Math.max(startMidi, center + octaveOffset * 12));
  const markerRoot = findNoteNearestTarget(pc, targetMidi, startMidi, endMidi);

  keyboard.setNotes({
    highlighted: scaleNotes,
    markers: markerRoot !== null ? [markerRoot] : [],
    markerClass: 'marker-root',
  });

  const modeLabel = mode === 'major' ? 'Major' : 'Minor';
  document.getElementById('current-selection').textContent =
    `${NOTE_NAMES_SHARP[pc]} ${modeLabel} scale`;
}

const keySelector = createKeySelector(document.getElementById('key-selector-container'), {
  onChange: update,
});
const modeSelector = createModeSelector(document.getElementById('mode-selector-container'), {
  onChange: update,
});
const octaveTranspose = createOctaveTranspose(document.getElementById('octave-transpose-container'), {
  onChange: (offset) => {
    octaveOffset = offset;
    update();
  },
});
createRangeControl(document.getElementById('range-control-container'), {
  min: MIN_OCTAVE_SPAN,
  max: MAX_OCTAVE_SPAN,
  initial: DEFAULT_OCTAVE_SPAN,
  onChange: (span) => {
    octaveSpan = span;
    const { startMidi, endMidi } = computeKeyboardWindow(octaveSpan);
    keyboard.setRange(startMidi, endMidi);
    update();
  },
});

update();