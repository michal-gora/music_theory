/**
 * chords-page.js
 * Page-specific wiring: keyboard + key selector + mode selector +
 * inversion selector + octave transpose -> highlight the triad in the
 * chosen inversion, with the root note circle-marked wherever it ends
 * up in the voicing.
 *
 * IMPORTANT: the keyboard window is fixed (never resized/scrolled) and
 * shared with the scales page via keyboard-config.js (see
 * KEYBOARD_START_MIDI / KEYBOARD_END_MIDI there for the exact bounds).
 * Only the chord's underlying base octave changes when you transpose -
 * that's what actually makes the chord visibly move to different keys.
 * (An earlier version shifted the window by the same amount as the
 * chord, which cancelled out visually - a full octave shift looks
 * identical on a periodic keyboard.)
 */
import { PianoKeyboard } from './keyboard.js';
import { createKeySelector } from './key-selector.js';
import { createModeSelector } from './mode-selector.js';
import { createInversionSelector } from './inversion-selector.js';
import { createOctaveTranspose } from './octave-transpose.js';
import { getStandardKeyboardOptions } from './keyboard-config.js';
import {
  getTriadMidiNotes,
  invertChord,
  findRootNoteInVoicing,
  NOTE_NAMES_SHARP,
} from './music-theory.js';

// Base (transpose offset = 0) chord root octave: C3. Combined with the
// -1..+1 transpose range, the chord's base octave ranges from C2 to C4,
// which keeps every root note's every inversion within the shared
// keyboard window defined in keyboard-config.js (C2-C7):
//   offset -1 (octave 2): notes span MIDI 36-63
//   offset  0 (octave 3): notes span MIDI 48-75
//   offset +1 (octave 4): notes span MIDI 60-87
const BASE_CHORD_OCTAVE = 3;
const TRANSPOSE_MIN = -1;
const TRANSPOSE_MAX = 1;

let octaveOffset = 0;

const keyboard = new PianoKeyboard(
  document.getElementById('keyboard-container'),
  getStandardKeyboardOptions()
);

function update() {
  const pc = keySelector.getSelected();
  const mode = modeSelector.getSelected();
  const inversion = inversionSelector.getSelected();
  const chordOctave = BASE_CHORD_OCTAVE + octaveOffset;

  const rootPositionTriad = getTriadMidiNotes(pc, mode, chordOctave);
  const voicedTriad = invertChord(rootPositionTriad, inversion);
  const rootNote = findRootNoteInVoicing(voicedTriad, pc);

  keyboard.setNotes({
    highlighted: voicedTriad,
    markers: [rootNote],
    markerClass: 'marker-root',
  });

  const modeLabel = mode === 'major' ? 'Major' : 'Minor';
  const inversionLabels = ['Root Position', '1st Inversion', '2nd Inversion'];
  document.getElementById('current-selection').textContent =
    `${NOTE_NAMES_SHARP[pc]} ${modeLabel} triad — ${inversionLabels[inversion]}`;
}

const keySelector = createKeySelector(document.getElementById('key-selector-container'), {
  onChange: update,
});
const modeSelector = createModeSelector(document.getElementById('mode-selector-container'), {
  onChange: update,
});
const inversionSelector = createInversionSelector(document.getElementById('inversion-selector-container'), {
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