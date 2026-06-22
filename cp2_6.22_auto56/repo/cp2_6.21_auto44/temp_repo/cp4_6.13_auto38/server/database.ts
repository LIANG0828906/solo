import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('./music-studio.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    data TEXT,
    created_at TEXT,
    updated_at TEXT
  );
`);

const demoUserId = 'demo-user-001';

const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(demoUserId);
if (!userExists) {
  db.prepare('INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)').run(
    demoUserId,
    'Demo User',
    new Date().toISOString()
  );
}

const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
if (projectCount.count === 0) {
  const insertProject = db.prepare(
    'INSERT INTO projects (id, user_id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const demoBeatData = {
    bpm: 120,
    tracks: [
      {
        id: 'track-kick',
        name: 'Kick',
        type: 'drum',
        pattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        soundParams: { frequency: 60, decay: 0.3, gain: 1 }
      },
      {
        id: 'track-snare',
        name: 'Snare',
        type: 'drum',
        pattern: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        volume: 0.7,
        pan: 0,
        muted: false,
        solo: false,
        soundParams: { tone: 400, noise: 0.6, decay: 0.2, gain: 0.8 }
      },
      {
        id: 'track-hihat',
        name: 'Hi-Hat',
        type: 'drum',
        pattern: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        volume: 0.3,
        pan: 0.3,
        muted: false,
        solo: false,
        soundParams: { frequency: 8000, decay: 0.05, gain: 0.5 }
      },
      {
        id: 'track-bass',
        name: 'Bass',
        type: 'synth',
        pattern: [true, false, true, false, false, true, false, false, true, false, true, false, false, true, false, false],
        volume: 0.6,
        pan: -0.2,
        muted: false,
        solo: false,
        soundParams: { waveform: 'sawtooth', attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.1, note: 'C2' }
      }
    ]
  };

  const ambientPadData = {
    bpm: 80,
    tracks: [
      {
        id: 'track-pad-c',
        name: 'Pad C Major',
        type: 'synth',
        pattern: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        volume: 0.5,
        pan: -0.3,
        muted: false,
        solo: false,
        soundParams: { waveform: 'sine', attack: 1, decay: 0.5, sustain: 0.8, release: 2, note: 'C4', chord: ['C4', 'E4', 'G4'] }
      },
      {
        id: 'track-pad-high',
        name: 'High Pad',
        type: 'synth',
        pattern: [false, false, true, true, false, false, true, true, false, false, true, true, false, false, true, true],
        volume: 0.4,
        pan: 0.3,
        muted: false,
        solo: false,
        soundParams: { waveform: 'triangle', attack: 0.5, decay: 0.3, sustain: 0.6, release: 1.5, note: 'C5' }
      },
      {
        id: 'track-arpeggio',
        name: 'Arpeggio',
        type: 'synth',
        pattern: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        volume: 0.35,
        pan: 0,
        muted: false,
        solo: false,
        soundParams: { waveform: 'square', attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.05, notes: ['C4', 'E4', 'G4', 'C5'] }
      },
      {
        id: 'track-ambient-noise',
        name: 'Ambient Noise',
        type: 'noise',
        pattern: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        volume: 0.15,
        pan: 0,
        muted: false,
        solo: false,
        soundParams: { type: 'pink', filterFreq: 500, q: 0.5, gain: 0.3 }
      }
    ]
  };

  const now = new Date().toISOString();

  insertProject.run(
    uuidv4(),
    demoUserId,
    'Demo Beat',
    JSON.stringify(demoBeatData),
    now,
    now
  );

  insertProject.run(
    uuidv4(),
    demoUserId,
    'Ambient Pad',
    JSON.stringify(ambientPadData),
    now,
    now
  );
}

export default db;
