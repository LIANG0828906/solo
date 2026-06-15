import * as THREE from 'three';

export function generateUniqueId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

class LRUCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize: number = 20, maxAge: number = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      if (Date.now() - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        return undefined;
      }
      entry.timestamp = Date.now();
      return entry.value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp <= this.maxAge) {
      return true;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: K): void {
    this.cache.delete(key);
  }
}

export const modelCache = new LRUCache<string, THREE.BufferGeometry>(10, 300000);

class ThrottledFunction<T extends (...args: any[]) => any> {
  private fn: T;
  private delay: number;
  private lastCall: number = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastArgs: Parameters<T> | null = null;

  constructor(fn: T, delay: number) {
    this.fn = fn;
    this.delay = delay;
  }

  invoke(...args: Parameters<T>): void {
    this.lastArgs = args;
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;

    if (timeSinceLastCall >= this.delay) {
      this.lastCall = now;
      this.fn(...args);
    } else if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.lastCall = Date.now();
        this.timeoutId = null;
        if (this.lastArgs) {
          this.fn(...this.lastArgs);
        }
      }, this.delay - timeSinceLastCall);
    }
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  const throttled = new ThrottledFunction(fn, delay);
  return (...args: Parameters<T>) => throttled.invoke(...args);
}

export function worldToScreen(
  position: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number
): { x: number; y: number; visible: boolean } {
  const vector = position.clone().project(camera);
  return {
    x: (vector.x * 0.5 + 0.5) * width,
    y: (-vector.y * 0.5 + 0.5) * height,
    visible: vector.z >= -1 && vector.z <= 1
  };
}

export function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
}

export function createEventDispatcher<T extends Record<string, any>>() {
  const listeners: Partial<Record<keyof T, Set<(data: any) => void>>> = {};

  return {
    on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
      if (!listeners[event]) {
        listeners[event] = new Set();
      }
      listeners[event]!.add(callback);
      return () => {
        listeners[event]?.delete(callback);
      };
    },

    dispatch<K extends keyof T>(event: K, data: T[K]): void {
      listeners[event]?.forEach((callback) => callback(data));
    },

    off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
      listeners[event]?.delete(callback);
    }
  };
}

export type EventDispatcher<T extends Record<string, any>> = ReturnType<typeof createEventDispatcher<T>>;
