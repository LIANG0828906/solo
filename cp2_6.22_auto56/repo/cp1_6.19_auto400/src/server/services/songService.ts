import { v4 as uuidv4 } from 'uuid';
import { Song, Chord, LyricBlock, ChordOp, LyricOp } from '../types';
import * as songStore from '../store/songStore';

function generateInitialChordSequence(timeSignature: '4/4' | '3/4'): Chord[][] {
  const measures = 8;
  const sequence: Chord[][] = [];
  
  for (let i = 0; i < measures; i++) {
    sequence.push([]);
  }
  
  return sequence;
}

function generateInitialLyrics(timeSignature: '4/4' | '3/4'): LyricBlock[] {
  const blocks: LyricBlock[] = [];
  
  for (let i = 0; i < 8; i++) {
    blocks.push({
      id: uuidv4(),
      content: '',
      measureIndex: i,
      formatting: { bold: false, italic: false }
    });
  }
  
  return blocks;
}

export function createSong(
  name: string,
  timeSignature: '4/4' | '3/4',
  userId: string
): { success: boolean; song?: Song; error?: string } {
  const song: Song = {
    id: uuidv4(),
    name,
    timeSignature,
    bpm: 120,
    key: 'C',
    chordSequence: generateInitialChordSequence(timeSignature),
    lyricBlocks: generateInitialLyrics(timeSignature),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    members: [userId]
  };
  
  const success = songStore.addSong(song);
  if (!success) {
    return {
      success: false,
      error: 'Maximum number of songs reached (10)'
    };
  }
  
  return { success: true, song };
}

export function getSong(id: string): { success: boolean; song?: Song; error?: string } {
  const song = songStore.getSong(id);
  if (!song) {
    return { success: false, error: 'Song not found' };
  }
  return { success: true, song };
}

export function getAllSongs(): { success: boolean; songs: Song[] } {
  return { success: true, songs: songStore.getSongs() };
}

export function updateSong(
  id: string,
  updates: Partial<Omit<Song, 'id' | 'createdAt'>>
): { success: boolean; song?: Song; error?: string } {
  const song = songStore.updateSong(id, updates);
  if (!song) {
    return { success: false, error: 'Song not found' };
  }
  return { success: true, song };
}

export function addChord(
  songId: string,
  op: ChordOp,
  userId: string
): { success: boolean; error?: string } {
  const result = songStore.getSong(songId);
  if (!result) {
    return { success: false, error: 'Song not found' };
  }
  
  const song = result;
  
  if (!song.members.includes(userId)) {
    return { success: false, error: 'Not authorized' };
  }
  
  const { measure, position, chord } = op;
  
  if (!chord) {
    return { success: false, error: 'Chord name required' };
  }
  
  if (measure < 0 || measure >= song.chordSequence.length) {
    while (song.chordSequence.length <= measure) {
      song.chordSequence.push([]);
    }
  }
  
  if (position < 0 || position > song.chordSequence[measure].length) {
    return { success: false, error: 'Invalid position' };
  }
  
  if (song.chordSequence[measure].length >= 4) {
    return { success: false, error: 'Maximum 4 chords per measure' };
  }
  
  const newChord: Chord = {
    id: uuidv4(),
    name: chord,
    duration: 2
  };
  
  song.chordSequence[measure].splice(position, 0, newChord);
  
  const lyricBlock = song.lyricBlocks.find(b => b.measureIndex === measure);
  if (!lyricBlock) {
    song.lyricBlocks.push({
      id: uuidv4(),
      content: '',
      measureIndex: measure,
      formatting: { bold: false, italic: false }
    });
  }
  
  songStore.updateSong(songId, {
    chordSequence: song.chordSequence,
    lyricBlocks: song.lyricBlocks
  });
  
  return { success: true };
}

export function removeChord(
  songId: string,
  op: ChordOp,
  userId: string
): { success: boolean; error?: string } {
  const result = songStore.getSong(songId);
  if (!result) {
    return { success: false, error: 'Song not found' };
  }
  
  const song = result;
  
  if (!song.members.includes(userId)) {
    return { success: false, error: 'Not authorized' };
  }
  
  const { measure, position } = op;
  
  if (measure < 0 || measure >= song.chordSequence.length) {
    return { success: false, error: 'Invalid measure' };
  }
  
  if (position < 0 || position >= song.chordSequence[measure].length) {
    return { success: false, error: 'Invalid position' };
  }
  
  song.chordSequence[measure].splice(position, 1);
  
  songStore.updateSong(songId, {
    chordSequence: song.chordSequence
  });
  
  return { success: true };
}

export function updateLyric(
  songId: string,
  op: LyricOp,
  userId: string
): { success: boolean; error?: string } {
  const result = songStore.getSong(songId);
  if (!result) {
    return { success: false, error: 'Song not found' };
  }
  
  const song = result;
  
  if (!song.members.includes(userId)) {
    return { success: false, error: 'Not authorized' };
  }
  
  const { blockId, content, formatting } = op;
  
  const blockIndex = song.lyricBlocks.findIndex(b => b.id === blockId);
  if (blockIndex === -1) {
    return { success: false, error: 'Lyric block not found' };
  }
  
  song.lyricBlocks[blockIndex] = {
    ...song.lyricBlocks[blockIndex],
    content,
    formatting: formatting || song.lyricBlocks[blockIndex].formatting
  };
  
  songStore.updateSong(songId, {
    lyricBlocks: song.lyricBlocks
  });
  
  return { success: true };
}

export function addMember(songId: string, userId: string): { success: boolean; error?: string } {
  const result = songStore.getSong(songId);
  if (!result) {
    return { success: false, error: 'Song not found' };
  }
  
  const song = result;
  
  if (!song.members.includes(userId)) {
    song.members.push(userId);
    songStore.updateSong(songId, { members: song.members });
  }
  
  return { success: true };
}
