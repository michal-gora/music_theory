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
import { midiToNoteName, NOTE_NAMES_SHARP } from './music-theory.js';

const keyboard = new PianoKeyboard(
  document.getElementById('keyboard-container'),
  getStandardKeyboardOptions()
);

const infoEl = document.getElementById('note-info');
const clearBtn = document.getElementById('clear-btn');
const selected = new Set();

const DEFAULT_INFO_TEXT = 'Click any key to see its name and toggle its highlight.';

function getTriadDescription() {
  const selectedList = [...selected].sort((a, b) => a - b);
  if (selectedList.length < 3) return null;

  const pitchClasses = [...new Set(selectedList.map((midi) => midi % 12))];
  if (pitchClasses.length < 3) return null;

  const triadTypes = [
    { mode: 'major', intervals: [0, 4, 7] },
    { mode: 'minor', intervals: [0, 3, 7] },
  ];

  for (const triadType of triadTypes) {
    for (let rootPc = 0; rootPc < 12; rootPc++) {
      const triadPcs = triadType.intervals.map((interval) => (rootPc + interval) % 12);
      const isTriadMatch = triadPcs.every((pc) => pitchClasses.includes(pc))
        && pitchClasses.every((pc) => triadPcs.includes(pc));

      if (!isTriadMatch) continue;

      const modeLabel = triadType.mode === 'major' ? 'Major' : 'Minor';
      const chordName = `${NOTE_NAMES_SHARP[rootPc]} ${modeLabel}`;
      const thirdPc = (rootPc + (triadType.mode === 'major' ? 4 : 3)) % 12;
      const fifthPc = (rootPc + 7) % 12;
      const bassPc = selectedList[0] % 12;

      if (selectedList.length > 3) {
        return chordName;
      }

      if (bassPc === rootPc) {
        return `${chordName} (Root Position)`;
      }
      if (bassPc === thirdPc) {
        return `${chordName} (1st Inversion)`;
      }
      if (bassPc === fifthPc) {
        return `${chordName} (2nd Inversion)`;
      }

      return chordName;
    }
  }

  return null;
}

function refresh() {
  keyboard.setNotes({ highlighted: [...selected] });
  infoEl.textContent = getTriadDescription() ?? DEFAULT_INFO_TEXT;
}

keyboard.onKeyClick((midi) => {
  if (selected.has(midi)) {
    selected.delete(midi);
  } else {
    selected.add(midi);
  }
  refresh();
});

clearBtn.addEventListener('click', () => {
  selected.clear();
  refresh();
});

refresh();