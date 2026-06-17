export type LayerType = 'epidermis' | 'cortex' | 'vascular';

export interface LayerConfig {
  id: LayerType;
  name: string;
  index: number;
  visible: boolean;
  opacity: number;
  defaultOpacity: number;
  color: number;
  thickness: number;
  innerRadius: number;
  outerRadius: number;
}

export interface VascularBundle {
  id: number;
  angle: number;
  x: number;
  z: number;
  width: number;
  height: number;
  length: number;
}

export interface PlantStemData {
  height: number;
  diameter: number;
  layers: LayerConfig[];
  vascularBundles: VascularBundle[];
  gap: number;
}

export enum EventType {
  LAYER_SWITCH = 'layerSwitch',
  LAYER_VISIBILITY_CHANGE = 'layerVisibilityChange',
  LAYER_OPACITY_CHANGE = 'layerOpacityChange',
  ROTATION_SPEED_CHANGE = 'rotationSpeedChange',
  AUTO_ROTATE_TOGGLE = 'autoRotateToggle',
  VASCULAR_HOVER = 'vascularHover',
  VASCULAR_LEAVE = 'vascularLeave',
  LAYER_RESTORE = 'layerRestore',
}

type EventCallback = (data?: unknown) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<EventType, Set<EventCallback>>;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on(event: EventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: EventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  public emit(event: EventType, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

export const eventBus = EventBus.getInstance();

export class DataParser {
  private stemData: PlantStemData | null = null;

  public parse(): PlantStemData {
    const height = 10;
    const diameter = 3;
    const radius = diameter / 2;
    const gap = 0.05;

    const layers: LayerConfig[] = [
      {
        id: 'epidermis',
        name: '表皮层',
        index: 1,
        visible: true,
        opacity: 0.3,
        defaultOpacity: 0.3,
        color: 0xffffff,
        thickness: 0.3,
        innerRadius: radius - 0.3,
        outerRadius: radius,
      },
      {
        id: 'cortex',
        name: '皮层',
        index: 2,
        visible: true,
        opacity: 0.4,
        defaultOpacity: 0.4,
        color: 0x8fbc8f,
        thickness: 0.6,
        innerRadius: radius - 0.3 - gap - 0.6,
        outerRadius: radius - 0.3 - gap,
      },
      {
        id: 'vascular',
        name: '维管束层',
        index: 3,
        visible: true,
        opacity: 1,
        defaultOpacity: 1,
        color: 0x006400,
        thickness: 0.5,
        innerRadius: 0.3,
        outerRadius: radius - 0.3 - gap - 0.6 - gap,
      },
    ];

    const vascularBundles: VascularBundle[] = [];
    const bundleCount = 12;
    const bundleRadius = (layers[2].innerRadius + layers[2].outerRadius) / 2;

    for (let i = 0; i < bundleCount; i++) {
      const angle = (i / bundleCount) * Math.PI * 2;
      vascularBundles.push({
        id: i + 1,
        angle: (angle * 180) / Math.PI,
        x: Math.cos(angle) * bundleRadius,
        z: Math.sin(angle) * bundleRadius,
        width: 0.4,
        height: 8,
        length: 0.2,
      });
    }

    this.stemData = {
      height,
      diameter,
      layers,
      vascularBundles,
      gap,
    };

    return this.stemData;
  }

  public getStemData(): PlantStemData | null {
    return this.stemData;
  }
}

export const dataParser = new DataParser();
