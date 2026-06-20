import * as THREE from 'three';
import { Tween, Easing } from '@tweenjs/tween.js';
import { BoxGeometry, InstancedMesh, MeshStandardMaterial, Vector3, Box3, Color, CanvasTexture } from 'three';

export class BuildingGenerator {
  private windowTextureCache: Map<string, CanvasTexture> = new Map();

  public generateBuildings(
    centerX: number,
    centerZ: number,
    radius: number
  ): { mesh: InstancedMesh; emitPositions: Vector3[]; buildingBoxes: Box3[] } {
    const buildingCount = Math.floor(Math.random() * 201) + 400;

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshStandardMaterial({
      map: this.createWindowTexture(),
      color: 0x1a1a2e,
      roughness: 0.7,
      metalness: 0.1,
      emissive: new Color(0x2891ff),
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.98,
    });

    const instancedMesh = new InstancedMesh(geometry, material, buildingCount);
    const emitPositions: Vector3[] = [];
    const buildingBoxes: Box3[] = [];

    const dummy = new THREE.Object3D();
    const tempMatrix = new THREE.Matrix4();

    for (let i = 0; i < buildingCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;

      const width = Math.random() * 2 + 1;
      const depth = Math.random() * 2 + 1;
      const height = Math.random() * 17 + 3;

      const brightness = Math.random() * 0.7 + 0.3;
      const colorTemp = Math.floor(Math.random() * 3801) + 2700;
      const windowColor = this.colorTemperatureToRGB(colorTemp);
      const emissiveColor = new Color(
        windowColor.r * brightness,
        windowColor.g * brightness,
        windowColor.b * brightness
      );

      dummy.position.set(x, height / 2, z);
      dummy.scale.set(width, height, depth);
      dummy.updateMatrix();
      tempMatrix.copy(dummy.matrix);
      instancedMesh.setMatrixAt(i, tempMatrix);

      instancedMesh.setColorAt(i, emissiveColor);

      const buildingBox = new Box3(
        new Vector3(x - width / 2, 0, z - depth / 2),
        new Vector3(x + width / 2, height, z + depth / 2)
      );
      buildingBoxes.push(buildingBox);

      emitPositions.push(new Vector3(x, height * 0.7, z));

      this.animateBuildingRise(dummy, height, i, tempMatrix, instancedMesh);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }

    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    return { mesh: instancedMesh, emitPositions, buildingBoxes };
  }

  private createWindowTexture(): CanvasTexture {
    const cacheKey = 'default_window';
    if (this.windowTextureCache.has(cacheKey)) {
      return this.windowTextureCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    const width = 256;
    const height = 512;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, width, height);

    const cols = 8;
    const rows = 16;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const margin = 4;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isLit = Math.random() > 0.3;

        if (isLit) {
          const brightness = Math.random() * 0.7 + 0.3;
          const colorTemp = Math.floor(Math.random() * 3801) + 2700;
          const rgb = this.colorTemperatureToRGB(colorTemp);

          const r = Math.floor(rgb.r * brightness * 255);
          const g = Math.floor(rgb.g * brightness * 255);
          const b = Math.floor(rgb.b * brightness * 255);

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#1a1a2e';
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(
          col * cellWidth + margin,
          row * cellHeight + margin,
          cellWidth - margin * 2,
          cellHeight - margin * 2
        );
      }
    }

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#2891ff33';
    ctx.lineWidth = 2;

    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, height);
      ctx.stroke();
    }

    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(width, i * cellHeight);
      ctx.stroke();
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    this.windowTextureCache.set(cacheKey, texture);

    return texture;
  }

  private colorTemperatureToRGB(kelvin: number): { r: number; g: number; b: number } {
    const temp = kelvin / 100;
    let r: number, g: number, b: number;

    if (temp <= 66) {
      r = 1;
      g = Math.min(Math.max(0.3900815787690196 * Math.log(temp) - 0.6318414437886275, 0), 1);
    } else {
      r = Math.min(Math.max(1.2929361860627454 * Math.pow(temp - 60, -0.1332047592), 0), 1);
      g = Math.min(Math.max(1.1298908608952945 * Math.pow(temp - 60, -0.0755148492), 0), 1);
    }

    if (temp >= 66) {
      b = 1;
    } else if (temp <= 19) {
      b = 0;
    } else {
      b = Math.min(Math.max(0.543206789110196 * Math.log(temp - 10) - 1.19625408914, 0), 1);
    }

    return { r, g, b };
  }

  private animateBuildingRise(
    dummy: THREE.Object3D,
    targetHeight: number,
    index: number,
    tempMatrix: THREE.Matrix4,
    instancedMesh: InstancedMesh
  ): void {
    const startHeight = 0.1;
    const position = { y: startHeight };

    new Tween(position)
      .to({ y: targetHeight }, 500)
      .easing(Easing.Quadratic.Out)
      .delay(Math.random() * 500)
      .onUpdate(() => {
        dummy.scale.y = position.y;
        dummy.position.y = position.y / 2;
        dummy.updateMatrix();
        tempMatrix.copy(dummy.matrix);
        instancedMesh.setMatrixAt(index, tempMatrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
      })
      .start();
  }

  public dispose(): void {
    this.windowTextureCache.forEach((texture) => {
      texture.dispose();
    });
    this.windowTextureCache.clear();
  }
}
