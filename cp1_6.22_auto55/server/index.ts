import express from 'express';
import cors from 'cors';
import { Molecule, ReactionResult, Atom, Bond } from '../src/types';

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

const molecules: Molecule[] = [
  {
    id: 'h2o',
    name: '水',
    formula: 'H₂O',
    molecularWeight: 18.015,
    atoms: [
      { id: 'o1', element: 'O', x: 0, y: 0, z: 0 },
      { id: 'h1', element: 'H', x: 0.76, y: 0.58, z: 0 },
      { id: 'h2', element: 'H', x: -0.76, y: 0.58, z: 0 },
    ],
    bonds: [
      { id: 'b1', atom1: 'o1', atom2: 'h1', type: 'single' },
      { id: 'b2', atom1: 'o1', atom2: 'h2', type: 'single' },
    ],
  },
  {
    id: 'ch4',
    name: '甲烷',
    formula: 'CH₄',
    molecularWeight: 16.04,
    atoms: [
      { id: 'c1', element: 'C', x: 0, y: 0, z: 0 },
      { id: 'h1', element: 'H', x: 0.63, y: 0.63, z: 0.63 },
      { id: 'h2', element: 'H', x: -0.63, y: -0.63, z: 0.63 },
      { id: 'h3', element: 'H', x: 0.63, y: -0.63, z: -0.63 },
      { id: 'h4', element: 'H', x: -0.63, y: 0.63, z: -0.63 },
    ],
    bonds: [
      { id: 'b1', atom1: 'c1', atom2: 'h1', type: 'single' },
      { id: 'b2', atom1: 'c1', atom2: 'h2', type: 'single' },
      { id: 'b3', atom1: 'c1', atom2: 'h3', type: 'single' },
      { id: 'b4', atom1: 'c1', atom2: 'h4', type: 'single' },
    ],
  },
  {
    id: 'co2',
    name: '二氧化碳',
    formula: 'CO₂',
    molecularWeight: 44.01,
    atoms: [
      { id: 'c1', element: 'C', x: 0, y: 0, z: 0 },
      { id: 'o1', element: 'O', x: 1.16, y: 0, z: 0 },
      { id: 'o2', element: 'O', x: -1.16, y: 0, z: 0 },
    ],
    bonds: [
      { id: 'b1', atom1: 'c1', atom2: 'o1', type: 'double' },
      { id: 'b2', atom1: 'c1', atom2: 'o2', type: 'double' },
    ],
  },
  {
    id: 'c6h6',
    name: '苯',
    formula: 'C₆H₆',
    molecularWeight: 78.11,
    atoms: (() => {
      const atoms: Atom[] = [];
      const radius = 1.4;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        atoms.push({
          id: `c${i + 1}`,
          element: 'C',
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          z: 0,
        });
      }
      const hRadius = 2.48;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        atoms.push({
          id: `h${i + 1}`,
          element: 'H',
          x: hRadius * Math.cos(angle),
          y: hRadius * Math.sin(angle),
          z: 0,
        });
      }
      return atoms;
    })(),
    bonds: (() => {
      const bonds: Bond[] = [];
      for (let i = 0; i < 6; i++) {
        bonds.push({
          id: `cb${i + 1}`,
          atom1: `c${i + 1}`,
          atom2: `c${((i + 1) % 6) + 1}`,
          type: 'aromatic',
        });
      }
      for (let i = 0; i < 6; i++) {
        bonds.push({
          id: `chb${i + 1}`,
          atom1: `c${i + 1}`,
          atom2: `h${i + 1}`,
          type: 'single',
        });
      }
      return bonds;
    })(),
  },
  {
    id: 'h2co3',
    name: '碳酸',
    formula: 'H₂CO₃',
    molecularWeight: 62.025,
    atoms: [
      { id: 'c1', element: 'C', x: 0, y: 0, z: 0 },
      { id: 'o1', element: 'O', x: 1.2, y: 0, z: 0 },
      { id: 'o2', element: 'O', x: -0.6, y: 1.04, z: 0 },
      { id: 'o3', element: 'O', x: -0.6, y: -1.04, z: 0 },
      { id: 'h1', element: 'H', x: -0.6, y: 1.04, z: 0.95 },
      { id: 'h2', element: 'H', x: -0.6, y: -1.04, z: 0.95 },
    ],
    bonds: [
      { id: 'b1', atom1: 'c1', atom2: 'o1', type: 'double' },
      { id: 'b2', atom1: 'c1', atom2: 'o2', type: 'single' },
      { id: 'b3', atom1: 'c1', atom2: 'o3', type: 'single' },
      { id: 'b4', atom1: 'o2', atom2: 'h1', type: 'single' },
      { id: 'b5', atom1: 'o3', atom2: 'h2', type: 'single' },
    ],
  },
  {
    id: 'ch3oh',
    name: '甲醇',
    formula: 'CH₃OH',
    molecularWeight: 32.04,
    atoms: [
      { id: 'c1', element: 'C', x: 0, y: 0, z: 0 },
      { id: 'o1', element: 'O', x: 1.42, y: 0, z: 0 },
      { id: 'h1', element: 'H', x: 2.38, y: 0, z: 0 },
      { id: 'h2', element: 'H', x: -0.77, y: 0.77, z: 0.77 },
      { id: 'h3', element: 'H', x: -0.77, y: -0.77, z: 0.77 },
      { id: 'h4', element: 'H', x: -0.77, y: 0, z: -0.77 },
    ],
    bonds: [
      { id: 'b1', atom1: 'c1', atom2: 'o1', type: 'single' },
      { id: 'b2', atom1: 'o1', atom2: 'h1', type: 'single' },
      { id: 'b3', atom1: 'c1', atom2: 'h2', type: 'single' },
      { id: 'b4', atom1: 'c1', atom2: 'h3', type: 'single' },
      { id: 'b5', atom1: 'c1', atom2: 'h4', type: 'single' },
    ],
  },
  {
    id: 'h2',
    name: '氢气',
    formula: 'H₂',
    molecularWeight: 2.016,
    atoms: [
      { id: 'h1', element: 'H', x: -0.37, y: 0, z: 0 },
      { id: 'h2', element: 'H', x: 0.37, y: 0, z: 0 },
    ],
    bonds: [{ id: 'b1', atom1: 'h1', atom2: 'h2', type: 'single' }],
  },
];

