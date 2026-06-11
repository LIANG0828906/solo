export type GamePhase = 'assembly' | 'transition' | 'race' | 'result';

export type ModuleType = 'gear' | 'propeller' | 'engine' | 'wing';

export type SlotType = 'leftWing' | 'rightWing' | 'engine' | 'propeller';

export interface Module {
  id: string;
  type: ModuleType;
  name: string;
  tier: number;
  color: string;
}

export interface AircraftStats {
  speed: number;
  turning: number;
  climb: number;
}

export interface RaceResult {
  lap: number;
  time: number;
  rating: string;
}

export interface PlacedModules {
  leftWing: Module | null;
  rightWing: Module | null;
  engine: Module | null;
  propeller: Module | null;
}

export class GameManager {
  private static instance: GameManager;
  
  public currentPhase: GamePhase = 'assembly';
  public transitionProgress: number = 0;
  public transitionDirection: 'toRace' | 'toAssembly' = 'toRace';
  
  public aircraftStats: AircraftStats = {
    speed: 50,
    turning: 40,
    climb: 30
  };
  
  public placedModules: PlacedModules = {
    leftWing: null,
    rightWing: null,
    engine: null,
    propeller: null
  };
  
  public availableModules: Module[] = [];
  
  public raceTime: number = 0;
  public currentLap: number = 0;
  public totalLaps: number = 3;
  public gatesPassed: number = 0;
  public totalGates: number = 3;
  
  public raceResults: RaceResult[] = [];
  
  public finalTime: number = 0;
  public finalRating: string = '';
  
  public score: number = 0;
  
  private constructor() {
    this.initializeModules();
  }
  
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }
  
  private initializeModules(): void {
    this.availableModules = [
      { id: 'wing1', type: 'wing', name: '初级机翼', tier: 1, color: '#8B4513' },
      { id: 'wing2', type: 'wing', name: '高级机翼', tier: 2, color: '#A0522D' },
      { id: 'engine1', type: 'engine', name: '单缸引擎', tier: 1, color: '#696969' },
      { id: 'engine2', type: 'engine', name: '四缸引擎', tier: 2, color: '#505050' },
      { id: 'prop1', type: 'propeller', name: '双叶螺旋桨', tier: 1, color: '#DAA520' },
      { id: 'prop2', type: 'propeller', name: '四叶螺旋桨', tier: 2, color: '#FFD700' },
      { id: 'gear1', type: 'gear', name: '齿轮组', tier: 1, color: '#B87333' },
      { id: 'gear2', type: 'gear', name: '精密齿轮', tier: 2, color: '#CD853F' }
    ];
  }
  
  public calculateStats(): void {
    let speed = 50;
    let turning = 40;
    let climb = 30;
    
    if (this.placedModules.engine) {
      speed += this.placedModules.engine.tier * 10;
    }
    
    if (this.placedModules.leftWing && this.placedModules.rightWing) {
      const avgTier = (this.placedModules.leftWing.tier + this.placedModules.rightWing.tier) / 2;
      turning += avgTier * 8;
    }
    
    if (this.placedModules.propeller) {
      climb += this.placedModules.propeller.tier * 6;
    }
    
    if (this.placedModules.leftWing && this.placedModules.rightWing && 
        this.placedModules.engine && this.placedModules.propeller) {
      speed += 5;
      turning += 3;
      climb += 2;
    }
    
    this.aircraftStats = { speed, turning, climb };
    this.calculateScore();
  }
  
  public calculateScore(): void {
    this.score = Math.floor(
      this.aircraftStats.speed * 0.4 +
      this.aircraftStats.turning * 0.3 +
      this.aircraftStats.climb * 0.3
    );
  }
  
  public isAllSlotsFilled(): boolean {
    return !!(this.placedModules.leftWing && 
              this.placedModules.rightWing && 
              this.placedModules.engine && 
              this.placedModules.propeller);
  }
  
  public placeModule(slot: SlotType, module: Module): boolean {
    const slotTypeMap: Record<SlotType, ModuleType[]> = {
      leftWing: ['wing', 'gear'],
      rightWing: ['wing', 'gear'],
      engine: ['engine', 'gear'],
      propeller: ['propeller', 'gear']
    };
    
    if (!slotTypeMap[slot].includes(module.type)) {
      return false;
    }
    
    this.placedModules[slot] = module;
    this.calculateStats();
    return true;
  }
  
  public removeModule(slot: SlotType): Module | null {
    const module = this.placedModules[slot];
    this.placedModules[slot] = null;
    this.calculateStats();
    return module;
  }
  
  public startRace(): void {
    this.currentPhase = 'transition';
    this.transitionProgress = 0;
    this.transitionDirection = 'toRace';
    this.raceTime = 0;
    this.currentLap = 0;
    this.gatesPassed = 0;
  }
  
  public returnToAssembly(): void {
    this.currentPhase = 'transition';
    this.transitionProgress = 0;
    this.transitionDirection = 'toAssembly';
  }
  
  public completeTransition(): void {
    if (this.transitionDirection === 'toRace') {
      this.currentPhase = 'race';
    } else {
      this.currentPhase = 'assembly';
    }
    this.transitionProgress = 0;
  }
  
  public passGate(): void {
    this.gatesPassed++;
    if (this.gatesPassed >= this.totalGates) {
      this.gatesPassed = 0;
      this.currentLap++;
      
      if (this.currentLap >= this.totalLaps) {
        this.finishRace();
      }
    }
  }
  
  public finishRace(): void {
    this.finalTime = this.raceTime;
    this.finalRating = this.calculateRating(this.raceTime);
    this.currentPhase = 'result';
    
    this.raceResults.unshift({
      lap: this.totalLaps,
      time: this.finalTime,
      rating: this.finalRating
    });
    
    if (this.raceResults.length > 5) {
      this.raceResults.pop();
    }
  }
  
  public calculateRating(time: number): string {
    if (time < 60) return 'S';
    if (time < 90) return 'A';
    return 'B';
  }
  
  public formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }
  
  public resetRace(): void {
    this.raceTime = 0;
    this.currentLap = 0;
    this.gatesPassed = 0;
  }
}
