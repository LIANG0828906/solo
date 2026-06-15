const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data', 'decks.json');

function readDecks() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeDecks(decks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(decks, null, 2));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/api/decks', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  res.json(decks);
});

app.get('/api/decks/:id', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  const deck = decks.find(d => d.id === req.params.id);
  if (deck) {
    res.json(deck);
  } else {
    res.status(404).json({ error: 'Deck not found' });
  }
});

app.post('/api/decks', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  const newDeck = {
    id: uuidv4(),
    name: req.body.name,
    cards: [],
    lastReviewed: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0]
  };
  decks.push(newDeck);
  writeDecks(decks);
  res.json(newDeck);
});

app.put('/api/decks/:id', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  const index = decks.findIndex(d => d.id === req.params.id);
  if (index !== -1) {
    decks[index] = { ...decks[index], ...req.body };
    writeDecks(decks);
    res.json(decks[index]);
  } else {
    res.status(404).json({ error: 'Deck not found' });
  }
});

app.delete('/api/decks/:id', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  const filtered = decks.filter(d => d.id !== req.params.id);
  writeDecks(filtered);
  res.json({ success: true });
});

app.post('/api/decks/:id/cards', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  const deckIndex = decks.findIndex(d => d.id === req.params.id);
  if (deckIndex !== -1) {
    const newCard = {
      id: uuidv4(),
      question: req.body.question,
      answer: req.body.answer,
      nextReview: new Date().toISOString().split('T')[0],
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0
    };
    decks[deckIndex].cards.push(newCard);
    writeDecks(decks);
    res.json(newCard);
  } else {
    res.status(404).json({ error: 'Deck not found' });
  }
});

app.put('/api/decks/:deckId/cards/:cardId', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  const deckIndex = decks.findIndex(d => d.id === req.params.deckId);
  if (deckIndex !== -1) {
    const cardIndex = decks[deckIndex].cards.findIndex(c => c.id === req.params.cardId);
    if (cardIndex !== -1) {
      decks[deckIndex].cards[cardIndex] = { ...decks[deckIndex].cards[cardIndex], ...req.body };
      writeDecks(decks);
      res.json(decks[deckIndex].cards[cardIndex]);
    } else {
      res.status(404).json({ error: 'Card not found' });
    }
  } else {
    res.status(404).json({ error: 'Deck not found' });
  }
});

app.delete('/api/decks/:deckId/cards/:cardId', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  const deckIndex = decks.findIndex(d => d.id === req.params.deckId);
  if (deckIndex !== -1) {
    decks[deckIndex].cards = decks[deckIndex].cards.filter(c => c.id !== req.params.cardId);
    writeDecks(decks);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Deck not found' });
  }
});

app.get('/api/stats', async (req, res) => {
  await delay(200);
  const decks = readDecks();
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  let totalCards = 0;
  let dueToday = 0;
  let easyCount = 0;
  let reviewCount = 0;

  decks.forEach(deck => {
    totalCards += deck.cards.length;
    deck.cards.forEach(card => {
      if (card.nextReview <= today) {
        dueToday++;
      }
      if (card.repetitions > 0) {
        reviewCount++;
        if (card.easeFactor > 2.6) {
          easyCount++;
        }
      }
    });
  });

  const masteryRate = reviewCount > 0 ? Math.round((easyCount / reviewCount) * 100) : 0;

  res.json({
    totalDecks: decks.length,
    totalCards,
    dueToday,
    masteryRate
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});