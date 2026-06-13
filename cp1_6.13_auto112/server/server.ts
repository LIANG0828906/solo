import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, Spell, ElementType } from '../src/types';
interface GameSession {
  id: string;
  state: GameState;
  createdAt: number;
  lastAccessedAt: number;
}
const games: Map<string, GameSession> = new Map();
const ELEMENT_CONFIG: Record<ElementType, {
  name: string;
  emoji: string;
  color: string;
  baseDamageRange: [number, number];
}> = {
  fire: { name: '烈焰术', emoji: '🔥', color: '#E25822', baseDamageRange: [10, 18] },
  ice: { name: '寒霜术', emoji: '❄️', color: '#00BFFF', baseDamageRange: [6, 10] },
  thunder: { name: '雷霆术', emoji: '⚡', color: '#FFD700', baseDamageRange: [8, 14] },
  wind: { name: '疾风术', emoji: '🌪️', color: '#32CD32', baseDamageRange: [4, 6] },
};
function generateDamageRanges(): Record<ElementType, { min: number; max: number }> {
  const ranges = {} as Record<ElementType, { min: number; max: number }>;
  (Object.keys(ELEMENT_CONFIG) as ElementType[]).forEach((element) => {
    const [baseMin, baseMax] = ELEMENT_CONFIG[element].baseDamageRange;
    const mid = Math.floor((baseMin + baseMax) / 2);
    const spread = Math.floor((baseMax - baseMin) / 2);
    const actualMid = mid + Math.floor(Math.random() * (spread + 1)) - Math.floor(spread / 2);
    const actualMin = Math.max(baseMin, actualMid - 2);
    const actualMax = Math.min(baseMax, actualMid + 2);
    ranges[element] = { min: actualMin, max: actualMax };
  });
  return ranges;
}
function getRandomDamage(element: ElementType, ranges: Record<ElementType, { min: number; max: number }>): number {
  const { min, max } = ranges[element];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function createDeck(ranges: Record<ElementType, { min: number; max: number }>): Spell[] {
  const deck: Spell[] = [];
  const elements: ElementType[] = ['fire', 'ice', 'thunder', 'wind'];
  elements.forEach((element) => {
    for (let i = 0; i < 5; i++) {
      const config = ELEMENT_CONFIG[element];
      deck.push({
        id: uuidv4(),
        element,
        damage: getRandomDamage(element, ranges),
        name: config.name,
        emoji: config.emoji,
        color: config.color,
        description: '',
      });
    }
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function drawCards(deck: Spell[], count: number): { drawn: Spell[]; remaining: Spell[] } {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}
function createInitialState(): { state: GameState; deck: Spell[] } {
  const ranges = generateDamageRanges();
  let deck = createDeck(ranges);
  const { drawn: p1Hand, remaining: afterP1 } = drawCards(deck, 4);
  deck = afterP1;
  const { drawn: p2Hand, remaining: afterP2 } = drawCards(deck, 4);
  deck = afterP2;
  const player1: Player = { id: 0, name: '玩家一', hp: 100, maxHp: 100, status: 'none', hand: p1Hand };
  const player2: Player = { id: 1, name: '玩家二', hp: 100, maxHp: 100, status: 'none', hand: p2Hand };
  const state: GameState = {
    gameId: uuidv4(),
    round: 1,
    players: [player1, player2],
    currentPlayer: 0,
    deckRemaining: deck.length,
    selectedSpell: null,
    gameOver: false,
    winner: null,
    phase: 'selecting',
    actionLog: ['游戏开始！玩家一先手。'],
    spellDamageRanges: ranges,
  };
  return { state, deck };
}
const app = express();
app.use(cors());
app.use(express.json());
const activeDecks = new Map<string, Spell[]>();
app.post('/api/game/init', (_req, res) => {
  try {
    const { state, deck } = createInitialState();
    const session: GameSession = {
      id: state.gameId,
      state,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };
    games.set(state.gameId, session);
    activeDecks.set(state.gameId, deck);
    console.log(`[ArcaneForge] 游戏创建: ${state.gameId}`);
    res.json({ success: true, gameId: state.gameId, state });
  } catch (e) {
    console.error('[ArcaneForge] 初始化错误:', e);
    res.status(500).json({ success: false, error: '初始化失败' });
  }
});
app.get('/api/game/:gameId', (req, res) => {
  const session = games.get(req.params.gameId);
  if (!session) {
    return res.status(404).json({ success: false, error: '游戏不存在' });
  }
  session.lastAccessedAt = Date.now();
  res.json({ success: true, state: session.state });
});
app.post('/api/game/:gameId/play', (req, res) => {
  const { playerId, spellId } = req.body;
  const session = games.get(req.params.gameId);
  if (!session) return res.status(404).json({ success: false, error: '游戏不存在' });
  const s = session.state;
  const deck = activeDecks.get(req.params.gameId) || [];
  if (s.gameOver || s.phase !== 'selecting' || s.currentPlayer !== playerId) {
    return res.json({ success: false, error: '非法操作', state: s });
  }
  const player = s.players[playerId];
  if (player.status === 'frozen') {
    return res.json({ success: false, error: '已被冻结', state: s });
  }
  const spellIndex = player.hand.findIndex((sp) => sp.id === spellId);
  if (spellIndex === -1) {
    return res.json({ success: false, error: '法术不存在', state: s });
  }
  const spell = player.hand[spellIndex];
  const targetId = playerId === 0 ? 1 : 0;
  const target = s.players[targetId];
  let damage = spell.damage;
  let combo = false;
  let freeze = false;
  let blowback = false;
  switch (spell.element) {
    case 'thunder':
      if (Math.random() < 0.3) {
        combo = true;
        damage += Math.floor(spell.damage * 0.7);
      }
      break;
    case 'ice':
      freeze = true;
      break;
    case 'wind':
      blowback = target.hand.length > 0;
      break;
  }
  s.selectedSpell = spell;
  s.phase = 'animating';
  setTimeout(() => {
    const session2 = games.get(req.params.gameId);
    if (!session2) return;
    const s2 = session2.state;
    const p = s2.players[playerId];
    const t = s2.players[targetId];
    const spIdx = p.hand.findIndex((sp) => sp.id === spellId);
    if (spIdx !== -1) p.hand.splice(spIdx, 1);
    let log = `${p.name} 使用了 ${spell.name}${spell.emoji}`;
    t.hp = Math.max(0, t.hp - damage);
    if (damage > 0) log += `，对 ${t.name} 造成 ${damage} 点伤害`;
    if (combo) { log += '（连击！）'; t.status = 'combo'; }
    if (freeze && t.status !== 'frozen') { t.status = 'frozen'; log += `，${t.name} 被冰冻`; }
    const deck2 = activeDecks.get(req.params.gameId) || [];
    if (blowback && t.hand.length > 0) {
      const bi = Math.floor(Math.random() * t.hand.length);
      const blown = t.hand.splice(bi, 1)[0];
      deck2.push(blown);
      for (let i = deck2.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck2[i], deck2[j]] = [deck2[j], deck2[i]];
      }
      activeDecks.set(req.params.gameId, deck2);
      log += `，${t.name} 的 ${blown.name} 被吹回牌组`;
    }
    s2.actionLog.push(log);
    s2.selectedSpell = null;
    s2.phase = 'resolving';
    const curr = s2.currentPlayer;
    const cp = s2.players[curr];
    if (cp.status === 'combo') cp.status = 'none';
    while (cp.hand.length < 4 && deck2.length > 0) {
      const c = deck2.shift();
      if (c) cp.hand.push(c);
    }
    activeDecks.set(req.params.gameId, deck2);
    if (curr === 1) {
      s2.round++;
      const p1 = s2.players[0];
      const p2 = s2.players[1];
      if (p1.status === 'frozen' && p2.status === 'frozen') {
        p1.hp = Math.max(0, p1.hp - 5);
        p2.hp = Math.max(0, p2.hp - 5);
        s2.actionLog.push('双方同时冻结！各承受5点剧痛伤害！');
        p1.status = 'none';
        p2.status = 'none';
      }
    }
    const p1f = s2.players[0];
    const p2f = s2.players[1];
    if (p1f.hp <= 0 && p2f.hp <= 0) {
      s2.gameOver = true;
      s2.winner = p1f.hp > p2f.hp ? 0 : p2f.hp > p1f.hp ? 1 : null;
      s2.actionLog.push(s2.winner === null ? '平局！' : `${s2.players[s2.winner].name} 获胜！`);
    } else if (p1f.hp <= 0) {
      s2.gameOver = true; s2.winner = 1;
      s2.actionLog.push(`${p2f.name} 获胜！`);
    } else if (p2f.hp <= 0) {
      s2.gameOver = true; s2.winner = 0;
      s2.actionLog.push(`${p1f.name} 获胜！`);
    } else if (deck2.length === 0 && p1f.hand.length === 0 && p2f.hand.length === 0) {
      s2.gameOver = true;
      s2.winner = p1f.hp > p2f.hp ? 0 : p2f.hp > p1f.hp ? 1 : null;
      s2.actionLog.push('牌组耗尽！' + (s2.winner === null ? '平局！' : `${s2.players[s2.winner].name} 以更高生命获胜！`));
    }
    if (!s2.gameOver) {
      s2.currentPlayer = curr === 0 ? 1 : 0;
      s2.phase = 'selecting';
      const np = s2.players[s2.currentPlayer];
      if (np.status === 'frozen' && !s2.gameOver) {
        s2.actionLog.push(`${np.name} 因冻结跳过行动`);
        np.status = 'none';
        const nc = s2.currentPlayer;
        const ncp = s2.players[nc];
        while (ncp.hand.length < 4 && deck2.length > 0) {
          const c = deck2.shift();
          if (c) ncp.hand.push(c);
        }
        activeDecks.set(req.params.gameId, deck2);
        if (nc === 1) s2.round++;
        s2.currentPlayer = nc === 0 ? 1 : 0;
      }
    }
    s2.deckRemaining = deck2.length;
    session2.lastAccessedAt = Date.now();
  }, 0);
  res.json({ success: true, state: s });
});
app.post('/api/game/:gameId/reset', (req, res) => {
  const old = games.get(req.params.gameId);
  if (old) {
    games.delete(req.params.gameId);
    activeDecks.delete(req.params.gameId);
  }
  const { state, deck } = createInitialState();
  const session: GameSession = {
    id: state.gameId,
    state,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  };
  games.set(state.gameId, session);
  activeDecks.set(state.gameId, deck);
  res.json({ success: true, state, gameId: state.gameId });
});
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of games) {
    if (now - session.lastAccessedAt > 3600000) {
      games.delete(id);
      activeDecks.delete(id);
      console.log(`[ArcaneForge] 清理过期游戏: ${id}`);
    }
  }
}, 600000);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[ArcaneForge] 服务器启动于 http://localhost:${PORT}`);
});
