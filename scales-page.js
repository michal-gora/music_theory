/**
 * scales-page.js
 * Page-specific wiring: keyboard + key selector + mode selector +
 * octave transpose -> highlight every occurrence of the scale's notes
 * across the (fixed) visible keyboard window.
 *
 * The keyboard window is fixed and shared with the chords page via
 * keyboard-config.js, so both pages always show the same range/width
 * without duplicating those numbers.
 *
 * Because this page already highlights the scale in every octave at
 * once, that highlight pattern is inherently "transpose-invariant" -
 * shifting a fully periodic pattern by exactly one octave looks
 * identical. So instead, transposing here moves the single root
 * marker to a different octave's occurrence of the root note, which
 * is a real, visible effect and still matches "transpose by an
 * octave" conceptually (it shows you the same note, an octave over).
 */
import { PianoKeyboard } from './keyboard.js';
import { createKeySelector } from './key-selector.js';
import { createModeSelector } from './mode-selector.js';
import { createOctaveTranspose } from './octave-transpose.js';
import { KEYBOARD_START_MIDI, KEYBOARD_END_MIDI, getStandardKeyboardOptions } from './keyboard-config.js';
import {
  getScalePitchClasses,
  getNotesInRangeMatchingPitchClasses,
  findNoteNearestTarget,
  NOTE_NAMES_SHARP,
} from './music-theory.js';

const CENTER_MIDI = (KEYBOARD_START_MIDI + KEYBOARD_END_MIDI) / 2;
const TRANSPOSE_MIN = -2;
const TRANSPOSE_MAX = 2;

let octaveOffset = 0;

const keyboard = new PianoKeyboard(
  document.getElementById('keyboard-container'),
  getStandardKeyboardOptions()
);

function update() {
  const pc = keySelector.getSelected();
  const mode = modeSelector.getSelected();

  const scalePitchClasses = getScalePitchClasses(pc, mode);
  const scaleNotes = getNotesInRangeMatchingPitchClasses(scalePitchClasses, KEYBOARD_START_MIDI, KEYBOARD_END_MIDI);

  // Aim the marker at "the usual center, shifted by however many
  // octaves we've transposed" - clamped so it can't aim outside the
  // visible window entirely.
  const targetMidi = Math.min(
    KEYBOARD_END_MIDI,
    Math.max(KEYBOARD_START_MIDI, CENTER_MIDI + octaveOffset * 12)
  );
  const markerRoot = findNoteNearestTarget(pc, targetMidi, KEYBOARD_START_MIDI, KEYBOARD_END_MIDI);

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
  min: TRANSPOSE_MIN,
  max: TRANSPOSE_MAX,
  onChange: (offset) => {
    octaveOffset = offset;
    update();
  },
});

update();