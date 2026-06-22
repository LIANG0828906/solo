import { HEX_SIZE, getHexCorners, hexToPixel, pixelToHex, hexCircle, hexKey, hexDistance } from '../core/hex_grid';
import { HexCoord, Vec2, Nest, ResourceNode } from '../types';
import { ColonyManager, PheromoneMapImpl } from '../core/colony_manager';
import { AlertZone } from '../types';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface MapRendererState {
  camera: CameraState;
  hoveredHex: HexCoord | null;
  mapRadius: number;
}

export class MapRenderer {
  private ctx: CanvasRenderingContext2D;
  private state: MapRendererState;
  private colony: ColonyManager;
  private animationTime: number = 0;

  constructor(ctx: CanvasRenderingContext2D, colony: ColonyManager) {
    this.ctx = ctx;
    this.colony = colony;
    this.state = {
      camera: { x: 0, y: 0, zoom: 1 },
      hoveredHex: null,
      mapRadius: 15,
    };
  }

  getCamera(): CameraState {
    return this.state.camera;
  }

  setCamera(camera: CameraState): void {
    this.state.camera = camera;
  }

  screenToWorld(screenX: number, screenY: number, canvas: HTMLCanvasElement): Vec2 {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    return {
      x: (screenX - centerX) / this.state.camera.zoom + this.state.camera.x,
      y: (screenY - centerY) / this.state.camera.zoom + this.state.camera.y,
    };
  }

  worldToScreen(worldX: number, worldY: number, canvas: HTMLCanvasElement): Vec2 {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    return {
      x: (worldX - this.state.camera.x) * this.state.camera.zoom + centerX,
      y: (worldY - this.state.camera.y) * this.state.camera.zoom + centerY,
    };
  }

  setHoveredHex(hex: HexCoord | null): void {
    this.state.hoveredHex = hex;
  }

  render(deltaTime: number, canvas: HTMLCanvasElement, alertZones: AlertZone[]): void {
    this.animationTime += deltaTime;
    const ctx = this.ctx;
    const { camera } = this.state;

    ctx.save();
    ctx.fillStyle = '#0a0f14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    this.renderHexGrid();
    this.renderPheromoneMap();
    this.renderResources();
    this.renderNests();
    this.renderAlertZones(alertZones);
    this.renderHoveredHex();

    ctx.restore();
  }

