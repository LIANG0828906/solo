import { Vector2, Vector2Utils } from './physics';
import { Ship, ResourceType, ResourceTypes, Particle, RippleEffect } from './ship';
import { Starfield, Star, Planet, ResourceNode } from './starfield';

export interface UIState {
  editMode: boolean;
  editWaypoints: Vector2[];
  hoveredWaypoint: number;
  draggingWaypoint: number;
  mouseWorldPos: Vector2;
  lastFuelValue: number;
  lastSpeedValue: number;
  lastResourceValues: Map<ResourceType, number>;
  fuelBlinkTimer: number;
  fuelBlinkState: boolean;
}

export class UI {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private state: UIState;
  private dashOffset: number = 0;
  private dashLength: number = 10;
  private dashGap: number = 10;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.state = {
      editMode: false,
      editWaypoints: [],
      hoveredWaypoint: -1,
      draggingWaypoint: -1,
      mouseWorldPos: Vector2Utils.create(),
      lastFuelValue: 100,
      lastSpeedValue: 0,
      lastResourceValues: new Map(),
      fuelBlinkTimer: 0,
      fuelBlinkState: true
    };

    this.regenDashPattern();
  }

  private regenDashPattern(): void {
    this.dashLength = 8 + Math.random() * 4;
    this.dashGap = 8 + Math.random() * 4;
  }

  getState(): UIState {
    return this.state;
  }

  enterEditMode(waypoints: Vector2[]): void {
    this.state.editMode = true;
    this.state.editWaypoints = waypoints.map(w => Vector2Utils.clone(w));
    const banner = document.getElementById('edit-mode-banner');
    if (banner) banner.classList.add('visible');
  }

  exitEditMode(): Vector2[] {
    this.state.editMode = false;
    this.state.hoveredWaypoint = -1;
    this.state.draggingWaypoint = -1;
    const banner = document.getElementById('edit-mode-banner');
    if (banner) banner.classList.remove('visible');
    return this.state.editWaypoints;
  }

  isEditMode(): boolean {
    return this.state.editMode;
  }

  setMouseWorldPos(pos: Vector2): void {
    this.state.mouseWorldPos = pos;
  }

  handleMouseDown(canvasPos: Vector2): boolean {
    if (!this.state.editMode) return false;

    for (let i = 0; i < this.state.editWaypoints.length; i++) {
      const wp = this.state.editWaypoints[i];
      const dist = Vector2Utils.distance(canvasPos, wp);
      if (dist <= 10) {
        this.state.draggingWaypoint = i;
        return true;
      }
    }
    return false;
  }

  handleMouseMove(canvasPos: Vector2): boolean {
    this.state.mouseWorldPos = canvasPos;

    if (this.state.editMode && this.state.draggingWaypoint >= 0) {
      this.state.editWaypoints[this.state.draggingWaypoint] = Vector2Utils.clone(canvasPos);
      return true;
    }

    if (this.state.editMode) {
      this.state.hoveredWaypoint = -1;
      for (let i = 0; i < this.state.editWaypoints.length; i++) {
        const wp = this.state.editWaypoints[i];
        const dist = Vector2Utils.distance(canvasPos, wp);
        if (dist <= 10) {
          this.state.hoveredWaypoint = i;
          break;
        }
      }
    }

    return false;
  }

  handleMouseUp(): void {
    this.state.draggingWaypoint = -1;
  }

  updateHUD(ship: Ship, dt: number): void {
    this.updateResourcesPanel(ship);
    this.updateFuelPanel(ship, dt);
    this.updateTargetPanel(ship);
    this.updateSpeedDisplay(ship, dt);
  }

  private updateResourcesPanel(ship: Ship): void {
    const panel = document.getElementById('resources-panel');
    if (!panel) return;

    const types: Array<{ type: ResourceType; label: string; color: string }> = [
      { type: ResourceTypes.CRYSTAL, label: '水晶', color: '#a78bfa' },
      { type: ResourceTypes.METAL, label: '金属', color: '#60a5fa' },
      { type: ResourceTypes.GAS, label: '气体', color: '#34d399' },
      { type: ResourceTypes.ENERGY, label: '能量', color: '#fbbf24' }
    ];

    let html = '';
    for (const { type, label, color } of types) {
      const amount = ship.resources.get(type) || 0;
      const prevAmount = this.state.lastResourceValues.get(type) || 0;
      const updated = amount !== prevAmount ? 'updated' : '';

      html += `<div class="resource-item">
        <svg class="resource-icon" viewBox="0 0 16 16">
          <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" fill="${color}" opacity="0.8"/>
        </svg>
        <span class="resource-value ${updated}">${label}: ${amount}</span>
      </div>`;

      if (amount !== prevAmount) {
        this.state.lastResourceValues.set(type, amount);
        const el = panel.querySelector(`[data-type="${type}"]`);
        if (el) {
          setTimeout(() => el.classList.remove('updated'), 200);
        }
      }
    }

    if (panel.innerHTML !== html) {
      panel.innerHTML = html;
    }
  }

  private updateFuelPanel(ship: Ship, dt: number): void {
    const fuelBar = document.getElementById('fuel-bar');
    if (!fuelBar) return;

    const pct = ship.getFuelPercentage();
    fuelBar.style.width = `${pct}%`;

    fuelBar.classList.remove('low', 'critical');

    if (pct < 20) {
      fuelBar.classList.add('low');
    }

    if (pct < 5 && pct > 0) {
      this.state.fuelBlinkTimer += dt;
      if (this.state.fuelBlinkTimer >= 0.25) {
        this.state.fuelBlinkTimer = 0;
        this.state.fuelBlinkState = !this.state.fuelBlinkState;
      }
      fuelBar.style.opacity = this.state.fuelBlinkState ? '1' : '0.3';
      fuelBar.classList.add('critical');
    } else {
      this.state.fuelBlinkTimer = 0;
      this.state.fuelBlinkState = true;
      fuelBar.style.opacity = '1';
    }
  }

  private updateSpeedDisplay(ship: Ship, dt: number): void {
    const speedEl = document.getElementById('speed-value');
    if (!speedEl) return;

    const speed = Math.round(ship.getSpeed());
    const prevSpeed = this.state.lastSpeedValue;

    speedEl.textContent = `${speed}`;

    if (speed !== prevSpeed) {
      speedEl.classList.add('updated');
      this.state.lastSpeedValue = speed;
      setTimeout(() => speedEl.classList.remove('updated'), 200);
    }
  }

  private updateTargetPanel(ship: Ship): void {
    const targetInfo = document.getElementById('target-info');
    if (!targetInfo) return;

    const target = ship.getCurrentTarget();
    if (target) {
      const dist = Math.round(ship.getDistanceToTarget());
      targetInfo.textContent = `目标: (${Math.round(target.x)}, ${Math.round(target.y)}) | 剩余: ${dist} px`;
    } else {
      targetInfo.textContent = '无目标';
    }
  }

  renderBackground(starfield: Starfield, time: number): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#1a1a4e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    const bgStars = starfield.getBackgroundStars();
    for (const star of bgStars) {
      const flicker = 0.5 + 0.5 * Math.sin(time * star.flickerSpeed + star.phase);
      ctx.globalAlpha = star.alpha * flicker;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  renderStars(stars: Star[], time: number): void {
    const ctx = this.ctx;

    for (const star of stars) {
      const flicker = 0.7 + 0.3 * Math.sin(time * star.flickerSpeed + star.flickerPhase);

      const glowGradient = ctx.createRadialGradient(
        star.position.x, star.position.y, 0,
        star.position.x, star.position.y, star.radius * 3
      );
      glowGradient.addColorStop(0, star.color);
      glowGradient.addColorStop(0.5, `rgba(251, 191, 36, ${0.2 * flicker})`);
      glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(star.position.x, star.position.y, star.radius * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = star.color;
      ctx.globalAlpha = flicker;
      ctx.beginPath();
      ctx.arc(star.position.x, star.position.y, star.radius * (0.8 + 0.2 * flicker), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  renderPlanets(planets: Planet[]): void {
    const ctx = this.ctx;

    for (const planet of planets) {
      ctx.strokeStyle = '#47556980';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(
        planet.star.position.x,
        planet.star.position.y,
        planet.semiMajorAxis,
        planet.semiMajorAxis * Math.sqrt(1 - planet.eccentricity * planet.eccentricity),
        0, 0, Math.PI * 2
      );
      ctx.stroke();

      ctx.fillStyle = planet.color;
      ctx.beginPath();
      ctx.arc(planet.position.x, planet.position.y, planet.radius, 0, Math.PI * 2);
      ctx.fill();

      const planetGlow = ctx.createRadialGradient(
        planet.position.x, planet.position.y, planet.radius * 0.5,
        planet.position.x, planet.position.y, planet.radius * 2
      );
      planetGlow.addColorStop(0, planet.color + '40');
      planetGlow.addColorStop(1, planet.color + '00');
      ctx.fillStyle = planetGlow;
      ctx.beginPath();
      ctx.arc(planet.position.x, planet.position.y, planet.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderResourceNodes(nodes: ResourceNode[], time: number): void {
    const ctx = this.ctx;

    for (const node of nodes) {
      if (node.collected) continue;

      const glowIntensity = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * Math.PI * 2 + node.glowPhase));

      const glowGradient = ctx.createRadialGradient(
        node.position.x, node.position.y, node.radius * 0.5,
        node.position.x, node.position.y, node.radius * 2.5
      );
      glowGradient.addColorStop(0, `rgba(34, 197, 94, ${glowIntensity * 0.5})`);
      glowGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, node.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      const scale = node.shrinking ? Math.max(0, 1 - node.shrinkProgress) : 1;
      const drawRadius = node.radius * scale;

      if (drawRadius > 0) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        this.drawHexagon(ctx, node.position.x, node.position.y, drawRadius);
        ctx.fill();

        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        this.drawHexagon(ctx, node.position.x, node.position.y, drawRadius);
        ctx.stroke();
      }

      if (node.isCollecting && node.collectProgress > 0 && !node.shrinking) {
        const barWidth = 40;
        const barHeight = 6;
        const barX = node.position.x - barWidth / 2;
        const barY = node.position.y - node.radius - 12;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const fillWidth = (node.collectProgress / 100) * barWidth;
        const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        progressGradient.addColorStop(0, '#22c55e');
        progressGradient.addColorStop(1, '#4ade80');
        ctx.fillStyle = progressGradient;
        ctx.fillRect(barX, barY, fillWidth, barHeight);
      }
    }
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
  }

  renderRipples(ripples: RippleEffect[]): void {
    const ctx = this.ctx;

    for (const ripple of ripples) {
      ctx.strokeStyle = `rgba(34, 197, 94, ${ripple.alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ripple.position.x, ripple.position.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(34, 197, 94, ${ripple.alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ripple.position.x, ripple.position.y, ripple.radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderShip(ship: Ship, time: number, nearStar: boolean): void {
    const ctx = this.ctx;
    const { position, angle } = ship;

    this.renderParticles(ship.getParticles());

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);

    if (nearStar && ship.isRefueling) {
      const haloAlpha = 0.3 + 0.3 * Math.sin(time * 8);
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.fillStyle = `rgba(251, 191, 36, ${haloAlpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private renderParticles(particles: Particle[]): void {
    const ctx = this.ctx;

    for (const particle of particles) {
      const lifeRatio = particle.life / particle.maxLife;
      const alpha = lifeRatio;
      const size = particle.size * lifeRatio;

      if (size <= 0) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.startColor;
      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  renderWaypoints(ship: Ship, time: number): void {
    const ctx = this.ctx;
    const target = ship.getCurrentTarget();
    const waypoints = this.state.editMode ? this.state.editWaypoints : ship.waypoints;

    if (waypoints.length === 0 && !target) return;

    const points: Vector2[] = this.state.editMode
      ? [ship.position, ...this.state.editWaypoints]
      : (ship.waypoints.length > 0 ? [ship.position, ...ship.waypoints] : (target ? [ship.position, target] : []));

    if (points.length < 2) return;

    if (this.state.editMode) {
      this.dashOffset -= 0.5;
    }

    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.setLineDash(this.dashPatterns);
    ctx.lineDashOffset = this.dashOffset;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    if (this.state.editMode) {
      for (let i = 0; i < this.state.editWaypoints.length; i++) {
        const wp = this.state.editWaypoints[i];
        const isHovered = this.state.hoveredWaypoint === i;
        const isDragging = this.state.draggingWaypoint === i;
        const pointRadius = (isHovered || isDragging) ? 5 : 3;

        ctx.fillStyle = '#a78bfa';
        ctx.strokeStyle = '#c4b5fd';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, pointRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isHovered || isDragging) {
          ctx.fillStyle = '#a78bfa';
          ctx.font = '11px Orbitron, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`(${Math.round(wp.x)}, ${Math.round(wp.y)})`, wp.x, wp.y - 14);
        }
      }
    }

    if (target && !this.state.editMode) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 4);
      ctx.strokeStyle = `rgba(167, 139, 250, ${0.5 + 0.5 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(target.x, target.y, 6 + pulse * 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(target.x, target.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderRefuelIndicator(ship: Ship): void {
    if (!ship.isRefueling) return;

    const ctx = this.ctx;
    const barWidth = 30;
    const barHeight = 4;
    const barX = ship.position.x - barWidth / 2;
    const barY = ship.position.y - 20;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const fillWidth = (ship.fuel / ship.maxFuel) * barWidth;
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    ctx.fillStyle = '#fbbf24';
    ctx.font = '10px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('补充中', ship.position.x, barY - 4);
  }
}
