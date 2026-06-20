import { Card } from './card';

export class Gallery {
  cards: Card[] = [];
  maxCards = 36;
  cameraRotX = -Math.PI / 6;
  cameraRotY = 0;
  zoom = 1.0;
  minZoom = 0.5;
  maxZoom = 3.0;
  dragSensitivity = 0.1;
  inertiaDamping = 0.85;
  isDragging = false;
  private velocityX = 0;
  private velocityY = 0;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private stage: HTMLElement;
  private container: HTMLElement;
  private animationId = 0;
  private startTime = 0;
  private isMobile = false;
  private baseSpacing = 40;
  private scatterRange = 60;

  constructor(container: HTMLElement, stage: HTMLElement) {
    this.container = container;
    this.stage = stage;
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile) {
      this.scatterRange = 90;
      this.baseSpacing = 50;
    }
    this.checkMobile();
    this.bindEvents();
  }

  private checkMobile(): void {
    const onResize = () => {
      this.isMobile = window.innerWidth < 768;
      this.scatterRange = this.isMobile ? 90 : 60;
      this.baseSpacing = this.isMobile ? 50 : 40;
      this.cards.forEach(card => {
        card.width = 200 * (this.isMobile ? 0.6 : 1);
        card.height = 260 * (this.isMobile ? 0.6 : 1);
        card.element.style.width = card.width + 'px';
        card.element.style.height = card.height + 'px';
      });
      this.layout();
    };
    window.addEventListener('resize', onResize);
  }

  private bindEvents(): void {
    this.container.addEventListener('mousedown', this.onPointerDown.bind(this));
    window.addEventListener('mousemove', this.onPointerMove.bind(this));
    window.addEventListener('mouseup', this.onPointerUp.bind(this));
    this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private onPointerDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  private onPointerMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;
    this.velocityY = dx * this.dragSensitivity;
    this.velocityX = dy * this.dragSensitivity;
    this.cameraRotY += dx * this.dragSensitivity * 0.01;
    this.cameraRotX += dy * this.dragSensitivity * 0.01;
    this.clampRotation();
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  private onPointerUp(): void {
    this.isDragging = false;
  }

  private lastTouchDist = 0;
  private lastTouchX = 0;
  private lastTouchY = 0;

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
      this.velocityX = 0;
      this.velocityY = 0;
    } else if (e.touches.length === 2) {
      this.lastTouchDist = this.getTouchDist(e.touches);
    }
    e.preventDefault();
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.lastTouchX;
      const dy = e.touches[0].clientY - this.lastTouchY;
      this.velocityY = dx * this.dragSensitivity;
      this.velocityX = dy * this.dragSensitivity;
      this.cameraRotY += dx * this.dragSensitivity * 0.01;
      this.cameraRotX += dy * this.dragSensitivity * 0.01;
      this.clampRotation();
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = this.getTouchDist(e.touches);
      const delta = dist - this.lastTouchDist;
      this.zoom += delta * 0.005;
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
      this.lastTouchDist = dist;
    }
    e.preventDefault();
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  private getTouchDist(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    this.zoom += delta;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
    this.layout();
  }

  private clampRotation(): void {
    this.cameraRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 6, this.cameraRotX));
  }

  addCard(url: string): void {
    if (this.cards.length >= this.maxCards) {
      this.removeOldestCard();
    }

    const card = new Card(url, this.isMobile);

    const idx = this.cards.length;
    const spacing = this.baseSpacing * this.zoom;
    const scatter = this.scatterRange * this.zoom;
    const offsetX = (Math.random() - 0.5) * scatter;
    const offsetY = (Math.random() - 0.5) * scatter * 0.6;
    const offsetZ = idx * spacing;

    card.setPosition(offsetX, offsetY, -offsetZ);
    card.rotationX = this.cameraRotX;

    card.onVisit = (targetUrl: string) => {
      if (targetUrl.startsWith('http')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    };

    this.stage.appendChild(card.element);
    this.cards.push(card);
    card.flyInAnimation();
    this.layout();
  }

  private removeOldestCard(): void {
    if (this.cards.length === 0) return;
    const oldest = this.cards[0];
    this.cards.splice(0, 1);
    oldest.fadeOutAnimation().then(() => {
      oldest.dispose();
    });
    this.layout();
  }

  layout(): void {
    const spacing = this.baseSpacing * this.zoom;
    const scatter = this.scatterRange * this.zoom;

    this.cards.forEach((card, i) => {
      if (!card.element.classList.contains('card-fly-in') && !card.element.classList.contains('card-fade-out')) {
        const seed = card.url.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const pseudoRand = (s: number) => {
          const x = Math.sin(s) * 10000;
          return x - Math.floor(x);
        };
        const offsetX = (pseudoRand(seed + 1) - 0.5) * scatter;
        const offsetY = (pseudoRand(seed + 2) - 0.5) * scatter * 0.6;
        const offsetZ = i * spacing;
        card.x = offsetX;
        card.y = offsetY;
        card.z = -offsetZ;
      }
    });
  }

  start(): void {
    this.startTime = performance.now() / 1000;
    this.loop();
  }

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    const time = performance.now() / 1000 - this.startTime;

    if (!this.isDragging) {
      this.cameraRotY += this.velocityY * 0.005;
      this.cameraRotX += this.velocityX * 0.005;
      this.clampRotation();
      this.velocityX *= this.inertiaDamping;
      this.velocityY *= this.inertiaDamping;
      if (Math.abs(this.velocityX) < 0.01) this.velocityX = 0;
      if (Math.abs(this.velocityY) < 0.01) this.velocityY = 0;
    }

    this.stage.style.transform = `translateZ(0) rotateX(${this.cameraRotX}rad) rotateY(${this.cameraRotY}rad) scale(${this.zoom})`;

    for (const card of this.cards) {
      card.rotationX = 0;
      card.rotationY = 0;
      card.update(time);
    }
  };

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
