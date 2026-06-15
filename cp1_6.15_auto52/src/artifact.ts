import * as THREE from 'three';
import { ArtifactMesh, ShipwreckManager } from './shipwreck';
import { UnderwaterScene } from './scene';

export interface ProgressItem {
  type: string;
  name: string;
  totalPieces: number;
  collectedCount: number;
  completed: boolean;
}

interface CollectedPiece {
  id: string;
  type: string;
  pieceIndex: number;
  totalPieces: number;
  name: string;
}

interface AnimatingArtifact {
  group: THREE.Group;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startRot: THREE.Euler;
  targetRot: THREE.Euler;
  startScale: number;
  targetScale: number;
  progress: number;
  duration: number;
  onComplete?: () => void;
}

interface CombinePiece {
  group: THREE.Group;
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  progress: number;
  delay: number;
  type: string;
  pieceIndex: number;
}

export class ArtifactManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private wreckManager: ShipwreckManager;
  private underwaterScene: UnderwaterScene;
  private container: HTMLElement;

  private collected: CollectedPiece[] = [];
  private progress: ProgressItem[] = [];
  private animating: AnimatingArtifact[] = [];
  private combining: CombinePiece[] = [];
  private combiningGroup: THREE.Group;
  private particleGroup: THREE.Points;
  private particles: {
    positions: Float32Array;
    velocities: Float32Array;
    colors: Float32Array;
    lives: Float32Array;
  };
  private particleCount = 1500;
  private particleAttrs: {
    position: THREE.BufferAttribute;
    velocity: THREE.BufferAttribute;
    color: THREE.BufferAttribute;
    life: THREE.BufferAttribute;
  } | null = null;

  private ui: {
    inventoryPanel: HTMLDivElement;
    inventoryToggle: HTMLButtonElement;
    itemsContainer: HTMLDivElement;
    progressPanel: HTMLDivElement;
    progressBars: Map<string, HTMLDivElement>;
    flashOverlay: HTMLDivElement;
    toast: HTMLDivElement;
    combineOverlay: HTMLDivElement;
    combineName: HTMLDivElement;
  };

  private inventoryOpen = false;
  private isClicking = false;
  private clickStartX = 0;
  private clickStartY = 0;
  private clickStartTime = 0;
  private hoveredArtifact: ArtifactMesh | null = null;
  private cursorStyle = '';
  private onProgressChange?: (progress: ProgressItem[]) => void;

  constructor(
    container: HTMLElement,
    underwaterScene: UnderwaterScene,
    wreckManager: ShipwreckManager
  ) {
    this.container = container;
    this.underwaterScene = underwaterScene;
    this.wreckManager = wreckManager;
    this.scene = underwaterScene.scene;
    this.camera = underwaterScene.camera;
    this.renderer = underwaterScene.renderer;

    this.combiningGroup = new THREE.Group();
    this.scene.add(this.combiningGroup);

    this.particles = {
      positions: new Float32Array(this.particleCount * 3),
      velocities: new Float32Array(this.particleCount * 3),
      colors: new Float32Array(this.particleCount * 3),
      lives: new Float32Array(this.particleCount),
    };
    this.particleGroup = this.createParticleSystem();
    this.scene.add(this.particleGroup);

    this.ui = this.createUI();
    this.bindCanvasEvents();
  }

  private createParticleSystem(): THREE.Points {
    const geo = new THREE.BufferGeometry();
    this.particleAttrs = {
      position: new THREE.BufferAttribute(this.particles.positions, 3),
      velocity: new THREE.BufferAttribute(this.particles.velocities, 3),
      color: new THREE.BufferAttribute(this.particles.colors, 3),
      life: new THREE.BufferAttribute(this.particles.lives, 1),
    };
    geo.setAttribute('position', this.particleAttrs.position);
    geo.setAttribute('color', this.particleAttrs.color);
    geo.setAttribute('aLife', this.particleAttrs.life);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
      },
      vertexShader: `
        attribute float aLife;
        varying float vLife;
        varying vec3 vColor;
        void main() {
          vLife = aLife;
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.0 + aLife * 8.0) * uPixelRatio * (200.0 / -mv.z);
        }
      `,
      fragmentShader: `
        varying float vLife;
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d) * vLife;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    return new THREE.Points(geo, mat);
  }

  private createUI() {
    const inventoryPanel = document.createElement('div');
    inventoryPanel.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0;
      padding: 16px 24px;
      background: linear-gradient(180deg, rgba(11,26,58,0.92) 0%, rgba(11,26,58,0.75) 70%, rgba(11,26,58,0) 100%);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border-bottom: 1px solid rgba(138,196,255,0.18);
      transform: translateY(-100%);
      transition: transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s;
      opacity: 0;
      pointer-events: none;
      z-index: 20;
    `;
    this.container.appendChild(inventoryPanel);

    const invHeader = document.createElement('div');
    invHeader.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px;
    `;
    inventoryPanel.appendChild(invHeader);

    const invTitle = document.createElement('div');
    invTitle.textContent = '📦 考古背包';
    invTitle.style.cssText = `
      font-size: 18px; font-weight: 600;
      color: #8ac4ff;
      letter-spacing: 1px;
    `;
    invHeader.appendChild(invTitle);

    const invClose = document.createElement('button');
    invClose.textContent = '×';
    invClose.style.cssText = `
      background: rgba(138,196,255,0.1);
      border: 1px solid rgba(138,196,255,0.3);
      color: #8ac4ff;
      width: 30px; height: 30px;
      border-radius: 8px;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s;
      pointer-events: auto;
    `;
    invClose.onmouseenter = () => {
      invClose.style.background = 'rgba(138,196,255,0.25)';
    };
    invClose.onmouseleave = () => {
      invClose.style.background = 'rgba(138,196,255,0.1)';
    };
    invClose.onclick = () => this.toggleInventory(false);
    invHeader.appendChild(invClose);

    const itemsContainer = document.createElement('div');
    itemsContainer.style.cssText = `
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      padding-bottom: 8px;
    `;
    inventoryPanel.appendChild(itemsContainer);

    const inventoryToggle = document.createElement('button');
    inventoryToggle.textContent = '📦 背包';
    inventoryToggle.style.cssText = `
      position: absolute;
      top: 18px; left: 18px;
      padding: 10px 18px;
      background: rgba(11,26,58,0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(138,196,255,0.3);
      color: #cfe4ff;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      z-index: 25;
      transition: all 0.25s;
      font-family: inherit;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    `;
    inventoryToggle.onmouseenter = () => {
      inventoryToggle.style.background = 'rgba(11,26,58,0.88)';
      inventoryToggle.style.borderColor = 'rgba(138,196,255,0.55)';
      inventoryToggle.style.transform = 'translateY(-1px)';
    };
    inventoryToggle.onmouseleave = () => {
      inventoryToggle.style.background = 'rgba(11,26,58,0.7)';
      inventoryToggle.style.borderColor = 'rgba(138,196,255,0.3)';
      inventoryToggle.style.transform = 'translateY(0)';
    };
    inventoryToggle.onclick = () => this.toggleInventory();
    this.container.appendChild(inventoryToggle);

    const progressPanel = document.createElement('div');
    progressPanel.style.cssText = `
      position: absolute;
      left: 18px; bottom: 18px;
      background: rgba(11,26,58,0.72);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(138,196,255,0.22);
      border-radius: 14px;
      padding: 14px 16px;
      z-index: 20;
      min-width: 260px;
      transition: opacity 0.4s, transform 0.4s;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    this.container.appendChild(progressPanel);

    const progTitle = document.createElement('div');
    progTitle.textContent = '🏺 拼合进度';
    progTitle.style.cssText = `
      font-size: 14px; font-weight: 600;
      color: #8ac4ff;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    `;
    progressPanel.appendChild(progTitle);

    const flashOverlay = document.createElement('div');
    flashOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(138,196,255,0.45) 0%, rgba(138,196,255,0) 70%);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 30;
    `;
    this.container.appendChild(flashOverlay);

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -20px);
      background: rgba(11,26,58,0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(138,196,255,0.4);
      color: #cfe4ff;
      padding: 12px 22px;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 500;
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
      pointer-events: none;
      z-index: 35;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    `;
    this.container.appendChild(toast);

    const combineOverlay = document.createElement('div');
    combineOverlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(26,61,107,0.6) 0%, rgba(11,26,58,0.9) 100%);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.5s;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    `;
    this.container.appendChild(combineOverlay);

    const combineName = document.createElement('div');
    combineName.style.cssText = `
      font-size: 32px;
      font-weight: 700;
      color: #ffe28a;
      text-shadow: 0 0 30px rgba(255,214,100,0.6);
      letter-spacing: 4px;
      opacity: 0;
      transform: scale(0.7);
      transition: all 0.6s cubic-bezier(0.34,1.56,0.64,1);
      text-align: center;
      padding: 0 20px;
    `;
    combineOverlay.appendChild(combineName);

    const progressBars = new Map<string, HTMLDivElement>();

    return {
      inventoryPanel,
      inventoryToggle,
      itemsContainer,
      progressPanel,
      progressBars,
      flashOverlay,
      toast,
      combineOverlay,
      combineName,
    };
  }

  private bindCanvasEvents(): void {
    const canvas = this.renderer.domElement;
    this.cursorStyle = canvas.style.cursor;

    canvas.addEventListener('pointerdown', (e) => {
      this.isClicking = true;
      this.clickStartX = e.clientX;
      this.clickStartY = e.clientY;
      this.clickStartTime = performance.now();
    });

    canvas.addEventListener('pointermove', () => {
      this.updateHover();
    });

    canvas.addEventListener('pointerup', (e) => {
      if (!this.isClicking) return;
      this.isClicking = false;
      const dx = e.clientX - this.clickStartX;
      const dy = e.clientY - this.clickStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const elapsed = performance.now() - this.clickStartTime;
      if (dist < 6 && elapsed < 320) {
        this.handleClick();
      }
    });
  }

  private updateHover(): void {
    const intersections = this.underwaterScene.getRaycasterTargets(
      this.wreckManager.getAllArtifacts()
    );
    if (intersections.length > 0) {
      let obj: THREE.Object3D | null = intersections[0].object;
      while (obj && !((obj as ArtifactMesh).userData?.isArtifact)) {
        obj = obj.parent;
      }
      if (obj) {
        const artifact = obj as ArtifactMesh;
        if (this.hoveredArtifact !== artifact) {
          this.clearHover();
          this.hoveredArtifact = artifact;
          if (artifact.userData.glowMesh) {
            const glowMat = artifact.userData.glowMesh.material as THREE.MeshBasicMaterial;
            glowMat.color.set(0xffffff);
            glowMat.opacity = 0.55;
          }
          artifact.scale.setScalar(artifact.userData.baseScale * 1.1);
        }
        this.renderer.domElement.style.cursor = 'pointer';
        return;
      }
    }
    this.clearHover();
  }

  private clearHover(): void {
    if (this.hoveredArtifact) {
      const a = this.hoveredArtifact;
      if (a.userData.glowMesh) {
        const glowMat = a.userData.glowMesh.material as THREE.MeshBasicMaterial;
        glowMat.color.set(0x8ac4ff);
      }
      a.scale.setScalar(a.userData.baseScale);
      this.hoveredArtifact = null;
    }
    this.renderer.domElement.style.cursor = this.cursorStyle || 'default';
  }

  private handleClick(): void {
    const intersections = this.underwaterScene.getRaycasterTargets(
      this.wreckManager.getAllArtifacts()
    );
    if (intersections.length === 0) return;
    let obj: THREE.Object3D | null = intersections[0].object;
    while (obj && !((obj as ArtifactMesh).userData?.isArtifact)) {
      obj = obj.parent;
    }
    if (!obj) return;
    const artifact = obj as ArtifactMesh;
    this.collectArtifact(artifact);
  }

  public async collectArtifact(artifact: ArtifactMesh): Promise<void> {
    const data = artifact.userData.artifact;

    this.wreckManager.spawnBubbles(artifact.position.clone(), 30);

    const screenCenter = this.getScreenCenter();
    const anim: AnimatingArtifact = {
      group: artifact,
      startPos: artifact.position.clone(),
      targetPos: screenCenter,
      startRot: artifact.rotation.clone(),
      targetRot: new THREE.Euler(0, 0, 0),
      startScale: artifact.scale.x,
      targetScale: artifact.userData.baseScale * 2,
      progress: 0,
      duration: 0.85,
    };
    this.animating.push(anim);
    this.wreckManager.artifacts = this.wreckManager.artifacts.filter(
      (a) => a !== artifact
    );

    this.showFlash();

    try {
      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id }),
      });
      const json = await res.json();
      if (json.success) {
        this.collected.push({
          id: data.id,
          type: data.type,
          pieceIndex: data.pieceIndex,
          totalPieces: data.totalPieces,
          name: data.name,
        });
        this.setProgress(json.progress);
        this.showToast(`✓ 采集到 ${data.name} 碎片 ${data.pieceIndex + 1}/${data.totalPieces}`);
        this.updateInventoryUI();

        setTimeout(() => {
          this.wreckManager.removeArtifact(data.id);
          const typeProgress = this.progress.find((p) => p.type === data.type);
          if (typeProgress?.completed) {
            this.startCombineAnimation(data.type);
          }
        }, 900);
      }
    } catch (err) {
      console.error('采集失败:', err);
      this.showToast('⚠ 网络错误，进度可能未保存');
    }
  }

  private getScreenCenter(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);
    const dist = 12;
    return this.camera.position.clone().add(dir.multiplyScalar(dist));
  }

  private showFlash(): void {
    this.ui.flashOverlay.style.opacity = '1';
    setTimeout(() => {
      this.ui.flashOverlay.style.opacity = '0';
    }, 300);
  }

  private showToast(msg: string): void {
    this.ui.toast.textContent = msg;
    this.ui.toast.style.opacity = '1';
    this.ui.toast.style.transform = 'translate(-50%, 0)';
    setTimeout(() => {
      this.ui.toast.style.opacity = '0';
      this.ui.toast.style.transform = 'translate(-50%, -20px)';
    }, 2200);
  }

  public setProgress(progress: ProgressItem[]): void {
    this.progress = progress;
    this.onProgressChange?.(progress);
    this.updateProgressUI();
  }

  public setOnProgressChange(cb: (p: ProgressItem[]) => void): void {
    this.onProgressChange = cb;
  }

  private updateProgressUI(): void {
    this.progress.forEach((p) => {
      let bar = this.ui.progressBars.get(p.type);
      if (!bar) {
        bar = this.createProgressBar(p);
        this.ui.progressBars.set(p.type, bar);
        this.ui.progressPanel.appendChild(bar);
      }
      this.renderProgressBar(bar, p);
    });
  }

  private createProgressBar(p: ProgressItem): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      margin-bottom: 10px;
    `;
    const label = document.createElement('div');
    label.style.cssText = `
      display: flex; justify-content: space-between;
      font-size: 12px;
      color: #a8c8e8;
      margin-bottom: 4px;
    `;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'prog-name';
    nameSpan.textContent = p.name;
    const countSpan = document.createElement('span');
    countSpan.className = 'prog-count';
    countSpan.textContent = `${p.collectedCount}/${p.totalPieces}`;
    label.appendChild(nameSpan);
    label.appendChild(countSpan);

    const track = document.createElement('div');
    track.style.cssText = `
      background: rgba(138,196,255,0.1);
      border-radius: 6px;
      height: 8px;
      overflow: hidden;
      border: 1px solid rgba(138,196,255,0.12);
    `;
    const fill = document.createElement('div');
    fill.className = 'prog-fill';
    fill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #3a7ecf, #8ac4ff);
      border-radius: 6px;
      width: 0%;
      transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 0 10px rgba(138,196,255,0.5);
    `;
    track.appendChild(fill);

    wrapper.appendChild(label);
    wrapper.appendChild(track);
    return wrapper;
  }

  private renderProgressBar(bar: HTMLDivElement, p: ProgressItem): void {
    const countSpan = bar.querySelector('.prog-count') as HTMLSpanElement;
    const fill = bar.querySelector('.prog-fill') as HTMLDivElement;
    const nameSpan = bar.querySelector('.prog-name') as HTMLSpanElement;
    if (countSpan) countSpan.textContent = `${p.collectedCount}/${p.totalPieces}`;
    const pct = p.totalPieces > 0 ? (p.collectedCount / p.totalPieces) * 100 : 0;
    if (fill) {
      fill.style.width = `${pct}%`;
      if (p.completed) {
        fill.style.background = 'linear-gradient(90deg, #ffb84a, #ffe28a)';
        fill.style.boxShadow = '0 0 14px rgba(255,214,100,0.6)';
      }
    }
    if (nameSpan && p.completed) {
      nameSpan.textContent = `✓ ${p.name}`;
      nameSpan.style.color = '#ffe28a';
    }
  }

  private updateInventoryUI(): void {
    this.ui.itemsContainer.innerHTML = '';
    const typeMap = new Map<string, CollectedPiece[]>();
    this.collected.forEach((c) => {
      if (!typeMap.has(c.type)) typeMap.set(c.type, []);
      typeMap.get(c.type)!.push(c);
    });

    typeMap.forEach((pieces, type) => {
      const sample = pieces[0];
      const total = sample.totalPieces;
      const collected = pieces.length;
      const complete = collected >= total;

      const card = document.createElement('div');
      card.style.cssText = `
        background: rgba(138,196,255,0.08);
        border: 1px solid ${complete ? 'rgba(255,214,100,0.5)' : 'rgba(138,196,255,0.2)'};
        border-radius: 12px;
        padding: 10px 12px;
        min-width: 140px;
        pointer-events: auto;
        transition: all 0.25s;
        backdrop-filter: blur(6px);
      `;
      card.onmouseenter = () => {
        card.style.background = 'rgba(138,196,255,0.16)';
        card.style.transform = 'translateY(-2px)';
      };
      card.onmouseleave = () => {
        card.style.background = 'rgba(138,196,255,0.08)';
        card.style.transform = 'translateY(0)';
      };

      const icon = document.createElement('div');
      icon.style.cssText = `
        font-size: 28px;
        margin-bottom: 6px;
      `;
      icon.textContent = this.getTypeEmoji(type);
      card.appendChild(icon);

      const name = document.createElement('div');
      name.style.cssText = `
        font-size: 13px;
        font-weight: 600;
        color: ${complete ? '#ffe28a' : '#cfe4ff'};
        margin-bottom: 4px;
      `;
      name.textContent = sample.name;
      card.appendChild(name);

      const dots = document.createElement('div');
      dots.style.cssText = `
        display: flex; gap: 5px;
        margin-bottom: 6px;
      `;
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        const has = pieces.some((p) => p.pieceIndex === i);
        dot.style.cssText = `
          width: 10px; height: 10px;
          border-radius: 50%;
          background: ${has ? (complete ? '#ffe28a' : '#8ac4ff') : 'rgba(138,196,255,0.15)'};
          box-shadow: ${has ? `0 0 6px ${complete ? 'rgba(255,214,100,0.8)' : 'rgba(138,196,255,0.6)'}` : 'none'};
          transition: all 0.3s;
        `;
        dots.appendChild(dot);
      }
      card.appendChild(dots);

      const count = document.createElement('div');
      count.style.cssText = `
        font-size: 11px;
        color: #8ab8d8;
      `;
      count.textContent = complete ? '✓ 拼合完成' : `${collected}/${total} 碎片`;
      card.appendChild(count);

      this.ui.itemsContainer.appendChild(card);
    });

    if (this.collected.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = `
        color: #6a8ab0;
        font-size: 13px;
        padding: 10px 4px;
        pointer-events: none;
      `;
      empty.textContent = '点击沉船周围发光的碎片进行采集...';
      this.ui.itemsContainer.appendChild(empty);
    }
  }

  private getTypeEmoji(type: string): string {
    const map: Record<string, string> = {
      pottery: '🏺',
      statue: '🗿',
      coin: '💰',
      tablet: '📜',
      weapon: '⚔️',
      jewelry: '👑',
    };
    return map[type] || '💎';
  }

  public toggleInventory(force?: boolean): void {
    const open = force !== undefined ? force : !this.inventoryOpen;
    this.inventoryOpen = open;
    if (open) {
      this.ui.inventoryPanel.style.transform = 'translateY(0)';
      this.ui.inventoryPanel.style.opacity = '1';
      this.ui.inventoryPanel.style.pointerEvents = 'auto';
      this.ui.inventoryToggle.style.opacity = '0';
      this.ui.inventoryToggle.style.pointerEvents = 'none';
      this.updateInventoryUI();
    } else {
      this.ui.inventoryPanel.style.transform = 'translateY(-100%)';
      this.ui.inventoryPanel.style.opacity = '0';
      this.ui.inventoryPanel.style.pointerEvents = 'none';
      this.ui.inventoryToggle.style.opacity = '1';
      this.ui.inventoryToggle.style.pointerEvents = 'auto';
    }
  }

  private startCombineAnimation(type: string): void {
    const typePieces = this.collected.filter((c) => c.type === type);
    if (typePieces.length === 0) return;

    const prog = this.progress.find((p) => p.type === type);
    const typeName = prog?.name || type;

    this.ui.combineOverlay.style.opacity = '1';
    setTimeout(() => {
      this.ui.combineName.textContent = `✨ ${typeName} 已复原 ✨`;
      this.ui.combineName.style.opacity = '1';
      this.ui.combineName.style.transform = 'scale(1)';
    }, 400);

    const screenCenter = this.getScreenCenter();
    screenCenter.y += 1;

    const positions = this.getCombinePositions(typePieces.length);
    typePieces.forEach((piece, idx) => {
      const mockGroup = this.createMockPiece(piece.type, piece.pieceIndex);
      const start = this.getRandomStartPosition();
      mockGroup.position.copy(start);
      mockGroup.scale.setScalar(0.3);
      this.combiningGroup.add(mockGroup);

      this.combining.push({
        group: mockGroup,
        targetPos: screenCenter.clone().add(positions[idx]),
        targetRot: new THREE.Euler(
          (Math.random() - 0.5) * 0.5,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.5
        ),
        progress: 0,
        delay: idx * 0.08,
        type: piece.type,
        pieceIndex: piece.pieceIndex,
      });
    });

    this.spawnExplosionParticles(screenCenter, 0);

    setTimeout(() => {
      this.spawnExplosionParticles(screenCenter, 1);
    }, 600);
    setTimeout(() => {
      this.spawnExplosionParticles(screenCenter, 1);
    }, 800);

    setTimeout(() => {
      this.ui.combineName.style.opacity = '0';
      this.ui.combineName.style.transform = 'scale(1.3)';
      this.ui.combineOverlay.style.opacity = '0';
      setTimeout(() => {
        this.combiningGroup.clear();
        this.combining = [];
      }, 600);
    }, 3200);
  }

  private getCombinePositions(n: number): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const r = 0.6 + (i % 2) * 0.3;
      out.push(new THREE.Vector3(
        Math.cos(angle) * r,
        Math.sin(angle * 2) * 0.2,
        Math.sin(angle) * r
      ));
    }
    return out;
  }

  private getRandomStartPosition(): THREE.Vector3 {
    const angle = Math.random() * Math.PI * 2;
    const r = 12 + Math.random() * 6;
    return new THREE.Vector3(
      Math.cos(angle) * r,
      (Math.random() - 0.3) * 8,
      Math.sin(angle) * r - 4
    );
  }

  private createMockPiece(type: string, pieceIndex: number): THREE.Group {
    const group = new THREE.Group();
    const colors: Record<string, number> = {
      pottery: 0xb56b3a,
      statue: 0xe8e4d4,
      coin: 0xd4af37,
      tablet: 0x7a6e5a,
      weapon: 0x8a7a5a,
      jewelry: 0xf0c850,
    };
    const color = colors[type] || 0xcccccc;
    let geo: THREE.BufferGeometry;
    switch (pieceIndex % 5) {
      case 0: geo = new THREE.IcosahedronGeometry(0.5, 1); break;
      case 1: geo = new THREE.BoxGeometry(0.7, 0.9, 0.25); break;
      case 2: geo = new THREE.SphereGeometry(0.45, 10, 8); break;
      case 3: geo = new THREE.ConeGeometry(0.4, 0.9, 6); break;
      default: geo = new THREE.CylinderGeometry(0.25, 0.4, 0.8, 8);
    }
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.3,
      flatShading: true,
      emissive: new THREE.Color(color).multiplyScalar(0.2),
      emissiveIntensity: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    const halo = new THREE.Mesh(
      geo.clone(),
      new THREE.MeshBasicMaterial({
        color: 0x8ac4ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    halo.scale.multiplyScalar(1.3);
    group.add(halo);
    return group;
  }

  private spawnExplosionParticles(center: THREE.Vector3, variant: number): void {
    const color1 = variant === 0 ? new THREE.Color(0x8ac4ff) : new THREE.Color(0xffe28a);
    const color2 = variant === 0 ? new THREE.Color(0xffffff) : new THREE.Color(0xffb84a);
    const n = 200;
    for (let i = 0; i < n; i++) {
      let slot = -1;
      for (let j = 0; j < this.particleCount; j++) {
        if (this.particles.lives[j] <= 0) {
          slot = j;
          break;
        }
      }
      if (slot < 0) break;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2 + Math.random() * 6;
      this.particles.positions[slot * 3] = center.x;
      this.particles.positions[slot * 3 + 1] = center.y;
      this.particles.positions[slot * 3 + 2] = center.z;
      this.particles.velocities[slot * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      this.particles.velocities[slot * 3 + 1] = Math.cos(phi) * speed;
      this.particles.velocities[slot * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
      const c = new THREE.Color().lerpColors(color1, color2, Math.random());
      this.particles.colors[slot * 3] = c.r;
      this.particles.colors[slot * 3 + 1] = c.g;
      this.particles.colors[slot * 3 + 2] = c.b;
      this.particles.lives[slot] = 1;
    }
    this.particleAttrs!.position.needsUpdate = true;
    this.particleAttrs!.color.needsUpdate = true;
    this.particleAttrs!.life.needsUpdate = true;
  }

  public update(): void {
    const dt = 1 / 60;
    for (let i = this.animating.length - 1; i >= 0; i--) {
      const a = this.animating[i];
      a.progress += dt / a.duration;
      const t = Math.min(a.progress, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      a.group.position.lerpVectors(a.startPos, a.targetPos, ease);
      a.group.rotation.x = a.startRot.x + (a.targetRot.x - a.startRot.x) * ease;
      a.group.rotation.y = a.startRot.y + (a.targetRot.y - a.startRot.y) * ease + t * Math.PI * 2;
      a.group.rotation.z = a.startRot.z + (a.targetRot.z - a.startRot.z) * ease;
      const s = a.startScale + (a.targetScale - a.startScale) * ease;
      a.group.scale.setScalar(s * (1 + Math.sin(t * Math.PI) * 0.25));
      if (t >= 1) {
        if (a.onComplete) a.onComplete();
        this.animating.splice(i, 1);
      }
    }

    for (let i = this.combining.length - 1; i >= 0; i--) {
      const c = this.combining[i];
      if (c.delay > 0) {
        c.delay -= dt;
        c.group.rotation.y += 0.04;
        c.group.rotation.x += 0.02;
        c.group.scale.multiplyScalar(1.01);
        continue;
      }
      c.progress += dt * 0.9;
      const t = Math.min(c.progress, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      c.group.position.lerp(c.targetPos, ease);
      c.group.rotation.x += (c.targetRot.x - c.group.rotation.x) * 0.08;
      c.group.rotation.y += 0.05 + (c.targetRot.y - c.group.rotation.y) * 0.05;
      c.group.rotation.z += (c.targetRot.z - c.group.rotation.z) * 0.08;
      const sc = 0.8 + Math.sin(t * Math.PI) * 0.5;
      c.group.scale.setScalar(sc);
      if (t >= 1) {
        this.spawnExplosionParticles(c.targetPos, 1);
      }
    }

    for (let i = 0; i < this.particleCount; i++) {
      if (this.particles.lives[i] <= 0) continue;
      this.particles.lives[i] -= dt * 0.7;
      this.particles.positions[i * 3] += this.particles.velocities[i * 3] * dt;
      this.particles.positions[i * 3 + 1] += this.particles.velocities[i * 3 + 1] * dt;
      this.particles.positions[i * 3 + 2] += this.particles.velocities[i * 3 + 2] * dt;
      this.particles.velocities[i * 3] *= 0.98;
      this.particles.velocities[i * 3 + 1] -= dt * 2;
      this.particles.velocities[i * 3 + 2] *= 0.98;
    }
    if (this.particleAttrs) {
      this.particleAttrs.position.needsUpdate = true;
      this.particleAttrs.life.needsUpdate = true;
    }
  }
}
