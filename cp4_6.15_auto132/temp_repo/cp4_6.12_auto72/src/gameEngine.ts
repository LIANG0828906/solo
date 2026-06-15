import type { Particle } from './types';
import { createMapState, updateMap, drawMap, getPetAtPosition, getGrassAtPosition, removeWildPet, drawTooltip, MapState } from './mapRenderer';
import { createBattleState, startBattle, updateBattle, drawBattle, attemptCatch, BattleState } from './battleSystem';
import { createPet } from './gameLogic';
import type { Pet } from './types';

export type GameScene = 'map' | 'battle' | 'menu' | 'team' | 'replace';

export interface GameEngineState {
  scene: GameScene;
  mapState: MapState;
  battleState: BattleState;
  playerTeam: Pet[];
  pokeballs: number;
  particles: Particle[];
  scale: number;
  isSmallScreen: boolean;
  pendingCatchPet: Pet | null;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameEngineState;
  private lastTime: number = 0;
  private animationId: number = 0;
  private isRunning: boolean = false;
  private hoverTimer: number = 0;
  private hoverX: number = 0;
  private hoverY: number = 0;
  private listeners: Set<(state: GameEngineState) => void> = new Set();
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    
    const starterPet = createPet('flamey', 5);
    starterPet.x = 400;
    starterPet.y = 300;
    
    const secondPet = createPet('bubbly', 4);
    const thirdPet = createPet('leafy', 3);
    
    this.state = {
      scene: 'map',
      mapState: createMapState(),
      battleState: createBattleState(),
      playerTeam: [starterPet, secondPet, thirdPet],
      pokeballs: 5,
      particles: [],
      scale: 1,
      isSmallScreen: false,
      pendingCatchPet: null,
    };
    
