const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/generate', (req, res) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Received generate request`);

  const { skeleton } = req.body;

  if (!skeleton || !Array.isArray(skeleton) || skeleton.length < 2) {
    return res.status(400).json({
      error: 'Invalid skeleton data. At least 2 points are required.',
    });
  }

  try {
    const startTime = Date.now();

    const xs = skeleton.map((p) => p.x);
    const ys = skeleton.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = Math.max(maxX - minX, 1);
    const height = Math.max(maxY - minY, 1);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const scale = 4 / Math.max(width, height);
    const depth = width * 1.5 * scale;
    const layers = 3;
    const layerStep = depth / (layers - 1);

    const nodes = [];
    const edges = [];

    const nodeMap = new Map();

    for (let layerIdx = 0; layerIdx < layers; layerIdx++) {
      const z = -depth / 2 + layerIdx * layerStep;
      const layerFactor = 1 - Math.abs(layerIdx - (layers - 1) / 2) / ((layers - 1) / 2) * 0.3;

      skeleton.forEach((point, pointIdx) => {
        const nx = (point.x - centerX) * scale * layerFactor;
        const ny = -(point.y - centerY) * scale * layerFactor;
        const nz = z;

        const nodeIndex = nodes.length;
        nodes.push({ x: nx, y: ny, z: nz });
        nodeMap.set(`${layerIdx}-${pointIdx}`, nodeIndex);

        if (pointIdx > 0) {
          const prevKey = `${layerIdx}-${pointIdx - 1}`;
          const prevIndex = nodeMap.get(prevKey);
          if (prevIndex !== undefined) {
            edges.push([prevIndex, nodeIndex]);
          }
        }

        if (layerIdx > 0) {
          const belowKey = `${layerIdx - 1}-${pointIdx}`;
          const belowIndex = nodeMap.get(belowKey);
          if (belowIndex !== undefined) {
            edges.push([belowIndex, nodeIndex]);
          }

          if (pointIdx > 0) {
            const belowPrevKey = `${layerIdx - 1}-${pointIdx - 1}`;
            const belowPrevIndex = nodeMap.get(belowPrevKey);
            if (belowPrevIndex !== undefined) {
              edges.push([belowPrevIndex, nodeIndex]);
            }
          }

          if (pointIdx < skeleton.length - 1) {
            const belowNextKey = `${layerIdx - 1}-${pointIdx + 1}`;
            const belowNextIndex = nodeMap.get(belowNextKey);
            if (belowNextIndex !== undefined) {
              edges.push([belowNextIndex, nodeIndex]);
            }
          }
        }
      });
    }

    const elapsed = Date.now() - startTime;
    console.log(`[${requestId}] Generated ${nodes.length} nodes, ${edges.length} edges in ${elapsed}ms`);

    res.json({ nodes, edges });
  } catch (err) {
    console.error(`[${requestId}] Error:`, err);
    res.status(500).json({ error: 'Internal server error during lattice generation' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Lattice Sculptor server running on http://localhost:${PORT}`);
  console.log(`POST /api/generate - Generate 3D lattice from 2D skeleton`);
});
