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
 * Difficulty/scope presets. Each restricts which roots, modes, and (for
 * chord questions) inversions can be drawn when generating a question.
 * Add more presets here without touching any UI code.
 */
export const DIFFICULTY_PRESETS = [
  {
    id: 'beginner',
    shortLabel: 'Beginner',
    label: 'Beginner — natural keys only, major only, root position only',
    roots: NATURAL_PITCH_CLASSES,
    modes: ['major'],
    inversions: [0],
  },
  {
    id: 'easy',
    shortLabel: 'Easy',
    label: 'Easy — natural keys only, major & minor, root/1st inversion',
    roots: NATURAL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [0, 1],
  },
  {
    id: 'intermediate',
    shortLabel: 'Intermediate',
    label: 'Intermediate — all 12 keys, major & minor, root/1st inversion',
    roots: ALL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [0, 1],
  },
  {
    id: 'advanced',
    shortLabel: 'Advanced',
    label: 'Advanced — all 12 keys, major & minor, all inversions',
    roots: ALL_PITCH_CLASSES,
    modes: ['major', 'minor'],
    inversions: [0, 1, 2],
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
    const rootPc = pickRandom(preset.roots);
    const mode = pickRandom(preset.modes);
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