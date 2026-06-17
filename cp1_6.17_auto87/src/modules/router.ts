import type { ReactNode } from 'react';
import { snapshotManager } from './snapshot';

export type RouteComponent = () => ReactNode;

export type RouteTable = Map<string, RouteComponent>;

export type RouterListener = (hash: string, component: RouteComponent | null, restored: boolean) => void;

export class Router {
  private routes: RouteTable;
  private currentHash: string;
  private listeners: Set<RouterListener>;
  private containerRef: HTMLElement | null = null;

  constructor(routes: RouteTable) {
    this.routes = routes;
    this.currentHash = '';
    this.listeners = new Set();
    this.handlePopState = this.handlePopState.bind(this);
  }

  setContainer(container: HTMLElement | null): void {
    this.containerRef = container;
  }

  subscribe(listener: RouterListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(hash: string, component: RouteComponent | null, restored: boolean): void {
    this.listeners.forEach((listener) => listener(hash, component, restored));
  }

  start(): void {
    window.addEventListener('popstate', this.handlePopState);
    const initialHash = window.location.hash || '/#/pageA';
    if (!window.location.hash) {
      window.location.hash = '/#/pageA';
    }
    this.currentHash = initialHash;
    const component = this.routes.get(initialHash) || null;
    this.notify(initialHash, component, snapshotManager.hasSnapshot(initialHash));
  }

  stop(): void {
    window.removeEventListener('popstate', this.handlePopState);
  }

  private async handlePopState(): Promise<void> {
    const newHash = window.location.hash || '/#/pageA';
    if (newHash === this.currentHash) {
      return;
    }
    if (this.containerRef) {
      await snapshotManager.saveState(this.currentHash, this.containerRef);
    }
    this.currentHash = newHash;
    const component = this.routes.get(newHash) || null;
    const restored = snapshotManager.hasSnapshot(newHash);
    this.notify(newHash, component, restored);
  }

  async navigate(hash: string): Promise<void> {
    if (hash === this.currentHash) {
      return;
    }
    if (this.containerRef) {
      await snapshotManager.saveState(this.currentHash, this.containerRef);
    }
    window.location.hash = hash;
    this.currentHash = hash;
    const component = this.routes.get(hash) || null;
    const restored = snapshotManager.hasSnapshot(hash);
    this.notify(hash, component, restored);
  }

  getCurrentHash(): string {
    return this.currentHash;
  }
}
