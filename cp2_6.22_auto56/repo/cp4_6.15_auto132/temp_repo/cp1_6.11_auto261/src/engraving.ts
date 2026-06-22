import * as THREE from 'three';
import { ParticleSystem } from './particles';
import { playHitSound } from './audio';

export interface EngraveParams {
  angle: number;
  force: number;
  speed: 'slow' | 'medium' | 'fast';
  selectedChar: string | null;
}

export interface EngraveMark {
  x: number;
  y: number;
  force: number;
  char: string | null;
  weathering: number;
}

export class EngravingSystem {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private steleSurface: THREE.Mesh;
  private camera: THREE.Camera;
  private particleSystem: ParticleSystem;
  private marks: EngraveMark[] = [];
  private dispCanvas: HTMLCanvasElement;
  private dispCtx: CanvasRenderingContext2D;
  private dispTex: THREE.CanvasTexture;
  private weatherCanvas: HTMLCanvasElement;
  private weatherCtx: CanvasRenderingContext2D;
  private weatherTex: THREE.CanvasTexture;
  private params: EngraveParams = { angle: 15, force: 5, speed: 'medium', selectedChar: null };
  private shakeOffset = new THREE.Vector3();
  private shakeTime = 0;
  private rubbingsCanvas: HTMLCanvasElement;
  private rubbingsCtx: CanvasRenderingContext2D;

  constructor(
    camera: THREE.Camera,
    steleSurface: THREE.Mesh,
    particleSystem: ParticleSystem,
    dispCanvas: HTMLCanvasElement,
    dispCtx: CanvasRenderingContext2D,
    dispTex: THREE.CanvasTexture,
    weatherCanvas: HTMLCanvasElement,
    weatherCtx: CanvasRenderingContext2D,
    weatherTex: THREE.CanvasTexture,
    rubbingsCanvas: HTMLCanvasElement,
    rubbingsCtx: CanvasRenderingContext2D,
  ) {
    this.camera = camera;
    this.steleSurface = steleSurface;
    this.particleSystem = particleSystem;
    this.dispCanvas = dispCanvas;
    this.dispCtx = dispCtx;
    this.dispTex = dispTex;
    this.weatherCanvas = weatherCanvas;
    this.weatherCtx = weatherCtx;
    this.weatherTex = weatherTex;
    this.rubbingsCanvas = rubbingsCanvas;
    this.rubbingsCtx = rubbingsCtx;
  }

  setParams(params: Partial<EngraveParams>): void {
    Object.assign(this.params, params);
  }

  getParams(): EngraveParams {
    return { ...this.params };
  }

  getMarks(): EngraveMark[] {
    return this.marks;
  }

  engraveAt(event: MouseEvent, renderer: THREE.WebGLRenderer, domElement: HTMLElement): void {
    const rect = domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.steleSurface);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const uv = hit.uv!;

      const forceRatio = this.params.force / 10;
      let radius: number;
      if (forceRatio < 0.33) radius = 8;
      else if (forceRatio < 0.66) radius = 12;
      else radius = 18;

      const canvasRadius = (radius / 512) * 256;

      this.drawPit(this.dispCtx, uv.x * 512, (1 - uv.y) * 512, canvasRadius, forceRatio);
      this.dispTex.needsUpdate = true;

      this.drawRubbingsMark(uv.x, 1 - uv.y, canvasRadius / 256, forceRatio);

      const worldPos = hit.point.clone();
      const normal = hit.face!.normal.clone();
      const tangent = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

      const angleRad = (this.params.angle * Math.PI) / 180;
      const offset = tangent.clone().multiplyScalar(Math.sin(angleRad) * 0.1);

      this.particleSystem.spawnParticles(worldPos.clone().add(offset), 30);

      playHitSound();

      this.shakeTime = 0.2;

      this.marks.push({
        x: uv.x,
        y: uv.y,
        force: this.params.force,
        char: this.params.selectedChar,
        weathering: 0,
      });
    }
  }

  private drawPit(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, force: number): void {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const centerVal = Math.floor(128 - force * 128);
    gradient.addColorStop(0, `rgb(${centerVal}, ${centerVal}, ${centerVal})`);
    gradient.addColorStop(0.6, `rgb(${Math.floor(centerVal * 0.5 + 64)}, ${Math.floor(centerVal * 0.5 + 64)}, ${Math.floor(centerVal * 0.5 + 64)})`);
    gradient.addColorStop(1, 'rgb(128, 128, 128)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRubbingsMark(uvx: number, uvy: number, radius: number, force: number): void {
    const w = this.rubbingsCanvas.width;
    const h = this.rubbingsCanvas.height;
    const cx = uvx * w;
    const cy = uvy * h;
    const r = radius * w * 0.5;

    const alpha = 0.3 + force * 0.7;
    this.rubbingsCtx.fillStyle = `rgba(40, 30, 20, ${alpha})`;
    this.rubbingsCtx.beginPath();
    this.rubbingsCtx.arc(cx, cy, r, 0, Math.PI * 2);
    this.rubbingsCtx.fill();
  }

  applyWeathering(percent: number): void {
    this.weatherCtx.clearRect(0, 0, 512, 512);

    if (percent <= 0) {
      this.weatherTex.needsUpdate = true;
      return;
    }

    for (const mark of this.marks) {
      const cx = mark.x * 512;
      const cy = (1 - mark.y) * 512;
      const radius = (mark.force / 10) * 15 + 5;
      const weatherRadius = radius * (1 + percent * 2);

      this.weatherCtx.fillStyle = `rgba(255, 255, 255, ${0.3 + percent * 0.5})`;
      this.weatherCtx.beginPath();
      this.weatherCtx.arc(cx, cy, weatherRadius, 0, Math.PI * 2);
      this.weatherCtx.fill();

      if (percent > 0.3) {
        const crackCount = Math.floor(percent * 6);
        for (let i = 0; i < crackCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const len = weatherRadius * (0.5 + Math.random());
          this.weatherCtx.strokeStyle = `rgba(43, 26, 0, ${0.3 + percent * 0.5})`;
          this.weatherCtx.lineWidth = 0.5 + Math.random();
          this.weatherCtx.beginPath();
          this.weatherCtx.moveTo(cx, cy);
          let bx = cx;
          let by = cy;
          for (let j = 0; j < 4; j++) {
            bx += Math.cos(angle + (Math.random() - 0.5) * 1.5) * (len / 4);
            by += Math.sin(angle + (Math.random() - 0.5) * 1.5) * (len / 4);
            this.weatherCtx.lineTo(bx, by);
          }
          this.weatherCtx.stroke();
        }
      }
    }

    this.weatherTex.needsUpdate = true;
  }

  updateShake(dt: number, steleGroup: THREE.Group): void {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const intensity = this.shakeTime / 0.2;
      this.shakeOffset.set(
        (Math.random() - 0.5) * 0.01 * intensity,
        (Math.random() - 0.5) * 0.01 * intensity,
        (Math.random() - 0.5) * 0.005 * intensity
      );
      steleGroup.position.x = 0 + this.shakeOffset.x;
      steleGroup.position.y = 0.2 + this.shakeOffset.y;
      steleGroup.position.z = 0 + this.shakeOffset.z;
    }
  }
}
