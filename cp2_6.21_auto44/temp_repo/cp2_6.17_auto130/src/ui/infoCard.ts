import gsap from 'gsap';
import { EventBus, BodyState } from '../types';

export class InfoCard {
  private card: HTMLElement;
  private eventBus: EventBus;
  private bodies: BodyState[] = [];
  private isVisible: boolean = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.card = document.getElementById('info-card') as HTMLElement;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on('bodies:initialized', (bodies) => {
      this.bodies = bodies as BodyState[];
    });

    this.eventBus.on('body:clicked', (bodyId, clientX, clientY) => {
      const body = this.bodies.find((b) => b.id === bodyId);
      if (body) {
        this.showCard(body, clientX as number, clientY as number);
      }
    });

    this.eventBus.on('scene:clicked', () => {
      this.hideCard();
    });
  }

  private showCard(body: BodyState, _clientX: number, clientY: number): void {
    const cardTitle = document.getElementById('card-title');
    const cardName = document.getElementById('card-name');
    const cardMass = document.getElementById('card-mass');
    const cardOrbit = document.getElementById('card-orbit');
    const cardPeriod = document.getElementById('card-period');

    if (cardTitle) cardTitle.textContent = body.type === 'star' ? '⭐ 恒星信息' : '🪐 行星信息';
    if (cardName) cardName.textContent = body.name;
    if (cardMass) cardMass.textContent = body.mass.toFixed(3) + ' M☉';
    if (cardOrbit) {
      cardOrbit.textContent = body.type === 'star'
        ? 'N/A (中心天体)'
        : body.orbitRadius.toFixed(2) + ' AU';
    }
    if (cardPeriod) {
      if (body.type === 'star') {
        cardPeriod.textContent = 'N/A';
      } else {
        const period = this.calculatePeriod(body.orbitRadius);
        cardPeriod.textContent = period.toFixed(2) + ' 地球年';
      }
    }

    this.positionCard(clientY);

    if (!this.isVisible) {
      this.isVisible = true;

      gsap.fromTo(
        this.card,
        {
          opacity: 0,
          y: 30,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
          onStart: () => {
            this.card.classList.add('visible');
          }
        }
      );
    }
  }

  private positionCard(clientY: number): void {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const cardWidth = 300;
    const cardHeight = this.card.offsetHeight || 200;

    let left = windowWidth - cardWidth - 40;
    let top = clientY - cardHeight / 2;

    if (windowWidth < 768) {
      left = (windowWidth - cardWidth) / 2;
      top = Math.min(windowHeight - cardHeight - 20, Math.max(20, clientY - cardHeight - 10));
    } else {
      left = Math.min(left, windowWidth - cardWidth - 20);
      top = Math.max(20, Math.min(windowHeight - cardHeight - 20, top));
    }

    this.card.style.left = left + 'px';
    this.card.style.top = top + 'px';
  }

  private calculatePeriod(orbitRadius: number): number {
    return 2 * Math.PI * orbitRadius / Math.sqrt(orbitRadius);
  }

  private hideCard(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    gsap.to(this.card, {
      opacity: 0,
      y: 20,
      scale: 0.98,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        this.card.classList.remove('visible');
        this.eventBus.emit('card:closed');
      }
    });
  }

  updatePosition(_clientX: number, clientY: number): void {
    if (this.isVisible) {
      this.positionCard(clientY);
    }
  }

  destroy(): void {
    // Cleanup if needed
  }
}
