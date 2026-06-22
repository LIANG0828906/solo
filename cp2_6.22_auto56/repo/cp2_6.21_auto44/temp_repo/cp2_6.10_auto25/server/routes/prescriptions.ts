import express from 'express';
import fs from 'fs';
import path from 'path';
import type { Prescription } from '../../src/types';

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/prescriptions.json');

const readPrescriptions = (): Prescription[] => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('读取处方数据失败', e);
  }
  return [];
};

const writePrescriptions = (prescriptions: Prescription[]) => {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(prescriptions, null, 2));
  } catch (e) {
    console.error('保存处方数据失败', e);
  }
};

router.get('/', (_req, res) => {
  const prescriptions = readPrescriptions();
  res.json(prescriptions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
});

router.get('/:id', (req, res) => {
  const prescriptions = readPrescriptions();
  const prescription = prescriptions.find(p => p.id === req.params.id);
  if (!prescription) {
    return res.status(404).json({ error: '处方未找到' });
  }
  res.json(prescription);
});

router.post('/', (req, res) => {
  const prescription = req.body as Prescription;
  if (!prescription.id) {
    prescription.id = Date.now().toString();
  }
  if (!prescription.createdAt) {
    prescription.createdAt = new Date().toISOString();
  }
  
  const prescriptions = readPrescriptions();
  prescriptions.push(prescription);
  writePrescriptions(prescriptions);
  
  res.status(201).json(prescription);
});

export default router;
