export class Card {
  x = 0;
  y = 0;
  z = 0;
  rotationX = 0;
  rotationY = 0;
  width = 200;
  height = 260;
  url: string;
  title: string;
  description: string;
  frontTexture: string;
  isFlipped = false;
  isHovered = false;
  breathPhase: number;
  element: HTMLElement;
  onFlip: (() => void) | null = null;
  onVisit: ((url: string) => void) | null = null;
  private _scale = 1;
  private _opacity = 1;

  private static readonly CARD_WIDTH = 200;
  private static readonly CARD_HEIGHT = 260;
  private static readonly MOBILE_SCALE = 0.6;

  constructor(url: string, isMobile: boolean) {
    this.url = url;
    this.title = this.extractTitle(url);
    this.description = this.extractDescription(url);
    this.breathPhase = Math.random() * Math.PI * 2;
    this.width = Card.CARD_WIDTH * (isMobile ? Card.MOBILE_SCALE : 1);
    this.height = Card.CARD_HEIGHT * (isMobile ? Card.MOBILE_SCALE : 1);
    this.frontTexture = this.generateTexture(url);
    this.element = this.createElement();
  }

  private extractTitle(input: string): string {
    try {
      if (input.startsWith('http://') || input.startsWith('https://')) {
        const u = new URL(input);
        const host = u.hostname.replace('www.', '');
        const parts = host.split('.');
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    } catch {}
    if (input.length > 20) return input.substring(0, 20) + '...';
    return input;
  }

  private extractDescription(input: string): string {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        const u = new URL(input);
        return u.hostname + u.pathname.substring(0, 30);
      } catch {}
    }
    return input.length > 40 ? input.substring(0, 40) + '...' : input;
  }

  generateTexture(text: string): string {
    const hues: number[] = [];
    const saturations: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      hues.push(code % 360);
      saturations.push(50 + (code % 30));
    }

    const h1 = hues.length > 0 ? hues[0] : 200;
    const h2 = hues.length > 1 ? hues[1] : (h1 + 60) % 360;
    const h3 = hues.length > 2 ? hues[2] : (h1 + 180) % 360;
    const s1 = saturations.length > 0 ? saturations[0] : 70;
    const s2 = saturations.length > 1 ? saturations[1] : 60;

    const angle1 = (hues.length > 3 ? hues[3] : 45) % 180;
    const angle2 = (hues.length > 4 ? hues[4] : 135) % 180;

    const gradient1 = `linear-gradient(${angle1}deg, hsl(${h1}, ${s1}%, 45%) 0%, hsl(${h2}, ${s2}%, 30%) 50%, hsl(${h3}, ${s1}%, 20%) 100%)`;
    const gradient2 = `radial-gradient(ellipse at ${30 + (h1 % 40)}% ${20 + (h2 % 60)}%, hsla(${h1}, ${s1}%, 55%, 0.6) 0%, transparent 60%)`;
    const gradient3 = `radial-gradient(circle at ${60 + (h3 % 30)}% ${50 + (h2 % 40)}%, hsla(${h2}, ${s2}%, 50%, 0.4) 0%, transparent 50%)`;

    const patternSteps: string[] = [];
    for (let i = 0; i < Math.min(hues.length, 5); i++) {
      const x = (hues[i] % 80) + 10;
      const y = (hues[(i + 1) % hues.length] % 80) + 10;
      const size = 2 + (hues[i] % 4);
      patternSteps.push(`hsla(${hues[i]}, 80%, 70%, 0.3) ${x}% ${y}% / ${size}px ${size}px`);
    }
    const pattern = patternSteps.length > 0
      ? `radial-gradient(circle, ${patternSteps.join(', ')})`
      : 'none';

    return `${gradient1}, ${gradient2}, ${gradient3}, ${pattern}`;
  }

  private createElement(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.width = this.width + 'px';
    card.style.height = this.height + 'px';

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    front.style.background = this.frontTexture;

    const patternOverlay = document.createElement('div');
    patternOverlay.className = 'card-pattern-overlay';
    this.generateSvgPattern(patternOverlay, this.url);
    front.appendChild(patternOverlay);

    const back = document.createElement('div');
    back.className = 'card-face card-back';

    const title = document.createElement('div');
    title.className = 'card-back-title';
    title.textContent = this.title;

    const desc = document.createElement('div');
    desc.className = 'card-back-desc';
    desc.textContent = this.description;

    const urlText = document.createElement('div');
    urlText.className = 'card-back-url';
    urlText.textContent = this.url.length > 35 ? this.url.substring(0, 35) + '...' : this.url;

    const btn = document.createElement('a');
    btn.className = 'card-back-btn';
    btn.textContent = '访问';
    btn.href = this.url.startsWith('http') ? this.url : '#';
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onVisit) this.onVisit(this.url);
    });

    back.appendChild(title);
    back.appendChild(desc);
    back.appendChild(urlText);
    back.appendChild(btn);

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.card-back-btn')) return;
      this.flip();
    });

    card.addEventListener('mouseenter', () => {
      this.isHovered = true;
      this.updateVisual();
    });

    card.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.updateVisual();
    });

    return card;
  }

  private generateSvgPattern(container: HTMLElement, text: string): void {
    const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    const pseudoRandom = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 49297) * 49297;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 8; i++) {
      const el = document.createElementNS(svgNs, pseudoRandom(i) > 0.5 ? 'circle' : 'rect');
      const hue = (seed + i * 47) % 360;
      el.setAttribute('fill', `hsla(${hue}, 70%, 65%, 0.12)`);
      if (el.tagName === 'circle') {
        el.setAttribute('cx', `${pseudoRandom(i * 2) * 100}%`);
        el.setAttribute('cy', `${pseudoRandom(i * 2 + 1) * 100}%`);
        el.setAttribute('r', `${3 + pseudoRandom(i * 3) * 15}px`);
      } else {
        el.setAttribute('x', `${pseudoRandom(i * 2) * 80}%`);
        el.setAttribute('y', `${pseudoRandom(i * 2 + 1) * 80}%`);
        el.setAttribute('width', `${5 + pseudoRandom(i * 3) * 20}px`);
        el.setAttribute('height', `${5 + pseudoRandom(i * 4) * 20}px`);
        el.setAttribute('rx', '2');
      }
      svg.appendChild(el);
    }

    for (let i = 0; i < 3; i++) {
      const line = document.createElementNS(svgNs, 'line');
      const hue = (seed + i * 73) % 360;
      line.setAttribute('stroke', `hsla(${hue}, 60%, 60%, 0.08)`);
      line.setAttribute('stroke-width', '1');
      line.setAttribute('x1', `${pseudoRandom(i * 5) * 100}%`);
      line.setAttribute('y1', `${pseudoRandom(i * 5 + 1) * 100}%`);
      line.setAttribute('x2', `${pseudoRandom(i * 5 + 2) * 100}%`);
      line.setAttribute('y2', `${pseudoRandom(i * 5 + 3) * 100}%`);
      svg.appendChild(line);
    }

    container.appendChild(svg);
  }

  flip(): void {
    this.isFlipped = !this.isFlipped;
    this.element.classList.toggle('flipped', this.isFlipped);
    if (this.onFlip) this.onFlip();
  }

  updateVisual(): void {
    if (this.isHovered) {
      this._scale = 1.05;
      this.element.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(201, 169, 110, 0.15)';
    } else {
      this._scale = 1;
      this.element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
    }
  }

  update(time: number): void {
    const breathOffset = Math.sin(time * 0.8 + this.breathPhase) * 0.03;
    const hoverScale = this._scale;
    this.element.style.transform = `translate3d(${this.x - this.width / 2}px, ${this.y - this.height / 2}px, ${this.z}px) rotateX(${this.rotationX + breathOffset}rad) rotateY(${this.rotationY}rad) scale(${hoverScale})`;
    this.element.style.opacity = String(this._opacity);
  }

  flyInAnimation(): void {
    this.element.classList.add('card-fly-in');
    this.element.addEventListener('animationend', () => {
      this.element.classList.remove('card-fly-in');
    }, { once: true });
  }

  fadeOutAnimation(): Promise<void> {
    return new Promise((resolve) => {
      this.element.classList.add('card-fade-out');
      this.element.addEventListener('animationend', () => {
        resolve();
      }, { once: true });
    });
  }

  setPosition(x: number, y: number, z: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  setOpacity(val: number): void {
    this._opacity = val;
  }

  dispose(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
