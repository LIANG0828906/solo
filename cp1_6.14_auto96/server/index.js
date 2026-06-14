import express from 'express';
import cors from 'cors';
import { Low, JSONFile } from 'lowdb';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const defaultData = { wines: [], tastings: [] };
const db = new Low(adapter, defaultData);

function createSeedData() {
  const wines = [
    { id: uuidv4(), name: 'Château Margaux', chateau: 'Château Margaux', region: 'bordeaux', regionLabel: '波尔多', variety: 'Cabernet Sauvignon', year: 2015, rating: 5, capacity: '750ml', alcohol: '13.5%', logoColor: '#722F37', forExchange: false, tastingCount: 2 },
    { id: uuidv4(), name: 'Château Lafite Rothschild', chateau: 'Château Lafite Rothschild', region: 'bordeaux', regionLabel: '波尔多', variety: 'Cabernet Sauvignon', year: 2016, rating: 5, capacity: '750ml', alcohol: '13.0%', logoColor: '#8B3A3A', forExchange: true, exchangeCondition: '寻求同等级波尔多或纳帕谷佳酿', desiredWines: ['Opus One', 'Screaming Eagle'], tastingCount: 1 },
    { id: uuidv4(), name: 'Château Mouton Rothschild', chateau: 'Château Mouton Rothschild', region: 'bordeaux', regionLabel: '波尔多', variety: 'Cabernet Sauvignon', year: 2017, rating: 4, capacity: '750ml', alcohol: '13.5%', logoColor: '#6B2D2D', forExchange: false, tastingCount: 1 },
    { id: uuidv4(), name: 'Château Haut-Brion', chateau: 'Château Haut-Brion', region: 'bordeaux', regionLabel: '波尔多', variety: 'Merlot', year: 2014, rating: 5, capacity: '750ml', alcohol: '14.0%', logoColor: '#943A3A', forExchange: false, tastingCount: 0 },
    { id: uuidv4(), name: 'Château Palmer', chateau: 'Château Palmer', region: 'bordeaux', regionLabel: '波尔多', variety: 'Merlot', year: 2018, rating: 4, capacity: '750ml', alcohol: '13.5%', logoColor: '#7A3535', forExchange: true, exchangeCondition: '偏好勃艮第黑皮诺', desiredWines: ['Romanée-Conti'], tastingCount: 1 },
    { id: uuidv4(), name: 'Pauillac Reserve', chateau: 'Pauillac Estate', region: 'bordeaux', regionLabel: '波尔多', variety: 'Cabernet Sauvignon', year: 2019, rating: 3, capacity: '750ml', alcohol: '13.0%', logoColor: '#5C2828', forExchange: true, exchangeCondition: '任意产区同年份即可', desiredWines: [], tastingCount: 0 },
    { id: uuidv4(), name: 'Opus One', chateau: 'Opus One Winery', region: 'napa', regionLabel: '纳帕谷', variety: 'Cabernet Sauvignon', year: 2018, rating: 5, capacity: '750ml', alcohol: '14.5%', logoColor: '#E67E22', forExchange: false, tastingCount: 2 },
    { id: uuidv4(), name: 'Screaming Eagle', chateau: 'Screaming Eagle', region: 'napa', regionLabel: '纳帕谷', variety: 'Cabernet Sauvignon', year: 2019, rating: 5, capacity: '750ml', alcohol: '14.8%', logoColor: '#D4711A', forExchange: false, tastingCount: 1 },
    { id: uuidv4(), name: 'Harlan Estate', chateau: 'Harlan Estate', region: 'napa', regionLabel: '纳帕谷', variety: 'Cabernet Sauvignon', year: 2017, rating: 4, capacity: '750ml', alcohol: '14.5%', logoColor: '#C76B18', forExchange: true, exchangeCondition: '寻找意大利超级托斯卡纳', desiredWines: ['Sassicaia', 'Ornellaia'], tastingCount: 0 },
    { id: uuidv4(), name: 'Dominus', chateau: 'Dominus Estate', region: 'napa', regionLabel: '纳帕谷', variety: 'Cabernet Sauvignon', year: 2016, rating: 4, capacity: '750ml', alcohol: '14.2%', logoColor: '#B8651A', forExchange: false, tastingCount: 0 },
    { id: uuidv4(), name: 'Silver Oak', chateau: 'Silver Oak Cellars', region: 'napa', regionLabel: '纳帕谷', variety: 'Cabernet Sauvignon', year: 2020, rating: 4, capacity: '750ml', alcohol: '13.8%', logoColor: '#A85D15', forExchange: false, tastingCount: 1 },
    { id: uuidv4(), name: "Stag's Leap", chateau: "Stag's Leap Wine Cellars", region: 'napa', regionLabel: '纳帕谷', variety: 'Cabernet Sauvignon', year: 2018, rating: 3, capacity: '750ml', alcohol: '14.0%', logoColor: '#9A5510', forExchange: true, exchangeCondition: '同等价位法国红酒', desiredWines: [], tastingCount: 0 },
    { id: uuidv4(), name: 'Sassicaia', chateau: 'Tenuta San Guido', region: 'tuscany', regionLabel: '托斯卡纳', variety: 'Cabernet Sauvignon', year: 2017, rating: 5, capacity: '750ml', alcohol: '13.5%', logoColor: '#2D5016', forExchange: false, tastingCount: 1 },
    { id: uuidv4(), name: 'Tignanello', chateau: 'Antinori', region: 'tuscany', regionLabel: '托斯卡纳', variety: 'Sangiovese', year: 2019, rating: 4, capacity: '750ml', alcohol: '13.5%', logoColor: '#3A6320', forExchange: false, tastingCount: 0 },
    { id: uuidv4(), name: 'Ornellaia', chateau: 'Ornellaia', region: 'tuscany', regionLabel: '托斯卡纳', variety: 'Cabernet Sauvignon', year: 2018, rating: 4, capacity: '750ml', alcohol: '14.0%', logoColor: '#2A4A12', forExchange: true, exchangeCondition: '寻找纳帕谷珍藏', desiredWines: ['Opus One'], tastingCount: 0 },
    { id: uuidv4(), name: 'Brunello di Montalcino', chateau: 'Biondi-Santi', region: 'tuscany', regionLabel: '托斯卡纳', variety: 'Sangiovese', year: 2016, rating: 4, capacity: '750ml', alcohol: '13.5%', logoColor: '#1F3D0E', forExchange: false, tastingCount: 0 },
    { id: uuidv4(), name: 'Super Tuscan Reserve', chateau: 'Michele Satta', region: 'tuscany', regionLabel: '托斯卡纳', variety: 'Cabernet Sauvignon', year: 2020, rating: 3, capacity: '750ml', alcohol: '14.0%', logoColor: '#2A5518', forExchange: false, tastingCount: 0 },
    { id: uuidv4(), name: 'Chianti Classico Riserva', chateau: 'Fontodi', region: 'tuscany', regionLabel: '托斯卡纳', variety: 'Sangiovese', year: 2019, rating: 3, capacity: '750ml', alcohol: '13.0%', logoColor: '#3D6D28', forExchange: true, exchangeCondition: '同等价位法国或美国酒', desiredWines: [], tastingCount: 0 },
    { id: uuidv4(), name: 'Domaine Romanée-Conti', chateau: 'Domaine de la Romanée-Conti', region: 'burgundy', regionLabel: '勃艮第', variety: 'Pinot Noir', year: 2015, rating: 5, capacity: '750ml', alcohol: '13.0%', logoColor: '#5B2C6F', forExchange: false, tastingCount: 1 },
    { id: uuidv4(), name: 'Montrachet', chateau: 'Domaine Leflaive', region: 'burgundy', regionLabel: '勃艮第', variety: 'Chardonnay', year: 2017, rating: 5, capacity: '750ml', alcohol: '13.5%', logoColor: '#6C3483', forExchange: false, tastingCount: 0 },
    { id: uuidv4(), name: 'Gevrey-Chambertin', chateau: 'Domaine Armand Rousseau', region: 'burgundy', regionLabel: '勃艮第', variety: 'Pinot Noir', year: 2019, rating: 4, capacity: '750ml', alcohol: '13.0%', logoColor: '#4A235A', forExchange: false, tastingCount: 0 },
    { id: uuidv4(), name: 'Puligny-Montrachet', chateau: 'Domaine Bouchard Père & Fils', region: 'burgundy', regionLabel: '勃艮第', variety: 'Chardonnay', year: 2018, rating: 4, capacity: '750ml', alcohol: '13.5%', logoColor: '#7D3C98', forExchange: true, exchangeCondition: '寻找优质纳帕霞多丽', desiredWines: [], tastingCount: 0 },
    { id: uuidv4(), name: 'Nuits-Saint-Georges', chateau: 'Domaine Henri Gouges', region: 'burgundy', regionLabel: '勃艮第', variety: 'Pinot Noir', year: 2020, rating: 3, capacity: '750ml', alcohol: '13.0%', logoColor: '#5B2C6F', forExchange: false, tastingCount: 0 },
    { id: uuidv4(), name: 'Meursault', chateau: 'Domaine Coche-Dury', region: 'burgundy', regionLabel: '勃艮第', variety: 'Chardonnay', year: 2019, rating: 4, capacity: '750ml', alcohol: '13.5%', logoColor: '#6C3483', forExchange: false, tastingCount: 0 },
  ];

  const tastings = [
    { id: uuidv4(), wineId: wines[0].id, date: '2026-03-15', appearance: '深宝石红色，边缘微带砖红', clarity: 4, aromas: ['果香', '橡木', '香料'], tannin: 8, acidity: 7, body: 8, notes: '入口丝滑，黑樱桃与雪松的完美交融，余韵悠长而优雅', foodPairing: '烤羊排配迷迭香', rating: 5 },
    { id: uuidv4(), wineId: wines[0].id, date: '2026-01-20', appearance: '浓郁的紫红色', clarity: 5, aromas: ['果香', '皮革'], tannin: 7, acidity: 6, body: 9, notes: '酒体饱满，单宁细腻柔和，黑醋栗风味突出', foodPairing: '菲力牛排', rating: 4 },
    { id: uuidv4(), wineId: wines[1].id, date: '2026-02-10', appearance: '深邃的红宝石色', clarity: 5, aromas: ['果香', '橡木', '矿物'], tannin: 9, acidity: 7, body: 9, notes: '经典波尔多风格，矿物感与果香层次分明，陈年潜力卓越', foodPairing: '黑松露牛排', rating: 5 },
    { id: uuidv4(), wineId: wines[2].id, date: '2025-12-25', appearance: '明亮的樱桃红', clarity: 4, aromas: ['果香', '花卉'], tannin: 6, acidity: 7, body: 7, notes: '花香迷人，红果风味清新，适合年轻时享用', foodPairing: '烤鸭胸', rating: 4 },
    { id: uuidv4(), wineId: wines[4].id, date: '2026-04-01', appearance: '深紫色', clarity: 4, aromas: ['果香', '香料', '橡木'], tannin: 7, acidity: 6, body: 8, notes: '香料与黑莓的迷人组合，结构感好，但尚需时间柔化', foodPairing: '炖牛肉', rating: 4 },
    { id: uuidv4(), wineId: wines[6].id, date: '2026-03-20', appearance: '深沉的紫红色', clarity: 5, aromas: ['果香', '橡木', '巧克力'], tannin: 8, acidity: 7, body: 9, notes: '美国与法国风格的完美融合，浓郁黑莓巧克力风味，令人难忘', foodPairing: '美式烟熏肋排', rating: 5 },
    { id: uuidv4(), wineId: wines[6].id, date: '2025-11-15', appearance: '深紫红色', clarity: 4, aromas: ['果香', '烟熏'], tannin: 9, acidity: 6, body: 9, notes: '新世界酒的力度与优雅并存，黑巧克力尾韵绵长', foodPairing: '战斧牛排', rating: 5 },
    { id: uuidv4(), wineId: wines[7].id, date: '2026-02-28', appearance: '不透明深紫色', clarity: 5, aromas: ['果香', '橡木', '矿物'], tannin: 9, acidity: 7, body: 10, notes: '极度浓郁的果酱风味，矿物感贯穿始终，堪称纳帕巅峰之作', foodPairing: '和牛牛排', rating: 5 },
    { id: uuidv4(), wineId: wines[10].id, date: '2026-05-01', appearance: '明亮红宝石色', clarity: 4, aromas: ['果香', '草本'], tannin: 6, acidity: 7, body: 7, notes: '典型的银橡风格，柔和易饮，红果与草本平衡', foodPairing: '烤三文鱼', rating: 4 },
    { id: uuidv4(), wineId: wines[12].id, date: '2026-04-10', appearance: '深石榴红色', clarity: 5, aromas: ['果香', '矿物', '香料'], tannin: 8, acidity: 7, body: 8, notes: '地中海与波尔多风格的独特融合，矿物质感独特，回味深邃', foodPairing: '意式炖小牛膝', rating: 5 },
    { id: uuidv4(), wineId: wines[18].id, date: '2026-03-05', appearance: '通透的淡红宝石色', clarity: 5, aromas: ['花卉', '果香', '矿物'], tannin: 5, acidity: 8, body: 6, notes: '无与伦比的优雅与纯净，玫瑰花瓣与红樱桃的绝妙组合', foodPairing: '松露意面', rating: 5 },
  ];

  return { wines, tastings };
}

