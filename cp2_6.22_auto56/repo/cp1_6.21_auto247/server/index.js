import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4321;

app.use(cors());
app.use(express.json());

const BRICK_UNIT = 16;

const brickTypes = [
  { id: '2x2', name: '2x2方块', width: 2, height: 1, depth: 2, shape: 'cube' },
  { id: '2x4', name: '2x4长条', width: 2, height: 1, depth: 4, shape: 'cube' },
  { id: '1x8', name: '1x8薄板', width: 1, height: 0.5, depth: 8, shape: 'cube' },
  { id: 'slope', name: '斜面块', width: 2, height: 1, depth: 2, shape: 'slope' },
  { id: 'cylinder', name: '圆柱体', width: 1, height: 1, depth: 1, shape: 'cylinder' },
];

app.get('/api/bricks/types', (req, res) => {
  res.json(brickTypes);
});

function generateBrickSTL(brick, offsetX = 0, offsetY = 0, offsetZ = 0) {
  const { type, position } = brick;
  const brickType = brickTypes.find(b => b.id === type);
  if (!brickType) return '';

  const w = brickType.width * BRICK_UNIT;
  const h = brickType.height * BRICK_UNIT;
  const d = brickType.depth * BRICK_UNIT;

  const px = position.x * BRICK_UNIT + offsetX;
  const py = position.y * BRICK_UNIT + offsetY;
  const pz = position.z * BRICK_UNIT + offsetZ;

  let stl = '';

  if (brickType.shape === 'cube' || brickType.shape === 'slope') {
    const hw = w / 2;
    const hd = d / 2;

    const vertices = [
      [px - hw, py,      pz - hd],
      [px + hw, py,      pz - hd],
      [px + hw, py,      pz + hd],
      [px - hw, py,      pz + hd],
      [px - hw, py + h,  pz - hd],
      [px + hw, py + h,  pz - hd],
      [px + hw, py + h,  pz + hd],
      [px - hw, py + h,  pz + hd],
    ];

    const faces = [
      [0, 2, 1], [0, 3, 2],
      [4, 5, 6], [4, 6, 7],
      [0, 1, 5], [0, 5, 4],
      [2, 3, 7], [2, 7, 6],
      [1, 2, 6], [1, 6, 5],
      [0, 4, 7], [0, 7, 3],
    ];

    const name = `brick_${brick.id}`;
    stl += `solid ${name}\n`;

    faces.forEach(face => {
      const v0 = vertices[face[0]];
      const v1 = vertices[face[1]];
      const v2 = vertices[face[2]];

      const ax = v1[0] - v0[0];
      const ay = v1[1] - v0[1];
      const az = v1[2] - v0[2];
      const bx = v2[0] - v0[0];
      const by = v2[1] - v0[1];
      const bz = v2[2] - v0[2];

      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;

      stl += `facet normal ${(nx / len).toFixed(6)} ${(ny / len).toFixed(6)} ${(nz / len).toFixed(6)}\n`;
      stl += `  outer loop\n`;
      stl += `    vertex ${v0[0].toFixed(6)} ${v0[1].toFixed(6)} ${v0[2].toFixed(6)}\n`;
      stl += `    vertex ${v1[0].toFixed(6)} ${v1[1].toFixed(6)} ${v1[2].toFixed(6)}\n`;
      stl += `    vertex ${v2[0].toFixed(6)} ${v2[1].toFixed(6)} ${v2[2].toFixed(6)}\n`;
      stl += `  endloop\n`;
      stl += `endfacet\n`;
    });

    stl += `endsolid ${name}\n`;
  } else if (brickType.shape === 'cylinder') {
    const radius = w / 2;
    const segments = 32;
    const name = `brick_${brick.id}`;
    stl += `solid ${name}\n`;

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const x1 = px + Math.cos(angle1) * radius;
      const z1 = pz + Math.sin(angle1) * radius;
      const x2 = px + Math.cos(angle2) * radius;
      const z2 = pz + Math.sin(angle2) * radius;

      const nx = (Math.cos(angle1) + Math.cos(angle2)) / 2;
      const nz = (Math.sin(angle1) + Math.sin(angle2)) / 2;
      const nlen = Math.sqrt(nx * nx + nz * nz) || 1;

      stl += `facet normal ${(nx / nlen).toFixed(6)} 0 ${(nz / nlen).toFixed(6)}\n`;
      stl += `  outer loop\n`;
      stl += `    vertex ${x1.toFixed(6)} ${py.toFixed(6)} ${z1.toFixed(6)}\n`;
      stl += `    vertex ${x2.toFixed(6)} ${py.toFixed(6)} ${z2.toFixed(6)}\n`;
      stl += `    vertex ${x2.toFixed(6)} ${(py + h).toFixed(6)} ${z2.toFixed(6)}\n`;
      stl += `  endloop\n`;
      stl += `endfacet\n`;

      stl += `facet normal ${(nx / nlen).toFixed(6)} 0 ${(nz / nlen).toFixed(6)}\n`;
      stl += `  outer loop\n`;
      stl += `    vertex ${x1.toFixed(6)} ${py.toFixed(6)} ${z1.toFixed(6)}\n`;
      stl += `    vertex ${x2.toFixed(6)} ${(py + h).toFixed(6)} ${z2.toFixed(6)}\n`;
      stl += `    vertex ${x1.toFixed(6)} ${(py + h).toFixed(6)} ${z1.toFixed(6)}\n`;
      stl += `  endloop\n`;
      stl += `endfacet\n`;

      stl += `facet normal 0 -1 0\n`;
      stl += `  outer loop\n`;
      stl += `    vertex ${px.toFixed(6)} ${py.toFixed(6)} ${pz.toFixed(6)}\n`;
      stl += `    vertex ${x1.toFixed(6)} ${py.toFixed(6)} ${z1.toFixed(6)}\n`;
      stl += `    vertex ${x2.toFixed(6)} ${py.toFixed(6)} ${z2.toFixed(6)}\n`;
      stl += `  endloop\n`;
      stl += `endfacet\n`;

      stl += `facet normal 0 1 0\n`;
      stl += `  outer loop\n`;
      stl += `    vertex ${px.toFixed(6)} ${(py + h).toFixed(6)} ${pz.toFixed(6)}\n`;
      stl += `    vertex ${x2.toFixed(6)} ${(py + h).toFixed(6)} ${z2.toFixed(6)}\n`;
      stl += `    vertex ${x1.toFixed(6)} ${(py + h).toFixed(6)} ${z1.toFixed(6)}\n`;
      stl += `  endloop\n`;
      stl += `endfacet\n`;
    }

    stl += `endsolid ${name}\n`;
  }

  return stl;
}

app.post('/api/export/stl', (req, res) => {
  const { bricks } = req.body;

  if (!bricks || !Array.isArray(bricks)) {
    return res.status(400).json({ error: 'Invalid bricks data' });
  }

  let stlContent = '';
  bricks.forEach(brick => {
    stlContent += generateBrickSTL(brick);
  });

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="model.stl"');
  res.send(stlContent);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
