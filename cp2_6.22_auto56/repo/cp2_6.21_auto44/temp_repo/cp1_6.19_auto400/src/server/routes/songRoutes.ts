import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as songService from '../services/songService';
import { getNextChordRecommendation, getCommonChords, getChordNotes } from '../services/chordTheoryEngine';

const router = Router();

let currentUserId = '';

function getUserId(req: Request): string {
  if (!currentUserId) {
    currentUserId = uuidv4();
  }
  return currentUserId;
}

router.get('/songs', (req: Request, res: Response) => {
  const result = songService.getAllSongs();
  res.json({
    success: true,
    songs: result.songs.map(song => ({
      id: song.id,
      name: song.name,
      timeSignature: song.timeSignature,
      bpm: song.bpm,
      key: song.key,
      memberCount: song.members.length,
      updatedAt: song.updatedAt,
      chordCount: song.chordSequence.flat().length
    }))
  });
});

router.post('/songs', (req: Request, res: Response) => {
  const { name, timeSignature } = req.body;
  
  if (!name || !timeSignature) {
    return res.status(400).json({
      success: false,
      error: 'Name and timeSignature are required'
    });
  }
  
  if (timeSignature !== '4/4' && timeSignature !== '3/4') {
    return res.status(400).json({
      success: false,
      error: 'Invalid timeSignature, must be 4/4 or 3/4'
    });
  }
  
  const userId = getUserId(req);
  const result = songService.createSong(name, timeSignature, userId);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.status(201).json({
    success: true,
    song: result.song
  });
});

router.get('/songs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = songService.getSong(id);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({
    success: true,
    song: result.song
  });
});

router.put('/songs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, bpm, key } = req.body;
  
  const updates: Partial<any> = {};
  if (name !== undefined) updates.name = name;
  if (bpm !== undefined) updates.bpm = bpm;
  if (key !== undefined) updates.key = key;
  
  const result = songService.updateSong(id, updates);
  
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({
    success: true,
    song: result.song
  });
});

router.post('/songs/:id/chords', (req: Request, res: Response) => {
  const { id } = req.params;
  const { measure, position, chord } = req.body;
  
  if (measure === undefined || position === undefined || !chord) {
    return res.status(400).json({
      success: false,
      error: 'measure, position, and chord are required'
    });
  }
  
  const userId = getUserId(req);
  const result = songService.addChord(id, { measure, position, chord, timestamp: Date.now() }, userId);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({ success: true });
});

router.delete('/songs/:id/chords', (req: Request, res: Response) => {
  const { id } = req.params;
  const { measure, position } = req.body;
  
  if (measure === undefined || position === undefined) {
    return res.status(400).json({
      success: false,
      error: 'measure and position are required'
    });
  }
  
  const userId = getUserId(req);
  const result = songService.removeChord(id, { measure, position, timestamp: Date.now() }, userId);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({ success: true });
});

router.put('/songs/:id/lyrics', (req: Request, res: Response) => {
  const { id } = req.params;
  const { blockId, content, formatting } = req.body;
  
  if (!blockId || content === undefined) {
    return res.status(400).json({
      success: false,
      error: 'blockId and content are required'
    });
  }
  
  const userId = getUserId(req);
  const result = songService.updateLyric(
    id,
    { blockId, content, formatting, timestamp: Date.now() },
    userId
  );
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({ success: true });
});

router.get('/songs/:id/recommend', (req: Request, res: Response) => {
  const { id } = req.params;
  const { measure } = req.query;
  
  const result = songService.getSong(id);
  if (!result.success) {
    return res.status(404).json({
      success: false,
      error: result.error
    });
  }
  
  const song = result.song!;
  const measureIndex = measure ? parseInt(measure as string) : song.chordSequence.length - 1;
  
  const recommendation = getNextChordRecommendation(song.chordSequence, measureIndex);
  
  res.json({
    success: true,
    recommended: recommendation.recommended,
    alternatives: recommendation.alternatives,
    score: recommendation.score
  });
});

router.get('/chords/common', (req: Request, res: Response) => {
  res.json({
    success: true,
    chords: getCommonChords()
  });
});

router.post('/chords/notes', (req: Request, res: Response) => {
  const { chord } = req.body;
  
  if (!chord) {
    return res.status(400).json({
      success: false,
      error: 'chord is required'
    });
  }
  
  const notes = getChordNotes(chord);
  
  res.json({
    success: true,
    notes
  });
});

export default router;
