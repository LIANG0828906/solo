import type {
  ShipType,
  AIStrategy,
  Faction,
  FleetConfig,
  ShipConfig,
  BattleTemplate,
  SimulationResult,
  GameStateFrame,
} from '../shared/types';
import { SHIP_STATS, SHIP_COLORS } from '../shared/types';

type EventCallback = (data?: unknown) => void;

export class UIController {
  private blueFleet: FleetConfig;
  private redFleet: FleetConfig;
  private templates: BattleTemplate[];
  private simulationId: string | null;
  private isSimulating: boolean;
  private isPaused: boolean;
  private simulationResult: SimulationResult | null;
  private simulationSpeed: number;
  private listeners: Map<string, EventCallback[]>;

  constructor() {
    this.templates = [];
    this.simulationId = null;
    this.isSimulating = false;
    this.isPaused = false;
    this.simulationResult = null;
    this.simulationSpeed = 1;
    this.listeners = new Map();

    this.blueFleet = this.createDefaultFleet('blue');
    this.redFleet = this.createDefaultFleet('red');

    this.loadTemplates().catch(() => {});
  }

  private createDefaultFleet(faction: Faction): FleetConfig {
    const ships: ShipConfig[] = [];
    const shipTypes: ShipType[] = ['scout', 'scout', 'capital', 'carrier'];
    const counts: Record<ShipType, number> = { scout: 0, capital: 0, carrier: 0 };

    shipTypes.forEach((type) => {
      counts[type]++;
      const factionName = faction === 'blue' ? 'Blue' : 'Red';
      const typeName = type.charAt(0).toUpperCase() + type.slice(1);
      ships.push({
        id: `${faction}-${type}-${counts[type]}`,
        type,
        faction,
        name: `${factionName} ${typeName} ${counts[type]}`,
      });
    });

    return {
      faction,
      ships,
      aiStrategy: 'balanced',
    };
  }

  addShip(faction: Faction, type: ShipType): boolean {
    const fleet = faction === 'blue' ? this.blueFleet : this.redFleet;
    if (fleet.ships.length >= 8) {
      return false;
    }

    const counts: Record<ShipType, number> = { scout: 0, capital: 0, carrier: 0 };
    fleet.ships.forEach((ship) => {
      counts[ship.type]++;
    });
    counts[type]++;

    const factionName = faction === 'blue' ? 'Blue' : 'Red';
    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
    const newShip: ShipConfig = {
      id: `${faction}-${type}-${counts[type]}`,
      type,
      faction,
      name: `${factionName} ${typeName} ${counts[type]}`,
    };

    fleet.ships.push(newShip);
    this.emit('fleetsChanged');
    return true;
  }

  removeShip(faction: Faction, shipId: string): void {
    const fleet = faction === 'blue' ? this.blueFleet : this.redFleet;
    const index = fleet.ships.findIndex((ship) => ship.id === shipId);
    if (index !== -1) {
      fleet.ships.splice(index, 1);
      this.emit('fleetsChanged');
    }
  }

  setAIStrategy(strategy: AIStrategy): void {
    this.blueFleet.aiStrategy = strategy;
    this.redFleet.aiStrategy = strategy;
    this.emit('fleetsChanged');
  }

  getFleet(faction: Faction): FleetConfig {
    return faction === 'blue'
      ? JSON.parse(JSON.stringify(this.blueFleet))
      : JSON.parse(JSON.stringify(this.redFleet));
  }

  clearFleet(faction: Faction): void {
    const fleet = faction === 'blue' ? this.blueFleet : this.redFleet;
    fleet.ships = [];
    this.emit('fleetsChanged');
  }

  async loadTemplates(): Promise<BattleTemplate[]> {
    try {
      this.templates = await this.apiCall('GET', '/api/templates');
      this.emit('templatesChanged');
      return this.templates;
    } catch (error) {
      this.templates = [];
      return [];
    }
  }

