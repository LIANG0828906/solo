import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'medicines.json');

app.use(cors());
app.use(bodyParser.json());

interface Medicine {
  id: string;
  name: string;
  specification: string;
  quantity: number;
  expiryDate: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

const readData = (): Medicine[] => {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeData = (medicines: Medicine[]): void => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(medicines, null, 2), 'utf-8');
};

app.get('/api/medicines', (req, res) => {
  try {
    const medicines = readData();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: '读取药品数据失败' });
  }
});

app.get('/api/medicines/:id', (req, res) => {
  try {
    const medicines = readData();
    const medicine = medicines.find(m => m.id === req.params.id);
    if (!medicine) {
      res.status(404).json({ error: '药品不存在' });
      return;
    }
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: '读取药品数据失败' });
  }
});

app.post('/api/medicines', (req, res) => {
  try {
    const { name, specification, quantity, expiryDate, location } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: '药品名称不能为空' });
      return;
    }
    if (quantity === undefined || quantity < 0) {
      res.status(400).json({ error: '数量必须大于等于0' });
      return;
    }
    if (!expiryDate) {
      res.status(400).json({ error: '有效期不能为空' });
      return;
    }

    const medicines = readData();
    const now = new Date().toISOString();
    const newMedicine: Medicine = {
      id: uuidv4(),
      name: name.trim(),
      specification: specification || '',
      quantity: Number(quantity),
      expiryDate,
      location: location || '客厅药箱',
      createdAt: now,
      updatedAt: now,
    };

    medicines.push(newMedicine);
    writeData(medicines);
    res.status(201).json(newMedicine);
  } catch (error) {
    res.status(500).json({ error: '创建药品失败' });
  }
});

app.put('/api/medicines/:id', (req, res) => {
  try {
    const { name, specification, quantity, expiryDate, location } = req.body;
    const medicines = readData();
    const index = medicines.findIndex(m => m.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: '药品不存在' });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: '药品名称不能为空' });
      return;
    }
    if (quantity === undefined || quantity < 0) {
      res.status(400).json({ error: '数量必须大于等于0' });
      return;
    }

    const updatedMedicine: Medicine = {
      ...medicines[index],
      name: name.trim(),
      specification: specification || '',
      quantity: Number(quantity),
      expiryDate,
      location: location || '客厅药箱',
      updatedAt: new Date().toISOString(),
    };

    medicines[index] = updatedMedicine;
    writeData(medicines);
    res.json(updatedMedicine);
  } catch (error) {
    res.status(500).json({ error: '更新药品失败' });
  }
});

app.delete('/api/medicines/:id', (req, res) => {
  try {
    const medicines = readData();
    const index = medicines.findIndex(m => m.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ error: '药品不存在' });
      return;
    }

    medicines.splice(index, 1);
    writeData(medicines);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除药品失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
