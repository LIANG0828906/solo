import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const elementData = {
  H: { name: '氢', mass: 1.008, color: '#FFFFFF', covalentRadius: 0.31 },
  C: { name: '碳', mass: 12.011, color: '#808080', covalentRadius: 0.76 },
  N: { name: '氮', mass: 14.007, color: '#0000FF', covalentRadius: 0.71 },
  O: { name: '氧', mass: 15.999, color: '#FF0000', covalentRadius: 0.66 },
};

const molecules = {
  H2O: {
    name: '水分子',
    formula: 'H₂O',
    atoms: [
      { id: 1, element: 'O', x: 0, y: 0, z: 0 },
      { id: 2, element: 'H', x: 0.958, y: 0, z: 0 },
      { id: 3, element: 'H', x: -0.239, y: 0.927, z: 0 },
    ],
    bonds: [
      { from: 1, to: 2, order: 1 },
      { from: 1, to: 3, order: 1 },
    ],
  },
  CO2: {
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: [
      { id: 1, element: 'C', x: 0, y: 0, z: 0 },
      { id: 2, element: 'O', x: 1.163, y: 0, z: 0 },
      { id: 3, element: 'O', x: -1.163, y: 0, z: 0 },
    ],
    bonds: [
      { from: 1, to: 2, order: 2 },
      { from: 1, to: 3, order: 2 },
    ],
  },
  C6H6: {
    name: '苯',
    formula: 'C₆H₆',
    atoms: [
      { id: 1, element: 'C', x: 1.397, y: 0, z: 0 },
      { id: 2, element: 'C', x: 0.698, y: 1.210, z: 0 },
      { id: 3, element: 'C', x: -0.698, y: 1.210, z: 0 },
      { id: 4, element: 'C', x: -1.397, y: 0, z: 0 },
      { id: 5, element: 'C', x: -0.698, y: -1.210, z: 0 },
      { id: 6, element: 'C', x: 0.698, y: -1.210, z: 0 },
      { id: 7, element: 'H', x: 2.481, y: 0, z: 0 },
      { id: 8, element: 'H', x: 1.240, y: 2.148, z: 0 },
      { id: 9, element: 'H', x: -1.240, y: 2.148, z: 0 },
      { id: 10, element: 'H', x: -2.481, y: 0, z: 0 },
      { id: 11, element: 'H', x: -1.240, y: -2.148, z: 0 },
      { id: 12, element: 'H', x: 1.240, y: -2.148, z: 0 },
    ],
    bonds: [
      { from: 1, to: 2, order: 1.5 },
      { from: 2, to: 3, order: 1.5 },
      { from: 3, to: 4, order: 1.5 },
      { from: 4, to: 5, order: 1.5 },
      { from: 5, to: 6, order: 1.5 },
      { from: 6, to: 1, order: 1.5 },
      { from: 1, to: 7, order: 1 },
      { from: 2, to: 8, order: 1 },
      { from: 3, to: 9, order: 1 },
      { from: 4, to: 10, order: 1 },
      { from: 5, to: 11, order: 1 },
      { from: 6, to: 12, order: 1 },
    ],
  },
};

app.get('/api/molecules', (req, res) => {
  const moleculeList = Object.keys(molecules).map((key) => ({
    id: key,
    name: molecules[key].name,
    formula: molecules[key].formula,
    atomCount: molecules[key].atoms.length,
  }));
  res.json(moleculeList);
});

app.get('/api/molecules/:id', (req, res) => {
  const moleculeId = req.params.id;
  const molecule = molecules[moleculeId];

  if (!molecule) {
    return res.status(404).json({ error: '分子未找到' });
  }

  const atomsWithData = molecule.atoms.map((atom) => ({
    ...atom,
    ...elementData[atom.element],
  }));

  res.json({
    ...molecule,
    atoms: atomsWithData,
  });
});

app.get('/api/elements', (req, res) => {
  res.json(elementData);
});

app.listen(PORT, () => {
  console.log(`分子数据服务器运行在 http://localhost:${PORT}`);
});
