import * as THREE from 'three';

export interface BuildingData {
  id: number;
  name: string;
  height: number;
  width: number;
  depth: number;
  position: THREE.Vector3;
  barrierLevel: number;
  ventilationValue: number;
  area: number;
}

export type LayerMode = 'both' | 'particles' | 'colors';

type BarrierLevel = '低' | '中' | '高';

export class BuildingManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private rendererDom: HTMLElement;

  public buildingsGroup: THREE.Group;
  public colorBlocksGroup: THREE.Group;
  public buildingData: Map<THREE.Mesh, BuildingData> = new Map();
  private hoveredBuilding: THREE.Mesh | null = null;
  private dataLabelElement: HTMLElement | null = null;
  private labelHideTimer: number | null = null;
  private labelBaseTransform = 'translate(-50%, -100%)';

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    rendererDom: HTMLElement
  ) {
    this.scene = scene;
    this.camera = camera;
    this.rendererDom = rendererDom;

    this.buildingsGroup = new THREE.Group();
    this.colorBlocksGroup = new THREE.Group();
    this.colorBlocksGroup.name = 'colorBlocksGroup';

    this.scene.add(this.buildingsGroup);
    this.scene.add(this.colorBlocksGroup);

    this.createDataLabelDOM();
    this.generateBuildings();
  }

  private createDataLabelDOM(): void {
    this.dataLabelElement = document.createElement('div');
    this.dataLabelElement.className = 'data-label';
    this.dataLabelElement.innerHTML = `
      <div class="data-label-inner">
        <div class="data-label-name"></div>
        <div class="data-label-row"><span>建筑高度</span><span class="dl-height"></span></div>
        <div class="data-label-row"><span>通风潜力</span><span class="dl-vent"></span></div>
        <div class="data-label-row"><span>阻挡等级</span><span class="dl-barrier"></span></div>
      </div>
    `;
    document.querySelector('.ui-overlay')?.appendChild(this.dataLabelElement);
  }

  private getBarrierLevel(level: number): BarrierLevel {
    if (level < 0.33) return '低';
    if (level < 0.66) return '中';
    return '高';
  }

  private getBarrierColor(level: number): THREE.Color {
    if (level < 0.33) {
      const t = level / 0.33;
      return new THREE.Color().lerpColors(
        new THREE.Color(0x4aa0ff),
        new THREE.Color(0xa0c8e8),
        t
      );
    } else if (level < 0.66) {
      const t = (level - 0.33) / 0.33;
      return new THREE.Color().lerpColors(
        new THREE.Color(0xa0c8e8),
        new THREE.Color(0xe8a080),
        t
      );
    } else {
      const t = (level - 0.66) / 0.34;
      return new THREE.Color().lerpColors(
        new THREE.Color(0xe8a080),
        new THREE.Color(0xff6060),
        t
      );
    }
  }

  private getVentilationColor(value: number): THREE.Color {
    if (value < 0.5) {
      const t = value / 0.5;
      return new THREE.Color().lerpColors(
        new THREE.Color(0xff6060),
        new THREE.Color(0xe8c870),
        t
      );
    } else {
      const t = (value - 0.5) / 0.5;
      return new THREE.Color().lerpColors(
        new THREE.Color(0xe8c870),
        new THREE.Color(0x60e8a0),
        t
      );
    }
  }

  private generateBuildings(): void {
    const blocks = [
      { cx: -60, cz: -60 }, { cx: 0, cz: -60 }, { cx: 60, cz: -60 },
      { cx: -60, cz: 0 },  { cx: 60, cz: 0 },
      { cx: -60, cz: 60 }, { cx: 0, cz: 60 }, { cx: 60, cz: 60 },
    ];

    let buildingId = 0;
    const zoneNames = ['A', 'B', 'C', 'D'];
    const blockSize = 40;

    for (let b = 0; b < blocks.length; b++) {
      const block = blocks[b];
      const buildingsPerBlock = b === 4 ? 3 : 2;
      const zone = zoneNames[Math.floor(buildingId / 6)];

      for (let i = 0; i < buildingsPerBlock && buildingId < 20; i++) {
        const offsetX = (i - buildingsPerBlock / 2 + 0.5) * (blockSize / buildingsPerBlock + 5);
        const offsetZ = ((i * 7) % 5 - 2) * 4;

        const width = 8 + Math.random() * 10;
        const depth = 8 + Math.random() * 10;
        const height = 20 + Math.random() * 100;
        const posX = block.cx + offsetX + (Math.random() - 0.5) * 6;
        const posZ = block.cz + offsetZ + (Math.random() - 0.5) * 6;

        const buildingNum = (buildingId % 6) + 1;
        const area = Math.round(width * depth);

        const barrierLevel = Math.random();
        const ventilationValue = 1 - barrierLevel * (0.6 + Math.random() * 0.4);

        const data: BuildingData = {
          id: buildingId,
          name: `${zone}区${buildingNum}号楼`,
          height: Math.round(height),
          width: Math.round(width),
          depth: Math.round(depth),
          position: new THREE.Vector3(posX, height / 2, posZ),
          barrierLevel: Math.round(barrierLevel * 100) / 100,
          ventilationValue: Math.round(ventilationValue * 100) / 100,
          area
        };

        this.createBuildingMesh(data);
        buildingId++;
      }
    }

    while (buildingId < 20) {
      const width = 8 + Math.random() * 10;
      const depth = 8 + Math.random() * 10;
      const height = 20 + Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 30;
      const posX = Math.cos(angle) * radius;
      const posZ = Math.sin(angle) * radius;

      const buildingNum = (buildingId % 6) + 1;
      const zone = zoneNames[Math.floor(buildingId / 6)];
      const area = Math.round(width * depth);

      const barrierLevel = Math.random();
      const ventilationValue = 1 - barrierLevel * (0.6 + Math.random() * 0.4);

      const data: BuildingData = {
        id: buildingId,
        name: `${zone}区${buildingNum}号楼`,
        height: Math.round(height),
        width: Math.round(width),
        depth: Math.round(depth),
        position: new THREE.Vector3(posX, height / 2, posZ),
        barrierLevel: Math.round(barrierLevel * 100) / 100,
        ventilationValue: Math.round(ventilationValue * 100) / 100,
        area
      };

      this.createBuildingMesh(data);
      buildingId++;
    }
  }

  private createBuildingMesh(data: BuildingData): void {
    const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);

    const hue = 0.55 + Math.random() * 0.1;
    const sat = 0.05 + Math.random() * 0.1;
    const light = 0.55 + Math.random() * 0.15;
    const color = new THREE.Color().setHSL(hue, sat, light);

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(data.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.buildingsGroup.add(mesh);
    this.buildingData.set(mesh, data);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x2a3b4c,
      transparent: true,
      opacity: 0.3
    });
    const lineSegments = new THREE.LineSegments(edges, lineMaterial);
    lineSegments.position.copy(data.position);
    this.buildingsGroup.add(lineSegments);
  }

  public setOpacity(opacity: number): void {
    this.buildingsGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj !== this.hoveredBuilding) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        mat.opacity = opacity;
        mat.transparent = opacity < 1.0;
        mat.needsUpdate = true;
      }
    });
  }

  public showVentilationColor(mesh: THREE.Mesh, duration: number = 600): void {
    const data = this.buildingData.get(mesh);
    if (!data) return;

    this.removeColorBlocksForMesh(mesh);

    const colors = [
      this.getBarrierColor(data.barrierLevel),
      this.getVentilationColor(data.ventilationValue)
    ];

    const expandWidth = data.width * 1.15;
    const expandHeight = data.height * 1.15;
    const expandDepth = data.depth * 1.15;
    const maxRadius = Math.sqrt(
      Math.pow(expandWidth / 2, 2) +
      Math.pow(expandHeight / 2, 2) +
      Math.pow(expandDepth / 2, 2)
    );

    const vertexShader = `
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_progress;
      uniform vec3 u_color;
      uniform float u_maxRadius;
      varying vec3 vLocalPos;

      void main() {
        float dist = length(vLocalPos);
        float easedProgress = 1.0 - pow(1.0 - u_progress, 3.0);
        float currentRadius = u_maxRadius * easedProgress;

        float alpha = 0.0;
        if (dist < currentRadius) {
          float relDist = dist / currentRadius;
          alpha = pow(1.0 - relDist, 1.5);
          alpha *= 0.55;
        }

        if (alpha < 0.01) discard;

        gl_FragColor = vec4(u_color, alpha);
      }
    `;

    colors.forEach((color, idx) => {
      const blockGeometry = new THREE.BoxGeometry(expandWidth, expandHeight, expandDepth);

      const blockMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          u_progress: { value: 0 },
          u_color: { value: new THREE.Color(color) },
          u_maxRadius: { value: maxRadius }
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const blockMesh = new THREE.Mesh(blockGeometry, blockMaterial);
      blockMesh.position.copy(mesh.position);
      blockMesh.userData = { sourceMesh: mesh, type: 'ventBlock', side: idx };

      this.colorBlocksGroup.add(blockMesh);
      this.animateColorBlock(blockMesh, duration, idx);
    });
  }

  private animateColorBlock(mesh: THREE.Mesh, duration: number, idx: number = 0): void {
    const material = mesh.material as THREE.ShaderMaterial;
    const startTime = performance.now();
    const phaseOffset = idx * 0.12;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const adjustedProgress = Math.max(0, Math.min(1, (rawProgress - phaseOffset) / (1 - phaseOffset)));
      const easedProgress = 1 - Math.pow(1 - adjustedProgress, 3);

      material.uniforms.u_progress.value = easedProgress;

      if (rawProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.colorBlocksGroup.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    };
    requestAnimationFrame(animate);
  }

  private removeColorBlocksForMesh(mesh: THREE.Mesh): void {
    const toRemove: THREE.Mesh[] = [];
    this.colorBlocksGroup.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.userData.sourceMesh === mesh
      ) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach((m) => {
      this.colorBlocksGroup.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
  }

  public setColorBlocksVisible(visible: boolean): void {
    this.colorBlocksGroup.visible = visible;
  }

  public handleHover(mesh: THREE.Mesh | null): void {
    if (this.hoveredBuilding === mesh) return;

    if (this.hoveredBuilding) {
      const prevMat = this.hoveredBuilding.material as THREE.MeshStandardMaterial;
      prevMat.emissive.setHex(0x000000);
    }

    this.hoveredBuilding = mesh;

    if (mesh) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(0x4080c0);
      mat.emissiveIntensity = 0.2;

      if (this.labelHideTimer !== null) {
        window.clearTimeout(this.labelHideTimer);
        this.labelHideTimer = null;
      }

      this.updateDataLabel(mesh);
      requestAnimationFrame(() => {
        if (this.dataLabelElement) {
          this.dataLabelElement.classList.add('visible');
        }
      });
    } else {
      if (this.dataLabelElement) {
        this.dataLabelElement.classList.remove('visible');
      }
      if (this.labelHideTimer !== null) {
        window.clearTimeout(this.labelHideTimer);
      }
      this.labelHideTimer = window.setTimeout(() => {
        this.labelHideTimer = null;
      }, 500);
    }
  }

  private updateDataLabel(mesh: THREE.Mesh): void {
    const data = this.buildingData.get(mesh);
    if (!data || !this.dataLabelElement) return;

    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    worldPos.y += data.height / 2 + 2;

    const projected = worldPos.clone().project(this.camera);
    const rect = this.rendererDom.getBoundingClientRect();

    const x = (projected.x * 0.5 + 0.5) * rect.width;
    const y = (-projected.y * 0.5 + 0.5) * rect.height;

    this.dataLabelElement.style.left = `${x}px`;
    this.dataLabelElement.style.top = `${y}px`;
    this.dataLabelElement.style.transform = this.labelBaseTransform;
    this.dataLabelElement.style.opacity = '1';

    const nameEl = this.dataLabelElement.querySelector('.data-label-name') as HTMLElement;
    const heightEl = this.dataLabelElement.querySelector('.dl-height') as HTMLElement;
    const ventEl = this.dataLabelElement.querySelector('.dl-vent') as HTMLElement;
    const barrierEl = this.dataLabelElement.querySelector('.dl-barrier') as HTMLElement;

    if (nameEl) nameEl.textContent = data.name;
    if (heightEl) heightEl.textContent = `${data.height} m`;
    if (ventEl) ventEl.textContent = `${Math.round(data.ventilationValue * 100)}%`;
    if (barrierEl) {
      barrierEl.textContent = this.getBarrierLevel(data.barrierLevel);
    }

    requestAnimationFrame(() => {
      if (this.dataLabelElement) {
        this.dataLabelElement.classList.add('visible');
      }
    });
  }

  public updateDataLabelPosition(): void {
    if (this.hoveredBuilding && this.dataLabelElement) {
      this.updateDataLabel(this.hoveredBuilding);
    }
  }

  public getBuildingData(mesh: THREE.Mesh): BuildingData | undefined {
    return this.buildingData.get(mesh);
  }

  public isBuildingMesh(obj: THREE.Object3D): obj is THREE.Mesh {
    return this.buildingData.has(obj as THREE.Mesh);
  }
}
