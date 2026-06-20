import * as THREE from 'three';
import {
  CONSTELLATIONS_DATA,
  SHICHEN_CONSTELLATION_MAP,
  Constellation,
  easeOutQuad
} from './utils';

export class ConstellationProjection {
  public group: THREE.Group;
  private linesGroup: THREE.Group;
  private pointsGroup: THREE.Group;
  private labelSprite: THREE.Sprite | null = null;
  private currentConstellationName: string | null = null;
  private isVisible: boolean = false;
  private isDayMode: boolean = false;
  private animationProgress: number = 0;
  private animationDuration: number = 0.5;
  private animationStartTime: number = 0;
  private isAnimating: boolean = false;
  private lineMaterials: THREE.LineBasicMaterial[] = [];
  private pointMaterials: THREE.PointsMaterial[] = [];
  private labelMaterial: THREE.SpriteMaterial | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.linesGroup = new THREE.Group();
    this.pointsGroup = new THREE.Group();
    this.group.add(this.linesGroup);
    this.group.add(this.pointsGroup);
    this.group.visible = false;
  }

  public projectConstellation(shichen: string, dialTopY: number): string | null {
    const constellationName = SHICHEN_CONSTELLATION_MAP[shichen];
    if (!constellationName) return null;

    this.currentConstellationName = constellationName;
    const constellation = CONSTELLATIONS_DATA[constellationName];
    if (!constellation) return null;

    this.clearConstellation();
    this.renderConstellation(constellation, dialTopY);

    this.isVisible = true;
    this.isAnimating = true;
    this.animationStartTime = performance.now();
    this.animationProgress = 0;

    this.updateOpacity(0);
    this.group.visible = !this.isDayMode;

    return constellationName;
  }

  public hideConstellation(): void {
    this.isVisible = false;
    this.group.visible = false;
    this.currentConstellationName = null;
    this.clearConstellation();
  }

  public toggleConstellation(shichen: string, dialTopY: number): string | null {
    if (this.isVisible) {
      this.hideConstellation();
      return null;
    } else {
      return this.projectConstellation(shichen, dialTopY);
    }
  }

  private clearConstellation(): void {
    while (this.linesGroup.children.length > 0) {
      const child = this.linesGroup.children[0];
      this.linesGroup.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
      }
    }

    while (this.pointsGroup.children.length > 0) {
      const child = this.pointsGroup.children[0];
      this.pointsGroup.remove(child);
      if (child instanceof THREE.Points) {
        child.geometry.dispose();
      }
    }

    if (this.labelSprite) {
      this.pointsGroup.remove(this.labelSprite);
      if (this.labelSprite.material instanceof THREE.SpriteMaterial) {
        if (this.labelSprite.material.map) {
          this.labelSprite.material.map.dispose();
        }
        this.labelSprite.material.dispose();
      }
      this.labelSprite = null;
      this.labelMaterial = null;
    }

    this.lineMaterials.forEach(mat => mat.dispose());
    this.pointMaterials.forEach(mat => mat.dispose());
    this.lineMaterials = [];
    this.pointMaterials = [];
  }

  private renderConstellation(constellation: Constellation, dialTopY: number): void {
    const yPos = dialTopY + 0.05;
    const scale = 1.0;

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.5,
      depthTest: false
    });
    this.lineMaterials.push(lineMaterial);

    constellation.lines.forEach(line => {
      const fromPoint = constellation.points[line.from];
      const toPoint = constellation.points[line.to];

      if (!fromPoint || !toPoint) return;

      const points = [
        new THREE.Vector3(fromPoint.x * scale, yPos, fromPoint.y * scale),
        new THREE.Vector3(toPoint.x * scale, yPos, toPoint.y * scale)
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMesh = new THREE.Line(geometry, lineMaterial);
      this.linesGroup.add(lineMesh);
    });

    const pointGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    constellation.points.forEach(point => {
      positions.push(point.x * scale, yPos, point.y * scale);
      colors.push(1.0, 1.0, 1.0);
    });

    pointGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    pointGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    const pointMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      sizeAttenuation: true
    });
    this.pointMaterials.push(pointMaterial);

    const starPoints = new THREE.Points(pointGeometry, pointMaterial);
    this.pointsGroup.add(starPoints);

    const centerX = constellation.centerPoint.x * scale;
    const centerZ = constellation.centerPoint.y * scale;

    this.labelSprite = this.createLabelSprite(constellation.name);
    this.labelSprite.position.set(centerX, yPos + 0.15, centerZ);
    this.labelSprite.scale.set(1.0, 0.5, 1);
    this.pointsGroup.add(this.labelSprite);
  }

  private createLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 40px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(218, 165, 32, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    this.labelMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    return new THREE.Sprite(this.labelMaterial);
  }

  private updateOpacity(opacity: number): void {
    this.lineMaterials.forEach(mat => {
      mat.opacity = opacity * 0.5;
    });

    this.pointMaterials.forEach(mat => {
      mat.opacity = opacity * 0.9;
    });

    if (this.labelMaterial) {
      this.labelMaterial.opacity = opacity;
    }
  }

  public update(_deltaTime: number): void {
    if (this.isAnimating) {
      const elapsed = (performance.now() - this.animationStartTime) / 1000;
      const rawProgress = Math.min(elapsed / this.animationDuration, 1);
      this.animationProgress = easeOutQuad(rawProgress);
      this.updateOpacity(this.animationProgress);

      if (rawProgress >= 1) {
        this.isAnimating = false;
      }
    }
  }

  public setDayMode(isDay: boolean): void {
    this.isDayMode = isDay;
    if (isDay) {
      this.group.visible = false;
    } else {
      this.group.visible = this.isVisible;
    }
  }

  public isConstellationVisible(): boolean {
    return this.isVisible;
  }

  public getCurrentConstellationName(): string | null {
    return this.currentConstellationName;
  }

  public refresh(shichen: string, dialTopY: number): string | null {
    if (this.isVisible) {
      return this.projectConstellation(shichen, dialTopY);
    }
    return null;
  }
}
