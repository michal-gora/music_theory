/**
 * music-theory.js
 * Pure, DOM-free music theory helpers. Canonical note representation is
 * MIDI note number (C4 = 60), per MIDI convention (octave = floor(midi/12) - 1).
 *
 * Everything here is pure data + pure functions, so it can be reused in any
 * context (browser, node, tests) and is the "single source of truth" that
 * the UI components below read from.
 */

// 12 pitch classes, 0 = C. Two naming tables so callers can choose spelling.
export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_NAMES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function pitchClass(midi) {
  return ((midi % 12) + 12) % 12;
}

export function midiToOctave(midi) {
  return Math.floor(midi / 12) - 1;
}

export function midiToNoteName(midi, preferFlat = false) {
  const names = preferFlat ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return `${names[pitchClass(midi)]}${midiToOctave(midi)}`;
}

export function noteNameToPitchClass(name) {
  let idx = NOTE_NAMES_SHARP.indexOf(name);
  if (idx === -1) idx = NOTE_NAMES_FLAT.indexOf(name);
  return idx;
}

// Interval patterns in semitones from the root. Add more modes/scales here
// later (dorian, pentatonic, etc.) without touching any UI code.
export const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 9, 10], // natural minor
};

// Triad interval patterns from the root.
export const CHORD_INTERVALS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
};

export const MODE_LABELS = {
  major: 'Major',
  minor: 'Minor',
};

/**
 * Build the MIDI notes of a scale, one full octave, root through the
 * octave above (e.g. C major -> C D E F G A B C).
 * @param {number} rootPitchClass 0-11
 * @param {'major'|'minor'} scaleType
 * @param {number} octave the octave of the root (4 = middle-ish, C4 = 60)
 */
export function getScaleMidiNotes(rootPitchClass, scaleType, octave = 4) {
  const baseMidi = (octave + 1) * 12 + rootPitchClass;
  const intervals = SCALE_INTERVALS[scaleType];
  if (!intervals) throw new Error(`Unknown scale type: ${scaleType}`);
  return [...intervals.map((i) => baseMidi + i), baseMidi + 12];
}

/**
 * The set of pitch classes (0-11) that belong to a scale, independent of
 * octave. E.g. C major -> [0, 2, 4, 5, 7, 9, 11].
 */
export function getScalePitchClasses(rootPitchClass, scaleType) {
  const intervals = SCALE_INTERVALS[scaleType];
  if (!intervals) throw new Error(`Unknown scale type: ${scaleType}`);
  return intervals.map((i) => (rootPitchClass + i) % 12);
}

/**
 * All MIDI notes within [startMidi, endMidi] whose pitch class matches one
 * of the given pitch classes. Useful for showing a full scale across an
 * arbitrary keyboard range, not just a single octave.
 */
export function getNotesInRangeMatchingPitchClasses(pitchClasses, startMidi, endMidi) {
  const notes = [];
  for (let m = startMidi; m <= endMidi; m++) {
    if (pitchClasses.includes(pitchClass(m))) notes.push(m);
  }
  return notes;
}

/**
 * Find the occurrence of a given pitch class within [startMidi, endMidi]
 * that is closest to an arbitrary target MIDI value (which itself doesn't
 * have to fall on a matching note, or even inside the range - it's just
 * an aim point). Useful for things like "move the marker roughly an
 * octave to the left/right" without necessarily moving the keyboard.
 */
export function findNoteNearestTarget(targetPitchClass, targetMidi, startMidi, endMidi) {
  let best = null;
  let bestDist = Infinity;
  for (let m = startMidi; m <= endMidi; m++) {
    if (pitchClass(m) === targetPitchClass) {
      const dist = Math.abs(m - targetMidi);
      if (dist < bestDist) {
        bestDist = dist;
        best = m;
      }
    }
  }
  return best;
}

/**
 * Find the occurrence of a given pitch class within [startMidi, endMidi]
 * that is closest to the center of that range. Handy for placing a single
 * "root" marker roughly in the middle of the visible keyboard even though
 * the same pitch class repeats every octave.
 */
export function findNoteNearestCenter(targetPitchClass, startMidi, endMidi) {
  return findNoteNearestTarget(targetPitchClass, (startMidi + endMidi) / 2, startMidi, endMidi);
}

/**
 * Build the MIDI notes of a triad in root position.
 */
export function getTriadMidiNotes(rootPitchClass, chordType, octave = 4) {
  const baseMidi = (octave + 1) * 12 + rootPitchClass;
  const intervals = CHORD_INTERVALS[chordType];
  if (!intervals) throw new Error(`Unknown chord type: ${chordType}`);
  return intervals.map((i) => baseMidi + i);
}

/**
 * Re-voice a chord into a given inversion.
 * inversion 0 = root position, 1 = first inversion, 2 = second inversion, etc.
 * Works generically for any chord size (triads, 7th chords, ...).
 * @param {number[]} midiNotes chord in root position, ascending
 * @param {number} inversion
 */
export function invertChord(midiNotes, inversion = 0) {
  let notes = [...midiNotes].sort((a, b) => a - b);
  const n = inversion % notes.length;
  for (let i = 0; i < n; i++) {
    const lowest = notes.shift();
    notes.push(lowest + 12);
  }
  return notes.sort((a, b) => a - b);
}

/**
 * Given an inverted chord and the original root pitch class, find which
 * MIDI note in the voicing is the root (useful for marking it distinctly).
 */
export function findRootNoteInVoicing(midiNotes, rootPitchClass) {
  return midiNotes.find((n) => pitchClass(n) === rootPitchClass);
}

export function getCenteredChordVoicing(rootPitchClass, chordType, inversion, startMidi, endMidi) {
  const target = (startMidi + endMidi) / 2;
  const minOctave = midiToOctave(startMidi) - 1;
  const maxOctave = midiToOctave(endMidi) + 1;

  let best = null;
  let bestDist = Infinity;
  for (let octave = minOctave; octave <= maxOctave; octave++) {
    const rootPosition = getTriadMidiNotes(rootPitchClass, chordType, octave);
    const voiced = invertChord(rootPosition, inversion);
    const midpoint = (voiced[0] + voiced[voiced.length - 1]) / 2;
    const dist = Math.abs(midpoint - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = voiced;
    }
  }
  return best;
}

/**
 * Fold a list of MIDI notes into a single display octave, e.g. for
 * showing a scale confined to one visual octave regardless of the
 * math above. Keeps relative order stable, all notes get the same
 * base octave except a possible final "top" note wraps to octave+1
 * if it shares the root's pitch class (so scales still show start->end).
 */
export function wrapToSingleOctave(midiNotes, centerOctave = 4) {
  const base = (centerOctave + 1) * 12;
  const rootPc = pitchClass(midiNotes[0]);
  return midiNotes.map((n) => {
    const pc = pitchClass(n);
    const isFinalRootRepeat = pc === rootPc && n !== midiNotes[0];
    return isFinalRootRepeat ? base + 12 : base + pc;
  });
}

/**
 * Convenience: MIDI range covering exactly one octave centered around a
 * given octave number, e.g. octaveRange(4) -> { startMidi: 60, endMidi: 72 }
 * (C4 to C5 inclusive).
 */
export function octaveRange(centerOctave = 4) {
  const start = (centerOctave + 1) * 12;
  return { startMidi: start, endMidi: start + 12 };
}