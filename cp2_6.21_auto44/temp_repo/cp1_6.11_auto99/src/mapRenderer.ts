import { cityCoordinates, distanceToKm, estimateDuration } from './routePlanner';

interface CityMarker {
  name: string;
  x: number;
  y: number;
  radius: number;
}

interface RouteSegment {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  distance: number;
}

export class MapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cities: string[] = [];
  private routeOrder: string[] = [];
  private distances: number[] = [];
  private animationOffset: number = 0;
  private animationId: number | null = null;
  private markers: CityMarker[] = [];
  private segments: RouteSegment[] = [];
  private tooltip: HTMLElement;
  private hoveredSegmentIndex: number = -1;
  private onClickCallback: ((city: string) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, tooltip: HTMLElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.tooltip = tooltip;
    this.bindEvents();
  }

  setOnCityClick(callback: (city: string) => void): void {
    this.onClickCallback = callback;
  }

  updateData(cities: string[], routeOrder: string[], distances: number[]): void {
    this.cities = cities;
    this.routeOrder = routeOrder;
    this.distances = distances;
    this.updateMarkers();
    this.updateSegments();
  }

  private updateMarkers(): void {
    this.markers = [];
    for (const city of this.cities) {
      const coord = cityCoordinates[city];
      if (coord) {
        this.markers.push({
          name: city,
          x: coord.x,
          y: coord.y,
          radius: 8
        });
      }
    }
  }

  private updateSegments(): void {
    this.segments = [];
    for (let i = 0; i < this.routeOrder.length - 1; i++) {
      const fromCity = this.routeOrder[i];
      const toCity = this.routeOrder[i + 1];
      const fromCoord = cityCoordinates[fromCity];
      const toCoord = cityCoordinates[toCity];
      if (fromCoord && toCoord) {
        this.segments.push({
          fromX: fromCoord.x,
          fromY: fromCoord.y,
          toX: toCoord.x,
          toY: toCoord.y,
          distance: this.distances[i] || 0
        });
      }
    }
  }

  start(): void {
    if (this.animationId) return;
    this.animate();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    this.animationOffset += 1;
    if (this.animationOffset > 16) {
      this.animationOffset = 0;
    }
    this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  };

  draw(): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#E0F7FA');
    gradient.addColorStop(1, '#C8E6C9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    this.drawGrid();
    this.drawRoute();
    this.drawCities();
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const gridSize = 100;

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private drawRoute(): void {
    if (this.segments.length === 0) return;

    const ctx = this.ctx;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];

      const gradient = ctx.createLinearGradient(seg.fromX, seg.fromY, seg.toX, seg.toY);
      gradient.addColorStop(0, '#FF7043');
      gradient.addColorStop(1, '#FFB74D');

      ctx.save();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -this.animationOffset;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(seg.fromX, seg.fromY);
      ctx.lineTo(seg.toX, seg.toY);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawCities(): void {
    const ctx = this.ctx;

    for (const marker of this.markers) {
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, marker.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FF7043';
      ctx.fill();
      ctx.strokeStyle = '#D84315';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '12px Arial';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const textX = marker.x + marker.radius + 6;
      const textY = marker.y;

      ctx.strokeText(marker.name, textX, textY);
      ctx.fillText(marker.name, textX, textY);
    }
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private handleClick(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);

    for (const marker of this.markers) {
      const dx = x - marker.x;
      const dy = y - marker.y;
      if (Math.sqrt(dx * dx + dy * dy) <= marker.radius + 4) {
        if (this.onClickCallback) {
          this.onClickCallback(marker.name);
        }
        return;
      }
    }
  }

  private pointToSegmentDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): { distance: number; midX: number; midY: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
    }

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const distance = Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));

    return {
      distance,
      midX: (x1 + x2) / 2,
      midY: (y1 + y2) / 2
    };
  }

  private handleMouseMove(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);

    let nearestSegIndex = -1;
    let nearestDist = 15;
    let nearestMidX = 0;
    let nearestMidY = 0;

    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const result = this.pointToSegmentDistance(x, y, seg.fromX, seg.fromY, seg.toX, seg.toY);
      if (result.distance < nearestDist) {
        nearestDist = result.distance;
        nearestSegIndex = i;
        nearestMidX = result.midX;
        nearestMidY = result.midY;
      }
    }

    this.hoveredSegmentIndex = nearestSegIndex;

    if (nearestSegIndex >= 0) {
      const seg = this.segments[nearestSegIndex];
      const km = distanceToKm(seg.distance);
      const duration = estimateDuration(km);

      this.tooltip.textContent = `距离：${km} km | 预计：${duration}`;
      this.tooltip.classList.add('visible');

      const rect = this.canvas.getBoundingClientRect();
      const mapSection = this.canvas.parentElement;
      if (!mapSection) return;

      const sectionRect = mapSection.getBoundingClientRect();
      const scaleX = rect.width / this.canvas.width;
      const scaleY = rect.height / this.canvas.height;

      const tooltipX = rect.left - sectionRect.left + nearestMidX * scaleX;
      const tooltipY = rect.top - sectionRect.top + nearestMidY * scaleY - 30;

      this.tooltip.style.left = `${tooltipX}px`;
      this.tooltip.style.top = `${tooltipY}px`;
      this.tooltip.style.transform = 'translateX(-50%)';
    } else {
      this.tooltip.classList.remove('visible');
    }

    let onCity = false;
    for (const marker of this.markers) {
      const dx = x - marker.x;
      const dy = y - marker.y;
      if (Math.sqrt(dx * dx + dy * dy) <= marker.radius + 4) {
        onCity = true;
        break;
      }
    }
    this.canvas.style.cursor = onCity ? 'pointer' : 'default';
  }

  private handleMouseLeave(): void {
    this.hoveredSegmentIndex = -1;
    this.tooltip.classList.remove('visible');
    this.canvas.style.cursor = 'default';
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.draw();
  }
}
