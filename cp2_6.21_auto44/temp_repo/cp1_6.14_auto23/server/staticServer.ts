import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const sceneData = {
  room: { width: 14, height: 4.2, depth: 10 },
  materials: [
    { id: 'floor', type: 'standard', color: '#2a2622', roughness: 0.75, metalness: 0.05 },
    { id: 'wall', type: 'standard', color: '#d6d0c7', roughness: 0.92, metalness: 0 },
    { id: 'ceiling', type: 'standard', color: '#efeae1', roughness: 0.95, metalness: 0 },
    { id: 'wood', type: 'standard', color: '#6b4f3a', roughness: 0.65, metalness: 0.05 },
    { id: 'upholstery', type: 'standard', color: '#3b5a6b', roughness: 0.85, metalness: 0 },
    { id: 'fabric2', type: 'standard', color: '#7a6b57', roughness: 0.88, metalness: 0 },
    { id: 'metal', type: 'metal', color: '#b8bcc2', roughness: 0.18, metalness: 0.95 },
    { id: 'glass', type: 'glass', color: '#cfe2ff', roughness: 0.04, metalness: 0 },
    { id: 'accent', type: 'standard', color: '#8a6a4a', roughness: 0.6, metalness: 0.1 },
    { id: 'rug', type: 'standard', color: '#5c4a3a', roughness: 0.98, metalness: 0 },
    { id: 'chrome', type: 'metal', color: '#e8eaed', roughness: 0.08, metalness: 1.0 },
    { id: 'marble', type: 'standard', color: '#e8e4de', roughness: 0.35, metalness: 0.02 },
    { id: 'cushion', type: 'standard', color: '#9b7e5e', roughness: 0.9, metalness: 0 },
  ],
  meshes: [
    { id: 'floor', geometry: 'plane', materialId: 'floor', position: [0, 0, 0], rotation: [-1.5708, 0, 0], scale: [14, 1, 10], castShadow: false, receiveShadow: true },
    { id: 'ceiling', geometry: 'plane', materialId: 'ceiling', position: [0, 4.2, 0], rotation: [1.5708, 0, 0], scale: [14, 1, 10], castShadow: false, receiveShadow: true },
    { id: 'wall-back', geometry: 'box', materialId: 'wall', position: [0, 2.1, -5], rotation: [0, 0, 0], scale: [14, 4.2, 0.15], castShadow: false, receiveShadow: true },
    { id: 'wall-left', geometry: 'box', materialId: 'wall', position: [-7, 2.1, 0], rotation: [0, 0, 0], scale: [0.15, 4.2, 10], castShadow: false, receiveShadow: true },
    { id: 'wall-right', geometry: 'box', materialId: 'wall', position: [7, 2.1, 0], rotation: [0, 0, 0], scale: [0.15, 4.2, 10], castShadow: false, receiveShadow: true },
    { id: 'window-frame-l', geometry: 'box', materialId: 'chrome', position: [-4.5, 2.4, -4.9], rotation: [0, 0, 0], scale: [2.8, 2.2, 0.1], castShadow: true, receiveShadow: true },
    { id: 'window-glass-l', geometry: 'box', materialId: 'glass', position: [-4.5, 2.4, -4.88], rotation: [0, 0, 0], scale: [2.5, 1.9, 0.03], castShadow: false, receiveShadow: false },
    { id: 'window-frame-r', geometry: 'box', materialId: 'chrome', position: [4.5, 2.4, -4.9], rotation: [0, 0, 0], scale: [2.8, 2.2, 0.1], castShadow: true, receiveShadow: true },
    { id: 'window-glass-r', geometry: 'box', materialId: 'glass', position: [4.5, 2.4, -4.88], rotation: [0, 0, 0], scale: [2.5, 1.9, 0.03], castShadow: false, receiveShadow: false },
    { id: 'rug', geometry: 'box', materialId: 'rug', position: [0, 0.02, 0.6], rotation: [0, 0, 0], scale: [8, 0.02, 6.5], castShadow: false, receiveShadow: true },
    { id: 'sofa-base', geometry: 'box', materialId: 'upholstery', position: [-1.8, 0.55, 2.8], rotation: [0, 0, 0], scale: [3.6, 0.7, 1.3], castShadow: true, receiveShadow: true },
    { id: 'sofa-back', geometry: 'box', materialId: 'upholstery', position: [-1.8, 1.3, 3.35], rotation: [0, 0, 0], scale: [3.6, 1.0, 0.25], castShadow: true, receiveShadow: true },
    { id: 'sofa-arm-l', geometry: 'box', materialId: 'upholstery', position: [-3.5, 1.0, 2.8], rotation: [0, 0, 0], scale: [0.25, 0.9, 1.3], castShadow: true, receiveShadow: true },
    { id: 'sofa-arm-r', geometry: 'box', materialId: 'upholstery', position: [-0.1, 1.0, 2.8], rotation: [0, 0, 0], scale: [0.25, 0.9, 1.3], castShadow: true, receiveShadow: true },
    { id: 'cushion-1', geometry: 'box', materialId: 'cushion', position: [-2.7, 0.95, 2.6], rotation: [0, 0.1, 0], scale: [1.5, 0.2, 1.0], castShadow: true, receiveShadow: true },
    { id: 'cushion-2', geometry: 'box', materialId: 'cushion', position: [-0.9, 0.95, 2.6], rotation: [0, -0.08, 0], scale: [1.5, 0.2, 1.0], castShadow: true, receiveShadow: true },
    { id: 'coffee-table-top', geometry: 'box', materialId: 'wood', position: [-1.5, 0.45, 0.6], rotation: [0, 0, 0], scale: [1.8, 0.06, 0.9], castShadow: true, receiveShadow: true },
    { id: 'coffee-leg-1', geometry: 'cylinder', materialId: 'chrome', position: [-2.3, 0.22, 1.0], rotation: [0, 0, 0], scale: [0.06, 0.44, 0.06], castShadow: true, receiveShadow: true },
    { id: 'coffee-leg-2', geometry: 'cylinder', materialId: 'chrome', position: [-0.7, 0.22, 1.0], rotation: [0, 0, 0], scale: [0.06, 0.44, 0.06], castShadow: true, receiveShadow: true },
    { id: 'coffee-leg-3', geometry: 'cylinder', materialId: 'chrome', position: [-2.3, 0.22, 0.2], rotation: [0, 0, 0], scale: [0.06, 0.44, 0.06], castShadow: true, receiveShadow: true },
    { id: 'coffee-leg-4', geometry: 'cylinder', materialId: 'chrome', position: [-0.7, 0.22, 0.2], rotation: [0, 0, 0], scale: [0.06, 0.44, 0.06], castShadow: true, receiveShadow: true },
    { id: 'vase', geometry: 'cylinder', materialId: 'accent', position: [-1.5, 0.62, 0.6], rotation: [0, 0, 0], scale: [0.18, 0.28, 0.18], castShadow: true, receiveShadow: true },
    { id: 'armchair-seat', geometry: 'box', materialId: 'fabric2', position: [3.2, 0.55, 2.4], rotation: [0, -0.5, 0], scale: [1.1, 0.4, 1.1], castShadow: true, receiveShadow: true },
    { id: 'armchair-back', geometry: 'box', materialId: 'fabric2', position: [3.6, 1.15, 2.85], rotation: [0.2, -0.5, 0], scale: [1.1, 0.9, 0.2], castShadow: true, receiveShadow: true },
    { id: 'armchair-leg-1', geometry: 'cylinder', materialId: 'chrome', position: [2.75, 0.15, 1.95], rotation: [0, 0, 0], scale: [0.05, 0.3, 0.05], castShadow: true, receiveShadow: true },
    { id: 'armchair-leg-2', geometry: 'cylinder', materialId: 'chrome', position: [3.65, 0.15, 1.95], rotation: [0, 0, 0], scale: [0.05, 0.3, 0.05], castShadow: true, receiveShadow: true },
    { id: 'armchair-leg-3', geometry: 'cylinder', materialId: 'chrome', position: [2.75, 0.15, 2.85], rotation: [0, 0, 0], scale: [0.05, 0.3, 0.05], castShadow: true, receiveShadow: true },
    { id: 'armchair-leg-4', geometry: 'cylinder', materialId: 'chrome', position: [3.65, 0.15, 2.85], rotation: [0, 0, 0], scale: [0.05, 0.3, 0.05], castShadow: true, receiveShadow: true },
    { id: 'bookshelf', geometry: 'box', materialId: 'wood', position: [5.8, 1.6, -3.2], rotation: [0, 0, 0], scale: [2.2, 2.8, 0.4], castShadow: true, receiveShadow: true },
    { id: 'shelf-1', geometry: 'box', materialId: 'wood', position: [5.8, 0.9, -3.1], rotation: [0, 0, 0], scale: [2.1, 0.03, 0.36], castShadow: true, receiveShadow: true },
    { id: 'shelf-2', geometry: 'box', materialId: 'wood', position: [5.8, 1.6, -3.1], rotation: [0, 0, 0], scale: [2.1, 0.03, 0.36], castShadow: true, receiveShadow: true },
    { id: 'shelf-3', geometry: 'box', materialId: 'wood', position: [5.8, 2.3, -3.1], rotation: [0, 0, 0], scale: [2.1, 0.03, 0.36], castShadow: true, receiveShadow: true },
    { id: 'book-1', geometry: 'box', materialId: 'accent', position: [5.2, 0.5, -3.1], rotation: [0, 0.15, 0], scale: [0.1, 0.5, 0.3], castShadow: true, receiveShadow: true },
    { id: 'book-2', geometry: 'box', materialId: 'upholstery', position: [5.5, 0.5, -3.1], rotation: [0, -0.1, 0], scale: [0.08, 0.46, 0.3], castShadow: true, receiveShadow: true },
    { id: 'book-3', geometry: 'box', materialId: 'chrome', position: [5.8, 1.25, -3.1], rotation: [0, 0, 0], scale: [0.12, 0.55, 0.3], castShadow: true, receiveShadow: true },
    { id: 'floor-lamp-base', geometry: 'cylinder', materialId: 'chrome', position: [-5.6, 0.08, 3.0], rotation: [0, 0, 0], scale: [0.3, 0.08, 0.3], castShadow: true, receiveShadow: true },
    { id: 'floor-lamp-pole', geometry: 'cylinder', materialId: 'chrome', position: [-5.6, 0.8, 3.0], rotation: [0, 0, 0], scale: [0.04, 1.4, 0.04], castShadow: true, receiveShadow: true },
    { id: 'floor-lamp-head', geometry: 'cylinder', materialId: 'accent', position: [-5.6, 1.6, 3.0], rotation: [0, 0, 0], scale: [0.4, 0.35, 0.4], castShadow: true, receiveShadow: true },
    { id: 'side-table', geometry: 'cylinder', materialId: 'marble', position: [5.2, 0.35, 1.8], rotation: [0, 0, 0], scale: [0.6, 0.7, 0.6], castShadow: true, receiveShadow: true },
    { id: 'tv-stand', geometry: 'box', materialId: 'wood', position: [0, 0.3, -4.2], rotation: [0, 0, 0], scale: [3.0, 0.6, 0.45], castShadow: true, receiveShadow: true },
    { id: 'tv-screen', geometry: 'box', materialId: 'glass', position: [0, 1.25, -4.35], rotation: [0, 0, 0], scale: [2.4, 1.4, 0.04], castShadow: false, receiveShadow: false },
    { id: 'tv-frame', geometry: 'box', materialId: 'chrome', position: [0, 1.25, -4.36], rotation: [0, 0, 0], scale: [2.5, 1.5, 0.02], castShadow: true, receiveShadow: true },
    { id: 'plant-pot', geometry: 'cylinder', materialId: 'accent', position: [-5.8, 0.22, -3.5], rotation: [0, 0, 0], scale: [0.28, 0.44, 0.28], castShadow: true, receiveShadow: true },
    { id: 'plant-foliage', geometry: 'sphere', materialId: 'upholstery', position: [-5.8, 0.9, -3.5], rotation: [0, 0, 0], scale: [0.7, 0.65, 0.7], castShadow: true, receiveShadow: true },
  ],
};

const presetsData = {
  day: {
    ambient: { color: '#fff5e6', intensity: 0.55 },
    directional: { color: '#fff2d6', intensity: 2.4, position: [-6, 10, -4], shadowSoftness: 0.6 },
    backgroundTint: '#1e293b',
    artificialLightsActive: false,
  },
  night: {
    ambient: { color: '#c4d4ff', intensity: 0.22 },
    directional: { color: '#9eb8ff', intensity: 0.25, position: [4, 8, -6], shadowSoftness: 0.9 },
    backgroundTint: '#0a0f1e',
    artificialLightsActive: true,
  },
};

app.get('/api/scene', (_req, res) => {
  res.json(sceneData);
});

app.get('/api/presets', (_req, res) => {
  res.json(presetsData);
});

app.get('/api/health', (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    memoryMB: Math.round(mem.heapUsed / 1048576),
  });
});

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Lumen Studio] API server running at http://localhost:${PORT}`);
  console.log(`  → GET /api/scene   — scene geometry data`);
  console.log(`  → GET /api/presets — day/night lighting presets`);
  console.log(`  → GET /api/health  — server health & memory`);
});
