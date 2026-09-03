/**
 * quiz-page.js
 * Page-specific wiring for the quiz. Reuses the same key/mode/inversion
 * selector components as the scales and chords pages, but here they act
 * as *answer inputs* instead of live display controls - the keyboard is
 * driven by a hidden, randomly generated question until you submit.
 *
 * Also reuses range-control.js so the quiz keyboard can be
 * grown/shrunk exactly like on the scales/chords pages; the engine
 * recomputes the question's display notes for whatever window is
 * currently active (chord questions stay centered via
 * getCenteredChordVoicing() inside quiz-engine.js).
 *
 * Note: `quizType` is initialized FROM the quiz-type toggle's own
 * getSelected() rather than a hardcoded literal like 'scale'. That
 * way, if the button order in quiz-type-toggle.js's DEFAULT_TYPES
 * (or whatever `types`/`initial` is passed in) ever changes, this
 * page automatically starts on whichever option is actually shown as
 * selected, instead of drifting out of sync with it.
 */
import { PianoKeyboard } from './keyboard.js';
import { createKeySelector } from './key-selector.js';
import { createModeSelector } from './mode-selector.js';
import { createInversionSelector } from './inversion-selector.js';
import { createQuizTypeToggle } from './quiz-type-toggle.js';
import { createDifficultySelector } from './difficulty-selector.js';
import { createScoreTracker } from './score-tracker.js';
import { createRangeControl } from './range-control.js';
import {
  computeKeyboardWindow,
  getStandardKeyboardOptions,
  DEFAULT_OCTAVE_SPAN,
  MIN_OCTAVE_SPAN,
  MAX_OCTAVE_SPAN,
} from './keyboard-config.js';
import {
  DIFFICULTY_PRESETS,
  generateQuestion,
  checkAnswer,
  getQuestionDisplayNotes,
  formatQuestionLabel,
} from './quiz-engine.js';

let octaveSpan = DEFAULT_OCTAVE_SPAN;

const keyboard = new PianoKeyboard(
  document.getElementById('keyboard-container'),
  getStandardKeyboardOptions(octaveSpan)
);
const scoreTracker = createScoreTracker(document.getElementById('score-tracker-container'));

const inversionGroupEl = document.getElementById('guess-inversion-group');
const actionBtn = document.getElementById('action-btn');
const feedbackEl = document.getElementById('feedback-message');

let quizType; // set below, right after the toggle is created
let preset = DIFFICULTY_PRESETS[0];
let currentQuestion = null;
let answered = false;

function refreshInversionVisibility() {
  inversionGroupEl.classList.toggle('hidden', quizType !== 'chord');
}

function showQuestion() {
  currentQuestion = generateQuestion(quizType, preset, currentQuestion);
  const { startMidi, endMidi } = computeKeyboardWindow(octaveSpan);
  const { highlighted } = getQuestionDisplayNotes(currentQuestion, startMidi, endMidi);

  // No marker here on purpose - the root position would give the
  // answer away before you've guessed.
  keyboard.setNotes({ highlighted });

  feedbackEl.textContent = 'Make your guess, then hit Submit.';
  feedbackEl.className = 'feedback-message';

  // Deliberately NOT resetting keySelector/modeSelector/inversionSelector
  // here - whatever was last selected stays selected.

  answered = false;
  actionBtn.textContent = 'Submit Answer';
  actionBtn.classList.remove('is-next');
}

function submitGuess() {
  const guess = {
    type: quizType,
    rootPc: keySelector.getSelected(),
    mode: modeSelector.getSelected(),
  };
  if (quizType === 'chord') guess.inversion = inversionSelector.getSelected();

  const isCorrect = checkAnswer(currentQuestion, guess);

  // Reveal the true root now that an answer has been submitted.
  const { startMidi, endMidi } = computeKeyboardWindow(octaveSpan);
  const { highlighted, rootNote } = getQuestionDisplayNotes(currentQuestion, startMidi, endMidi);
  keyboard.setNotes({ highlighted, markers: [rootNote], markerClass: 'marker-root' });

  if (isCorrect) {
    scoreTracker.recordCorrect();
    feedbackEl.textContent = `Correct! It was the ${formatQuestionLabel(currentQuestion)}.`;
    feedbackEl.className = 'feedback-message feedback-correct';
  } else {
    scoreTracker.recordWrong();
    feedbackEl.textContent = `Not quite — it was the ${formatQuestionLabel(currentQuestion)}.`;
    feedbackEl.className = 'feedback-message feedback-wrong';
  }

  answered = true;
  actionBtn.textContent = 'Next Question';
  actionBtn.classList.add('is-next');
}

const keySelector = createKeySelector(document.getElementById('guess-key-container'));
const modeSelector = createModeSelector(document.getElementById('guess-mode-container'));
const inversionSelector = createInversionSelector(document.getElementById('guess-inversion-container'));

const quizTypeToggle = createQuizTypeToggle(document.getElementById('quiz-type-container'), {
  onChange: (type) => {
    quizType = type;
    refreshInversionVisibility();
    showQuestion();
  },
});
// Read the toggle's actual default instead of assuming 'scale' - this
// is what was missing before. Whichever button the toggle shows as
// active on load (index 0 of its items) is what quizType starts as.
quizType = quizTypeToggle.getSelected();

createDifficultySelector(document.getElementById('difficulty-container'), {
  presets: DIFFICULTY_PRESETS,
  onChange: (selectedPreset) => {
    preset = selectedPreset;
    showQuestion();
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
    const notes = getQuestionDisplayNotes(currentQuestion, startMidi, endMidi);
    if (answered) {
      keyboard.setNotes({ highlighted: notes.highlighted, markers: [notes.rootNote], markerClass: 'marker-root' });
    } else {
      keyboard.setNotes({ highlighted: notes.highlighted });
    }
  },
});

actionBtn.addEventListener('click', () => {
  if (answered) {
    showQuestion();
  } else {
    submitGuess();
  }
});

refreshInversionVisibility();
showQuestion();