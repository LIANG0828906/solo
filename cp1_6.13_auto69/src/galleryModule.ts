import { Weights } from './morphController';
import { CoreScene } from './coreScene';

export interface Snapshot {
  id: string;
  name: string;
  weights: Weights;
  thumbnail: string;
  createdAt: number;
}

export class GalleryModule {
  private snapshots: Snapshot[] = [];
  private maxSnapshots: number = 20;
  private coreScene: CoreScene;
  private gridElement: HTMLElement | null = null;
  private countElement: HTMLElement | null = null;
  private snapshotCounter: number = 0;
  
  private onRestoreCallback: ((weights: Weights) => void) | null = null;

  constructor(coreScene: CoreScene) {
    this.coreScene = coreScene;
  }

  setGridElement(element: HTMLElement): void {
    this.gridElement = element;
    this.renderGrid();
  }

  setCountElement(element: HTMLElement): void {
    this.countElement = element;
    this.updateCount();
  }

  setOnRestoreCallback(callback: (weights: Weights) => void): void {
    this.onRestoreCallback = callback;
  }

  saveSnapshot(name: string, weights: Weights): Snapshot | null {
    if (this.snapshots.length >= this.maxSnapshots) {
      this.snapshots.shift();
    }

    this.snapshotCounter++;
    
    const thumbnail = this.coreScene.renderThumbnail(120, 120);
    
    const snapshot: Snapshot = {
      id: `snapshot_${Date.now()}_${this.snapshotCounter}`,
      name: name || `形态 #${this.snapshotCounter}`,
      weights: [...weights] as Weights,
      thumbnail,
      createdAt: Date.now(),
    };

    this.snapshots.push(snapshot);
    this.renderGrid();
    this.updateCount();

    return snapshot;
  }

  restoreSnapshot(id: string): Weights | null {
    const snapshot = this.snapshots.find((s) => s.id === id);
    if (!snapshot) return null;

    if (this.onRestoreCallback) {
      this.onRestoreCallback(snapshot.weights);
    }

    return [...snapshot.weights] as Weights;
  }

  deleteSnapshot(id: string): boolean {
    const index = this.snapshots.findIndex((s) => s.id === id);
    if (index === -1) return false;

    this.snapshots.splice(index, 1);
    this.renderGrid();
    this.updateCount();
    return true;
  }

  getSnapshots(): Snapshot[] {
    return [...this.snapshots];
  }

  updateName(id: string, name: string): boolean {
    const snapshot = this.snapshots.find((s) => s.id === id);
    if (!snapshot) return false;

    snapshot.name = name;
    return true;
  }

  private updateCount(): void {
    if (this.countElement) {
      this.countElement.textContent = `${this.snapshots.length} / ${this.maxSnapshots}`;
    }
  }

  private renderGrid(): void {
    if (!this.gridElement) return;

    if (this.snapshots.length === 0) {
      this.gridElement.innerHTML = `
        <div class="gallery-empty">暂无快照<br/>点击"保存快照"添加</div>
      `;
      return;
    }

    this.gridElement.innerHTML = '';

    for (const snapshot of this.snapshots) {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.dataset.id = snapshot.id;
      card.innerHTML = `
        <div class="gallery-thumbnail">
          <img src="${snapshot.thumbnail}" alt="${snapshot.name}" />
        </div>
        <input type="text" class="gallery-card-name" value="${snapshot.name}" />
      `;

      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('gallery-card-name')) {
          return;
        }
        this.restoreSnapshot(snapshot.id);
      });

      const nameInput = card.querySelector('.gallery-card-name') as HTMLInputElement;
      nameInput.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        this.updateName(snapshot.id, input.value || snapshot.name);
      });

      this.gridElement.appendChild(card);
    }
  }

  setMaxSnapshots(max: number): void {
    this.maxSnapshots = max;
    while (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    this.renderGrid();
    this.updateCount();
  }

  dispose(): void {
    this.snapshots = [];
    this.gridElement = null;
    this.countElement = null;
    this.onRestoreCallback = null;
  }
}
