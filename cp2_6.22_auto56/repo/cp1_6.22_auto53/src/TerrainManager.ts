export type TerrainType = 'asphalt' | 'sand' | 'snow' | 'mud';

export interface TerrainPhysics {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  friction: number;
  grip: number;
  color: string;
  name: string;
}

export interface TerrainZone {
  id: string;
  type: TerrainType;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | {
    centerX: number;
    centerY: number;
    radius: number;
  };
}

export interface TerrainResult {
  type: TerrainType;
  physics: TerrainPhysics;
  isOnTrack: boolean;
}

interface TerrainConfig {
  physics: Record<TerrainType, TerrainPhysics>;
  zones: TerrainZone[];
}

const DEFAULT_PHYSICS: Record<TerrainType, TerrainPhysics> = {
  asphalt: {
    maxSpeed: 320,
    acceleration: 180,
    deceleration: 250,
    friction: 0.98,
    grip: 0.95,
    color: '#3a3a4a',
    name: '沥青'
  },
  sand: {
    maxSpeed: 240,
    acceleration: 140,
    deceleration: 200,
    friction: 0.92,
    grip: 0.7,
    color: '#c2b280',
    name: '沙地'
  },
  snow: {
    maxSpeed: 200,
    acceleration: 100,
    deceleration: 150,
    friction: 0.85,
    grip: 0.4,
    color: '#e8e8e8',
    name: '雪地'
  },
  mud: {
    maxSpeed: 180,
    acceleration: 80,
    deceleration: 180,
    friction: 0.88,
    grip: 0.5,
    color: '#5c4033',
    name: '泥地'
  }
};

const TRACK_CENTER_X = 0;
const TRACK_CENTER_Y = 0;
const TRACK_SEMI_MAJOR = 800;
const TRACK_SEMI_MINOR = 500;
const TRACK_WIDTH = 120;

export class TerrainManager {
  private physics: Record<TerrainType, TerrainPhysics>;
  private _zones: TerrainZone[];
  private trackCenterX: number;
  private trackCenterY: number;
  private trackSemiMajor: number;
  private trackSemiMinor: number;
  private trackWidth: number;
  private startLineAngle: number;

  constructor(config?: Partial<TerrainConfig> & {
    trackCenterX?: number;
    trackCenterY?: number;
    trackSemiMajor?: number;
    trackSemiMinor?: number;
    trackWidth?: number;
  }) {
    this.physics = { ...DEFAULT_PHYSICS, ...config?.physics };
    this._zones = config?.zones ?? [];
    this.trackCenterX = config?.trackCenterX ?? TRACK_CENTER_X;
    this.trackCenterY = config?.trackCenterY ?? TRACK_CENTER_Y;
    this.trackSemiMajor = config?.trackSemiMajor ?? TRACK_SEMI_MAJOR;
    this.trackSemiMinor = config?.trackSemiMinor ?? TRACK_SEMI_MINOR;
    this.trackWidth = config?.trackWidth ?? TRACK_WIDTH;
    this.startLineAngle = 0;
  }

  async loadFromAPI(): Promise<void> {
    const response = await fetch('/api/terrains');
    if (!response.ok) {
      throw new Error(`Failed to load terrain data: ${response.status}`);
    }
    const data = await response.json();
    if (data.physics) {
      this.physics = { ...this.physics, ...data.physics };
    }
    if (data.track) {
      this.trackCenterX = data.track.centerX ?? this.trackCenterX;
      this.trackCenterY = data.track.centerY ?? this.trackCenterY;
      this.trackSemiMajor = data.track.semiMajor ?? this.trackSemiMajor;
      this.trackSemiMinor = data.track.semiMinor ?? this.trackSemiMinor;
      this.trackWidth = data.track.width ?? this.trackWidth;
    }
    if (data.zones) {
      this._zones = data.zones;
    }
  }

  getTerrainAt(x: number, y: number): TerrainResult {
    const onTrack = this.isOnTrack(x, y);
    let type: TerrainType = 'asphalt';

    if (onTrack) {
      const angle = this.getPolarAngle(x, y);
      type = this.getTerrainTypeByAngle(angle);
    }

    return {
      type,
      physics: this.physics[type],
      isOnTrack: onTrack
    };
  }

  getPhysics(type: TerrainType): TerrainPhysics {
    return this.physics[type];
  }

  getAllTerrainTypes(): TerrainType[] {
    return ['asphalt', 'sand', 'snow', 'mud'];
  }

  isOnTrack(x: number, y: number): boolean {
    return this.isInsideTrack(x, y);
  }

  isInsideTrack(x: number, y: number): boolean {
    const dx = x - this.trackCenterX;
    const dy = y - this.trackCenterY;

    const outerValue = (dx * dx) / ((this.trackSemiMajor + this.trackWidth / 2) ** 2) +
                       (dy * dy) / ((this.trackSemiMinor + this.trackWidth / 2) ** 2);

    const innerValue = (dx * dx) / ((this.trackSemiMajor - this.trackWidth / 2) ** 2) +
                       (dy * dy) / ((this.trackSemiMinor - this.trackWidth / 2) ** 2);

    return innerValue > 1 && outerValue <= 1;
  }

  getTrackCenter(): { x: number; y: number } {
    return { x: this.trackCenterX, y: this.trackCenterY };
  }

  getTrackSemiMajor(): number {
    return this.trackSemiMajor;
  }

  getTrackSemiMinor(): number {
    return this.trackSemiMinor;
  }

  getTrackWidth(): number {
    return this.trackWidth;
  }

  getTrackInnerRadius(): number {
    return this.trackSemiMajor - this.trackWidth / 2;
  }

  getTrackOuterRadius(): number {
    return this.trackSemiMajor + this.trackWidth / 2;
  }

  getStartLineAngle(): number {
    return this.startLineAngle;
  }

  getTrackRadiusAtAngle(angle: number): number {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    return Math.sqrt(
      1 / (
        (cosAngle * cosAngle) / (this.trackSemiMajor * this.trackSemiMajor) +
        (sinAngle * sinAngle) / (this.trackSemiMinor * this.trackSemiMinor)
      )
    );
  }

  getNormalAtPoint(x: number, y: number): { nx: number; ny: number } {
    const dx = x - this.trackCenterX;
    const dy = y - this.trackCenterY;

    const angle = Math.atan2(dy, dx);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const nx = (2 * cosAngle) / (this.trackSemiMajor * this.trackSemiMajor);
    const ny = (2 * sinAngle) / (this.trackSemiMinor * this.trackSemiMinor);

    const length = Math.sqrt(nx * nx + ny * ny);
    return {
      nx: nx / length,
      ny: ny / length,
    };
  }

  private getPolarAngle(x: number, y: number): number {
    const dx = x - this.trackCenterX;
    const dy = y - this.trackCenterY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) {
      angle += 360;
    }
    return angle;
  }

  private getTerrainTypeByAngle(angle: number): TerrainType {
    if (angle >= 0 && angle < 90) {
      return 'asphalt';
    } else if (angle >= 90 && angle < 180) {
      return 'sand';
    } else if (angle >= 180 && angle < 270) {
      return 'snow';
    } else {
      return 'mud';
    }
  }
}
