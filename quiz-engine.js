/**
 * quiz-engine.js
 * Pure, DOM-free quiz logic: generates random questions within a chosen
 * difficulty scope, checks a guess against the real answer (strict,
 * all-or-nothing), and computes which MIDI notes a question should
 * display on the keyboard. Builds entirely on music-theory.js - no new
 * music theory rules live here, just quiz bookkeeping.
 */
import {
  getScalePitchClasses, 
  getNotesInRangeMatchingPitchClasses, 
  findNoteNearestCenter,
  getCenteredChordVoicing, 
  findRootNoteInVoicing, 
  NOTE_NAMES_SHARP, 
  MODE_LABELS,
} from './music-theory.js';

const ALL_PITCH_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const NATURAL_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B (no sharps/flats)

// Fixed root octave used to build chord questions. Chosen (same as the
// chords page) so every root/inversion combination stays fully inside
// the shared keyboard window from keyboard-config.js.
const CHORD_BASE_OCTAVE = 3;

export const INVERSION_LABELS = ['Root Position', '1st Inversion', '2nd Inversion'];

/**
 * Course presets. Each restricts which roots, modes, and (for chord
 * questions) inversions can be drawn when generating a question.
 * These are static course definitions the learner can pick.
 */
export const COURSE_PRESETS = [
  {
    id: 'root-positions-only',
    shortLabel: 'Root positions only',
    label: 'Root positions only — major & minor triads in root position',
    roots: ALL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [0],
  },
  {
    id: 'first-inversions-only',
    shortLabel: '1st inversions only',
    label: '1st inversions only — major & minor triads in first inversion',
    roots: ALL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [1],
  },
  {
    id: 'second-inversions-only',
    shortLabel: '2nd inversions only',
    label: '2nd inversions only — major & minor triads in second inversion',
    roots: ALL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [2],
  },
  {
    id: 'root-and-first-inversions',
    shortLabel: 'Root + 1st inversions',
    label: 'Root + 1st inversions — major & minor triads with the first two voicings',
    roots: ALL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [0, 1],
  },
  {
    id: 'all-inversions',
    shortLabel: 'All inversions',
    label: 'All inversions — major & minor triads in every inversion',
    roots: ALL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [0, 1, 2],
  },
  {
    id: 'only-white',
    shortLabel: 'Only white keys',
    label: 'Only white keys — all notes of the triad are white keys',
    roots: NATURAL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [0, 1, 2],
  },
  {
    id: 'center-black',
    shortLabel: 'Center black',
    label: 'Center black — root-position major triads with a black-key third',
    roots: [2, 4, 6, 9, 11],
    modes: ['major'],
    inversions: [0],
  },
];

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function questionsEqual(a, b) {
  if (!a || !b) return false;
  if (a.type !== b.type || a.rootPc !== b.rootPc || a.mode !== b.mode) return false;
  if (a.type === 'chord' && a.inversion !== b.inversion) return false;
  return true;
}

/**
 * Generate a random question within a preset's scope. Tries a handful
 * of times to avoid repeating the immediately preceding question
 * (harmless if the pool is too small to guarantee that).
 * @param {'scale'|'chord'} quizType
 * @param {object} preset one of DIFFICULTY_PRESETS
 * @param {object|null} previousQuestion
 */
export function generateQuestion(quizType, preset, previousQuestion = null) {
  let question;
  let attempts = 0;
  do {
    const rootPc = pickRandom(preset.roots ?? ALL_PITCH_CLASSES);
    const mode = pickRandom(preset.modes ?? ['major', 'minor']);
    question = quizType === 'chord'
      ? { type: 'chord', rootPc, mode, inversion: pickRandom(preset.inversions ?? [0]) }
      : { type: 'scale', rootPc, mode };
    attempts += 1;
  } while (questionsEqual(question, previousQuestion) && attempts < 20);
  return question;
}

/**
 * Strict, all-or-nothing comparison: every relevant field must match.
 */
export function checkAnswer(question, guess) {
  if (question.type !== guess.type) return false;
  if (question.rootPc !== guess.rootPc || question.mode !== guess.mode) return false;
  if (question.type === 'chord' && question.inversion !== guess.inversion) return false;
  return true;
}

/**
 * Compute what to display on the keyboard for a question.
 * Returns { highlighted, rootNote } - callers decide whether/when to
 * actually reveal `rootNote` as a marker (e.g. only after answering).
 */
export function getQuestionDisplayNotes(question, startMidi, endMidi) {
  if (question.type === 'scale') {
    const pitchClasses = getScalePitchClasses(question.rootPc, question.mode);
    const highlighted = getNotesInRangeMatchingPitchClasses(pitchClasses, startMidi, endMidi);
    const rootNote = findNoteNearestCenter(question.rootPc, startMidi, endMidi);
    return { highlighted, rootNote };
  }
  const voiced = getCenteredChordVoicing(question.rootPc, question.mode, question.inversion, startMidi, endMidi);
  const rootNote = findRootNoteInVoicing(voiced, question.rootPc);
  return { highlighted: voiced, rootNote };
}

/**
 * Human-readable label for a question/guess, e.g. "C# Minor scale" or
 * "Eb Major triad — 2nd Inversion".
 */
export function formatQuestionLabel(question) {
  const modeLabel = MODE_LABELS[question.mode] ?? question.mode;
  const rootLabel = NOTE_NAMES_SHARP[question.rootPc];
  if (question.type === 'scale') return `${rootLabel} ${modeLabel} scale`;
  return `${rootLabel} ${modeLabel} triad — ${INVERSION_LABELS[question.inversion]}`;
}