import { Router, Request, Response } from 'express';
import { GameState } from '../types';

const router = Router();

const gameStore = new Map<string, GameState>();

router.post('/', (req: Request, res: Response) => {
  try {
    const gameState: GameState = req.body;
    
    if (!gameState.id) {
      return res.status(400).json({ success: false, message: 'Game ID is required' });
    }

    gameStore.set(gameState.id, gameState);
    
    res.json({ success: true, gameId: gameState.id });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ success: false, message: 'Failed to save game' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const gameId = req.params.id;
    const game = gameStore.get(gameId);

    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    res.json({ success: true, game });
  } catch (error) {
    console.error('Error loading game:', error);
    res.status(500).json({ success: false, message: 'Failed to load game' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const gameId = req.params.id;
    const updates: Partial<GameState> = req.body;
    const existingGame = gameStore.get(gameId);

    if (!existingGame) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }

    const updatedGame: GameState = {
      ...existingGame,
      ...updates,
    };

    gameStore.set(gameId, updatedGame);

    res.json({ success: true, game: updatedGame });
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ success: false, message: 'Failed to update game' });
  }
});

export default router;
