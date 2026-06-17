import { gsap } from 'gsap';
import type { CelestialBody } from '../utils/types';
import { EventBus } from '../core/bus';

export class InfoCard {
  private container: HTMLElement;
  private bus: EventBus;
  private card: HTMLDivElement;
  private headerDot: HTMLDivElement;
  private titleEl: HTMLHeadingElement;
  private massEl: HTMLSpanElement;
  private orbitEl: HTMLSpanElement;
  private periodEl: HTMLSpanElement;
  private radiusEl: HTMLSpanElement;
  private isVisible: boolean;
  private cachedBodies: Map<string, CelestialBody>;

  constructor(container: HTMLElement, bus: EventBus) {
    this.container = container;
    this.bus = bus;
    this.isVisible = false;
    this.cachedBodies = new Map();

    this.card = document.createElement('div');
    this.card.className = 'info-card';

    const header = document.createElement('div');
    header.className = 'info-card-header';

    this.headerDot = document.createElement('div');
    this.headerDot.className = 'info-card-dot';

    this.titleEl = document.createElement('h3');
    this.titleEl.className = 'info-card-title';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'info-card-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(this.headerDot);
    header.appendChild(this.titleEl);
    header.appendChild(closeBtn);

    const list = document.createElement('ul');
    list.className = 'info-card-list';

    const massItem = this.createListItem('质量', '');
    const orbitItem = this.createListItem('轨道半径', '');
    const periodItem = this.createListItem('公转周期', '');
    const radiusItem = this.createListItem('星体半径', '');

    this.massEl = massItem.valueEl;
    this.orbitEl = orbitItem.valueEl;
    this.periodEl = periodItem.valueEl;
    this.radiusEl = radiusItem.valueEl;

    list.appendChild(massItem.li);
    list.appendChild(orbitItem.li);
    list.appendChild(periodItem.li);
    list.appendChild(radiusItem.li);

    this.card.appendChild(header);
    this.card.appendChild(list);

    this.container.appendChild(this.card);

    this.subscribeEvents();
  }

  private createListItem(
    label: string,
    value: string
  ): { li: HTMLLIElement; valueEl: HTMLSpanElement } {
    const li = document.createElement('li');
    li.className = 'info-card-item';

    const labelEl = document.createElement('span');
    labelEl.className = 'info-card-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'info-card-value';
    valueEl.textContent = value;

    li.appendChild(labelEl);
    li.appendChild(valueEl);

    return { li, valueEl };
  }

  private subscribeEvents(): void {
    this.bus.on('bodies:update', (bodies) => {
      this.cachedBodies.clear();
      for (const body of bodies) {
        this.cachedBodies.set(body.id, body);
      }
    });

    this.bus.on('body:click', ({ body }) => {
      const fullBody = this.cachedBodies.get(body.id);
      if (fullBody && fullBody.type === 'planet') {
        this.show(fullBody);
      }
    });
  }

  private show(body: CelestialBody): void {
    this.titleEl.textContent = body.name;
    this.headerDot.style.backgroundColor = body.color;
    this.headerDot.style.color = body.color;
    this.massEl.textContent = `${body.mass.toFixed(3)} M☉`;
    this.orbitEl.textContent = `${body.orbitRadius.toFixed(2)} AU`;
    this.radiusEl.textContent = `${body.radius.toFixed(2)} R⊕`;

    const period =
      body.type === 'planet' && body.orbitSpeed > 0
        ? (2 * Math.PI) / body.orbitSpeed
        : 0;
    this.periodEl.textContent = period > 0 ? `${period.toFixed(2)} s` : '—';

    if (!this.isVisible) {
      this.isVisible = true;
      gsap.fromTo(
        this.card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
          onStart: () => {
            this.card.classList.add('visible');
          }
        }
      );
    }
  }

  private hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    gsap.to(this.card, {
      opacity: 0,
      y: 40,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        this.card.classList.remove('visible');
      }
    });
  }

  public dispose(): void {
    this.card.remove();
  }
}
