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
  COURSE_PRESETS,
  generateQuestion,
  checkAnswer,
  getQuestionDisplayNotes,
  formatQuestionLabel,
} from './quiz-engine.js';
import { NOTE_NAMES_SHARP } from './music-theory.js';

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
let selectedPreset = COURSE_PRESETS[0];
let preset = selectedPreset;
let currentQuestion = null;
let answered = false;

const CUSTOM_PRESET = {
  id: 'custom',
  shortLabel: 'Custom',
  label: 'Custom selection',
  roots: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  modes: ['major', 'minor'],
  inversions: [0, 1, 2],
};

const COURSE_OPTIONS = [...COURSE_PRESETS, CUSTOM_PRESET];

function arraysEqual(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, idx) => value === b[idx]);
}

function normalizeConfig(config) {
  const roots = [...new Set(config.roots ?? COURSE_PRESETS[0].roots)];
  const modes = [...new Set(config.modes ?? COURSE_PRESETS[0].modes)];
  const inversions = [...new Set(config.inversions ?? COURSE_PRESETS[0].inversions)];
  return {
    roots: roots.length ? roots.slice().sort((a, b) => a - b) : [...COURSE_PRESETS[0].roots],
    modes: modes.length ? modes.slice().sort((a, b) => {
      const order = { major: 0, minor: 1 };
      return (order[a] ?? 99) - (order[b] ?? 99);
    }) : [...COURSE_PRESETS[0].modes],
    inversions: inversions.length ? inversions.slice().sort((a, b) => a - b) : [...COURSE_PRESETS[0].inversions],
  };
}

function getNextToggleValues(selectedValues, value) {
  const nextValues = selectedValues.includes(value)
    ? selectedValues.filter((item) => item !== value)
    : [...selectedValues, value];
  return nextValues.length === 0 ? selectedValues : nextValues;
}

function isConfigValidForPreset(basePreset, config) {
  const effectivePreset = getEffectivePreset(basePreset, config);
  if (effectivePreset.roots.length === 0 || effectivePreset.modes.length === 0) {
    return false;
  }
  if (quizType === 'chord' && effectivePreset.inversions.length === 0) {
    return false;
  }

  const rootCandidates = effectivePreset.roots ?? [];
  const modeCandidates = effectivePreset.modes ?? [];
  const inversionCandidates = effectivePreset.inversions ?? [0];

  for (const rootPc of rootCandidates) {
    for (const mode of modeCandidates) {
      if (quizType === 'scale') {
        if (typeof basePreset?.isAllowed !== 'function') {
          return true;
        }
        if (basePreset.isAllowed({ type: 'scale', rootPc, mode })) {
          return true;
        }
        continue;
      }

      for (const inversion of inversionCandidates) {
        const candidate = { type: 'chord', rootPc, mode, inversion };
        if (typeof basePreset?.isAllowed !== 'function') {
          return true;
        }
        if (basePreset.isAllowed(candidate)) {
          return true;
        }
      }
    }
  }

  return false;
}

function getMatchingPresetForConfig(config) {
  const normalized = normalizeConfig(config);
  const exactMatch = COURSE_PRESETS.find((candidate) => {
    return arraysEqual(candidate.roots, normalized.roots)
      && arraysEqual(candidate.modes, normalized.modes)
      && arraysEqual(candidate.inversions, normalized.inversions);
  });
  if (exactMatch) return exactMatch;
  return {
    ...CUSTOM_PRESET,
    roots: [...normalized.roots],
    modes: [...normalized.modes],
    inversions: [...normalized.inversions],
  };
}

let courseConfig = normalizeConfig({
  roots: selectedPreset.roots,
  modes: selectedPreset.modes,
  inversions: selectedPreset.inversions,
});

function getEffectivePreset(basePreset, config) {
  const normalized = normalizeConfig(config);
  const resolvedPreset = basePreset ?? CUSTOM_PRESET;
  return {
    ...resolvedPreset,
    roots: (resolvedPreset.roots ?? []).filter((root) => normalized.roots.includes(root)),
    modes: (resolvedPreset.modes ?? []).filter((mode) => normalized.modes.includes(mode)),
    inversions: (resolvedPreset.inversions ?? []).filter((inversion) => normalized.inversions.includes(inversion)),
  };
}

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
    feedbackEl.textContent = `${formatQuestionLabel(currentQuestion)}`;
    feedbackEl.className = 'feedback-message feedback-correct';
  } else {
    scoreTracker.recordWrong();
    feedbackEl.textContent = `${formatQuestionLabel(currentQuestion)}`;
    feedbackEl.className = 'feedback-message feedback-wrong';
  }

  answered = true;
  actionBtn.textContent = 'Next Question';
  actionBtn.classList.add('is-next');
}

