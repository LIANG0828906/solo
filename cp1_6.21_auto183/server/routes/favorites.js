const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

let favorites = [];

router.get('/', (req, res) => {
  res.json(favorites);
});

router.post('/', (req, res) => {
  const { componentId } = req.body;
  if (!componentId) {
    return res.status(400).json({ error: 'componentId is required' });
  }
  const existing = favorites.find(f => f.componentId === componentId);
  if (existing) {
    return res.status(409).json({ error: 'Already favorited' });
  }
  const favorite = {
    id: uuidv4(),
    componentId,
    addedAt: new Date().toISOString()
  };
  favorites.push(favorite);
  res.status(201).json(favorite);
});

router.delete('/:id', (req, res) => {
  const index = favorites.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Favorite not found' });
  }
  favorites.splice(index, 1);
  res.status(204).send();
});

router.delete('/by-component/:componentId', (req, res) => {
  const index = favorites.findIndex(f => f.componentId === req.params.componentId);
  if (index === -1) {
    return res.status(404).json({ error: 'Favorite not found' });
  }
  favorites.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
