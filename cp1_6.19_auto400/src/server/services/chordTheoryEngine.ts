import { Chord } from '../types';

const MAJOR_SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const MINOR_SCALE = ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'];

const CHORD_QUALITIES: Record<string, string[]> = {
  major: ['', 'm', 'm', '', '', 'm', 'dim'],
  minor: ['m', 'dim', '', 'm', 'm', '', '']
};

const COMMON_CHORDS = [
  'C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim',
  'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5',
  'Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb',
  'A', 'B', 'D', 'E', 'Bb', 'Eb', 'Ab'
];

interface ChordFunction {
  degree: string;
  function: 'tonic' | 'subdominant' | 'dominant' | 'predominant' | 'mediant' | 'submediant';
  weight: number;
}

const FUNCTIONAL_PROGRESSIONS: Record<string, string[]> = {
  'C': ['F', 'G', 'Am', 'Em', 'Dm', 'C'],
  'Dm': ['G', 'G7', 'Am', 'C', 'F'],
  'Em': ['Am', 'F', 'C', 'Dm', 'G'],
  'F': ['G', 'C', 'Am', 'Dm', 'Em'],
  'G': ['C', 'Am', 'F', 'Dm', 'Em'],
  'Am': ['F', 'G', 'Em', 'C', 'Dm'],
  'Bdim': ['C', 'Em', 'G', 'Am'],
  'Cm': ['Fm', 'Gm', 'Ab', 'Eb', 'Bb'],
  'Ddim': ['Em', 'Gm', 'Cm', 'Eb'],
  'Eb': ['Fm', 'Gm', 'Cm', 'Ab', 'Bb'],
  'Fm': ['Gm', 'Cm', 'Ab', 'Eb', 'Ddim'],
  'Gm': ['Cm', 'Ab', 'Eb', 'Fm', 'Bb'],
  'Ab': ['Eb', 'Cm', 'Fm', 'Gm', 'Bb'],
  'Bb': ['Eb', 'Fm', 'Gm', 'Cm', 'Ab'],
  'A': ['D', 'E', 'F#m', 'C#m', 'Bm'],
  'D': ['G', 'A', 'Bm', 'F#m', 'Em'],
  'E': ['A', 'B', 'C#m', 'G#m', 'F#m'],
  'B': ['E', 'F#', 'G#m', 'D#m', 'C#m']
};

const TRANSITION_MATRIX: Record<string, Record<string, number>> = {};

(function buildTransitionMatrix() {
  for (const [chord, followers] of Object.entries(FUNCTIONAL_PROGRESSIONS)) {
    TRANSITION_MATRIX[chord] = {};
    const total = followers.length;
    followers.forEach((follower, idx) => {
      TRANSITION_MATRIX[chord][follower] = (total - idx) / total;
    });
  }
})();

interface RecommendationResult {
  recommended: string;
  alternatives: string[];
  score: number;
}

