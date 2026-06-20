import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Recipe, Experiment } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const dbPath = path.join(__dirname, 'db.json');
const adapter = new JSONFile<{ recipes: Recipe[]; experiments: Experiment[] }>(dbPath);
const db = new Low(adapter);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

async function initDB() {
  await db.read();
  if (!db.data) {
    db.data = { recipes: [], experiments: [] };
    await db.write();
  }
}

app.get('/api/recipes', async (req, res) => {
  try {
    await db.read();
    const recipes = db.data?.recipes || [];
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    await db.read();
    const recipe = db.data?.recipes.find(r => r.id === req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

app.post('/api/recipes', async (req, res) => {
  try {
    await db.read();
    const now = new Date().toISOString();
    const newRecipe: Recipe = {
      id: uuidv4(),
      ...req.body,
      latestRating: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.data?.recipes.push(newRecipe);
    await db.write();
    res.status(201).json(newRecipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

app.put('/api/recipes/:id', async (req, res) => {
  try {
    await db.read();
    const index = db.data?.recipes.findIndex(r => r.id === req.params.id);
    if (index === undefined || index === -1) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    if (db.data) {
      db.data.recipes[index] = {
        ...db.data.recipes[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      await db.write();
      res.json(db.data.recipes[index]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  try {
    await db.read();
    if (db.data) {
      db.data.recipes = db.data.recipes.filter(r => r.id !== req.params.id);
      db.data.experiments = db.data.experiments.filter(e => e.recipeId !== req.params.id);
      await db.write();
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

app.get('/api/recipes/:recipeId/experiments', async (req, res) => {
  try {
    await db.read();
    const experiments = db.data?.experiments
      .filter(e => e.recipeId === req.params.recipeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
    res.json(experiments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

app.post('/api/recipes/:recipeId/experiments', async (req, res) => {
  try {
    await db.read();
    const now = new Date().toISOString();
    const newExperiment: Experiment = {
      id: uuidv4(),
      recipeId: req.params.recipeId,
      ...req.body,
      createdAt: now,
    };
    db.data?.experiments.push(newExperiment);

    if (db.data) {
      const recipeIndex = db.data.recipes.findIndex(r => r.id === req.params.recipeId);
      if (recipeIndex !== -1) {
        const recipeExperiments = db.data.experiments.filter(e => e.recipeId === req.params.recipeId);
        const avgRating = recipeExperiments.length > 0
          ? recipeExperiments.reduce((sum, e) => sum + e.rating, 0) / recipeExperiments.length
          : 0;
        db.data.recipes[recipeIndex].latestRating = Math.round(avgRating * 10) / 10;
        db.data.recipes[recipeIndex].updatedAt = now;
      }
    }

    await db.write();
    res.status(201).json(newExperiment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

app.put('/api/experiments/:id', async (req, res) => {
  try {
    await db.read();
    const index = db.data?.experiments.findIndex(e => e.id === req.params.id);
    if (index === undefined || index === -1) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    if (db.data) {
      db.data.experiments[index] = {
        ...db.data.experiments[index],
        ...req.body,
      };

      const experiment = db.data.experiments[index];
      const recipeExperiments = db.data.experiments.filter(e => e.recipeId === experiment.recipeId);
      const avgRating = recipeExperiments.length > 0
        ? recipeExperiments.reduce((sum, e) => sum + e.rating, 0) / recipeExperiments.length
        : 0;
      
      const recipeIndex = db.data.recipes.findIndex(r => r.id === experiment.recipeId);
      if (recipeIndex !== -1) {
        db.data.recipes[recipeIndex].latestRating = Math.round(avgRating * 10) / 10;
        db.data.recipes[recipeIndex].updatedAt = new Date().toISOString();
      }

      await db.write();
      res.json(db.data.experiments[index]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update experiment' });
  }
});

app.delete('/api/experiments/:id', async (req, res) => {
  try {
    await db.read();
    if (db.data) {
      const experiment = db.data.experiments.find(e => e.id === req.params.id);
      db.data.experiments = db.data.experiments.filter(e => e.id !== req.params.id);

      if (experiment) {
        const recipeExperiments = db.data.experiments.filter(e => e.recipeId === experiment.recipeId);
        const avgRating = recipeExperiments.length > 0
          ? recipeExperiments.reduce((sum, e) => sum + e.rating, 0) / recipeExperiments.length
          : 0;
        
        const recipeIndex = db.data.recipes.findIndex(r => r.id === experiment.recipeId);
        if (recipeIndex !== -1) {
          db.data.recipes[recipeIndex].latestRating = Math.round(avgRating * 10) / 10;
          db.data.recipes[recipeIndex].updatedAt = new Date().toISOString();
        }
      }

      await db.write();
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete experiment' });
  }
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const filename = `${uuidv4()}.webp`;
    const outputPath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const url = `/uploads/${filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
