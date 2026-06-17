import { create } from 'zustand';
import {
  GameEngine,
  RuneType,
  SpellType,
  PlayerID,
  HexCell,
  SpellResult,
  HEX_RADIUS,
  HEX_SPACING,
  GRID_COLS,
  GRID_ROWS,
  hexToPixel,
  pixelToHex,
  getPlayerTerritory,
} from '../engine/gameEngine';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape: 'circle' | 'droplet' | 'leaf';
  rotation: number;
  rotationSpeed: number;
}

export interface SpellAnimation {
  spell: SpellResult;
  particles: Particle[];
  startTime: number;
  duration: number;
}

export interface HitAnimation {
  q: number;
  r: number;
  startTime: number;
  duration: number;
}

export interface HpAnimation {
  player: PlayerID;
  fromHp: number;
  toHp: number;
  startTime: number;
  duration: number;
}

interface GameStore {
  engine: GameEngine;
  grid: HexCell[][];
  players: Record<PlayerID, {
    id: PlayerID;
    hp: number;
    maxHp: number;
    hand: RuneType[];
    skipNextTurn: boolean;
    cannotPlace: boolean;
  }>;
  currentTurn: PlayerID;
  turnCount: number;
  gameOver: boolean;
  winner: PlayerID | null;
  lastSpellLocations: { q: number; r: number }[];

  selectedCell: { q: number; r: number } | null;
  selectedHandIndex: number | null;
  hoveredHex: { q: number; r: number } | null;
  validMoves: { fromQ: number; fromR: number; toQ: number; toR: number }[];
  validPlacements: { q: number; r: number }[];
  isAnimating: boolean;
  isPlayerTurn: boolean;

  spellAnimations: SpellAnimation[];
  hitAnimations: HitAnimation[];
  hpAnimations: HpAnimation[];
  frostOverlay: PlayerID | null;

  initGame: () => void;
  selectCell: (q: number, r: number) => void;
  selectHandRune: (index: number) => void;
  clearSelection: () => void;
  moveRune: (fromQ: number, fromR: number, toQ: number, toR: number) => void;
  placeRune: (q: number, r: number, handIndex: number) => void;
  endPlayerTurn: () => void;
  executeAiTurn: () => Promise<void>;
  setHoveredHex: (hex: { q: number; r: number } | null) => void;
  updateAnimations: (time: number) => void;
  syncState: () => void;
}

