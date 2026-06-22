import { Router } from 'express';
import {
  getAllPalettes,
  getPaletteById,
  createPalette,
  updatePalette,
  deletePalette
} from '../data/paletteData.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const palettes = getAllPalettes();
    res.json(palettes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch palettes' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const palette = getPaletteById(req.params.id);
    if (!palette) {
      return res.status(404).json({ error: 'Palette not found' });
    }
    res.json(palette);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch palette' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, colors, baseColor, harmonyRule, tags } = req.body;
    
    if (!colors || !Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ error: 'Colors array is required' });
    }
    if (!baseColor) {
      return res.status(400).json({ error: 'Base color is required' });
    }
    if (!harmonyRule) {
      return res.status(400).json({ error: 'Harmony rule is required' });
    }

    const newPalette = createPalette({
      name: name || 'Untitled Palette',
      colors,
      baseColor,
      harmonyRule,
      tags: tags || []
    });
    
    res.status(201).json(newPalette);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create palette' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const updatedPalette = updatePalette(req.params.id, req.body);
    if (!updatedPalette) {
      return res.status(404).json({ error: 'Palette not found' });
    }
    res.json(updatedPalette);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update palette' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const success = deletePalette(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Palette not found' });
    }
    res.json({ message: 'Palette deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete palette' });
  }
});

export default router;
