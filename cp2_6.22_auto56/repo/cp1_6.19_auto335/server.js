import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.post('/api/ai-decision', (req, res) => {
  const { aiHP, aiMP, aiShield, aiStatusEffects, playerHP, hand } = req.body;

  const availableIndices = hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.mpCost <= aiMP);

  if (availableIndices.length === 0) {
    return res.json({ cardIndex: -1 });
  }

  const isLowHP = aiHP < 30;

  let chosen;
  if (isLowHP) {
    const healCards = availableIndices.filter(
      ({ card }) => card.type === 'heal' || card.type === 'defense'
    );
    chosen = healCards.length > 0
      ? healCards[Math.floor(Math.random() * healCards.length)]
      : availableIndices[Math.floor(Math.random() * availableIndices.length)];
  } else {
    const attackCards = availableIndices.filter(
      ({ card }) => card.type === 'attack' || card.type === 'debuff'
    );
    chosen = attackCards.length > 0
      ? attackCards[Math.floor(Math.random() * attackCards.length)]
      : availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }

  res.json({ cardIndex: chosen.index });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI Decision Server running on port ${PORT}`);
});