function createSpellParticles(spell: SpellResult, centerX: number, centerY: number): Particle[] {
  const particles: Particle[] = [];

  switch (spell.type) {
    case SpellType.Fireball: {
      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 80;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.6,
          maxLife: 0.6,
          color: `hsl(${20 + Math.random() * 30}, 100%, ${50 + Math.random() * 30}%)`,
          size: 2 + Math.random() * 2,
          shape: 'circle',
          rotation: 0,
          rotationSpeed: 0,
        });
      }
      break;
    }
    case SpellType.Frost: {
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 10 + Math.random() * 40;
        particles.push({
          x: centerX + (Math.random() - 0.5) * 60,
          y: centerY + (Math.random() - 0.5) * 60,
          vx: Math.cos(angle) * speed * 0.3,
          vy: Math.sin(angle) * speed + 20,
          life: 0.5,
          maxLife: 0.5,
          color: `hsl(${200 + Math.random() * 20}, 80%, ${60 + Math.random() * 30}%)`,
          size: 2 + Math.random() * 3,
          shape: 'droplet',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 2,
        });
      }
      break;
    }
    case SpellType.Vine: {
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 60;
        particles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed * 0.5,
          vy: -Math.abs(Math.sin(angle) * speed) - 20,
          life: 0.7,
          maxLife: 0.7,
          color: `hsl(${100 + Math.random() * 40}, 70%, ${40 + Math.random() * 30}%)`,
          size: 3 + Math.random() * 3,
          shape: 'leaf',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 4,
        });
      }
      break;
    }
  }

  return particles;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const useGameStore = create<GameStore>((set, get) => ({
  engine: new GameEngine(),
  grid: [],
  players: {
    player: { id: 'player', hp: 100, maxHp: 100, hand: [], skipNextTurn: false, cannotPlace: false },
    ai: { id: 'ai', hp: 100, maxHp: 100, hand: [], skipNextTurn: false, cannotPlace: false },
  },
  currentTurn: 'player',
  turnCount: 1,
  gameOver: false,
  winner: null,
  lastSpellLocations: [],

  selectedCell: null,
  selectedHandIndex: null,
  hoveredHex: null,
  validMoves: [],
  validPlacements: [],
  isAnimating: false,
  isPlayerTurn: true,

  spellAnimations: [],
  hitAnimations: [],
  hpAnimations: [],
  frostOverlay: null,

  initGame: () => {
    const engine = new GameEngine();
    engine.init();
    const state = engine.getState();
    set({
      engine,
      grid: state.grid,
      players: state.players,
      currentTurn: state.currentTurn,
      turnCount: state.turnCount,
      gameOver: state.gameOver,
      winner: state.winner,
      lastSpellLocations: state.lastSpellLocations,
      selectedCell: null,
      selectedHandIndex: null,
      hoveredHex: null,
      validMoves: [],
      validPlacements: [],
      isAnimating: false,
      isPlayerTurn: true,
      spellAnimations: [],
      hitAnimations: [],
      hpAnimations: [],
      frostOverlay: null,
    });
  },

  selectCell: (q: number, r: number) => {
    const state = get();
    if (state.isAnimating || !state.isPlayerTurn || state.gameOver) return;

    const cell = state.grid[r][q];

    if (state.selectedHandIndex !== null) {
      const valid = state.validPlacements;
      const isValid = valid.some(p => p.q === q && p.r === r);
      if (isValid) {
        state.placeRune(q, r, state.selectedHandIndex);
        return;
      }
      set({ selectedHandIndex: null, validPlacements: [], validMoves: [] });
      return;
    }

    if (state.selectedCell) {
      const sc = state.selectedCell;
      const isValidMove = state.validMoves.some(
        m => m.fromQ === sc.q && m.fromR === sc.r && m.toQ === q && m.toR === r
      );
      if (isValidMove) {
        state.moveRune(sc.q, sc.r, q, r);
        return;
      }
    }

    if (cell.rune !== null && cell.owner === 'player' && cell.cooldown === 0) {
      const engine = state.engine;
      const validMoves = engine.getValidMoves('player').filter(m => m.fromQ === q && m.fromR === r);
      set({
        selectedCell: { q, r },
        selectedHandIndex: null,
        validMoves,
        validPlacements: [],
      });
    } else {
      set({ selectedCell: null, validMoves: [], validPlacements: [] });
    }
  },

  selectHandRune: (index: number) => {
    const state = get();
    if (state.isAnimating || !state.isPlayerTurn || state.gameOver) return;

    const engine = state.engine;
    if (state.selectedHandIndex === index) {
      set({ selectedHandIndex: null, validPlacements: [], selectedCell: null, validMoves: [] });
      return;
    }
    const validPlacements = engine.getValidPlacements('player');
    set({ selectedHandIndex: index, validPlacements, selectedCell: null, validMoves: [] });
  },

  clearSelection: () => {
    set({ selectedCell: null, selectedHandIndex: null, validMoves: [], validPlacements: [] });
  },

  moveRune: (fromQ: number, fromR: number, toQ: number, toR: number) => {
    const state = get();
    if (state.isAnimating || !state.isPlayerTurn || state.gameOver) return;

    const engine = state.engine;
    const spells = engine.moveRune(fromQ, fromR, toQ, toR);
    const newState = engine.getState();

    set({
      grid: newState.grid,
      selectedCell: null,
      selectedHandIndex: null,
      validMoves: [],
      validPlacements: [],
      isAnimating: spells.length > 0,
    });

    if (spells.length > 0) {
      processSpells(spells, newState);
    } else {
      finishPlayerTurn();
    }
  },

  placeRune: (q: number, r: number, handIndex: number) => {
    const state = get();
    if (state.isAnimating || !state.isPlayerTurn || state.gameOver) return;

    const engine = state.engine;
    const spells = engine.placeRune(q, r, handIndex);
    const newState = engine.getState();

    set({
      grid: newState.grid,
      players: newState.players,
      selectedCell: null,
      selectedHandIndex: null,
      validMoves: [],
      validPlacements: [],
      isAnimating: spells.length > 0,
    });

    if (spells.length > 0) {
      processSpells(spells, newState);
    } else {
      finishPlayerTurn();
    }
  },

  endPlayerTurn: () => {
    finishPlayerTurn();
  },

  executeAiTurn: async () => {
    const state = get();
    if (state.gameOver) return;

    set({ isAnimating: true, isPlayerTurn: false });

    const { decideAiAction } = await import('../ai/aiPlayer');
    const actions = decideAiAction(state.engine);

    for (const action of actions) {
      await delay(600);

      const currentState = get();
      const engine = currentState.engine;

      let spells: SpellResult[] = [];
      if (action.type === 'move') {
        spells = engine.moveRune(action.fromQ!, action.fromR!, action.toQ, action.toR);
      } else if (action.type === 'place' && action.handIndex !== undefined) {
        spells = engine.placeRune(action.toQ, action.toR, action.handIndex);
      }

      const newState = engine.getState();
      set({ grid: newState.grid, players: newState.players });

      if (spells.length > 0) {
        await processSpellsAsync(spells, newState);
      }
    }

    const engine = get().engine;
    engine.endTurn();
    const finalState = engine.getState();
    set({
      ...finalState,
      isAnimating: false,
      isPlayerTurn: finalState.currentTurn === 'player',
      selectedCell: null,
      selectedHandIndex: null,
      validMoves: [],
      validPlacements: [],
    });
  },

  setHoveredHex: (hex) => {
    set({ hoveredHex: hex });
  },

  updateAnimations: (time: number) => {
    const state = get();
    const activeSpells = state.spellAnimations.filter(a => (time - a.startTime) < a.duration);
    const activeHits = state.hitAnimations.filter(a => (time - a.startTime) < a.duration);
    const activeHp = state.hpAnimations.filter(a => (time - a.startTime) < a.duration);

    for (const anim of activeSpells) {
      const dt = 1 / 60;
      for (const p of anim.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.shape === 'leaf') {
          p.rotation += p.rotationSpeed * dt;
        }
      }
      anim.particles = anim.particles.filter(p => p.life > 0);
    }

    set({
      spellAnimations: activeSpells,
      hitAnimations: activeHits,
      hpAnimations: activeHp,
    });
  },

  syncState: () => {
    const state = get();
    const newState = state.engine.getState();
    set({
      grid: newState.grid,
      players: newState.players,
      currentTurn: newState.currentTurn,
      turnCount: newState.turnCount,
      gameOver: newState.gameOver,
      winner: newState.winner,
    });
  },
}));

