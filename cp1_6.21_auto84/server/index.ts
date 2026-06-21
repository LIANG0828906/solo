import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import type { UnitType } from '../src/types';
import { roomManager } from './roomManager';

const app: express.Application = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.post('/api/rooms', (req: Request, res: Response): void => {
  try {
    const { maxPlayers, initialHealth, playerName } = req.body as {
      maxPlayers: number;
      initialHealth: number;
      playerName: string;
    };

    if (
      !maxPlayers ||
      !initialHealth ||
      !playerName ||
      maxPlayers < 2 ||
      maxPlayers > 4
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid parameters',
      });
      return;
    }

    const result = roomManager.createRoom(maxPlayers, initialHealth, playerName);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create room',
    });
  }
});

app.post('/api/rooms/:roomId/join', (req: Request, res: Response): void => {
  try {
    const { roomId } = req.params;
    const { playerName } = req.body as { playerName: string };

    if (!playerName) {
      res.status(400).json({
        success: false,
        error: 'Player name is required',
      });
      return;
    }

    const result = roomManager.joinRoom(roomId, playerName);
    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Room not found or full',
      });
      return;
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to join room',
    });
  }
});

app.get('/api/rooms/:roomId', (req: Request, res: Response): void => {
  try {
    const { roomId } = req.params;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get room',
    });
  }
});

app.post('/api/rooms/:roomId/units', (req: Request, res: Response): void => {
  try {
    const { roomId } = req.params;
    const { playerId, unitTypes } = req.body as {
      playerId: string;
      unitTypes: UnitType[];
    };

    if (!playerId || !unitTypes || unitTypes.length !== 3) {
      res.status(400).json({
        success: false,
        error: 'Invalid parameters',
      });
      return;
    }

    const room = roomManager.selectUnits(roomId, playerId, unitTypes);
    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room not found or invalid state',
      });
      return;
    }

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to select units',
    });
  }
});

app.post('/api/rooms/:roomId/ready', (req: Request, res: Response): void => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body as { playerId: string };

    if (!playerId) {
      res.status(400).json({
        success: false,
        error: 'Player ID is required',
      });
      return;
    }

    const room = roomManager.setPlayerReady(roomId, playerId);
    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room or player not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to set player ready',
    });
  }
});

app.post('/api/rooms/:roomId/start', (req: Request, res: Response): void => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body as { playerId: string };

    if (!playerId) {
      res.status(400).json({
        success: false,
        error: 'Player ID is required',
      });
      return;
    }

    const room = roomManager.startBattle(roomId, playerId);
    if (!room) {
      res.status(400).json({
        success: false,
        error: 'Cannot start battle',
      });
      return;
    }

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start battle',
    });
  }
});

app.post('/api/rooms/:roomId/combat', (req: Request, res: Response): void => {
  try {
    const { roomId } = req.params;

    const result = roomManager.executeCombatRound(roomId);
    if (!result) {
      res.status(400).json({
        success: false,
        error: 'Cannot execute combat round',
      });
      return;
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute combat round',
    });
  }
});

app.post('/api/rooms/:roomId/leave', (req: Request, res: Response): void => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body as { playerId: string };

    if (!playerId) {
      res.status(400).json({
        success: false,
        error: 'Player ID is required',
      });
      return;
    }

    const room = roomManager.leaveRoom(roomId, playerId);
    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to leave room',
    });
  }
});

app.get('/api/rooms/:roomId/poll', (req: Request, res: Response): void => {
  try {
    const { roomId } = req.params;
    const since = parseInt(req.query.since as string) || 0;

    const result = roomManager.pollEvents(roomId, since);
    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Room not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to poll events',
    });
  }
});

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
  });
});

app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

app.use(
  (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Server internal error',
    });
  }
);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
