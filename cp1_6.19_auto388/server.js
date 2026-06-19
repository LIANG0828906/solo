import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import loki from 'lokijs';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const db = new loki('flowers.db', {
  persistenceMethod: 'memory',
});

const flowers = db.addCollection('flowers');
const schemes = db.addCollection('schemes');

const defaultFlowers = [
  { id: uuidv4(), name: '玫瑰', price: 8.5, stock: 50, color: '#E53935', imageUrl: '' },
  { id: uuidv4(), name: '绣球', price: 15.0, stock: 20, color: '#AB47BC', imageUrl: '' },
  { id: uuidv4(), name: '郁金香', price: 6.0, stock: 40, color: '#FF7043', imageUrl: '' },
  { id: uuidv4(), name: '洋桔梗', price: 5.5, stock: 35, color: '#64B5F6', imageUrl: '' },
  { id: uuidv4(), name: '向日葵', price: 12.0, stock: 25, color: '#FFD54F', imageUrl: '' },
  { id: uuidv4(), name: '康乃馨', price: 4.5, stock: 60, color: '#EC407A', imageUrl: '' },
  { id: uuidv4(), name: '百合', price: 10.0, stock: 30, color: '#FFFFFF', imageUrl: '' },
  { id: uuidv4(), name: '满天星', price: 3.5, stock: 100, color: '#ECEFF1', imageUrl: '' },
  { id: uuidv4(), name: '尤加利叶', price: 4.0, stock: 45, color: '#81C784', imageUrl: '' },
  { id: uuidv4(), name: '非洲菊', price: 7.0, stock: 28, color: '#FFA726', imageUrl: '' },
  { id: uuidv4(), name: '铃兰', price: 18.0, stock: 15, color: '#B2DFDB', imageUrl: '' },
  { id: uuidv4(), name: '鸢尾', price: 9.0, stock: 22, color: '#7C4DFF', imageUrl: '' },
];

defaultFlowers.forEach(flower => flowers.insert(flower));

app.get('/api/flowers', (req, res) => {
  const allFlowers = flowers.find();
  res.json(allFlowers);
});

app.get('/api/schemes', (req, res) => {
  const allSchemes = schemes.find();
  res.json(allSchemes);
});

app.post('/api/schemes', (req, res) => {
  const schemeData = req.body;
  const newScheme = {
    id: uuidv4(),
    ...schemeData,
    createdAt: new Date().toISOString(),
  };
  const result = schemes.insert(newScheme);
  res.status(201).json(result);
});

app.delete('/api/schemes/:id', (req, res) => {
  const { id } = req.params;
  const scheme = schemes.findOne({ id });
  if (scheme) {
    schemes.remove(scheme);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Scheme not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Flower server is running on http://localhost:${PORT}`);
});