    this.setupEventListeners();
    this.checkScreenSize();
  }
  
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('click', this.handleClick);
    window.addEventListener('resize', this.handleResize);
  }
  
  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.state.scale;
    const y = (e.clientY - rect.top) / this.state.scale;
    
    this.hoverX = e.clientX - rect.left;
    this.hoverY = e.clientY - rect.top;
    
    if (this.state.scene === 'map') {
      const pet = getPetAtPosition(this.state.mapState, x, y);
      if (pet) {
        this.hoverTimer += 16;
        if (this.hoverTimer >= 300) {
          this.state.mapState.hoveredPet = pet;
          this.state.mapState.showTooltip = true;
          this.state.mapState.tooltipX = x;
          this.state.mapState.tooltipY = y;
        }
      } else {
        this.hoverTimer = 0;
        this.state.mapState.hoveredPet = null;
        this.state.mapState.showTooltip = false;
      }
    }
  };
  
  private handleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.state.scale;
    const y = (e.clientY - rect.top) / this.state.scale;
    
    if (this.state.scene === 'map') {
      const grass = getGrassAtPosition(this.state.mapState, x, y);
      if (grass && grass.hasPet) {
        const pet = getPetAtPosition(this.state.mapState, grass.x, grass.y);
        if (pet) {
          this.startBattleWithPet(pet);
        }
      }
    }
  };
  
  private handleResize = (): void => {
    this.checkScreenSize();
    this.notifyListeners();
  };
  
  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.state.isSmallScreen = width < 768;
    this.state.scale = this.state.isSmallScreen ? 0.8 : 1;
    
    const canvasWidth = 800 * this.state.scale;
    const canvasHeight = 600 * this.state.scale;
    
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
  }
  
  private startBattleWithPet(pet: Pet): void {
    removeWildPet(this.state.mapState, pet as any);
    startBattle(this.state.battleState, this.state.playerTeam, pet, this.state.pokeballs);
    this.state.scene = 'battle';
    this.notifyListeners();
  }
  
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  private gameLoop = (): void => {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    
    this.update(deltaTime);
    this.render();
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
  
  private update(deltaTime: number): void {
    if (this.state.scene === 'map') {
      updateMap(this.state.mapState, deltaTime);
    } else if (this.state.scene === 'battle') {
      const particlesRef = { current: this.state.particles };
      updateBattle(this.state.battleState, deltaTime, particlesRef);
      this.state.particles = particlesRef.current;
      
      if (this.state.battleState.battleEnded) {
        this.handleBattleEnd();
      }
    }
    
    this.state.particles = this.state.particles
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1,
        life: p.life - 1,
      }))
      .filter(p => p.life > 0);
  }
  
  private handleBattleEnd(): void {
    const battle = this.state.battleState;
    
    this.state.playerTeam = battle.playerTeam;
    this.state.pokeballs = battle.pokeballs;
    
    if (battle.catchResult === 'success' && battle.enemy) {
      if (this.state.playerTeam.length < 4) {
        this.state.playerTeam.push(battle.enemy);
      } else {
        this.state.pendingCatchPet = battle.enemy;
        this.state.scene = 'replace';
        this.notifyListeners();
        return;
      }
    }
    
    setTimeout(() => {
      this.state.scene = 'map';
      this.state.battleState = createBattleState();
      this.notifyListeners();
    }, 1500);
  }
  
  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 800, 600);
    
    if (this.state.scene === 'map' || this.state.scene === 'menu' || this.state.scene === 'team') {
      drawMap(ctx, this.state.mapState, 1);
      
      if (this.state.mapState.showTooltip && this.state.mapState.hoveredPet) {
        const pet = this.state.mapState.hoveredPet;
        const text = `${pet.name} Lv.${pet.level}`;
        drawTooltip(ctx, this.state.mapState.tooltipX, this.state.mapState.tooltipY, text, 1);
      }
    }
    
    if (this.state.scene === 'battle' || this.state.scene === 'replace') {
      drawBattle(ctx, this.state.battleState, this.state.particles, 1);
    }
  }
  
  public getState(): GameEngineState {
    return { ...this.state };
  }
  
  public setScene(scene: GameScene): void {
    this.state.scene = scene;
    this.notifyListeners();
  }
  
  public attemptCatch(): boolean {
    if (this.state.scene !== 'battle') return false;
    const particlesRef = { current: this.state.particles };
    const result = attemptCatch(this.state.battleState, particlesRef);
    this.state.particles = particlesRef.current;
    this.notifyListeners();
    return result;
  }
  
  public addPokeballs(count: number): void {
    this.state.pokeballs += count;
    this.notifyListeners();
  }
  
  public swapTeamPositions(index1: number, index2: number): void {
    if (index1 < 0 || index1 >= this.state.playerTeam.length) return;
    if (index2 < 0 || index2 >= this.state.playerTeam.length) return;
    
    const temp = this.state.playerTeam[index1];
    this.state.playerTeam[index1] = this.state.playerTeam[index2];
    this.state.playerTeam[index2] = temp;
    
    this.notifyListeners();
  }
  
  public releasePet(index: number): void {
    if (index < 0 || index >= this.state.playerTeam.length) return;
    if (this.state.playerTeam.length <= 1) return;
    
    this.state.playerTeam.splice(index, 1);
    this.notifyListeners();
  }
  
  public replacePet(teamIndex: number): void {
    if (!this.state.pendingCatchPet) return;
    if (teamIndex < 0 || teamIndex >= this.state.playerTeam.length) return;
    
    this.state.playerTeam[teamIndex] = this.state.pendingCatchPet;
    this.state.pendingCatchPet = null;
    this.state.scene = 'map';
    this.state.battleState = createBattleState();
    this.notifyListeners();
  }
  
  public skipReplace(): void {
    this.state.pendingCatchPet = null;
    this.state.scene = 'map';
    this.state.battleState = createBattleState();
    this.notifyListeners();
  }
  
  public subscribe(listener: (state: GameEngineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }
  
  public destroy(): void {
    this.stop();
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('click', this.handleClick);
    window.removeEventListener('resize', this.handleResize);
    this.listeners.clear();
  }
}
