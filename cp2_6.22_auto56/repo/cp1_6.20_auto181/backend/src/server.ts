import express from 'express';
import cors from 'cors';
import {
  Card,
  CardEffect,
  Rarity,
  calculateCardPower,
  calculateCardCost,
  validateCardEffects,
  simulateBattle,
  PRESET_EFFECTS,
  BattleResult,
} from './gameEngine';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

let savedCards: Card[] = [];

interface CalculateRequest {
  effects: CardEffect[];
  rarity: Rarity;
}

interface CalculateResponse {
  power: number;
  cost: number;
  valid: boolean;
  error?: string;
}

interface SimulateRequest {
  playerDeck: Card[];
}

app.post('/api/cards/calculate', (req, res) => {
  try {
    const { effects, rarity } = req.body as CalculateRequest;

    const validation = validateCardEffects(effects);
    if (!validation.valid) {
      const response: CalculateResponse = {
        power: 0,
        cost: 0,
        valid: false,
        error: validation.error,
      };
      return res.json(response);
    }

    const power = calculateCardPower(effects, rarity);
    const cost = calculateCardCost(effects);

    const response: CalculateResponse = {
      power,
      cost,
      valid: true,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: '计算失败' });
  }
});

app.post('/api/cards', (req, res) => {
  try {
    const card = req.body as Card;
    const existingIndex = savedCards.findIndex(c => c.id === card.id);
    if (existingIndex >= 0) {
      savedCards[existingIndex] = { ...card, isDraft: false };
    } else {
      savedCards.push({ ...card, isDraft: false });
    }
    res.json({ success: true, card: { ...card, isDraft: false } });
  } catch (error) {
    res.status(500).json({ error: '保存卡牌失败' });
  }
});

app.get('/api/cards', (_req, res) => {
  res.json(savedCards);
});

app.delete('/api/cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    savedCards = savedCards.filter(c => c.id !== id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除卡牌失败' });
  }
});

app.get('/api/effects', (_req, res) => {
  res.json(PRESET_EFFECTS);
});

app.post('/api/decks/simulate', (req, res) => {
  try {
    const { playerDeck } = req.body as SimulateRequest;

    if (!playerDeck || playerDeck.length < 3) {
      return res.status(400).json({ error: '牌组至少需要3张卡牌' });
    }

    if (playerDeck.length > 5) {
      return res.status(400).json({ error: '牌组最多只能有5张卡牌' });
    }

    const result: BattleResult = simulateBattle(playerDeck);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '模拟对战失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