  private renderHexGrid(): void {
    const ctx = this.ctx;
    const { camera, mapRadius } = this.state;

    const centerHex = pixelToHex({ x: camera.x, y: camera.y });
    const visibleRadius = Math.ceil(mapRadius / camera.zoom) + 3;
    const hexes = hexCircle(centerHex, visibleRadius);

    ctx.lineWidth = 1 / camera.zoom;
    ctx.strokeStyle = '#3D5A80';

    for (const hex of hexes) {
      const center = hexToPixel(hex);
      const corners = getHexCorners(center);

      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(corners[i].x, corners[i].y);
      }
      ctx.closePath();

      const distFromCenter = hexDistance(hex, { q: 0, r: 0 });
      if (distFromCenter > mapRadius) {
        ctx.fillStyle = 'rgba(15, 25, 35, 0.3)';
        ctx.fill();
      } else {
        const intensity = 0.02 + (hex.q + hex.r) % 2 * 0.01;
        ctx.fillStyle = `rgba(30, 50, 70, ${intensity})`;
        ctx.fill();
      }
      ctx.stroke();
    }
  }

  private renderPheromoneMap(): void {
    const ctx = this.ctx;
    const pheroMap = this.colony.pheromoneMap as PheromoneMapImpl;
    const cells = pheroMap.getAllCells();

    cells.forEach((cell, key) => {
      const [q, r] = key.split(',').map(Number);
      const hex = { q, r };
      const center = hexToPixel(hex);

      if (cell.toFood > 0.1) {
        const alpha = Math.min(0.35, cell.toFood * 0.08);
        ctx.fillStyle = `rgba(0, 255, 127, ${alpha})`;
        this.drawHexFill(center, HEX_SIZE * 0.9);
      }

      if (cell.toHome > 0.1) {
        const alpha = Math.min(0.35, cell.toHome * 0.08);
        ctx.fillStyle = `rgba(118, 185, 0, ${alpha})`;
        this.drawHexFill(center, HEX_SIZE * 0.9);
      }
    });
  }

  private drawHexFill(center: Vec2, size: number): void {
    const ctx = this.ctx;
    const corners = getHexCorners(center, size);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  private renderResources(): void {
    const ctx = this.ctx;

    this.colony.resources.forEach((resource) => {
      const pulse = 1 + Math.sin(this.animationTime * 2) * 0.05;
      const size = HEX_SIZE * 0.55 * pulse;

      const gradient = ctx.createRadialGradient(
        resource.position.x, resource.position.y, 0,
        resource.position.x, resource.position.y, size * 1.5
      );
      const ratio = resource.amount / resource.maxAmount;
      gradient.addColorStop(0, `rgba(255, 215, 0, ${0.8 * ratio})`);
      gradient.addColorStop(0.6, `rgba(255, 165, 0, ${0.4 * ratio})`);
      gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(resource.position.x, resource.position.y, size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const r = size * (i % 2 === 0 ? 1 : 0.6);
        const x = resource.position.x + Math.cos(angle) * r;
        const y = resource.position.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1.5 / this.state.camera.zoom;
      ctx.stroke();

      if (ratio < 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(resource.position.x - 20, resource.position.y + size + 6, 40, 4);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(resource.position.x - 20, resource.position.y + size + 6, 40 * ratio, 4);
      }
    });
  }

  private renderNests(): void {
    const ctx = this.ctx;

    this.colony.nests.forEach((nest) => {
      this.renderNest(nest);
    });
  }

  private renderNest(nest: Nest): void {
    const ctx = this.ctx;
    const size = HEX_SIZE * 0.7;

    let baseColor = '#8B7355';
    let darkColor = '#5C4033';
    if (nest.type === 'resource_point') {
      baseColor = '#8B7355';
      darkColor = '#6B5344';
    } else if (nest.level >= 3) {
      baseColor = '#708090';
      darkColor = '#505A65';
    } else if (nest.level >= 2) {
      baseColor = '#5C4033';
      darkColor = '#3D2A22';
    }

    if (nest.upgrading) {
      const pulse = 1 + Math.sin(this.animationTime * Math.PI * 2) * 0.1;
      const pulseSize = size * pulse;
      const gradient = ctx.createRadialGradient(
        nest.position.x, nest.position.y, 0,
        nest.position.x, nest.position.y, pulseSize * 2
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(nest.position.x, nest.position.y, pulseSize * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(nest.position.x, nest.position.y + size * 0.2, size * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(nest.position.x, nest.position.y, size * 0.75, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(nest.position.x, nest.position.y + size * 0.1, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (nest.type === 'soldier_nest') {
      ctx.fillStyle = '#FF4500';
      ctx.font = `bold ${size * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚔', nest.position.x, nest.position.y - size * 0.3);
    } else if (nest.type === 'worker_nest') {
      ctx.fillStyle = '#00FF7F';
      ctx.font = `bold ${size * 0.5}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐜', nest.position.x, nest.position.y - size * 0.3);
    }

    if (nest.type !== 'resource_point') {
      for (let i = 0; i < nest.level; i++) {
        const angle = (-Math.PI / 2) + (i - (nest.level - 1) / 2) * 0.4;
        const dotX = nest.position.x + Math.cos(angle) * size * 1.1;
        const dotY = nest.position.y - size * 0.9 + Math.sin(angle) * size * 0.2;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3 / this.state.camera.zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (nest.selected) {
      const ringRadius = size * 1.3 + Math.sin(this.animationTime * 4) * 3;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3 / this.state.camera.zoom;
      ctx.setLineDash([8 / this.state.camera.zoom, 4 / this.state.camera.zoom]);
      ctx.beginPath();
      ctx.arc(nest.position.x, nest.position.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const levelRingRadius = size * 1.5;
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.lineWidth = 2 / this.state.camera.zoom;
      ctx.beginPath();
      ctx.arc(nest.position.x, nest.position.y, levelRingRadius, -Math.PI / 2, -Math.PI / 2 + (nest.level / 5) * Math.PI * 2);
      ctx.stroke();
    }

    if (nest.upgrading) {
      const barWidth = size * 1.6;
      const barX = nest.position.x - barWidth / 2;
      const barY = nest.position.y + size * 1.2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, barY, barWidth, 5);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(barX, barY, barWidth * (nest.upgradeProgress / 2), 5);
    }
  }

  private renderAlertZones(alertZones: AlertZone[]): void {
    const ctx = this.ctx;

    alertZones.forEach((zone) => {
      const flash = (Math.sin(this.animationTime * (Math.PI * 2 / 0.8)) + 1) / 2;
      const alpha = 0.2 + flash * 0.4;

      const gradient = ctx.createRadialGradient(
        zone.position.x, zone.position.y, zone.radius * 0.3,
        zone.position.x, zone.position.y, zone.radius
      );
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha * 0.2})`);
      gradient.addColorStop(0.8, `rgba(255, 60, 60, ${alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(zone.position.x, zone.position.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 50, 50, ${0.5 + flash * 0.5})`;
      ctx.lineWidth = 2.5 / this.state.camera.zoom;
      ctx.setLineDash([10 / this.state.camera.zoom, 6 / this.state.camera.zoom]);
      ctx.lineDashOffset = -this.animationTime * 30;
      ctx.beginPath();
      ctx.arc(zone.position.x, zone.position.y, zone.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = `rgba(255, 50, 50, ${0.7 + flash * 0.3})`;
      ctx.font = `bold ${16 / this.state.camera.zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠', zone.position.x, zone.position.y);
    });
  }

  private renderHoveredHex(): void {
    if (!this.state.hoveredHex) return;
    const ctx = this.ctx;
    const center = hexToPixel(this.state.hoveredHex);
    const corners = getHexCorners(center);

    ctx.fillStyle = 'rgba(118, 185, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#76B900';
    ctx.lineWidth = 2 / this.state.camera.zoom;
    ctx.stroke();
  }
}
