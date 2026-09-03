/**
 * quiz-page.js
 * Page-specific wiring for the quiz. Reuses the same key/mode/inversion
 * selector components as the scales and chords pages, but here they act
 * as *answer inputs* instead of live display controls - the keyboard is
 * driven by a hidden, randomly generated question until you submit.
 *
 * Two UX choices worth noting:
 * - There's one action button that alternates between "Submit Answer"
 *   and "Next Question" (rather than two separate buttons), so you
 *   never have to move the mouse to a different spot.
 * - The guess selectors are NOT reset between questions - whatever you
 *   last picked stays selected as the starting point for the next
 *   question, rather than snapping back to a fixed default every time.
 */
import { PianoKeyboard } from './keyboard.js';
import { createKeySelector } from './key-selector.js';
import { createModeSelector } from './mode-selector.js';
import { createInversionSelector } from './inversion-selector.js';
import { createQuizTypeToggle } from './quiz-type-toggle.js';
import { createDifficultySelector } from './difficulty-selector.js';
import { createScoreTracker } from './score-tracker.js';
import { getStandardKeyboardOptions } from './keyboard-config.js';
import {
  DIFFICULTY_PRESETS,
  generateQuestion,
  checkAnswer,
  getQuestionDisplayNotes,
  formatQuestionLabel,
} from './quiz-engine.js';

const keyboard = new PianoKeyboard(
  document.getElementById('keyboard-container'),
  getStandardKeyboardOptions()
);
const scoreTracker = createScoreTracker(document.getElementById('score-tracker-container'));

const inversionGroupEl = document.getElementById('guess-inversion-group');
const actionBtn = document.getElementById('action-btn');
const feedbackEl = document.getElementById('feedback-message');

let quizType = 'scale';
let preset = DIFFICULTY_PRESETS[0];
let currentQuestion = null;
let answered = false;

function refreshInversionVisibility() {
  inversionGroupEl.classList.toggle('hidden', quizType !== 'chord');
}

function showQuestion() {
  currentQuestion = generateQuestion(quizType, preset, currentQuestion);
  const { highlighted } = getQuestionDisplayNotes(currentQuestion);

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
  const { highlighted, rootNote } = getQuestionDisplayNotes(currentQuestion);
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

createQuizTypeToggle(document.getElementById('quiz-type-container'), {
  onChange: (type) => {
    quizType = type;
    refreshInversionVisibility();
    showQuestion();
  },
});

createDifficultySelector(document.getElementById('difficulty-container'), {
  presets: DIFFICULTY_PRESETS,
  onChange: (selectedPreset) => {
    preset = selectedPreset;
    showQuestion();
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