const keySelector = createKeySelector(document.getElementById('guess-key-container'));
const modeSelector = createModeSelector(document.getElementById('guess-mode-container'));
const inversionSelector = createInversionSelector(document.getElementById('guess-inversion-container'));

function renderManualToggleSet(container, { values, labels, selectedValues, onToggle, buttonClassName }) {
  container.innerHTML = '';
  values.forEach((value, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `manual-toggle-btn ${buttonClassName}`;
    button.textContent = labels[index];
    const selected = selectedValues.includes(value);
    button.classList.toggle('active', selected);
    button.addEventListener('click', () => {
      const nextValues = getNextToggleValues(selectedValues, value);
      onToggle(nextValues);
    });
    container.appendChild(button);
  });
}

function applyConfigToManualControls() {
  renderManualToggleSet(document.getElementById('manual-key-container'), {
    values: Array.from({ length: NOTE_NAMES_SHARP.length }, (_, i) => i),
    labels: NOTE_NAMES_SHARP,
    selectedValues: courseConfig.roots,
    onToggle: (nextValues) => {
      const candidateConfig = normalizeConfig({
        roots: nextValues,
        modes: courseConfig.modes,
        inversions: courseConfig.inversions,
      });
      if (!isConfigValidForPreset(selectedPreset, candidateConfig)) {
        return;
      }
      courseConfig = candidateConfig;
      preset = getEffectivePreset(selectedPreset, courseConfig);
      difficultySelector.setSelected(selectedPreset);
      applyConfigToManualControls();
      showQuestion();
    },
    buttonClassName: 'manual-key-btn',
  });

  renderManualToggleSet(document.getElementById('manual-mode-container'), {
    values: ['major', 'minor'],
    labels: ['Major', 'Minor'],
    selectedValues: courseConfig.modes,
    onToggle: (nextValues) => {
      const candidateConfig = normalizeConfig({
        roots: courseConfig.roots,
        modes: nextValues,
        inversions: courseConfig.inversions,
      });
      if (!isConfigValidForPreset(selectedPreset, candidateConfig)) {
        return;
      }
      courseConfig = candidateConfig;
      preset = getEffectivePreset(selectedPreset, courseConfig);
      difficultySelector.setSelected(selectedPreset);
      applyConfigToManualControls();
      showQuestion();
    },
    buttonClassName: 'manual-mode-btn',
  });

  renderManualToggleSet(document.getElementById('manual-inversion-container'), {
    values: [0, 1, 2],
    labels: ['Root', '1st', '2nd'],
    selectedValues: courseConfig.inversions,
    onToggle: (nextValues) => {
      const candidateConfig = normalizeConfig({
        roots: courseConfig.roots,
        modes: courseConfig.modes,
        inversions: nextValues,
      });
      if (!isConfigValidForPreset(selectedPreset, candidateConfig)) {
        return;
      }
      courseConfig = candidateConfig;
      preset = getEffectivePreset(selectedPreset, courseConfig);
      difficultySelector.setSelected(selectedPreset);
      applyConfigToManualControls();
      showQuestion();
    },
    buttonClassName: 'manual-inversion-btn',
  });
}

function applyPresetToManualConfig(nextPreset) {
  selectedPreset = nextPreset;
  const nextConfig = normalizeConfig({
    roots: nextPreset.roots,
    modes: nextPreset.modes,
    inversions: nextPreset.inversions,
  });
  courseConfig = nextConfig;
  preset = getEffectivePreset(selectedPreset, courseConfig);
  applyConfigToManualControls();
}

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

const difficultySelector = createDifficultySelector(document.getElementById('difficulty-container'), {
  presets: COURSE_OPTIONS,
  onChange: (nextPreset) => {
    const chosenPreset = nextPreset && nextPreset.id === 'custom' ? CUSTOM_PRESET : nextPreset;
    applyPresetToManualConfig(chosenPreset);
    showQuestion();
  },
});

applyPresetToManualConfig(selectedPreset);

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