  async saveTemplate(name: string): Promise<BattleTemplate> {
    const template: Omit<BattleTemplate, 'id' | 'createdAt'> = {
      name,
      blueFleet: JSON.parse(JSON.stringify(this.blueFleet)),
      redFleet: JSON.parse(JSON.stringify(this.redFleet)),
    };

    const saved = await this.apiCall('POST', '/api/templates', template);
    this.templates.push(saved);
    this.emit('templatesChanged');
    return saved;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.apiCall('DELETE', `/api/templates/${id}`);
    this.templates = this.templates.filter((t) => t.id !== id);
    this.emit('templatesChanged');
  }

  loadTemplate(id: string): void {
    const template = this.templates.find((t) => t.id === id);
    if (!template) {
      return;
    }
    this.blueFleet = JSON.parse(JSON.stringify(template.blueFleet));
    this.redFleet = JSON.parse(JSON.stringify(template.redFleet));
    this.emit('fleetsChanged');
  }

  async startSimulation(): Promise<string> {
    if (this.isSimulating) {
      throw new Error('Simulation already running');
    }

    const body = {
      blueFleet: this.blueFleet,
      redFleet: this.redFleet,
      speed: this.simulationSpeed,
    };

    const result = await this.apiCall('POST', '/api/simulations', body);
    this.simulationId = result.simulationId;
    this.isSimulating = true;
    this.isPaused = false;
    this.simulationResult = null;
    this.emit('simulationStarted', { simulationId: this.simulationId });
    return this.simulationId;
  }

  async pauseSimulation(): Promise<void> {
    if (!this.isSimulating || !this.simulationId) {
      return;
    }
    await this.apiCall('POST', `/api/simulations/${this.simulationId}/pause`);
    this.isPaused = true;
    this.emit('simulationPaused');
  }

  async resumeSimulation(): Promise<void> {
    if (!this.isSimulating || !this.simulationId) {
      return;
    }
    await this.apiCall('POST', `/api/simulations/${this.simulationId}/resume`);
    this.isPaused = false;
    this.emit('simulationResumed');
  }

  async stopSimulation(): Promise<SimulationResult | null> {
    if (!this.simulationId) {
      return null;
    }
    try {
      this.simulationResult = await this.apiCall(
        'POST',
        `/api/simulations/${this.simulationId}/stop`
      );
    } catch {
      this.simulationResult = null;
    }
    this.isSimulating = false;
    this.isPaused = false;
    this.emit('simulationStopped', this.simulationResult);
    if (this.simulationResult) {
      this.emit('resultReady', this.simulationResult);
    }
    return this.simulationResult;
  }

  async getCurrentFrame(): Promise<any> {
    if (!this.simulationId) {
      return null;
    }
    try {
      return await this.apiCall(
        'GET',
        `/api/simulations/${this.simulationId}/frame`
      );
    } catch {
      return null;
    }
  }

  async getSimulationResult(): Promise<SimulationResult | null> {
    if (!this.simulationId) {
      return null;
    }
    try {
      this.simulationResult = await this.apiCall(
        'GET',
        `/api/simulations/${this.simulationId}/result`
      );
      if (this.simulationResult) {
        this.emit('resultReady', this.simulationResult);
      }
      return this.simulationResult;
    } catch {
      return null;
    }
  }

  setSimulationSpeed(speed: number): void {
    if (speed !== 1 && speed !== 2 && speed !== 4) {
      throw new Error('Invalid speed. Must be 1, 2, or 4');
    }
    this.simulationSpeed = speed;
  }

  on(
    event:
      | 'fleetsChanged'
      | 'templatesChanged'
      | 'simulationStarted'
      | 'simulationPaused'
      | 'simulationResumed'
      | 'simulationStopped'
      | 'resultReady',
    callback: Function
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch {
        }
      });
    }
  }

  private async apiCall(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(path, options);
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API call failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }
}
