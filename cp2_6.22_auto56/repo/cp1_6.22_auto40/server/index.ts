import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Scene,
  SaveSceneRequest,
  SaveSceneResponse,
  AnalysisResult,
  Exhibit,
} from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const scenesStore = new Map<string, Scene>();

const createPresetScenes = (): Scene[] => {
  const now = Date.now();

  const galleryScene: Scene = {
    id: 'preset-gallery',
    name: '美术馆展厅',
    exhibits: [
      {
        id: 'ex-1',
        name: '雕塑作品 A',
        type: 'sphere',
        position: [-3, 0.75, -2],
        rotation: [0, 0, 0],
        scale: 1.5,
        color: '#e74c3c',
        opacity: 1,
      },
      {
        id: 'ex-2',
        name: '装置作品 B',
        type: 'cube',
        position: [0, 0.6, 0],
        rotation: [0, Math.PI / 4, 0],
        scale: 1.2,
        color: '#3498db',
        opacity: 1,
      },
      {
        id: 'ex-3',
        name: '立柱展品 C',
        type: 'cylinder',
        position: [3, 1, -2],
        rotation: [0, 0, 0],
        scale: 2,
        color: '#2ecc71',
        opacity: 1,
      },
      {
        id: 'ex-4',
        name: '环形装置 D',
        type: 'torus',
        position: [-2, 0.5, 2],
        rotation: [Math.PI / 2, 0, 0],
        scale: 1.3,
        color: '#f39c12',
        opacity: 1,
      },
      {
        id: 'ex-5',
        name: '立方体 E',
        type: 'cube',
        position: [2, 0.8, 2.5],
        rotation: [0, -Math.PI / 6, 0],
        scale: 1.6,
        color: '#9b59b6',
        opacity: 1,
      },
    ],
    path: [
      { id: 'p1', position: [-5, 1.6, 4] },
      { id: 'p2', position: [-2, 1.6, 0] },
      { id: 'p3', position: [0, 1.6, -3] },
      { id: 'p4', position: [2, 1.6, 0] },
      { id: 'p5', position: [5, 1.6, 4] },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const corridorScene: Scene = {
    id: 'preset-corridor',
    name: '画廊走廊',
    exhibits: [
      {
        id: 'c-1',
        name: '画作 1',
        type: 'cube',
        position: [-4, 1.5, -4],
        rotation: [0, 0, 0],
        scale: 0.3,
        color: '#ff6b6b',
        opacity: 1,
      },
      {
        id: 'c-2',
        name: '画作 2',
        type: 'cube',
        position: [-4, 1.5, -1],
        rotation: [0, 0, 0],
        scale: 0.3,
        color: '#4ecdc4',
        opacity: 1,
      },
      {
        id: 'c-3',
        name: '画作 3',
        type: 'cube',
        position: [-4, 1.5, 2],
        rotation: [0, 0, 0],
        scale: 0.3,
        color: '#45b7d1',
        opacity: 1,
      },
      {
        id: 'c-4',
        name: '画作 4',
        type: 'cube',
        position: [4, 1.5, -4],
        rotation: [0, Math.PI, 0],
        scale: 0.3,
        color: '#96ceb4',
        opacity: 1,
      },
      {
        id: 'c-5',
        name: '画作 5',
        type: 'cube',
        position: [4, 1.5, -1],
        rotation: [0, Math.PI, 0],
        scale: 0.3,
        color: '#ffeaa7',
        opacity: 1,
      },
      {
        id: 'c-6',
        name: '中央雕塑',
        type: 'sphere',
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: 1.2,
        color: '#dfe6e9',
        opacity: 1,
      },
    ],
    path: [
      { id: 'cp1', position: [0, 1.6, 5] },
      { id: 'cp2', position: [0, 1.6, -5] },
    ],
    createdAt: now,
    updatedAt: now,
  };

  return [galleryScene, corridorScene];
};

const presetScenes = createPresetScenes();
presetScenes.forEach((scene) => scenesStore.set(scene.id, scene));

function analyzeScene(scene: Scene): AnalysisResult[] {
  return scene.exhibits.map((exhibit) => ({
    exhibitId: exhibit.id,
    exhibitName: exhibit.name,
    isOccluded: false,
    occlusionPercentage: 0,
    occlusionDuration: 0,
  }));
}

app.get('/api/scenes', (_req, res) => {
  try {
    const scenes = Array.from(scenesStore.values());
    res.json(scenes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scenes' });
  }
});

app.post('/api/scenes', (req, res) => {
  try {
    const body = req.body as SaveSceneRequest;

    if (!body.name || !Array.isArray(body.exhibits) || !Array.isArray(body.path)) {
      return res.status(400).json({ error: 'Invalid scene data' });
    }

    const now = Date.now();
    const id = uuidv4();
    const newScene: Scene = {
      id,
      name: body.name,
      exhibits: body.exhibits as Exhibit[],
      path: body.path,
      createdAt: now,
      updatedAt: now,
    };

    scenesStore.set(id, newScene);

    const shareUrl = `${req.protocol}://${req.get('host')}/scene/${id}`;

    const response: SaveSceneResponse = {
      id,
      shareUrl,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Save scene error:', error);
    res.status(500).json({ error: 'Failed to save scene' });
  }
});

app.get('/api/scenes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const scene = scenesStore.get(id);

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    res.json(scene);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scene' });
  }
});

app.get('/api/scenes/:id/analysis', (req, res) => {
  try {
    const { id } = req.params;
    const scene = scenesStore.get(id);

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const analysis = analyzeScene(scene);

    res.json({
      timestamp: Date.now(),
      results: analysis,
      cameraPosition: [0, 1.6, 5],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze scene' });
  }
});

app.listen(PORT, () => {
  console.log(`Exhibition Simulator Server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/scenes`);
  console.log(`  POST   /api/scenes`);
  console.log(`  GET    /api/scenes/:id`);
  console.log(`  GET    /api/scenes/:id/analysis`);
});
