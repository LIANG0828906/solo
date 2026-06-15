import { createEventDispatcher, EventDispatcher, generateUniqueId } from './utils';

export interface GeologicalPeriod {
  id: string;
  name: string;
  abbreviation: string;
  startAge: number;
  endAge: number;
  color: string;
}

export const GEOLOGICAL_PERIODS: GeologicalPeriod[] = [
  { id: 'cambrian', name: '寒武纪', abbreviation: '寒', startAge: 541, endAge: 485.4, color: '#7fa052' },
  { id: 'ordovician', name: '奥陶纪', abbreviation: '奥', startAge: 485.4, endAge: 443.8, color: '#009270' },
  { id: 'silurian', name: '志留纪', abbreviation: '志', startAge: 443.8, endAge: 419.2, color: '#b3e1c6' },
  { id: 'devonian', name: '泥盆纪', abbreviation: '泥', startAge: 419.2, endAge: 358.9, color: '#cb8c37' },
  { id: 'carboniferous', name: '石炭纪', abbreviation: '石', startAge: 358.9, endAge: 298.9, color: '#67a59a' },
  { id: 'permian', name: '二叠纪', abbreviation: '二', startAge: 298.9, endAge: 252.2, color: '#e86a6a' },
];

interface TimelineEvents {
  periodChange: string;
}

export class GeologicalTimeline {
  private container: HTMLElement | null = null;
  private highlightEl: HTMLElement | null = null;
  private currentPeriodId: string = GEOLOGICAL_PERIODS[0].id;
  private dispatcher: EventDispatcher<TimelineEvents>;
  private nodeElements: HTMLElement[] = [];
  private instanceId: string;

  constructor() {
    this.dispatcher = createEventDispatcher<TimelineEvents>();
    this.instanceId = generateUniqueId('timeline');
  }

  render(container: HTMLElement): void {
    this.container = container;
    this.highlightEl = container.querySelector('.timeline-highlight') as HTMLElement;
    this.nodeElements = [];

    GEOLOGICAL_PERIODS.forEach((period, index) => {
      const node = this.createPeriodNode(period);
      container.insertBefore(node, this.highlightEl);
      this.nodeElements.push(node);

      if (index < GEOLOGICAL_PERIODS.length - 1) {
        const connector = document.createElement('div');
        connector.className = 'timeline-connector';
        container.insertBefore(connector, this.highlightEl);
      }
    });

    this.setActivePeriod(this.currentPeriodId, false);
  }

  private createPeriodNode(period: GeologicalPeriod): HTMLElement {
    const node = document.createElement('div');
    node.className = 'timeline-node';
    node.dataset.periodId = period.id;

    const dot = document.createElement('div');
    dot.className = 'timeline-dot';
    dot.textContent = period.abbreviation;

    const label = document.createElement('div');
    label.className = 'timeline-label';
    label.textContent = period.name;

    node.appendChild(dot);
    node.appendChild(label);

    node.addEventListener('click', () => {
      if (period.id !== this.currentPeriodId) {
        this.setActivePeriod(period.id);
        this.dispatcher.dispatch('periodChange', period.id);
      }
    });

    return node;
  }

  setActivePeriod(periodId: string, animate: boolean = true): void {
    this.currentPeriodId = periodId;

    this.nodeElements.forEach((node) => {
      if (node.dataset.periodId === periodId) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    this.updateHighlightPosition(animate);
  }

  private updateHighlightPosition(animate: boolean = true): void {
    if (!this.highlightEl || this.nodeElements.length === 0) return;

    const activeNode = this.nodeElements.find(
      (node) => node.dataset.periodId === this.currentPeriodId
    );

    if (activeNode) {
      const containerRect = this.container!.getBoundingClientRect();
      const nodeRect = activeNode.getBoundingClientRect();
      const dotEl = activeNode.querySelector('.timeline-dot') as HTMLElement;
      const dotRect = dotEl.getBoundingClientRect();

      const left = nodeRect.left - containerRect.left + (nodeRect.width - dotRect.width) / 2;

      if (!animate) {
        this.highlightEl.style.transition = 'none';
      }

      this.highlightEl.style.left = `${left}px`;

      if (!animate) {
        this.highlightEl.offsetHeight;
        this.highlightEl.style.transition = '';
      }
    }
  }

  onPeriodChange(callback: (periodId: string) => void): () => void {
    return this.dispatcher.on('periodChange', callback);
  }

  getCurrentPeriodId(): string {
    return this.currentPeriodId;
  }

  getCurrentPeriod(): GeologicalPeriod | undefined {
    return GEOLOGICAL_PERIODS.find((p) => p.id === this.currentPeriodId);
  }

  handleResize(): void {
    this.updateHighlightPosition(false);
  }

  dispose(): void {
    this.nodeElements.forEach((node) => {
      node.replaceWith(node.cloneNode(true));
    });
    this.nodeElements = [];
    this.container = null;
    this.highlightEl = null;
  }
}