await db.read();
if (!db.data || db.data.wines.length === 0) {
  db.data = createSeedData();
  await db.write();
}

app.get('/api/wines', (req, res) => {
  const { region } = req.query;
  let wines = db.data.wines;
  if (region && region !== 'all') {
    wines = wines.filter(w => w.region === region);
  }
  res.json(wines);
});

app.get('/api/wines/:id', (req, res) => {
  const wine = db.data.wines.find(w => w.id === req.params.id);
  if (!wine) return res.status(404).json({ error: 'Wine not found' });
  res.json(wine);
});

app.post('/api/wines', async (req, res) => {
  const wine = { id: uuidv4(), tastingCount: 0, forExchange: false, logoColor: '#722F37', ...req.body };
  db.data.wines.push(wine);
  await db.write();
  res.status(201).json(wine);
});

app.put('/api/wines/:id', async (req, res) => {
  const idx = db.data.wines.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Wine not found' });
  db.data.wines[idx] = { ...db.data.wines[idx], ...req.body, id: req.params.id };
  await db.write();
  res.json(db.data.wines[idx]);
});

app.delete('/api/wines/:id', async (req, res) => {
  const idx = db.data.wines.findIndex(w => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Wine not found' });
  db.data.wines.splice(idx, 1);
  db.data.tastings = db.data.tastings.filter(t => t.wineId !== req.params.id);
  await db.write();
  res.json({ success: true });
});

app.get('/api/tastings', (req, res) => {
  res.json(db.data.tastings);
});

app.get('/api/wines/:id/tastings', (req, res) => {
  const tastings = db.data.tastings.filter(t => t.wineId === req.params.id);
  tastings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(tastings);
});

app.post('/api/tastings', async (req, res) => {
  const tasting = { id: uuidv4(), ...req.body };
  db.data.tastings.push(tasting);

  const wineIdx = db.data.wines.findIndex(w => w.id === req.body.wineId);
  if (wineIdx !== -1) {
    const wineTastings = db.data.tastings.filter(t => t.wineId === req.body.wineId);
    const avgRating = wineTastings.reduce((sum, t) => sum + t.rating, 0) / wineTastings.length;
    db.data.wines[wineIdx].rating = Math.round(avgRating * 10) / 10;
    db.data.wines[wineIdx].tastingCount = wineTastings.length;
  }

  await db.write();
  res.status(201).json(tasting);
});

app.listen(PORT, () => {
  console.log(`🍷 Wine Cellar API running on http://localhost:${PORT}`);
});
