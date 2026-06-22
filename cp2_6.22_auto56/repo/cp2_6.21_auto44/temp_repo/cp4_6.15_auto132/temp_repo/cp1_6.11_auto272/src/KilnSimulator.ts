import * as THREE from 'three';

export type FiringState = 'idle' | 'heating' | 'holding' | 'cooling' | 'complete';

export interface Crack {
  x: number;
  y: number;
  length: number;
  angle: number;
  branches: { x: number; y: number; length: number; angle: number }[];
}

export class KilnSimulator {
  private glazeCanvas: HTMLCanvasElement;
  private glazeCtx: CanvasRenderingContext2D;
  private glazeTexture: THREE.Texture;
  private crackCanvas: HTMLCanvasElement;
  private crackCtx: CanvasRenderingContext2D;
  private crackTexture: THREE.Texture;
  private flowCanvas: HTMLCanvasElement;
  private flowCtx: CanvasRenderingContext2D;
  private baseCanvas: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;

  public temperature: number = 25;
  public targetTemperature: number = 25;
  public heatRate: number = 50;
  public coolingRate: number = 25;
  public state: FiringState = 'idle';
  public elapsedTime: number = 0;
  public holdStartTime: number = 0;
  public holdDuration: number = 0;

  private bubbles: { x: number; y: number; size: number; life: number; speed: number }[] = [];
  private cracks: Crack[] = [];
  private crackTimer: number = 0;
  private lastCrackTime: number = 0;

  private targetMeshes: THREE.Mesh[] = [];

  public onTemperatureChange?: (temp: number) => void;
  public onStateChange?: (state: FiringState) => void;

  private readonly TEXTURE_SIZE = 512;

  constructor() {
    this.glazeCanvas = document.createElement('canvas');
    this.glazeCanvas.width = this.TEXTURE_SIZE;
    this.glazeCanvas.height = this.TEXTURE_SIZE;
    this.glazeCtx = this.glazeCanvas.getContext('2d')!;
    this.glazeTexture = new THREE.CanvasTexture(this.glazeCanvas);
    this.glazeTexture.wrapS = THREE.RepeatWrapping;
    this.glazeTexture.wrapT = THREE.RepeatWrapping;
    this.glazeTexture.needsUpdate = true;

    this.crackCanvas = document.createElement('canvas');
    this.crackCanvas.width = this.TEXTURE_SIZE;
    this.crackCanvas.height = this.TEXTURE_SIZE;
    this.crackCtx = this.crackCanvas.getContext('2d')!;
    this.crackTexture = new THREE.CanvasTexture(this.crackCanvas);
    this.crackTexture.wrapS = THREE.RepeatWrapping;
    this.crackTexture.wrapT = THREE.RepeatWrapping;
    this.crackTexture.needsUpdate = true;

    this.flowCanvas = document.createElement('canvas');
    this.flowCanvas.width = this.TEXTURE_SIZE;
    this.flowCanvas.height = this.TEXTURE_SIZE;
    this.flowCtx = this.flowCanvas.getContext('2d')!;

    this.baseCanvas = document.createElement('canvas');
    this.baseCanvas.width = this.TEXTURE_SIZE;
    this.baseCanvas.height = this.TEXTURE_SIZE;
    this.baseCtx = this.baseCanvas.getContext('2d')!;

    this.initBaseTexture();
    this.initGlazeCanvas();
  }