function processSpells(spells: SpellResult[], newState: ReturnType<GameEngine['getState']>) {
  const store = useGameStore;

  for (const spell of spells) {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const engine = store.getState().engine;
    const center = engine.getGridCenter(canvasWidth, canvasHeight);

    let avgX = 0, avgY = 0;
    for (const cell of spell.cells) {
      const pos = hexToPixel(cell.q, cell.r, center.x, center.y);
      avgX += pos.x;
      avgY += pos.y;
    }
    avgX /= spell.cells.length;
    avgY /= spell.cells.length;

    const particles = createSpellParticles(spell, avgX, avgY);
    const now = performance.now() / 1000;

    store.setState(state => ({
      spellAnimations: [...state.spellAnimations, {
        spell,
        particles,
        startTime: now,
        duration: 0.8,
      }],
    }));

    const targetTerritory = getPlayerTerritory(spell.target);
    const targetQ = Math.floor((targetTerritory.minR + targetTerritory.maxR) / 2);
    const targetR = targetTerritory.maxR;

    store.setState(state => ({
      hitAnimations: [...state.hitAnimations, {
        q: targetQ,
        r: targetR,
        startTime: now,
        duration: 0.3,
      }],
    }));

    const prevHp = newState.players[spell.target].hp;
    store.getState().engine.applySpellEffect(spell);
    const afterState = store.getState().engine.getState();
    const newHp = afterState.players[spell.target].hp;

    store.setState(state => ({
      hpAnimations: [...state.hpAnimations, {
        player: spell.target,
        fromHp: prevHp,
        toHp: newHp,
        startTime: now,
        duration: 0.4,
      }],
      players: afterState.players,
      gameOver: afterState.gameOver,
      winner: afterState.winner,
      grid: afterState.grid,
    }));

    if (spell.type === SpellType.Frost) {
      store.setState({ frostOverlay: spell.target });
    }
  }

  setTimeout(() => {
    finishPlayerTurn();
  }, 900);
}

