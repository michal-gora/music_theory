/**
 * chords-page.js
 * Page-specific wiring: keyboard + key selector + mode selector +
 * inversion selector + octave transpose + range control -> highlight
 * the triad in the chosen inversion, with the root note circle-marked
 * wherever it ends up in the voicing.
 *
 * Centering is delegated entirely to music-theory.js's
 * getCenteredChordVoicing(), which picks whichever base octave keeps
 * the voiced chord closest to the middle of the current window - this
 * naturally keeps 1st/2nd inversions centered too, not just root
 * position (a fixed base octave only centers root position correctly).
 * Octave transpose is then a simple +/-12 semitone shift applied on
 * top of that centered voicing.
 */
import { PianoKeyboard } from './keyboard.js';
import { createKeySelector } from './key-selector.js';
import { createModeSelector } from './mode-selector.js';
import { createInversionSelector } from './inversion-selector.js';
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
  getCenteredChordVoicing,
  findRootNoteInVoicing,
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
  const inversion = inversionSelector.getSelected();
  const { startMidi, endMidi } = computeKeyboardWindow(octaveSpan);

  const centeredVoicing = getCenteredChordVoicing(pc, mode, inversion, startMidi, endMidi);
  const voicedTriad = centeredVoicing.map((n) => n + octaveOffset * 12);
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