  private initBaseTexture(): void {
    this.baseCtx.fillStyle = '#D2B48C';
    this.baseCtx.fillRect(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);

    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * this.TEXTURE_SIZE;
      const y = Math.random() * this.TEXTURE_SIZE;
      const size = Math.random() * 2 + 0.5;
      const gray = 180 + Math.random() * 40;
      this.baseCtx.fillStyle = `rgba(${gray}, ${gray - 20}, ${gray - 40}, ${Math.random() * 0.4})`;
      this.baseCtx.beginPath();
      this.baseCtx.arc(x, y, size, 0, Math.PI * 2);
      this.baseCtx.fill();
    }

    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.TEXTURE_SIZE;
      const y = Math.random() * this.TEXTURE_SIZE;
      const w = 10 + Math.random() * 30;
      const h = 2 + Math.random() * 5;
      this.baseCtx.fillStyle = `rgba(139, 90, 43, ${Math.random() * 0.2})`;
      this.baseCtx.save();
      this.baseCtx.translate(x, y);
      this.baseCtx.rotate(Math.random() * Math.PI);
      this.baseCtx.fillRect(-w / 2, -h / 2, w, h);
      this.baseCtx.restore();
    }
  }

  private initGlazeCanvas(): void {
    this.glazeCtx.drawImage(this.baseCanvas, 0, 0);
    this.flowCtx.drawImage(this.glazeCanvas, 0, 0);
    this.crackCtx.clearRect(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);
  }

  public setTargetMeshes(meshes: THREE.Mesh[]): void {
    this.targetMeshes = meshes;
    this.targetMeshes.forEach(mesh => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.map = this.glazeTexture;
        mesh.material.color = new THREE.Color(0xffffff);
        mesh.material.needsUpdate = true;
      }
    });
  }

  public applyGlaze(uvX: number, uvY: number, radius: number, color: string): void {
    const x = uvX * this.TEXTURE_SIZE;
    const y = (1 - uvY) * this.TEXTURE_SIZE;
    const pixelRadius = radius * (this.TEXTURE_SIZE / 200);

    this.glazeCtx.globalCompositeOperation = 'source-over';

    const gradient = this.glazeCtx.createRadialGradient(x, y, 0, x, y, pixelRadius);
    gradient.addColorStop(0, this.hexToRgba(color, 0.95));
    gradient.addColorStop(0.3, this.hexToRgba(color, 0.85));
    gradient.addColorStop(0.6, this.hexToRgba(color, 0.6));
    gradient.addColorStop(0.85, this.hexToRgba(color, 0.25));
    gradient.addColorStop(1, this.hexToRgba(color, 0));

    this.glazeCtx.fillStyle = gradient;
    this.glazeCtx.beginPath();
    this.glazeCtx.arc(x, y, pixelRadius, 0, Math.PI * 2);
    this.glazeCtx.fill();

    this.flowCtx.drawImage(this.glazeCanvas, 0, 0);
    this.glazeTexture.needsUpdate = true;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  public startFiring(targetTemp: number): void {
    this.targetTemperature = targetTemp;
    this.state = 'heating';
    this.holdStartTime = 0;
    this.holdDuration = 0;
    this.onStateChange?.(this.state);
  }

  public pause(): void {
    if (this.state === 'heating') {
      this.state = 'holding';
      this.holdStartTime = this.elapsedTime;
    } else if (this.state === 'holding') {
      this.state = 'heating';
      if (this.holdStartTime > 0) {
        this.holdDuration += this.elapsedTime - this.holdStartTime;
        this.holdStartTime = 0;
      }
    } else if (this.state === 'cooling') {
      this.state = 'holding';
      this.holdStartTime = this.elapsedTime;
    }
    this.onStateChange?.(this.state);
  }

  public startCooling(): void {
    this.state = 'cooling';
    this.coolingRate = this.heatRate * 0.5;
    if (this.holdStartTime > 0) {
      this.holdDuration += this.elapsedTime - this.holdStartTime;
      this.holdStartTime = 0;
    }
    this.onStateChange?.(this.state);
  }

  public update(deltaTime: number): void {
    if (this.state === 'idle' || this.state === 'complete') return;

    this.elapsedTime += deltaTime;

    if (this.state === 'heating') {
      const tempIncrease = this.heatRate * deltaTime;
      if (this.temperature + tempIncrease >= this.targetTemperature) {
        this.temperature = this.targetTemperature;
        this.state = 'holding';
        this.holdStartTime = this.elapsedTime;
        this.onStateChange?.(this.state);
      } else {
        this.temperature += tempIncrease;
      }
    } else if (this.state === 'cooling') {
      const tempDecrease = this.coolingRate * deltaTime;
      if (this.temperature - tempDecrease <= 25) {
        this.temperature = 25;
        this.state = 'complete';
        this.onStateChange?.(this.state);
      } else {
        this.temperature -= tempDecrease;
      }
    }

    this.onTemperatureChange?.(this.temperature);
    this.updateVisuals(deltaTime);
  }

  private updateVisuals(deltaTime: number): void {
    const tempRatio = Math.max(0, Math.min(1, (this.temperature - 25) / (1250 - 25)));

    if (this.temperature >= 500 && this.temperature < 800) {
      this.updateMelting(deltaTime, tempRatio);
    }

    if (this.temperature >= 800 && this.temperature < 1000) {
      this.updateColoring(deltaTime, tempRatio);
      this.updateCracking(deltaTime, tempRatio);
    }

    if (this.temperature >= 1000 && this.temperature <= 1250) {
      this.updateKilnChange(deltaTime, tempRatio);
    }

    if (this.state === 'cooling') {
      this.updateCoolingEffects(deltaTime);
    }

    this.updateMaterialProperties(tempRatio);
  }

  private updateMelting(deltaTime: number, tempRatio: number): void {
    const meltProgress = (this.temperature - 500) / 300;
    const flowIntensity = meltProgress * deltaTime * 1.5;

    const flowData = this.flowCtx.getImageData(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);
    const data = flowData.data;
    const tempData = new Uint8ClampedArray(data);

    for (let y = 0; y < this.TEXTURE_SIZE - 1; y++) {
      for (let x = 0; x < this.TEXTURE_SIZE; x++) {
        const idx = (y * this.TEXTURE_SIZE + x) * 4;
        const belowIdx = ((y + 1) * this.TEXTURE_SIZE + x) * 4;
        const alpha = data[idx + 3];

        if (alpha > 30) {
          const flowAmount = flowIntensity * (alpha / 255) * 0.3;

          for (let c = 0; c < 4; c++) {
            const transfer = (data[idx + c] - data[belowIdx + c]) * flowAmount;
            tempData[idx + c] -= transfer;
            tempData[belowIdx + c] += transfer;
          }

          if (x > 0) {
            const leftIdx = (y * this.TEXTURE_SIZE + x - 1) * 4;
            const leftFlow = flowAmount * 0.2;
            for (let c = 0; c < 4; c++) {
              const transfer = (data[idx + c] - data[leftIdx + c]) * leftFlow;
              tempData[idx + c] -= transfer;
              tempData[leftIdx + c] += transfer;
            }
          }
          if (x < this.TEXTURE_SIZE - 1) {
            const rightIdx = (y * this.TEXTURE_SIZE + x + 1) * 4;
            const rightFlow = flowAmount * 0.2;
            for (let c = 0; c < 4; c++) {
              const transfer = (data[idx + c] - data[rightIdx + c]) * rightFlow;
              tempData[idx + c] -= transfer;
              tempData[rightIdx + c] += transfer;
            }
          }
        }
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = tempData[i];
    }

    this.flowCtx.putImageData(flowData, 0, 0);
    this.glazeCtx.drawImage(this.flowCanvas, 0, 0);

    this.bubbles = this.bubbles.filter(b => b.life > 0);

    const bubbleRate = meltProgress * 8 * deltaTime;
    if (Math.random() < bubbleRate) {
      this.bubbles.push({
        x: Math.random() * this.TEXTURE_SIZE,
        y: this.TEXTURE_SIZE * 0.2 + Math.random() * this.TEXTURE_SIZE * 0.6,
        size: Math.random() * 2 + 1,
        life: 1,
        speed: Math.random() * 30 + 15
      });
    }

    this.glazeCtx.globalCompositeOperation = 'source-over';
    this.bubbles.forEach(bubble => {
      bubble.y -= bubble.speed * deltaTime;
      bubble.life -= deltaTime * 0.4;
      bubble.size += deltaTime * 1.5;

      if (bubble.life > 0) {
        this.glazeCtx.strokeStyle = `rgba(255, 255, 255, ${bubble.life * 0.6})`;
        this.glazeCtx.lineWidth = 0.8;
        this.glazeCtx.beginPath();
        this.glazeCtx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        this.glazeCtx.stroke();

        this.glazeCtx.fillStyle = `rgba(255, 255, 255, ${bubble.life * 0.2})`;
        this.glazeCtx.fill();
      }
    });

    this.glazeTexture.needsUpdate = true;
  }

  private updateColoring(deltaTime: number, tempRatio: number): void {
    const colorProgress = (this.temperature - 800) / 200;

    const imageData = this.glazeCtx.getImageData(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 30) {
        const boost = 1 + colorProgress * 0.3;
        const brightnessBoost = colorProgress * 0.15;

        data[i] = Math.min(255, data[i] * boost + brightnessBoost * 255);
        data[i + 1] = Math.min(255, data[i + 1] * boost * 0.98 + brightnessBoost * 200);
        data[i + 2] = Math.min(255, data[i + 2] * boost * 0.95 + brightnessBoost * 150);
      }
    }

    this.glazeCtx.putImageData(imageData, 0, 0);
    this.flowCtx.drawImage(this.glazeCanvas, 0, 0);
    this.glazeTexture.needsUpdate = true;
  }

  private updateCracking(deltaTime: number, tempRatio: number): void {
    this.crackTimer += deltaTime;

    const crackInterval = Math.max(0.1, 0.5 - tempRatio * 0.4);
    if (this.crackTimer - this.lastCrackTime >= crackInterval) {
      this.lastCrackTime = this.crackTimer;
      this.addCrack();
    }

    this.renderCracks(0.7);
    this.crackTexture.needsUpdate = true;
  }

  private addCrack(): void {
    const centerX = this.TEXTURE_SIZE / 2;
    const centerY = this.TEXTURE_SIZE / 2;

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.TEXTURE_SIZE * 0.35;
    const startX = centerX + Math.cos(angle) * distance;
    const startY = centerY + Math.sin(angle) * distance;

    const length = 10 + Math.random() * 30;
    const crackAngle = Math.random() * Math.PI * 2;

    const branches: { x: number; y: number; length: number; angle: number }[] = [];
    const branchCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < branchCount; i++) {
      const branchDist = length * (0.2 + Math.random() * 0.6);
      branches.push({
        x: startX + Math.cos(crackAngle) * branchDist,
        y: startY + Math.sin(crackAngle) * branchDist,
        length: length * (0.2 + Math.random() * 0.5),
        angle: crackAngle + (Math.random() - 0.5) * Math.PI * 0.7
      });
    }

    this.cracks.push({
      x: startX,
      y: startY,
      length,
      angle: crackAngle,
      branches
    });

    if (this.cracks.length > 150) {
      this.cracks = this.cracks.slice(-150);
    }
  }

  private renderCracks(opacity: number): void {
    this.crackCtx.clearRect(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);
    this.crackCtx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
    this.crackCtx.lineWidth = 1.2;
    this.crackCtx.lineCap = 'round';

    this.cracks.forEach(crack => {
      this.crackCtx.beginPath();
      this.crackCtx.moveTo(crack.x, crack.y);
      const endX = crack.x + Math.cos(crack.angle) * crack.length;
      const endY = crack.y + Math.sin(crack.angle) * crack.length;
      this.crackCtx.lineTo(endX, endY);
      this.crackCtx.stroke();

      crack.branches.forEach(branch => {
        this.crackCtx.beginPath();
        this.crackCtx.moveTo(branch.x, branch.y);
        const bEndX = branch.x + Math.cos(branch.angle) * branch.length;
        const bEndY = branch.y + Math.sin(branch.angle) * branch.length;
        this.crackCtx.lineTo(bEndX, bEndY);
        this.crackCtx.stroke();
      });
    });
  }

  private updateKilnChange(deltaTime: number, tempRatio: number): void {
    const kilnProgress = (this.temperature - 1000) / 250;

    if (Math.random() < deltaTime * 3) {
      const x = Math.random() * this.TEXTURE_SIZE;
      const y = Math.random() * this.TEXTURE_SIZE;
      const size = 15 + Math.random() * 35;

      const imageData = this.glazeCtx.getImageData(
        Math.max(0, Math.floor(x - size)),
        Math.max(0, Math.floor(y - size)),
        Math.min(this.TEXTURE_SIZE, Math.ceil(size * 2)),
        Math.min(this.TEXTURE_SIZE, Math.ceil(size * 2))
      );

      const data = imageData.data;
      const hueShift = (Math.random() - 0.5) * 40;

      for (let i = 0; i < data.length; i += 4) {
        const px = i / 4 % imageData.width;
        const py = Math.floor(i / 4 / imageData.width);
        const dist = Math.sqrt(Math.pow(px - size, 2) + Math.pow(py - size, 2));

        if (dist < size && data[i + 3] > 30) {
          const influence = (1 - dist / size) * kilnProgress * 0.25;
          data[i] = Math.min(255, Math.max(0, data[i] + hueShift * influence));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (hueShift * 0.4) * influence));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - hueShift * 0.6 * influence));
        }
      }

      this.glazeCtx.putImageData(
        imageData,
        Math.max(0, Math.floor(x - size)),
        Math.max(0, Math.floor(y - size))
      );
    }

    const visibleCracks = Math.floor(this.cracks.length * (1 - kilnProgress * 0.6));
    this.crackCtx.clearRect(0, 0, this.TEXTURE_SIZE, this.TEXTURE_SIZE);
    this.crackCtx.strokeStyle = `rgba(0, 0, 0, ${0.3 + (1 - kilnProgress) * 0.4})`;
    this.crackCtx.lineWidth = 0.8 + (1 - kilnProgress) * 0.6;
    this.crackCtx.lineCap = 'round';

    for (let i = 0; i < visibleCracks && i < this.cracks.length; i++) {
      const crack = this.cracks[i];
      const crackScale = 1 - kilnProgress * 0.4;

      this.crackCtx.beginPath();
      this.crackCtx.moveTo(crack.x, crack.y);
      const endX = crack.x + Math.cos(crack.angle) * crack.length * crackScale;
      const endY = crack.y + Math.sin(crack.angle) * crack.length * crackScale;
      this.crackCtx.lineTo(endX, endY);
      this.crackCtx.stroke();
    }

    this.crackTexture.needsUpdate = true;
    this.glazeTexture.needsUpdate = true;
  }

  private updateCoolingEffects(deltaTime: number): void {
    if (this.temperature < 600 && this.temperature > 100) {
      const crackRate = deltaTime * (600 - this.temperature) / 500 * 4;
      if (Math.random() < crackRate) {
        this.addCoolingCrack();
      }
    }

    const tempRatio = (this.temperature - 25) / (1250 - 25);
    const crackOpacity = 0.3 + tempRatio * 0.5;
    this.renderCracks(crackOpacity);

    this.crackTexture.needsUpdate = true;
  }

  private addCoolingCrack(): void {
    const x = Math.random() * this.TEXTURE_SIZE;
    const y = Math.random() * this.TEXTURE_SIZE;
    const length = 3 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;

    this.cracks.push({
      x, y, length, angle,
      branches: []
    });

    if (this.cracks.length > 300) {
      this.cracks = this.cracks.slice(-300);
    }
  }

  private updateMaterialProperties(tempRatio: number): void {
    const roughness = 0.95 - tempRatio * 0.7;
    const metalness = tempRatio * 0.08;
    const emissiveIntensity = tempRatio * tempRatio * 0.3;

    this.targetMeshes.forEach(mesh => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.roughness = roughness;
        mesh.material.metalness = metalness;
        mesh.material.emissive = new THREE.Color(emissiveIntensity * 0.6, emissiveIntensity * 0.3, emissiveIntensity * 0.1);
        mesh.material.emissiveIntensity = emissiveIntensity;
        mesh.material.needsUpdate = true;
      }
    });
  }

  public getCrackDensity(): number {
    return this.cracks.length;
  }

  public getGlazeTexture(): THREE.Texture {
    return this.glazeTexture;
  }

  public getCrackTexture(): THREE.Texture {
    return this.crackTexture;
  }

  public reset(): void {
    this.temperature = 25;
    this.targetTemperature = 25;
    this.state = 'idle';
    this.elapsedTime = 0;
    this.holdStartTime = 0;
    this.holdDuration = 0;
    this.bubbles = [];
    this.cracks = [];
    this.crackTimer = 0;
    this.lastCrackTime = 0;

    this.initGlazeCanvas();

    this.glazeTexture.needsUpdate = true;
    this.crackTexture.needsUpdate = true;

    this.targetMeshes.forEach(mesh => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.roughness = 0.95;
        mesh.material.metalness = 0;
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
        mesh.material.needsUpdate = true;
      }
    });

    this.onTemperatureChange?.(25);
    this.onStateChange?.('idle');
  }
}
