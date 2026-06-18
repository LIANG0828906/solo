import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'designs.json');

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json({ limit: '10mb' }));

const CLASP_PRICES = {
  silver: 15,
  gold: 30,
  copper: 20
};

const ENGRAVING_FEE = 10;
const LEATHER_PRICE_PER_SQ_CM = 0.05;

function readDesigns() {
  if (!fs.existsSync(DATA_FILE)) {
    return { designs: {} };
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { designs: {} };
  }
}

function writeDesigns(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateShortId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function calculateBill(params) {
  const { beltLength, beltWidth, claspType, engravingText } = params;
  const bill = [];

  const areaCm2 = beltLength * (beltWidth / 10);
  const leatherTotal = parseFloat((areaCm2 * LEATHER_PRICE_PER_SQ_CM).toFixed(2));
  bill.push({
    name: '皮料',
    quantity: areaCm2,
    unit: 'cm²',
    unitPrice: LEATHER_PRICE_PER_SQ_CM,
    total: leatherTotal
  });

  const claspPrice = CLASP_PRICES[claspType] || 15;
  const claspName = claspType === 'silver' ? '银扣' : claspType === 'gold' ? '金扣' : '铜扣';
  bill.push({
    name: claspName,
    quantity: 1,
    unit: '个',
    unitPrice: claspPrice,
    total: claspPrice
  });

  if (engravingText && engravingText.trim().length > 0) {
    bill.push({
      name: '刻字加工费',
      quantity: 1,
      unit: '次',
      unitPrice: ENGRAVING_FEE,
      total: ENGRAVING_FEE
    });
  }

  const totalPrice = bill.reduce((sum, item) => sum + item.total, 0);
  return { bill, totalPrice: parseFloat(totalPrice.toFixed(2)) };
}

app.post('/api/save-design', (req, res) => {
  try {
    const params = req.body;
    const { bill, totalPrice } = calculateBill(params);

    let id;
    const db = readDesigns();
    do {
      id = generateShortId();
    } while (db.designs[id]);

    const design = {
      id,
      ...params,
      bill,
      totalPrice,
      createdAt: Date.now()
    };

    db.designs[id] = design;
    writeDesigns(db);

    res.json({
      id,
      thumbnail: params.thumbnail || '',
      bill,
      totalPrice
    });
  } catch (err) {
    console.error('Save design error:', err);
    res.status(500).json({ error: '保存设计失败' });
  }
});

app.get('/api/design/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDesigns();
    const design = db.designs[id];

    if (!design) {
      return res.status(404).json({ error: '设计不存在' });
    }

    res.json(design);
  } catch (err) {
    console.error('Get design error:', err);
    res.status(500).json({ error: '读取设计失败' });
  }
});

app.listen(PORT, () => {
  console.log(`皮具定制工坊后端服务已启动: http://localhost:${PORT}`);
});
