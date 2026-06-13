import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, Spell, ElementType, SpellEffect } from '../src/types';

interface GameSession {
  id: string;
  state: GameState;
  createdAt: number;
  lastAccessedAt: number;
  pendingEffect: SpellEffect | null;
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

function calculateSpellEffect(spell: Spell, targetPlayer: Player): SpellEffect {
  const effect: SpellEffect = {
    damage: spell.damage,
    freeze: false,
    combo: false,
    blowback: false,
    element: spell.element,
  };
  switch (spell.element) {
    case 'fire':
      break;
    case 'ice':
      effect.freeze = true;
      break;
    case 'thunder':
      if (Math.random() < 0.3) {
        effect.combo = true;
        effect.damage += Math.floor(spell.damage * 0.7);
      }
      break;
    case 'wind':
      effect.blowback = targetPlayer.hand.length > 0;
      break;
  }
  return effect;
}

function checkDoubleFreeze(s: GameState): void {
  const p1 = s.players[0];
  const p2 = s.players[1];
  if (p1.status === 'frozen' && p2.status === 'frozen') {
    p1.hp = Math.max(0, p1.hp - 5);
    p2.hp = Math.max(0, p2.hp - 5);
    s.actionLog.push('⚡ 双方同时冻结！各承受5点剧痛伤害！');
    p1.status = 'none';
    p2.status = 'none';
  }
}

function checkGameOver(s: GameState, deck: Spell[]): void {
  const p1 = s.players[0];
  const p2 = s.players[1];
  if (p1.hp <= 0 && p2.hp <= 0) {
    s.gameOver = true;
    s.winner = p1.hp > p2.hp ? 0 : p2.hp > p1.hp ? 1 : null;
    s.actionLog.push(s.winner === null ? '🤝 平局！' : `🏆 ${s.players[s.winner].name} 获胜！`);
  } else if (p1.hp <= 0) {
    s.gameOver = true;
    s.winner = 1;
    s.actionLog.push(`🏆 ${p2.name} 获胜！`);
  } else if (p2.hp <= 0) {
    s.gameOver = true;
    s.winner = 0;
    s.actionLog.push(`🏆 ${p1.name} 获胜！`);
  } else if (deck.length === 0 || (p1.hand.length === 0 && p2.hand.length === 0)) {
    s.gameOver = true;
    if (p1.hp === p2.hp) {
      s.winner = null;
      s.actionLog.push('🃏 牌组耗尽！双方生命值相同，平局！');
    } else {
      s.winner = p1.hp > p2.hp ? 0 : 1;
      s.actionLog.push(`🃏 牌组耗尽！${s.players[s.winner].name} 以更高生命值（${s.players[s.winner].hp}）获胜！`);
    }
  }
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
      pendingEffect: null,
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

app.post('/api/game/:gameId/sync', (req, res) => {
  const session = games.get(req.params.gameId);
  if (!session) {
    return res.status(404).json({ success: false, error: '游戏不存在' });
  }
  session.lastAccessedAt = Date.now();
  res.json({
    success: true,
    state: session.state,
    timestamp: Date.now(),
  });
});

app.post('/api/game/:gameId/play', (req, res) => {
  const { playerId, spellId } = req.body;
  const session = games.get(req.params.gameId);
  if (!session) return res.status(404).json({ success: false, error: '游戏不存在' });
  const s = session.state;
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
  const effect = calculateSpellEffect(spell, target);
  session.pendingEffect = effect;
  s.selectedSpell = { ...spell, damage: effect.damage };
  s.phase = 'animating';
  session.lastAccessedAt = Date.now();
  setTimeout(() => {
    const session2 = games.get(req.params.gameId);
    if (!session2) return;
    const s2 = session2.state;
    const deck2 = activeDecks.get(req.params.gameId) || [];
    const p = s2.players[playerId];
    const t = s2.players[targetId];
    const spIdx = p.hand.findIndex((sp) => sp.id === spellId);
    const savedEffect = session2.pendingEffect || effect;
    session2.pendingEffect = null;
    if (spIdx !== -1) p.hand.splice(spIdx, 1);
    let log = `${p.name} 使用了 ${spell.name}${spell.emoji}`;
    t.hp = Math.max(0, t.hp - savedEffect.damage);
    if (savedEffect.damage > 0) log += `，对 ${t.name} 造成 ${savedEffect.damage} 点伤害`;
    if (savedEffect.combo) { log += '（连击！）'; t.status = 'combo'; }
    if (savedEffect.freeze && t.status !== 'frozen') { t.status = 'frozen'; log += `，${t.name} 被冰冻`; }
    if (savedEffect.blowback && t.hand.length > 0) {
      const bi = Math.floor(Math.random() * t.hand.length);
      const blown = t.hand.splice(bi, 1)[0];
      deck2.push(blown);
      for (let i = deck2.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck2[i], deck2[j]] = [deck2[j], deck2[i]];
      }
      log += `，${t.name} 的 ${blown.name} 被吹回牌组`;
    }
    s2.actionLog.push(log);
    checkDoubleFreeze(s2);
    s2.selectedSpell = null;
    s2.phase = 'resolving';
    const curr = s2.currentPlayer;
    const cp = s2.players[curr];
    if (cp.status === 'combo') cp.status = 'none';
    while (cp.hand.length < 4 && deck2.length > 0) {
      const c = deck2.shift();
      if (c) cp.hand.push(c);
    }
    if (curr === 1) s2.round++;
    checkGameOver(s2, deck2);
    if (!s2.gameOver) {
      s2.currentPlayer = curr === 0 ? 1 : 0;
      s2.phase = 'selecting';
      const np = s2.players[s2.currentPlayer];
      if (np.status === 'frozen') {
        s2.actionLog.push(`❄️ ${np.name} 被冰冻，自动跳过回合`);
        np.status = 'none';
        setTimeout(() => {
          const s3 = games.get(req.params.gameId)?.state;
          const d3 = activeDecks.get(req.params.gameId) || [];
          if (!s3 || s3.gameOver) return;
          const nc = s3.currentPlayer;
          const ncp = s3.players[nc];
          while (ncp.hand.length < 4 && d3.length > 0) {
            const c = d3.shift();
            if (c) ncp.hand.push(c);
          }
          if (nc === 1) s3.round++;
          checkGameOver(s3, d3);
          if (!s3.gameOver) {
            s3.currentPlayer = nc === 0 ? 1 : 0;
            const nextp = s3.players[s3.currentPlayer];
            if (nextp.status === 'frozen') {
              s3.actionLog.push(`❄️ ${nextp.name} 被冰冻，自动跳过回合`);
              nextp.status = 'none';
            }
          }
          s3.deckRemaining = d3.length;
          activeDecks.set(req.params.gameId, d3);
        }, 1200);
      }
    }
    s2.deckRemaining = deck2.length;
    session2.lastAccessedAt = Date.now();
    activeDecks.set(req.params.gameId, deck2);
  }, 0);
  res.json({ success: true, state: s, effect });
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
    pendingEffect: null,
  };
  games.set(state.gameId, session);
  activeDecks.set(state.gameId, deck);
  console.log(`[ArcaneForge] 游戏重置: ${state.gameId}`);
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
  console.log(`[ArcaneForge] 可用接口:`);
  console.log(`  POST /api/game/init        - 初始化新游戏`);
  console.log(`  GET  /api/game/:id         - 获取游戏状态`);
  console.log(`  POST /api/game/:id/sync    - 同步游戏状态`);
  console.log(`  POST /api/game/:id/play    - 打出法术`);
  console.log(`  POST /api/game/:id/reset   - 重置游戏`);
});
