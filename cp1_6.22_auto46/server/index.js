import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

function generateTerrainHeights(resolution, width, depth) {
  const heights = [];
  for (let i = 0; i <= resolution; i++) {
    const row = [];
    for (let j = 0; j <= resolution; j++) {
      const x = (j / resolution) * width - width / 2;
      const z = (i / resolution) * depth - depth / 2;
      const h =
        4.0 * Math.sin(x * 0.08) * Math.cos(z * 0.12) +
        2.5 * Math.sin(x * 0.05 + z * 0.07) +
        1.8 * Math.cos(x * 0.14 - z * 0.09) +
        3.0 * Math.sin(x * 0.03) * Math.sin(z * 0.04) +
        1.2 * Math.cos(x * 0.2 + z * 0.15);
      row.push(Math.max(0, h));
    }
    heights.push(row);
  }
  return heights;
}

const terrainData = {
  width: 100,
  depth: 100,
  resolution: 50,
  heights: generateTerrainHeights(50, 100, 100),
};

app.get('/api/terrain', (req, res) => {
  res.json(terrainData);
});

app.listen(3001, () => {
  console.log('Terrain API server running on http://localhost:3001');
});
