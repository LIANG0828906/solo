import {
  GameState,
  PlayerState,
  Direction,
  ElementType,
  Rune,
  AreaState,
  SpellResult,
  SpellRule,
  PLAYER_SPEED,
  RUNE_COLLECT_DISTANCE,
  TRANSITION_DURATION,
} from './types';
import {
  createAreaState,
  checkPortalTrigger,
  checkAllCollected,
  getConnectedAreas,
  getAllAreaInfos,
} from './MapLogic';
import { combine, getSpellRules } from './SpellCombiner';

const INITIAL_AREA = 'central_hall';

function createInitialPlayer(): PlayerState {
  return {
    position: { x: 640, y: 360 },
    direction: Direction.DOWN,
    isMoving: false,
    cloakFrame: 0,
    collectedElements: [],
    discoveredSpells: [],
    spellCount: 0,
  };
}

function createInitialAreas(): Record<string, AreaState> {
  const areas: Record<string, AreaState> = {};
  const allInfos = getAllAreaInfos();
  for (const info of allInfos) {
    if (info.id === INITIAL_AREA) {
      areas[info.id] = createAreaState(info.id);
    } else {
      areas[info.id] = {
        info,
        runes: [],
        allCollected: false,
        hasPortal: false,
        visited: false,
      };
    }
  }
  return areas;
}

export class GameManager {
  private state: GameState;
  private keys: Set<string> = new Set();
  private lastTime: number = 0;
  private onStateChange?: (state: GameState) => void;

  constructor() {
    const areas = createInitialAreas();
    const currentArea = areas[INITIAL_AREA];
    this.state = {
      player: createInitialPlayer(),
      currentArea: INITIAL_AREA,
      areas,
      runes: currentArea.runes,
      activePortal: false,
      gamePhase: 'playing',
      startTime: Date.now(),
      discoveredSpells: [],
      spellCount: 0,
      transitioning: false,
      transitionProgress: 0,
      spellBar: [],
      collectedBounce: null,
    };
  }

  setOnStateChange(cb: (state: GameState) => void): void {
    this.onStateChange = cb;
    this.notify();
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  handleKeyDown(key: string): void {
    this.keys.add(key.toLowerCase());
    if (key.toLowerCase() === 'e') {
      this.tryCollectRune();
    }
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key.toLowerCase());
  }

  tryCollectRune(): void {
    const player = this.state.player;
    for (const rune of this.state.runes) {
      if (rune.collected) continue;
      const dx = player.position.x - rune.position.x;
      const dy = player.position.y - rune.position.y;
      if (Math.sqrt(dx * dx + dy * dy) < RUNE_COLLECT_DISTANCE) {
        rune.collected = true;
        rune.collectAnimProgress = 0;
        if (!player.collectedElements.includes(rune.element)) {
          player.collectedElements.push(rune.element);
        }
        this.state.collectedBounce = { element: rune.element, time: Date.now() };
        const areaState = this.state.areas[this.state.currentArea];
        if (checkAllCollected(this.state.runes)) {
          areaState.allCollected = true;
          areaState.hasPortal = true;
        }
        this.notify();
        return;
      }
    }
  }

  combineSpell(elements: ElementType[]): SpellResult {
    const result = combine(elements);
    if (result.matched && result.spell) {
      if (!this.state.discoveredSpells.includes(result.spell.spellId)) {
        this.state.discoveredSpells.push(result.spell.spellId);
      }
      this.state.spellCount++;
      if (this.state.spellBar.length < 4 && !this.state.spellBar.find(s => s.spellId === result.spell!.spellId)) {
        this.state.spellBar.push(result.spell);
      }
      this.notify();
    }
    return result;
  }

  triggerPortal(): string | null {
    const areaState = this.state.areas[this.state.currentArea];
    if (!checkPortalTrigger(this.state.player.position, areaState)) return null;

    const collected = this.state.player.collectedElements;
    const allSix = Object.values(ElementType).filter(e => e !== ElementType.ARCANE);
    const hasAllSix = allSix.every(e => collected.includes(e));

    if (this.state.currentArea === 'central_hall' && hasAllSix) {
      this.state.gamePhase = 'victory';
      this.notify();
      return 'victory';
    }

    const connected = getConnectedAreas(this.state.currentArea);
    const unvisited = connected.find(id => !this.state.areas[id].visited);
    const target = unvisited || connected[0];
    if (!target) return null;

    this.startTransition(target);
    return target;
  }

  private startTransition(targetArea: string): void {
    this.state.transitioning = true;
    this.state.transitionProgress = 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      this.state.transitionProgress = Math.min(elapsed / TRANSITION_DURATION, 1);

      if (this.state.transitionProgress >= 0.5 && this.state.currentArea !== targetArea) {
        this.switchToArea(targetArea);
      }

      if (this.state.transitionProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.state.transitioning = false;
        this.state.transitionProgress = 0;
      }
      this.notify();
    };
    requestAnimationFrame(animate);
  }

  private switchToArea(areaId: string): void {
    if (!this.state.areas[areaId].visited) {
      this.state.areas[areaId] = createAreaState(areaId);
    }
    this.state.currentArea = areaId;
    this.state.runes = this.state.areas[areaId].runes;
    this.state.player.position = { x: 640, y: 500 };
    this.state.activePortal = false;
  }

  update(deltaTime: number): void {
    if (this.state.transitioning || this.state.gamePhase === 'victory') return;

    const player = this.state.player;
    let dx = 0;
    let dy = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;

    player.isMoving = dx !== 0 || dy !== 0;
    if (player.isMoving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      player.position.x += dx * PLAYER_SPEED;
      player.position.y += dy * PLAYER_SPEED;
      player.position.x = Math.max(20, Math.min(1260, player.position.x));
      player.position.y = Math.max(20, Math.min(700, player.position.y));

      if (Math.abs(dx) > Math.abs(dy)) {
        player.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        player.direction = dy > 0 ? Direction.DOWN : Direction.UP;
      }
      player.cloakFrame = (player.cloakFrame + 1) % 6;
    }

    for (const rune of this.state.runes) {
      if (!rune.collected) {
        rune.orbitAngle += (Math.PI * 2 * deltaTime) / 2000;
      } else if (rune.collectAnimProgress < 1) {
        rune.collectAnimProgress = Math.min(1, rune.collectAnimProgress + deltaTime / 500);
      }
    }

    const areaState = this.state.areas[this.state.currentArea];
    this.state.activePortal = checkPortalTrigger(player.position, areaState);
  }

  getAvailableTargets(): string[] {
    return getConnectedAreas(this.state.currentArea);
  }

  getAllSpellRules(): SpellRule[] {
    return getSpellRules();
  }

  getElapsedTime(): number {
    return Date.now() - this.state.startTime;
  }

  getDiscoveryRate(): number {
    const total = getSpellRules().length;
    return total > 0 ? this.state.discoveredSpells.length / total : 0;
  }
}

let instance: GameManager | null = null;

export function getGameManager(): GameManager {
  if (!instance) {
    instance = new GameManager();
  }
  return instance;
}
