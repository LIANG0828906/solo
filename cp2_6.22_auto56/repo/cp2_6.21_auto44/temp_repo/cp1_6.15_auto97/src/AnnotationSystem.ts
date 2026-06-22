import * as THREE from 'three';
import { generateUniqueId, worldToScreen, throttle, createEventDispatcher, EventDispatcher } from './utils';

export interface BoneAnnotation {
  id: string;
  boneName: string;
  boneNameCn: string;
  function: string;
  localPosition: [number, number, number];
}

interface AnnotationSystemEvents {
  boneClick: BoneAnnotation;
}

interface AnnotationElement {
  data: BoneAnnotation;
  container: HTMLElement;
  box: HTMLElement;
  worldPosition: THREE.Vector3;
}

export class AnnotationSystem {
  private container: HTMLElement;
  private svgContainer: SVGSVGElement;
  private annotations: AnnotationElement[] = [];
  private model: THREE.Group | null = null;
  private camera: THREE.Camera | null = null;
  private visible: boolean = true;
  private dispatcher: EventDispatcher<AnnotationSystemEvents>;
  private activeBoneCard: HTMLElement | null = null;
  private throttledUpdate: (() => void) | null = null;

  constructor(containerId: string, svgId: string) {
    this.container = document.getElementById(containerId) as HTMLElement;
    this.svgContainer = document.getElementById(svgId) as unknown as SVGSVGElement;
    this.dispatcher = createEventDispatcher<AnnotationSystemEvents>();
  }

  attachToModel(model: THREE.Group, annotations: BoneAnnotation[], camera: THREE.Camera): void {
    this.clear();
    this.model = model;
    this.camera = camera;

    annotations.forEach((annotationData) => {
      this.createAnnotation(annotationData);
    });

    this.throttledUpdate = throttle(() => this.updatePositions(), 32);
  }

  private createAnnotation(data: BoneAnnotation): void {
    const container = document.createElement('div');
    container.className = 'annotation';
    container.dataset.annotationId = data.id;

    const box = document.createElement('div');
    box.className = 'annotation-box';

    const title = document.createElement('div');
    title.className = 'annotation-title';
    title.textContent = data.boneNameCn;

    const desc = document.createElement('div');
    desc.className = 'annotation-desc';
    desc.textContent = data.function;

    box.appendChild(title);
    box.appendChild(desc);
    container.appendChild(box);

    box.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dispatcher.dispatch('boneClick', data);
      this.showBoneInfoCard(data, e.clientX, e.clientY);
    });

    const worldPosition = new THREE.Vector3(...data.localPosition);

    this.annotations.push({
      data,
      container,
      box,
      worldPosition
    });

    this.container.appendChild(container);
  }

  updatePositions(): void {
    if (!this.camera || !this.model) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.svgContainer.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';

    this.annotations.forEach((annotation) => {
      const worldPos = annotation.worldPosition.clone();
      this.model!.localToWorld(worldPos);

      const screenPos = worldToScreen(worldPos, this.camera!, width, height);

      if (screenPos.visible && this.visible) {
        annotation.container.style.left = `${screenPos.x}px`;
        annotation.container.style.top = `${screenPos.y - 50}px`;
        annotation.container.classList.remove('hidden');

        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('class', 'annotation-line');
        line.setAttribute('x1', `${screenPos.x}`);
        line.setAttribute('y1', `${screenPos.y - 30}`);
        line.setAttribute('x2', `${screenPos.x}`);
        line.setAttribute('y2', `${screenPos.y}`);
        this.svgContainer.appendChild(line);
      } else {
        annotation.container.classList.add('hidden');
      }
    });
  }

  private showBoneInfoCard(data: BoneAnnotation, x: number, y: number): void {
    this.closeBoneInfoCard();

    const card = document.createElement('div');
    card.className = 'bone-info-card';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'bone-card-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.closeBoneInfoCard());

    const title = document.createElement('div');
    title.className = 'bone-card-title';
    title.textContent = data.boneNameCn;

    const scientific = document.createElement('div');
    scientific.className = 'bone-card-scientific';
    scientific.textContent = data.boneName;

    const functionSection = document.createElement('div');
    functionSection.className = 'bone-card-section';
    const functionLabel = document.createElement('div');
    functionLabel.className = 'bone-card-section-label';
    functionLabel.textContent = '功能';
    const functionValue = document.createElement('div');
    functionValue.className = 'bone-card-section-value';
    functionValue.textContent = data.function;
    functionSection.appendChild(functionLabel);
    functionSection.appendChild(functionValue);

    card.appendChild(closeBtn);
    card.appendChild(title);
    card.appendChild(scientific);
    card.appendChild(functionSection);

    const cardWidth = 240;
    const cardHeight = 150;
    let posX = x + 20;
    let posY = y - cardHeight / 2;

    if (posX + cardWidth > window.innerWidth - 20) {
      posX = x - cardWidth - 20;
    }
    if (posY < 80) {
      posY = 80;
    }
    if (posY + cardHeight > window.innerHeight - 20) {
      posY = window.innerHeight - cardHeight - 20;
    }

    card.style.left = `${posX}px`;
    card.style.top = `${posY}px`;

    document.body.appendChild(card);
    this.activeBoneCard = card;
  }

  closeBoneInfoCard(): void {
    if (this.activeBoneCard) {
      this.activeBoneCard.remove();
      this.activeBoneCard = null;
    }
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.annotations.forEach((annotation) => {
      if (visible) {
        annotation.container.classList.remove('hidden');
      } else {
        annotation.container.classList.add('hidden');
      }
    });
    if (!visible) {
      this.svgContainer.innerHTML = '';
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  onBoneClick(callback: (data: BoneAnnotation) => void): () => void {
    return this.dispatcher.on('boneClick', callback);
  }

  update(): void {
    if (this.throttledUpdate) {
      this.throttledUpdate();
    }
  }

  clear(): void {
    this.annotations.forEach((annotation) => {
      annotation.container.remove();
    });
    this.annotations = [];
    this.svgContainer.innerHTML = '';
    this.model = null;
    this.closeBoneInfoCard();
    this.throttledUpdate = null;
  }

  dispose(): void {
    this.clear();
    this.camera = null;
  }
}