function parseChordName(chordName: string): { root: string; quality: string; suffix: string } {
  const match = chordName.match(/^([A-G][#b]?)(m|maj|min|dim|aug)?(7|9|11|13|sus2|sus4)?$/);
  if (!match) {
    return { root: chordName, quality: '', suffix: '' };
  }
  return {
    root: match[1] || chordName,
    quality: match[2] || '',
    suffix: match[3] || ''
  };
}

function determineKey(chordSequence: Chord[][]): { key: string; mode: 'major' | 'minor' } {
  const allChords = chordSequence.flat().map(c => c.name);
  if (allChords.length === 0) {
    return { key: 'C', mode: 'major' };
  }

  const chordCounts: Record<string, number> = {};
  allChords.forEach(chord => {
    const { root } = parseChordName(chord);
    chordCounts[root] = (chordCounts[root] || 0) + 1;
  });

  const sortedRoots = Object.entries(chordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);

  const majorCandidates = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb', 'Eb'];
  const minorCandidates = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'Dm', 'Gm', 'Cm'];

  for (const root of sortedRoots) {
    if (majorCandidates.includes(root) && allChords.includes(root)) {
      return { key: root, mode: 'major' };
    }
  }

  for (const chord of allChords) {
    if (minorCandidates.includes(chord)) {
      const { root } = parseChordName(chord);
      return { key: root, mode: 'minor' };
    }
  }

  return { key: 'C', mode: 'major' };
}

function getDiatonicChords(key: string, mode: 'major' | 'minor'): string[] {
  const scale = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  const qualities = mode === 'major' ? CHORD_QUALITIES.major : CHORD_QUALITIES.minor;
  const keyIndex = MAJOR_SCALE.indexOf(key);
  
  if (keyIndex === -1) {
    return ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'];
  }

  return scale.map((_, i) => {
    const noteIndex = (keyIndex + i) % 7;
    const note = MAJOR_SCALE[noteIndex];
    return note + qualities[i];
  });
}

function calculateFunctionalWeight(currentChord: string, candidateChord: string): number {
  const progressions = FUNCTIONAL_PROGRESSIONS[currentChord];
  if (!progressions) return 0.3;
  
  const index = progressions.indexOf(candidateChord);
  if (index === -1) return 0.2;
  
  return 1 - (index / progressions.length) * 0.7;
}

function calculateTransitionProbability(currentChord: string, candidateChord: string): number {
  const transitions = TRANSITION_MATRIX[currentChord];
  if (!transitions) return 0.3;
  
  return transitions[candidateChord] || 0.2;
}

function calculateKeyCompatibility(candidateChord: string, diatonicChords: string[]): number {
  const { root } = parseChordName(candidateChord);
  const diatonicRoots = diatonicChords.map(c => parseChordName(c).root);
  
  if (diatonicRoots.includes(root)) {
    return 1.0;
  }
  
  const chromaticDistance = Math.min(
    MAJOR_SCALE.indexOf(root) - MAJOR_SCALE.indexOf(diatonicRoots[0]),
    MAJOR_SCALE.indexOf(diatonicRoots[0]) - MAJOR_SCALE.indexOf(root)
  );
  
  return Math.max(0, 1 - Math.abs(chromaticDistance) * 0.2);
}

function calculateConsistencyScore(
  candidateChord: string,
  lastChords: string[]
): number {
  if (lastChords.length === 0) return 1.0;
  
  const lastChord = lastChords[lastChords.length - 1];
  const { root: lastRoot } = parseChordName(lastChord);
  const { root: candidateRoot } = parseChordName(candidateChord);
  
  if (lastRoot === candidateRoot) return 0.3;
  
  const repeated = lastChords.filter(c => c === candidateChord).length;
  if (repeated > 0) return 0.5;
  
  return 1.0;
}

export function getNextChordRecommendation(
  chordSequence: Chord[][],
  measureIndex: number
): RecommendationResult {
  const startTime = Date.now();
  
  const { key, mode } = determineKey(chordSequence);
  const diatonicChords = getDiatonicChords(key, mode);
  
  const allChords = chordSequence.flat().map(c => c.name);
  const lastChords = allChords.slice(-3);
  
  let currentChord = lastChords[lastChords.length - 1];
  if (!currentChord) {
    currentChord = diatonicChords[0];
  }
  
  const candidateChords = [...diatonicChords, ...COMMON_CHORDS.slice(7, 14)];
  const uniqueCandidates = [...new Set(candidateChords)];
  
  const scoredCandidates = uniqueCandidates.map(candidate => {
    const functionalWeight = calculateFunctionalWeight(currentChord, candidate);
    const transitionProb = calculateTransitionProbability(currentChord, candidate);
    const keyCompatibility = calculateKeyCompatibility(candidate, diatonicChords);
    const consistency = calculateConsistencyScore(candidate, lastChords);
    
    const finalScore = (
      functionalWeight * 0.5 +
      transitionProb * 0.3 +
      keyCompatibility * 0.15 +
      consistency * 0.05
    );
    
    return {
      chord: candidate,
      score: finalScore
    };
  });
  
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  const elapsed = Date.now() - startTime;
  if (elapsed > 50) {
    console.warn(`Chord recommendation took ${elapsed}ms`);
  }
  
  return {
    recommended: scoredCandidates[0].chord,
    alternatives: scoredCandidates.slice(1, 4).map(s => s.chord),
    score: scoredCandidates[0].score
  };
}

export function getChordNotes(chordName: string): number[] {
  const NOTE_VALUES: Record<string, number> = {
    'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
    'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
    'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
  };
  
  const { root, quality, suffix } = parseChordName(chordName);
  const rootValue = NOTE_VALUES[root] || 60;
  
  const intervals: number[] = [0];
  
  if (quality === 'm' || quality === 'min') {
    intervals.push(3, 7);
  } else if (quality === 'dim') {
    intervals.push(3, 6);
  } else if (quality === 'aug') {
    intervals.push(4, 8);
  } else {
    intervals.push(4, 7);
  }
  
  if (suffix === '7') {
    intervals.push(quality === 'maj' ? 11 : 10);
  } else if (suffix === '9') {
    intervals.push(10, 14);
  } else if (suffix === 'sus4') {
    intervals[1] = 5;
  } else if (suffix === 'sus2') {
    intervals[1] = 2;
  }
  
  return intervals.map(interval => rootValue + interval);
}

export function getCommonChords(): string[] {
  return COMMON_CHORDS;
}
