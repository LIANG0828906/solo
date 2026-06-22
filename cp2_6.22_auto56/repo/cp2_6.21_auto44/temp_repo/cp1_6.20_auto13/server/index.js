import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 4000;

const DATA_FILE = path.join(__dirname, '..', 'data', 'recipes.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

app.use(bodyParser.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

function readRecipes() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeRecipes(recipes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(recipes, null, 2), 'utf-8');
}

app.get('/api/recipes', (req, res) => {
  const recipes = readRecipes();
  res.json(recipes);
});

app.get('/api/recipes/:id', (req, res) => {
  const recipes = readRecipes();
  const recipe = recipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: '食谱未找到' });
  }
  res.json(recipe);
});

app.post('/api/recipes', (req, res) => {
  const recipes = readRecipes();
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
  const newRecipe = {
    ...req.body,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  recipes.push(newRecipe);
  writeRecipes(recipes);
  res.status(201).json(newRecipe);
});

app.put('/api/recipes/:id', (req, res) => {
  const recipes = readRecipes();
  const index = recipes.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '食谱未找到' });
  }
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
  const updatedRecipe = {
    ...recipes[index],
    ...req.body,
    id: req.params.id,
    createdAt: recipes[index].createdAt,
    updatedAt: now,
  };
  recipes[index] = updatedRecipe;
  writeRecipes(recipes);
  res.json(updatedRecipe);
});

app.delete('/api/recipes/:id', (req, res) => {
  const recipes = readRecipes();
  const index = recipes.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '食谱未找到' });
  }
  recipes.splice(index, 1);
  writeRecipes(recipes);
  res.status(204).end();
});

app.post('/api/upload', (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: '未提供图片' });
  }
  const matches = image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: '无效的图片格式' });
  }
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1] === 'png' ? 'png' : 'jpg';
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${uuidv4()}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  res.json({ url: `/uploads/${filename}` });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
