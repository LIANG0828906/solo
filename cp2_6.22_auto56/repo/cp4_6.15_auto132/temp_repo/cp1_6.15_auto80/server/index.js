import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const highScores = [];

const getLevelConfig = (width, height) => {
  return {
    path: [
      { x: 0, y: height * 0.2 },
      { x: width * 0.25, y: height * 0.2 },
      { x: width * 0.25, y: height * 0.5 },
      { x: width * 0.5, y: height * 0.5 },
      { x: width * 0.5, y: height * 0.3 },
      { x: width * 0.75, y: height * 0.3 },
      { x: width * 0.75, y: height * 0.6 },
      { x: width, y: height * 0.6 }
    ],
    waves: [
      { normalCount: 5, armoredCount: 0, speed: 70 },
      { normalCount: 6, armoredCount: 1, speed: 70 },
      { normalCount: 6, armoredCount: 2, speed: 75 },
      { normalCount: 7, armoredCount: 2, speed: 75 },
      { normalCount: 8, armoredCount: 3, speed: 80 }
    ]
  };
};

app.get('/api/levels', (req, res) => {
  try {
    const width = parseInt(req.query.width) || 1920;
    const height = parseInt(req.query.height) || 1080;
    const config = getLevelConfig(width, height);
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching level config:', error);
    res.status(500).json({ error: 'Failed to fetch level configuration' });
  }
});

app.post('/api/score', (req, res) => {
  try {
    const { score, name, date } = req.body;
    
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score value' });
    }
    
    const newScore = {
      id: uuidv4(),
      score: Math.floor(score),
      name: name || 'Anonymous',
      date: date || new Date().toISOString()
    };
    
    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    
    while (highScores.length > 100) {
      highScores.pop();
    }
    
    res.json({ 
      success: true, 
      score: newScore,
      rank: highScores.findIndex(s => s.id === newScore.id) + 1
    });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.get('/api/highscores', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const topScores = highScores.slice(0, limit);
    
    res.json(topScores);
  } catch (error) {
    console.error('Error fetching high scores:', error);
    res.status(500).json({ error: 'Failed to fetch high scores' });
  }
});

app.get('/api/resources', (req, res) => {
  try {
    const resources = {
      sprites: {
        tower: '/assets/tower.png',
        monster_normal: '/assets/monster_normal.png',
        monster_armored: '/assets/monster_armored.png',
        arrow: '/assets/arrow.png',
        heart: '/assets/heart.png',
        gold: '/assets/gold.png'
      },
      particles: {
        explosion: '/assets/particles/explosion.png',
        trail: '/assets/particles/trail.png'
      },
      sounds: {
        shoot: '/assets/sounds/shoot.wav',
        hit: '/assets/sounds/hit.wav',
        build: '/assets/sounds/build.wav',
        gameOver: '/assets/sounds/gameover.wav',
        victory: '/assets/sounds/victory.wav'
      }
    };
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    highScoresCount: highScores.length
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   🎮 Gesture Magic Tower Defense - Backend Server        ║
  ║                                                          ║
  ║   Server running on: http://localhost:${PORT}             ║
  ║                                                          ║
  ║   Available endpoints:                                   ║
  ║   • GET  /api/health      - Server health check          ║
  ║   • GET  /api/levels      - Get level configuration      ║
  ║   • POST /api/score       - Submit player score          ║
  ║   • GET  /api/highscores  - Get top scores               ║
  ║   • GET  /api/resources   - Get asset resources          ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Server shutting down gracefully...');
  process.exit(0);
});
