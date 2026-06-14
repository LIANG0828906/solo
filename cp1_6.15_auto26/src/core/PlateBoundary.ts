import * as THREE from 'three';
import type { PlateBoundaryData } from '../data/SeismicData';

export class PlateBoundary {
  private data: PlateBoundaryData;
  private earthRadius: number;
  private group: THREE.Group;
  private line: THREE.Line;
  private glowLine: THREE.Line;
  private hovered: boolean = false;
  private tooltipElement: HTMLElement | null = null;

  constructor(data: PlateBoundaryData, earthRadius: number) {
    this.data = data;
    this.earthRadius = earthRadius;
    this.group = new THREE.Group();
    this.line = this.createLine();
    this.glowLine = this.createGlowLine();
    this.group.add(this.line);
    this.group.add(this.glowLine);
    this.createTooltip();
  }

  private createLine(): THREE.Line {
    const points: THREE.Vector3[] = [];
    
    for (const coord of this.data.coordinates) {
      const lat = coord.lat * Math.PI / 180;
      const lng = coord.lng * Math.PI / 180;
      
      const radius = this.earthRadius * 1.001;
      const x = radius * Math.cos(lat) * Math.cos(lng);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(-lng);
      
      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(this.data.color),
      transparent: true,
      opacity: 0.8,
      linewidth: 1
    });
    
    return new THREE.Line(geometry, material);
  }

  private createGlowLine(): THREE.Line {
    const points: THREE.Vector3[] = [];
    
    for (const coord of this.data.coordinates) {
      const lat = coord.lat * Math.PI / 180;
      const lng = coord.lng * Math.PI / 180;
      
      const radius = this.earthRadius * 1.002;
      const x = radius * Math.cos(lat) * Math.cos(lng);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(-lng);
      
      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(this.data.color),
      transparent: true,
      opacity: 0.3,
      linewidth: 3
    });
    
    const glowLine = new THREE.Line(geometry, material);
    glowLine.userData.isGlow = true;
    
    return glowLine;
  }

  private createTooltip(): void {
    const tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.padding = '12px 16px';
    tooltip.style.background = 'rgba(255, 255, 255, 0.15)';
    tooltip.style.backdropFilter = 'blur(10px)';
    tooltip.style.borderRadius = '12px';
    tooltip.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    tooltip.style.color = '#ffffff';
    tooltip.style.fontSize = '14px';
    tooltip.style.transform = 'scale(0.9)';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    tooltip.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    
    tooltip.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 6px; color: ${this.data.color}">
        ${this.data.name}
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>运动方向：</span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          <span style="font-size: 18px;">${this.getDirectionArrow()}</span>
          ${this.data.movementDirection}
        </span>
      </div>
    `;
    
    this.tooltipElement = tooltip;
    document.body.appendChild(tooltip);
  }

  private getDirectionArrow(): string {
    const direction = this.data.movementDirection;
    if (direction.includes('西北')) return '↖';
    if (direction.includes('东北')) return '↗';
    if (direction.includes('西南')) return '↙';
    if (direction.includes('东南')) return '↘';
    if (direction.includes('北')) return '↑';
    if (direction.includes('南')) return '↓';
    if (direction.includes('东')) return '→';
    if (direction.includes('西')) return '←';
    return '→';
  }

  public onHover(mouseX: number, mouseY: number): void {
    if (!this.hovered) {
      this.hovered = true;
      (this.line.material as THREE.LineBasicMaterial).opacity = 1;
      (this.glowLine.material as THREE.LineBasicMaterial).opacity = 0.6;
      (this.line.material as THREE.LineBasicMaterial).linewidth = 2;
    }
    
    if (this.tooltipElement) {
      this.tooltipElement.style.left = `${mouseX + 15}px`;
      this.tooltipElement.style.top = `${mouseY + 15}px`;
      this.tooltipElement.style.transform = 'scale(1)';
      this.tooltipElement.style.opacity = '1';
    }
  }

  public onHoverEnd(): void {
    if (this.hovered) {
      this.hovered = false;
      (this.line.material as THREE.LineBasicMaterial).opacity = 0.8;
      (this.glowLine.material as THREE.LineBasicMaterial).opacity = 0.3;
      (this.line.material as THREE.LineBasicMaterial).linewidth = 1;
    }
    
    if (this.tooltipElement) {
      this.tooltipElement.style.transform = 'scale(0.9)';
      this.tooltipElement.style.opacity = '0';
    }
  }

  public isHovered(): boolean {
    return this.hovered;
  }

  public getLine(): THREE.Line {
    return this.line;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getData(): PlateBoundaryData {
    return this.data;
  }

  public dispose(): void {
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
    
    this.group.remove(this.line);
    this.group.remove(this.glowLine);
    
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
    this.glowLine.geometry.dispose();
    (this.glowLine.material as THREE.Material).dispose();
  }
}
