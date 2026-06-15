import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const GRID_SIZE = 50;
const RESOLUTION = 32;

function calculateField(greenery, baseValue, treeEffect, shrubEffect, treeRadius, shrubRadius) {
  const field = new Array(RESOLUTION * RESOLUTION).fill(baseValue);

  for (let gz = 0; gz < RESOLUTION; gz++) {
    for (let gx = 0; gx < RESOLUTION; gx++) {
      const worldX = (gx / (RESOLUTION - 1)) * GRID_SIZE;
      const worldZ = (gz / (RESOLUTION - 1)) * GRID_SIZE;

      let delta = 0;
      for (const item of greenery) {
        const dx = worldX - item.x;
        const dz = worldZ - item.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (item.type === 'tree') {
          if (dist < treeRadius) {
            const falloff = 1 - (dist / treeRadius);
            delta += treeEffect * falloff * falloff;
          }
        } else if (item.type === 'shrub') {
          if (dist < shrubRadius) {
            const falloff = 1 - (dist / shrubRadius);
            delta += shrubEffect * falloff * falloff;
          }
        }
      }

      const idx = gz * RESOLUTION + gx;
      field[idx] = field[idx] + delta;
    }
  }

  return field;
}

function addNoise(field, amplitude) {
  return field.map(v => {
    const noise = (Math.random() - 0.5) * amplitude;
    return v + noise;
  });
}

function smoothField(field, iterations) {
  let current = [...field];
  for (let iter = 0; iter < iterations; iter++) {
    const next = [...current];
    for (let z = 1; z < RESOLUTION - 1; z++) {
      for (let x = 1; x < RESOLUTION - 1; x++) {
        const idx = z * RESOLUTION + x;
        next[idx] = (
          current[idx] * 4 +
          current[idx - 1] +
          current[idx + 1] +
          current[idx - RESOLUTION] +
          current[idx + RESOLUTION]
        ) / 8;
      }
    }
    current = next;
  }
  return current;
}

app.post('/api/simulate', (req, res) => {
  const { greenery = [], gridSize = GRID_SIZE, resolution = RESOLUTION } = req.body;

  const temperature = addNoise(
    smoothField(
      calculateField(greenery, 27, -0.8, -0.4, 8, 5),
      2
    ),
    0.15
  );

  const humidity = addNoise(
    smoothField(
      calculateField(greenery, 40, 2, 1, 8, 5),
      2
    ),
    0.3
  );

  const windSpeed = addNoise(
    smoothField(
      calculateField(greenery, 5, -0.8, -0.3, 10, 5),
      2
    ),
    0.1
  ).map(v => Math.max(0.5, v));

  res.json({
    temperature: temperature.map(v => Math.round(v * 100) / 100),
    humidity: humidity.map(v => Math.round(v * 100) / 100),
    windSpeed: windSpeed.map(v => Math.round(v * 100) / 100),
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Microclimate simulation server running on port ${PORT}`);
});
