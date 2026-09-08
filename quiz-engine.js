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
const NATURAL_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const BLACK_PITCH_CLASSES = [1, 3, 6, 8, 10]; // C# D# F# G# A#

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
        id: 'white-key-chords',
        shortLabel: 'White-key chords',
        label: 'Major/minor triads whose notes stay on white keys',
        roots: [0, 2, 4, 5, 7, 9, 11],
        modes: ['major', 'minor'],
        inversions: [0, 1, 2],
        isAllowed: ({ rootPc, mode, inversion }) => {
            const triad = triadPitchClasses(rootPc, mode);
            return triad.every((pitchClass) => NATURAL_PITCH_CLASSES.includes(pitchClass));
        },
    },
    {
        id: 'center-white',
        shortLabel: 'Single white center',
        label: 'Single white center — root and fifth are black, third is white',
        roots: [1, 3, 6, 8],
        modes: ['major', 'minor'],
        inversions: [0, 1, 2],
        isAllowed: ({ rootPc, mode }) => {
            const [root, third, fifth] = triadPitchClasses(rootPc, mode);
            return !NATURAL_PITCH_CLASSES.includes(root)
                && !NATURAL_PITCH_CLASSES.includes(fifth)
                && NATURAL_PITCH_CLASSES.includes(third);
        },
    },
    {
        id: 'center-black',
        shortLabel: 'Single black center',
        label: 'Single black center — root and fifth are white, third is black',
        roots: [0, 2, 4, 5, 7, 9],
        modes: ['major', 'minor'],
        inversions: [0, 1, 2],
        isAllowed: ({ rootPc, mode }) => {
            const [root, third, fifth] = triadPitchClasses(rootPc, mode);
            return NATURAL_PITCH_CLASSES.includes(root)
                && NATURAL_PITCH_CLASSES.includes(fifth)
                && !NATURAL_PITCH_CLASSES.includes(third);
        },
    },
    {
        id: 'all-black',
        shortLabel: 'All-black chords',
        label: 'Major/minor triads whose notes stay on black keys',
        roots: BLACK_PITCH_CLASSES,
        modes: ['major', 'minor'],
        inversions: [0, 1, 2],
        isAllowed: ({ rootPc, mode }) => {
            const triad = triadPitchClasses(rootPc, mode);
            return triad.every((pitchClass) => BLACK_PITCH_CLASSES.includes(pitchClass));
        },
    },
    {
        id: 'odd-chords',
        shortLabel: 'Odd chords',
        label: 'B and Bb/A# major/minor triads — the remaining special cases',
        roots: [10, 11],
        modes: ['major', 'minor'],
        inversions: [0, 1, 2],
    },
];

function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function triadPitchClasses(rootPc, mode) {
    const third = mode === 'major' ? 4 : 3;
    const fifth = 7;
    return [rootPc, (rootPc + third) % 12, (rootPc + fifth) % 12];
}

function isQuestionAllowed(preset, question) {
    if (typeof preset?.isAllowed !== 'function') return true;
    return preset.isAllowed(question);
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
    const rootCandidates = preset.roots ?? ALL_PITCH_CLASSES;
    const modeCandidates = preset.modes ?? ['major', 'minor'];
    const inversionCandidates = preset.inversions ?? [0];

    let question = null;
    let attempts = 0;
    const candidatePool = [];

    for (const rootPc of rootCandidates) {
        for (const mode of modeCandidates) {
            if (quizType === 'scale') {
                candidatePool.push({ type: 'scale', rootPc, mode });
                continue;
            }
            for (const inversion of inversionCandidates) {
                candidatePool.push({ type: 'chord', rootPc, mode, inversion });
            }
        }
    }

    const filteredCandidates = candidatePool.filter((candidate) => isQuestionAllowed(preset, candidate));
    const pool = filteredCandidates.length > 0 ? filteredCandidates : candidatePool;

    do {
        question = pickRandom(pool);
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
 * "Eb Major — 2nd Inversion".
 */
export function formatQuestionLabel(question) {
    const modeLabel = MODE_LABELS[question.mode] ?? question.mode;
    const rootLabel = NOTE_NAMES_SHARP[question.rootPc];
    if (question.type === 'scale') return `${rootLabel} ${modeLabel} scale`;
    return `${rootLabel} ${modeLabel} (${INVERSION_LABELS[question.inversion]})`;
}