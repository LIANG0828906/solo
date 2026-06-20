import { v4 as uuidv4 } from 'uuid';
import type {
  Point2D,
  HallConfig,
  Showcase,
  Exhibit,
  ExhibitType,
  VisitorStart,
  Scene,
  ImportResult,
} from '../types';

export class SceneEngine {
  private scene: Scene;

  constructor(initialScene?: Partial<Scene>) {
    this.scene = this.createDefaultScene(initialScene);
  }

  private createDefaultScene(overrides?: Partial<Scene>): Scene {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      name: 'Untitled Scene',
      hall: {
        width: 10,
        height: 8,
        gridSize: 0.5,
        backgroundColor: '#E0E0E0',
      },
      showcases: [],
      exhibits: [],
      visitorStarts: [],
      paths: [],
      heatmapData: [],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  getScene(): Scene {
    return this.scene;
  }

  setHallConfig(config: Partial<HallConfig>): void {
    this.scene.hall = { ...this.scene.hall, ...config };
    this.updateTimestamp();
  }

  addShowcase(position: Point2D): Showcase {
    const showcase: Showcase = {
      id: uuidv4(),
      position: { ...position },
      width: 2,
      depth: 1,
      rotation: 0,
      color: '#4FC3F7',
    };
    this.scene.showcases.push(showcase);
    this.updateTimestamp();
    return showcase;
  }

  updateShowcase(id: string, updates: Partial<Showcase>): void {
    const index = this.scene.showcases.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.scene.showcases[index] = { ...this.scene.showcases[index], ...updates };
      this.updateTimestamp();
    }
  }

  removeShowcase(id: string): void {
    this.scene.showcases = this.scene.showcases.filter((s) => s.id !== id);
    this.scene.exhibits = this.scene.exhibits.filter((e) => e.showcaseId !== id);
    this.updateTimestamp();
  }

  addExhibit(showcaseId: string, type: ExhibitType): Exhibit {
    const showcase = this.scene.showcases.find((s) => s.id === showcaseId);
    if (!showcase) {
      throw new Error(`Showcase with id ${showcaseId} not found`);
    }

    const exhibitColors: Record<ExhibitType, string> = {
      sculpture: '#FF6B6B',
      painting: '#4ECDC4',
      jewelry: '#FFD93D',
    };

    const exhibitIcons: Record<ExhibitType, string> = {
      sculpture: 'circle',
      painting: 'square',
      jewelry: 'diamond',
    };

    const exhibit: Exhibit = {
      id: uuidv4(),
      showcaseId,
      type,
      position: { x: 0, y: 0 },
      height: 1.5,
      facing: { x: 1, y: 0 },
      icon: exhibitIcons[type],
      color: exhibitColors[type],
    };
    this.scene.exhibits.push(exhibit);
    this.updateTimestamp();
    return exhibit;
  }

  updateExhibit(id: string, updates: Partial<Exhibit>): void {
    const index = this.scene.exhibits.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.scene.exhibits[index] = { ...this.scene.exhibits[index], ...updates };
      this.updateTimestamp();
    }
  }

  removeExhibit(id: string): void {
    this.scene.exhibits = this.scene.exhibits.filter((e) => e.id !== id);
    this.updateTimestamp();
  }

  addVisitorStart(position: Point2D): VisitorStart {
    const start: VisitorStart = {
      id: uuidv4(),
      position: { ...position },
      radius: 0.3,
    };
    this.scene.visitorStarts.push(start);
    this.updateTimestamp();
    return start;
  }

  updateVisitorStart(id: string, updates: Partial<VisitorStart>): void {
    const index = this.scene.visitorStarts.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.scene.visitorStarts[index] = { ...this.scene.visitorStarts[index], ...updates };
      this.updateTimestamp();
    }
  }

  removeVisitorStart(id: string): void {
    this.scene.visitorStarts = this.scene.visitorStarts.filter((s) => s.id !== id);
    this.updateTimestamp();
  }

  setPaths(paths: Scene['paths']): void {
    this.scene.paths = paths;
    this.updateTimestamp();
  }

  setHeatmapData(data: Scene['heatmapData']): void {
    this.scene.heatmapData = data;
    this.updateTimestamp();
  }

  exportScene(): string {
    return JSON.stringify(this.scene, null, 2);
  }

  importScene(jsonString: string): ImportResult<Scene> {
    try {
      const data = JSON.parse(jsonString);
      const validation = this.validateSceneSchema(data);

      if (!validation.success) {
        return validation;
      }

      this.scene = {
        ...validation.data!,
        updatedAt: new Date().toISOString(),
      };

      return { success: true, data: this.scene };
    } catch (error) {
      return {
        success: false,
        errors: [`JSON parse error: ${(error as Error).message}`],
      };
    }
  }

  private validateSceneSchema(data: unknown): ImportResult<Scene> {
    const errors: string[] = [];

    if (typeof data !== 'object' || data === null) {
      return { success: false, errors: ['Scene must be an object'] };
    }

    const scene = data as Record<string, unknown>;

    if (typeof scene.id !== 'string') {
      errors.push('Scene.id must be a string');
    }
    if (typeof scene.name !== 'string') {
      errors.push('Scene.name must be a string');
    }

    if (typeof scene.hall !== 'object' || scene.hall === null) {
      errors.push('Scene.hall must be an object');
    } else {
      const hall = scene.hall as Record<string, unknown>;
      if (typeof hall.width !== 'number' || hall.width <= 0) {
        errors.push('Hall.width must be a positive number');
      }
      if (typeof hall.height !== 'number' || hall.height <= 0) {
        errors.push('Hall.height must be a positive number');
      }
      if (typeof hall.gridSize !== 'number' || hall.gridSize <= 0) {
        errors.push('Hall.gridSize must be a positive number');
      }
      if (typeof hall.backgroundColor !== 'string') {
        errors.push('Hall.backgroundColor must be a string');
      }
    }

    if (!Array.isArray(scene.showcases)) {
      errors.push('Scene.showcases must be an array');
    }

    if (!Array.isArray(scene.exhibits)) {
      errors.push('Scene.exhibits must be an array');
    }

    if (!Array.isArray(scene.visitorStarts)) {
      errors.push('Scene.visitorStarts must be an array');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const showcaseIds = new Set(
      (scene.showcases as Showcase[]).map((s) => s.id)
    );

    for (const exhibit of scene.exhibits as Exhibit[]) {
      if (!showcaseIds.has(exhibit.showcaseId)) {
        errors.push(`Exhibit ${exhibit.id} references non-existent showcase ${exhibit.showcaseId}`);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: data as Scene };
  }

  private updateTimestamp(): void {
    this.scene.updatedAt = new Date().toISOString();
  }

  getShowcaseById(id: string): Showcase | undefined {
    return this.scene.showcases.find((s) => s.id === id);
  }

  getExhibitById(id: string): Exhibit | undefined {
    return this.scene.exhibits.find((e) => e.id === id);
  }
}
