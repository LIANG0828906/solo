const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const DATA_FILE = path.join(__dirname, '..', 'data', 'entries.json');

function readEntries() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeEntries(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}

router.get('/', (req, res) => {
  try {
    const entries = readEntries();
    const sorted = entries.sort((a, b) => b.timestamp - a.timestamp);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const entries = readEntries();
    const entry = entries.find(e => e.id === req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

router.post('/', (req, res) => {
  try {
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    const entries = readEntries();
    const newEntry = {
      id: uuidv4(),
      userId,
      content,
      summary: stripHtml(content).substring(0, 30) + (stripHtml(content).length > 30 ? '...' : ''),
      timestamp: Date.now()
    };

    entries.push(newEntry);
    writeEntries(entries);

    res.status(201).json(newEntry);
  } catch (err) {
    console.error('Error creating entry:', err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { userId, content } = req.body;
    const entries = readEntries();
    const index = entries.findIndex(e => e.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    entries[index] = {
      ...entries[index],
      userId: userId || entries[index].userId,
      content: content || entries[index].content,
      summary: content ? (stripHtml(content).substring(0, 30) + (stripHtml(content).length > 30 ? '...' : '')) : entries[index].summary,
      timestamp: Date.now()
    };

    writeEntries(entries);
    res.json(entries[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const entries = readEntries();
    const filtered = entries.filter(e => e.id !== req.params.id);

    if (filtered.length === entries.length) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    writeEntries(filtered);
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;
