/**
 * home-page.js
 * A neutral, free-play demo of the keyboard component - no scales,
 * chords, or quizzes here, just click-to-toggle note identification.
 * This intentionally reuses PianoKeyboard exactly as-is (including its
 * onKeyClick hook, which none of the other pages needed until now) to
 * show off the "abstract keyboard engine" idea on its own terms.
 */
import { PianoKeyboard } from './keyboard.js';
import { getStandardKeyboardOptions } from './keyboard-config.js';
import { midiToNoteName } from './music-theory.js';

const keyboard = new PianoKeyboard(
  document.getElementById('keyboard-container'),
  getStandardKeyboardOptions()
);

const infoEl = document.getElementById('note-info');
const clearBtn = document.getElementById('clear-btn');
const selected = new Set();

const DEFAULT_INFO_TEXT = 'Click any key to see its name and toggle its highlight.';

function refresh() {
  keyboard.setNotes({ highlighted: [...selected] });
}

keyboard.onKeyClick((midi) => {
  if (selected.has(midi)) {
    selected.delete(midi);
  } else {
    selected.add(midi);
  }
  refresh();
  infoEl.textContent = `Last clicked: ${midiToNoteName(midi)}  (MIDI note ${midi})`;
});

clearBtn.addEventListener('click', () => {
  selected.clear();
  refresh();
  infoEl.textContent = DEFAULT_INFO_TEXT;
});

infoEl.textContent = DEFAULT_INFO_TEXT;
refresh();