async function processSpellsAsync(spells: SpellResult[], newState: ReturnType<GameEngine['getState']>) {
  const store = useGameStore;

  for (const spell of spells) {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const engine = store.getState().engine;
    const center = engine.getGridCenter(canvasWidth, canvasHeight);

    let avgX = 0, avgY = 0;
    for (const cell of spell.cells) {
      const pos = hexToPixel(cell.q, cell.r, center.x, center.y);
      avgX += pos.x;
      avgY += pos.y;
    }
    avgX /= spell.cells.length;
    avgY /= spell.cells.length;

    const particles = createSpellParticles(spell, avgX, avgY);
    const now = performance.now() / 1000;

    store.setState(state => ({
      spellAnimations: [...state.spellAnimations, {
        spell,
        particles,
        startTime: now,
        duration: 0.8,
      }],
    }));

    const targetTerritory = getPlayerTerritory(spell.target);
    const targetQ = Math.floor((targetTerritory.minR + targetTerritory.maxR) / 2);
    const targetR = targetTerritory.maxR;

    store.setState(state => ({
      hitAnimations: [...state.hitAnimations, {
        q: targetQ,
        r: targetR,
        startTime: now,
        duration: 0.3,
      }],
    }));

    const prevHp = store.getState().engine.getState().players[spell.target].hp;
    store.getState().engine.applySpellEffect(spell);
    const afterState = store.getState().engine.getState();
    const newHp = afterState.players[spell.target].hp;

    store.setState(state => ({
      hpAnimations: [...state.hpAnimations, {
        player: spell.target,
        fromHp: prevHp,
        toHp: newHp,
        startTime: now,
        duration: 0.4,
      }],
      players: afterState.players,
      gameOver: afterState.gameOver,
      winner: afterState.winner,
      grid: afterState.grid,
    }));

    if (spell.type === SpellType.Frost) {
      store.setState({ frostOverlay: spell.target });
    }

    await delay(800);
  }
}

function finishPlayerTurn() {
  const store = useGameStore;
  const state = store.getState();

  if (state.gameOver) {
    store.setState({ isAnimating: false, isPlayerTurn: false });
    return;
  }

  state.engine.endTurn();
  const newState = state.engine.getState();

  store.setState({
    ...newState,
    isAnimating: false,
    isPlayerTurn: newState.currentTurn === 'player',
    selectedCell: null,
    selectedHandIndex: null,
    validMoves: [],
    validPlacements: [],
    frostOverlay: newState.currentTurn === 'player' ? null : state.frostOverlay,
  });

  if (newState.currentTurn === 'ai') {
    setTimeout(() => {
      store.getState().executeAiTurn();
    }, 300);
  }
}
