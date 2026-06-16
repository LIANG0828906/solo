import * as THREE from 'three';
import type { Atom, NeighborInfo } from '../types';
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../types';
import { SceneManager } from './SceneManager';
import { useMaterialStore } from '../stores/useMaterialStore';

export class AnnotationSystem {
  private sceneManager: SceneManager;
  private infoCard: HTMLElement;
  private currentAtomId: string | null = null;

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.infoCard = document.getElementById('info-card') as HTMLElement;

    this.setupListeners();
    this.sceneManager.onFrame(() => this.updatePosition());
  }

  private setupListeners(): void {
    useMaterialStore.subscribe(
      (state) => state.selectedAtom,
      (atom) => this.onAtomSelected(atom)
    );

    document.addEventListener('click', (e) => {
      if (!this.infoCard.contains(e.target as Node)) {
        const canvas = this.sceneManager.renderer.domElement;
        if (!canvas.contains(e.target as Node)) {
          useMaterialStore.getState().selectAtom(null);
        }
      }
    });
  }

  private onAtomSelected(atom: Atom | null): void {
    if (!atom) {
      this.hide();
      this.currentAtomId = null;
      return;
    }

    this.currentAtomId = atom.id;
    this.show(atom);
  }

  private show(atom: Atom): void {
    const state = useMaterialStore.getState();
    const neighbors = state.getNeighborsWithinRange(atom.id, 0.1);

    const color = ELEMENT_COLORS[atom.element];
    const name = ELEMENT_NAMES[atom.element];

    this.infoCard.innerHTML = `
      <div class="info-header">
        <div class="info-element">
          <div class="element-ball" style="background: ${color};"></div>
          <span class="element-symbol">${atom.element} - ${name}</span>
        </div>
        <button class="info-close" id="info-close-btn">✕</button>
      </div>
      <div class="info-grid">
        <span class="info-key">坐标 (Å)</span>
        <span class="info-val">(${atom.position.x.toFixed(3)}, ${atom.position.y.toFixed(3)}, ${atom.position.z.toFixed(3)})</span>
        <span class="info-key">配位数</span>
        <span class="info-val">${atom.coordinationNumber}</span>
        <span class="info-key">原子ID</span>
        <span class="info-val" style="font-size:10px;">${atom.id.slice(0, 8)}...</span>
        ${atom.isDefect ? '<span class="info-key">状态</span><span class="info-val" style="color:#f0883e;">缺陷原子</span>' : ''}
      </div>
      <div class="info-neighbors-title">1nm范围内相邻原子 (${neighbors.length})</div>
      <div class="neighbors-list">
        ${neighbors.length > 0 ? neighbors.slice(0, 20).map((n: NeighborInfo) => `
          <div class="neighbor-item">
            <div class="neighbor-dot" style="background: ${ELEMENT_COLORS[n.atom.element]};"></div>
            <span>${n.atom.element} ${ELEMENT_NAMES[n.atom.element]}</span>
            <span class="neighbor-dist">${n.distance.toFixed(2)} Å</span>
          </div>
        `).join('') : '<div class="neighbor-item" style="justify-content:center; color:rgba(255,255,255,0.4);">无相邻原子</div>'}
        ${neighbors.length > 20 ? `<div class="neighbor-item" style="justify-content:center; color:rgba(255,255,255,0.3); font-size:10px;">还有 ${neighbors.length - 20} 个原子...</div>` : ''}
      </div>
    `;

    const closeBtn = document.getElementById('info-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        useMaterialStore.getState().selectAtom(null);
      });
    }

    this.infoCard.classList.add('visible');
    this.updatePosition();
  }

  private hide(): void {
    this.infoCard.classList.remove('visible');
  }

  private updatePosition(): void {
    if (!this.currentAtomId) return;

    const state = useMaterialStore.getState();
    const material = state.materials[state.currentMaterial];
    const atom = material.atoms.find((a) => a.id === this.currentAtomId);
    if (!atom) return;

    const pos = new THREE.Vector3(atom.position.x, atom.position.y, atom.position.z);
    const screen = this.sceneManager.worldToScreen(pos);

    const cardWidth = this.infoCard.offsetWidth;
    const cardHeight = this.infoCard.offsetHeight;
    const padding = 20;

    let left = screen.x + 20;
    let top = screen.y - cardHeight / 2;

    if (left + cardWidth + padding > window.innerWidth) {
      left = screen.x - cardWidth - 20;
    }
    left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));
    top = Math.max(80, Math.min(top, window.innerHeight - cardHeight - padding));

    this.infoCard.style.left = `${left}px`;
    this.infoCard.style.top = `${top}px`;
  }
}
