import * as THREE from 'three';
import { CityMap } from './cityMap';

export interface NoiseSourceData {
  id: string;
  category: 'traffic' | 'construction' | 'nightmarket' | 'factory' | 'vehicle' | 'temporary';
  position: THREE.Vector3;
  intensity: number;
  baseIntensity: number;
  diffusionRadius: number;
  isMobile: boolean;
  active: boolean;
  sphere?: THREE.Mesh;
  moveTimer: number;
}

type EventBusLike = { on(e: string, f: Function): void; emit(e: string, d?: any): void };

let idCounter = 0;
function genId(): string {
  return 'ns_' + (++idCounter);
}

function dbToColor(db: number): number {
  if (db < 40) return 0x44cc44;
  if (db < 55) return 0xaacc00;
  if (db < 70) return 0xffcc00;
  if (db < 85) return 0xff8800;
  return 0xff2200;
}

export class NoiseSourceManager {
  private sources: NoiseSourceData[] = [];
  private cityMap: CityMap;
  private scene: THREE.Scene;
  private eventBus: EventBusLike;
  private currentHour: number = 12;
  private autoUpdateInterval: number = 0;
  private tempSourceCount: number = 0;

  constructor(cityMap: CityMap, scene: THREE.Scene, eventBus: EventBusLike) {
    this.cityMap = cityMap;
    this.scene = scene;
    this.eventBus = eventBus;
    this.createFixedSources();
    this.createMobileSources();
    this.startAutoUpdate();
  }

  private createFixedSources(): void {
    const roadPositions = [
      new THREE.Vector3(20, 0.5, 20),
      new THREE.Vector3(60, 0.5, 60),
    ];

    for (const pos of roadPositions) {
      this.addSource('traffic', pos, 70 + Math.random() * 10, 30, false);
    }

    this.addSource('construction', new THREE.Vector3(40, 0.5, 40), 75 + Math.random() * 5, 25, false);
    this.addSource('nightmarket', new THREE.Vector3(80, 0.5, 20), 65 + Math.random() * 10, 20, false);
    this.addSource('factory', new THREE.Vector3(80, 0.5, 80), 78 + Math.random() * 2, 35, false);
  }

  private createMobileSources(): void {
    for (let i = 0; i < 5; i++) {
      const pos = this.cityMap.getRandomRoadPosition();
      const intensity = 35 + Math.random() * 15;
      this.addSource('vehicle', pos, intensity, 15, true);
    }
  }

  private addSource(
    category: NoiseSourceData['category'],
    position: THREE.Vector3,
    intensity: number,
    diffusionRadius: number,
    isMobile: boolean,
    isTemp: boolean = false,
  ): NoiseSourceData {
    const id = genId();
    const source: NoiseSourceData = {
      id,
      category,
      position: position.clone(),
      intensity,
      baseIntensity: intensity,
      diffusionRadius,
      isMobile,
      active: true,
      moveTimer: 0,
    };

    const geo = new THREE.SphereGeometry(2, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: dbToColor(intensity),
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(position);
    sphere.position.y = 2;
    sphere.userData = { sourceId: id };
    this.scene.add(sphere);
    source.sphere = sphere;

    this.sources.push(source);
    return source;
  }

  addTempSource(position: THREE.Vector3, intensity: number): NoiseSourceData | null {
    if (this.tempSourceCount >= 5) return null;
    this.tempSourceCount++;
    const source = this.addSource('temporary', position, intensity, 20, false, true);
    this.eventBus.emit('tempSourceAdded', source);
    return source;
  }

  removeTempSource(id: string): void {
    const idx = this.sources.findIndex(s => s.id === id);
    if (idx >= 0 && this.sources[idx].category === 'temporary') {
      const source = this.sources[idx];
      if (source.sphere) {
        this.scene.remove(source.sphere);
        source.sphere.geometry.dispose();
        (source.sphere.material as THREE.Material).dispose();
      }
      this.sources.splice(idx, 1);
      this.tempSourceCount--;
      this.eventBus.emit('tempSourceRemoved', { id });
    }
  }

  toggleSource(id: string): void {
    const source = this.sources.find(s => s.id === id);
    if (source) {
      source.active = !source.active;
      if (source.sphere) {
        (source.sphere.material as THREE.MeshBasicMaterial).opacity = source.active ? 0.6 : 0.15;
      }
    }
  }

  getSources(): NoiseSourceData[] {
    return this.sources;
  }

  updateTime(hour: number): void {
    this.currentHour = hour;
    this.applyTimeEffects();
  }

  private applyTimeEffects(): void {
    const hour = this.currentHour;

    for (const source of this.sources) {
      if (source.category === 'temporary') continue;

      let multiplier = 1.0;

      if (hour >= 8 && hour < 18) {
        multiplier = 1.0;
      } else if (hour >= 20 || hour < 6) {
        multiplier = 0.5;
        if (source.category === 'nightmarket') {
          multiplier = 1.2;
        }
      } else if (hour >= 6 && hour < 8) {
        const t = (hour - 6) / 2;
        multiplier = 0.5 + t * 0.5;
        if (source.category === 'nightmarket') multiplier = 1.2 - t * 0.2;
      } else if (hour >= 18 && hour < 20) {
        const t = (hour - 18) / 2;
        multiplier = 1.0 - t * 0.5;
        if (source.category === 'nightmarket') multiplier = 0.8 + t * 0.4;
      }

      source.intensity = source.baseIntensity * multiplier;

      if (source.sphere) {
        (source.sphere.material as THREE.MeshBasicMaterial).color.setHex(dbToColor(source.intensity));
      }
    }

    const isNight = hour >= 20 || hour < 6;
    let mobileVisible = 5;
    if (isNight) mobileVisible = 2;
    else if (hour >= 6 && hour < 8) mobileVisible = 2 + Math.floor(((hour - 6) / 2) * 3);
    else if (hour >= 18 && hour < 20) mobileVisible = 5 - Math.floor(((hour - 18) / 2) * 3);

    const mobileSources = this.sources.filter(s => s.category === 'vehicle');
    mobileSources.forEach((s, i) => {
      s.active = i < mobileVisible;
      if (s.sphere) {
        (s.sphere.material as THREE.MeshBasicMaterial).opacity = s.active ? 0.6 : 0.0;
        s.sphere.visible = s.active;
      }
    });
  }

  update(delta: number): void {
    for (const source of this.sources) {
      if (!source.isMobile || !source.active) continue;

      source.moveTimer += delta;
      if (source.moveTimer >= 3.0) {
        source.moveTimer = 0;
        const newPos = this.cityMap.getRandomRoadPosition();
        source.position.lerp(newPos, 0.5);
        if (source.sphere) {
          source.sphere.position.x = source.position.x;
          source.sphere.position.z = source.position.z;
        }
      }
    }
  }

  private startAutoUpdate(): void {
    this.autoUpdateInterval = window.setInterval(() => {
      for (const source of this.sources) {
        if (source.category === 'temporary') continue;
        const variation = (Math.random() - 0.5) * 6;
        source.baseIntensity = Math.max(35, Math.min(100, source.baseIntensity + variation));
      }
      this.applyTimeEffects();
    }, 60000);
  }

  dispose(): void {
    window.clearInterval(this.autoUpdateInterval);
    for (const source of this.sources) {
      if (source.sphere) {
        this.scene.remove(source.sphere);
        source.sphere.geometry.dispose();
        (source.sphere.material as THREE.Material).dispose();
      }
    }
  }
}