const reactionRules: Array<{
  reactants: [string, string];
  productId: string;
  atomMapping: Record<string, string>;
}> = [
  {
    reactants: ['h2o', 'co2'],
    productId: 'h2co3',
    atomMapping: {
      'h2o_o1': 'h2co3_o2',
      'h2o_h1': 'h2co3_h1',
      'h2o_h2': 'h2co3_h2',
      'co2_c1': 'h2co3_c1',
      'co2_o1': 'h2co3_o1',
      'co2_o2': 'h2co3_o3',
    },
  },
  {
    reactants: ['h2o', 'ch4'],
    productId: 'ch3oh',
    atomMapping: {
      'h2o_o1': 'ch3oh_o1',
      'h2o_h1': 'ch3oh_h1',
      'h2o_h2': 'ch3oh_h2',
      'ch4_c1': 'ch3oh_c1',
      'ch4_h1': 'ch3oh_h3',
      'ch4_h2': 'ch3oh_h4',
      'ch4_h3': 'ch3oh_h5',
      'ch4_h4': 'ch3oh_h6',
    },
  },
  {
    reactants: ['ch4', 'h2o'],
    productId: 'ch3oh',
    atomMapping: {
      'ch4_c1': 'ch3oh_c1',
      'ch4_h1': 'ch3oh_h2',
      'ch4_h2': 'ch3oh_h3',
      'ch4_h3': 'ch3oh_h4',
      'ch4_h4': 'ch3oh_h5',
      'h2o_o1': 'ch3oh_o1',
      'h2o_h1': 'ch3oh_h1',
      'h2o_h2': 'ch3oh_h6',
    },
  },
];

app.get('/api/molecules', (_req, res) => {
  const publicMolecules = molecules.filter(m => ['h2o', 'ch4', 'co2', 'c6h6'].includes(m.id));
  res.json(publicMolecules);
});

app.post('/api/react', (req, res) => {
  const { molecule1Id, molecule2Id } = req.body;

  if (!molecule1Id || !molecule2Id) {
    return res.status(400).json({ error: '需要提供两个分子ID' });
  }

  const rule = reactionRules.find(
    r =>
      (r.reactants[0] === molecule1Id && r.reactants[1] === molecule2Id) ||
      (r.reactants[0] === molecule2Id && r.reactants[1] === molecule1Id)
  );

  if (!rule) {
    return res.status(404).json({ error: '未找到匹配的反应规则' });
  }

  const product = molecules.find(m => m.id === rule.productId);

  if (!product) {
    return res.status(500).json({ error: '产物分子数据未找到' });
  }

  const result: ReactionResult = {
    product,
    reactant1Id: molecule1Id,
    reactant2Id: molecule2Id,
    atomMapping: rule.atomMapping,
  };

  res.json(result);
});

app.listen(port, () => {
  console.log(`分子模拟服务器运行在 http://localhost:${port}`);
});
