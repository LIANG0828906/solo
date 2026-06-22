import * as THREE from 'three';

export interface OrganelleData {
  type: string;
  name: string;
  nameEn: string;
  position: THREE.Vector3;
  baseColor: number;
  highlightColor: number;
}

export class OrganelleInstance {
  public group: THREE.Group;
  public data: OrganelleData;
  public mesh: THREE.Mesh;
  public outlineMesh: THREE.Mesh | null = null;
  public baseMaterial: THREE.MeshStandardMaterial;
  public isHighlighted: boolean = false;
  public floatOffset: number;
  public floatSpeed: number;
  public rotationSpeed: THREE.Vector3;
  public basePosition: THREE.Vector3;
  public boundingRadius: number;
}

export const ORGANELLE_TYPES: Record<string, { name: string; nameEn: string; baseColor: number; highlightColor: number; count: number }> = {
  mitochondrion: { name: '线粒体', nameEn: 'Mitochondrion', baseColor: 0xe85d4a, highlightColor: 0xff8a6b, count: 15 },
  endoplasmicReticulum: { name: '内质网', nameEn: 'Endoplasmic Reticulum', baseColor: 0x6bc9a7, highlightColor: 0x9ae8c8, count: 6 },
  golgi: { name: '高尔基体', nameEn: 'Golgi Apparatus', baseColor: 0xb388e6, highlightColor: 0xd8b0ff, count: 4 },
  lysosome: { name: '溶酶体', nameEn: 'Lysosome', baseColor: 0xe0a44c, highlightColor: 0xffcc7a, count: 12 },
  nucleus: { name: '细胞核', nameEn: 'Nucleus', baseColor: 0x8b6fd8, highlightColor: 0xb59fff, count: 1 }
};

export class OrganelleManager {
  private scene: THREE.Scene;
  private cellRadius: number;
  public organelles: OrganelleInstance[] = [];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredOrganelle: OrganelleInstance | null = null;
  private selectedOrganelle: OrganelleInstance | null = null;
  private particleSystems: THREE.Points[] = [];

  private onHoverCallback: ((x: number, y: number, name: string, type: string) => void) | null = null;
  private onHoverLeaveCallback: (() => void) | null = null;
  private onClickCallback: ((type: string) => void) | null = null;
  private onCurrentViewChangeCallback: ((name: string, nameEn: string) => void) | null = null;

  constructor(scene: THREE.Scene, cellRadius: number) {
    this.scene = scene;
    this.cellRadius = cellRadius;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = cellRadius * 2;
    this.mouse = new THREE.Vector2();
    this.generateOrganelles();
  }

  private generateOrganelles(): void {
    const nucleusType = ORGANELLE_TYPES['nucleus'];
    const nucleusInstance = this.createNucleus(new THREE.Vector3(0, 0, 0), nucleusType.baseColor);
    this.organelles.push(nucleusInstance);

    const nucleusRadius = nucleusInstance.boundingRadius;

    const types = Object.keys(ORGANELLE_TYPES).filter(t => t !== 'nucleus');
    for (const type of types) {
      const config = ORGANELLE_TYPES[type];
      for (let i = 0; i < config.count; i++) {
        const position = this.getRandomPosition(nucleusRadius + 5, this.cellRadius - 6);
        const instance = this.createOrganelle(type, position, config.baseColor);
        if (instance) {
          this.organelles.push(instance);
        }
      }
    }
  }

  private getRandomPosition(minDist: number, maxDist: number): THREE.Vector3 {
    for (let attempt = 0; attempt < 50; attempt++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = minDist + Math.random() * (maxDist - minDist);
      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      let valid = true;
      for (const organelle of this.organelles) {
        const minGap = organelle.boundingRadius + 2.5;
        if (pos.distanceTo(organelle.basePosition) < minGap) {
          valid = false;
          break;
        }
      }
      if (valid) return pos;
    }
    return new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10);
  }

  private createOrganelle(type: string, position: THREE.Vector3, color: number): OrganelleInstance | null {
    const config = ORGANELLE_TYPES[type];
    const group = new THREE.Group();
    group.position.copy(position);

    let mesh: THREE.Mesh;
    let boundingRadius: number;

    switch (type) {
      case 'mitochondrion':
        mesh = this.createMitochondrion(color);
        boundingRadius = 2.2;
        break;
      case 'endoplasmicReticulum':
        mesh = this.createEndoplasmicReticulum(color);
        boundingRadius = 5.5;
        break;
      case 'golgi':
        mesh = this.createGolgi(color);
        boundingRadius = 4.0;
        break;
      case 'lysosome':
        mesh = this.createLysosome(color);
        boundingRadius = 1.2;
        break;
      default:
        return null;
    }

    group.add(mesh);
    this.scene.add(group);

    const material = mesh.material as THREE.MeshStandardMaterial;

    return {
      group,
      mesh,
      baseMaterial: material,
      data: {
        type,
        name: config.name,
        nameEn: config.nameEn,
        position: position.clone(),
        baseColor: config.baseColor,
        highlightColor: config.highlightColor
      },
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.4 + Math.random() * 0.6,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.008
      ),
      basePosition: position.clone(),
      boundingRadius,
      isHighlighted: false
    };
  }

  private createMitochondrion(color: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) * 1.8;
      const y = positions.getY(i) * 0.85;
      const z = positions.getZ(i) * 0.95;
      positions.setXYZ(i, x, y, z);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.55,
      metalness: 0.15,
      emissive: new THREE.Color(color).multiplyScalar(0.08)
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const ridgesCount = 10;
    for (let i = 0; i < ridgesCount; i++) {
      const ridgeGeom = new THREE.TorusGeometry(0.7, 0.06, 12, 24);
      const ridgeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(0.55),
        roughness: 0.6,
        metalness: 0.1
      });
      const ridge = new THREE.Mesh(ridgeGeom, ridgeMat);
      const t = (i / ridgesCount) * 2 - 1;
      ridge.position.x = t * 1.3;
      const scale = Math.sqrt(Math.max(0, 1 - t * t * 0.75));
      ridge.scale.set(scale, scale, 1);
      ridge.rotation.y = Math.PI / 2;
      ridge.rotation.z = (Math.random() - 0.5) * 0.3;
      mesh.add(ridge);
    }

    return mesh;
  }

  private createEndoplasmicReticulum(color: number): THREE.Mesh {
    const group = new THREE.Group();

    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1.0;
      const sphereGeom = new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.92,
        emissive: new THREE.Color(color).multiplyScalar(0.06)
      });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 3,
        Math.sin(angle) * radius
      );
      sphere.castShadow = true;
      group.add(sphere);
    }

    for (let i = 0; i < 16; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 4
      );
      const length = 1.2 + Math.random() * 2.2;
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.6,
        Math.random() - 0.5
      ).normalize();

      const tubeGeom = new THREE.CylinderGeometry(0.15, 0.18, length, 10);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(0.85),
        roughness: 0.75,
        metalness: 0.05,
        transparent: true,
        opacity: 0.88
      });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      tube.position.copy(start).add(dir.clone().multiplyScalar(length / 2));
      tube.lookAt(start.clone().add(dir.clone().multiplyScalar(length)));
      tube.rotateX(Math.PI / 2);
      tube.castShadow = true;
      group.add(tube);
    }

    const mergedGeom = new THREE.SphereGeometry(4.5, 16, 16);
    const dummyMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    const boundingMesh = new THREE.Mesh(mergedGeom, dummyMat);
    boundingMesh.add(group);
    boundingMesh.castShadow = true;
    boundingMesh.receiveShadow = true;

    return boundingMesh;
  }

  private createGolgi(color: number): THREE.Mesh {
    const group = new THREE.Group();
    const stacks = 5;

    for (let i = 0; i < stacks; i++) {
      const t = (i - (stacks - 1) / 2) / ((stacks - 1) / 2);
      const radius = 2.6 - Math.abs(t) * 0.8;
      const curveGeom = new THREE.TorusGeometry(radius, 0.18, 12, 48, Math.PI * 1.5);
      const curveMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), Math.abs(t) * 0.2),
        roughness: 0.6,
        metalness: 0.15,
        emissive: new THREE.Color(color).multiplyScalar(0.05)
      });
      const curve = new THREE.Mesh(curveGeom, curveMat);
      curve.rotation.x = Math.PI / 2;
      curve.rotation.z = Math.PI / 4;
      curve.position.y = t * 0.6;
      curve.castShadow = true;
      group.add(curve);
    }

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 2.0 + Math.random() * 0.8;
      const vesicleGeom = new THREE.SphereGeometry(0.3 + Math.random() * 0.25, 16, 16);
      const vesicleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(0.9),
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      const vesicle = new THREE.Mesh(vesicleGeom, vesicleMat);
      vesicle.position.set(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 1.2,
        Math.sin(angle) * r
      );
      vesicle.castShadow = true;
      group.add(vesicle);
    }

    const mergedGeom = new THREE.SphereGeometry(3.5, 16, 16);
    const dummyMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
    const boundingMesh = new THREE.Mesh(mergedGeom, dummyMat);
    boundingMesh.add(group);
    boundingMesh.castShadow = true;
    boundingMesh.receiveShadow = true;

    return boundingMesh;
  }

  private createLysosome(color: number): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 20, 20);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.45,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(color).multiplyScalar(0.12)
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const innerGeom = new THREE.SphereGeometry(0.6, 16, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.55),
      roughness: 0.6,
      metalness: 0.05
    });
    const inner = new THREE.Mesh(innerGeom, innerMat);
    mesh.add(inner);

    return mesh;
  }

  private createNucleus(position: THREE.Vector3, color: number): OrganelleInstance {
    const config = ORGANELLE_TYPES['nucleus'];
    const group = new THREE.Group();
    group.position.copy(position);

    const geometry = new THREE.SphereGeometry(7, 48, 48);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.35,
      metalness: 0.2,
      emissive: new THREE.Color(color).multiplyScalar(0.1),
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const nucleolusGeom = new THREE.SphereGeometry(2.2, 24, 24);
    const nucleolusMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.65),
      roughness: 0.4,
      metalness: 0.15
    });
    const nucleolus = new THREE.Mesh(nucleolusGeom, nucleolusMat);
    nucleolus.position.set(1.5, -0.8, 2.0);
    mesh.add(nucleolus);

    const poreCount = 120;
    for (let i = 0; i < poreCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 7.02;
      const poreGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.15, 8);
      const poreMat = new THREE.MeshStandardMaterial({
        color: 0x1a1030,
        roughness: 0.8,
        metalness: 0.1
      });
      const pore = new THREE.Mesh(poreGeom, poreMat);
      pore.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      pore.lookAt(0, 0, 0);
      pore.rotateX(Math.PI / 2);
      mesh.add(pore);
    }

    const dnaSegments = 14;
    for (let i = 0; i < dnaSegments; i++) {
      const curvePoints: THREE.Vector3[] = [];
      const startTheta = Math.random() * Math.PI * 2;
      const startPhi = Math.acos(2 * Math.random() - 1);
      const helixRadius = 1.8 + Math.random() * 1.5;
      const turns = 2 + Math.random() * 2;
      const height = 3 + Math.random() * 2;
      const offsetX = (Math.random() - 0.5) * 5;
      const offsetY = (Math.random() - 0.5) * 4;
      const offsetZ = (Math.random() - 0.5) * 5;

      for (let t = 0; t <= 1; t += 0.05) {
        const angle = startTheta + t * turns * Math.PI * 2;
        const y = startPhi * 0.5 + (t - 0.5) * height;
        curvePoints.push(new THREE.Vector3(
          offsetX + Math.cos(angle) * helixRadius * Math.sin(startPhi),
          offsetY + y,
          offsetZ + Math.sin(angle) * helixRadius * Math.sin(startPhi)
        ));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.08, 6, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xcc88ff).multiplyScalar(0.8),
        emissive: new THREE.Color(0x9955dd).multiplyScalar(0.4),
        roughness: 0.4,
        metalness: 0.15
      });
      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      mesh.add(tube);
    }

    this.scene.add(group);

    return {
      group,
      mesh,
      baseMaterial: material,
      data: {
        type: 'nucleus',
        name: config.name,
        nameEn: config.nameEn,
        position: position.clone(),
        baseColor: config.baseColor,
        highlightColor: config.highlightColor
      },
      floatOffset: 0,
      floatSpeed: 0.25,
      rotationSpeed: new THREE.Vector3(0.002, 0.0035, 0.002),
      basePosition: position.clone(),
      boundingRadius: 7.2,
      isHighlighted: false
    };
  }

  public getInteractableMeshes(): THREE.Mesh[] {
    return this.organelles.map(o => o.mesh);
  }

  public getOrganelleByMesh(mesh: THREE.Object3D): OrganelleInstance | null {
    for (const organelle of this.organelles) {
      let current: THREE.Object3D | null = mesh;
      while (current) {
        if (current === organelle.mesh) return organelle;
        current = current.parent;
      }
    }
    return null;
  }

  public update(deltaTime: number, elapsedTime: number): void {
    for (const organelle of this.organelles) {
      organelle.group.rotation.x += organelle.rotationSpeed.x;
      organelle.group.rotation.y += organelle.rotationSpeed.y;
      organelle.group.rotation.z += organelle.rotationSpeed.z;

      if (organelle.data.type !== 'nucleus') {
        const floatY = Math.sin(elapsedTime * organelle.floatSpeed + organelle.floatOffset) * 0.3;
        const floatX = Math.cos(elapsedTime * organelle.floatSpeed * 0.7 + organelle.floatOffset) * 0.15;
        organelle.group.position.x = organelle.basePosition.x + floatX;
        organelle.group.position.y = organelle.basePosition.y + floatY;
      }
    }

    if (this.hoveredOrganelle) {
      const mat = this.hoveredOrganelle.baseMaterial;
      const pulse = 0.15 + Math.sin(elapsedTime * 5) * 0.1;
      mat.emissive = new THREE.Color(this.hoveredOrganelle.data.highlightColor).multiplyScalar(pulse);
    }
  }

  public updateMouse(normalizedX: number, normalizedY: number): void {
    this.mouse.x = normalizedX;
    this.mouse.y = normalizedY;
  }

  public checkHover(camera: THREE.PerspectiveCamera, screenX: number, screenY: number): void {
    this.raycaster.setFromCamera(this.mouse, camera);
    const meshes = this.getInteractableMeshes();
    const intersects = this.raycaster.intersectObjects(meshes, true);

    let newHovered: OrganelleInstance | null = null;
    if (intersects.length > 0) {
      newHovered = this.getOrganelleByMesh(intersects[0].object);
    }

    if (newHovered !== this.hoveredOrganelle) {
      if (this.hoveredOrganelle) {
        this.removeHighlight(this.hoveredOrganelle);
      }
      if (newHovered) {
        this.applyHighlight(newHovered);
        if (this.onHoverCallback) {
          this.onHoverCallback(screenX, screenY, newHovered.data.name, newHovered.data.type);
        }
        if (this.onCurrentViewChangeCallback) {
          this.onCurrentViewChangeCallback(newHovered.data.name, newHovered.data.nameEn);
        }
      } else {
        if (this.onHoverLeaveCallback) {
          this.onHoverLeaveCallback();
        }
        if (this.onCurrentViewChangeCallback && !this.selectedOrganelle) {
          this.onCurrentViewChangeCallback('细胞质环境', 'Cytoplasm');
        }
      }
      this.hoveredOrganelle = newHovered;
    } else if (this.hoveredOrganelle && this.onHoverCallback) {
      this.onHoverCallback(screenX, screenY, this.hoveredOrganelle.data.name, this.hoveredOrganelle.data.type);
    }
  }

  private applyHighlight(organelle: OrganelleInstance): void {
    organelle.isHighlighted = true;
    const mat = organelle.baseMaterial;
    mat.color = new THREE.Color(organelle.data.highlightColor);
    mat.roughness = Math.max(0.2, mat.roughness - 0.15);

    if (!organelle.outlineMesh) {
      const outlineGeom = organelle.mesh.geometry.clone();
      const outlineMat = new THREE.MeshBasicMaterial({
        color: organelle.data.highlightColor,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.5
      });
      organelle.outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
      organelle.outlineMesh.scale.setScalar(1.08);
      organelle.mesh.add(organelle.outlineMesh);
    }
  }

  private removeHighlight(organelle: OrganelleInstance): void {
    organelle.isHighlighted = false;
    const mat = organelle.baseMaterial;
    mat.color = new THREE.Color(organelle.data.baseColor);
    mat.roughness = 0.55;
    mat.emissive = new THREE.Color(organelle.data.baseColor).multiplyScalar(0.05);

    if (organelle.outlineMesh) {
      organelle.mesh.remove(organelle.outlineMesh);
      organelle.outlineMesh.geometry.dispose();
      (organelle.outlineMesh.material as THREE.Material).dispose();
      organelle.outlineMesh = null;
    }
  }

  public handleClick(camera: THREE.PerspectiveCamera): string | null {
    this.raycaster.setFromCamera(this.mouse, camera);
    const meshes = this.getInteractableMeshes();
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const clicked = this.getOrganelleByMesh(intersects[0].object);
      if (clicked) {
        if (this.selectedOrganelle && this.selectedOrganelle !== clicked) {
          this.removeHighlight(this.selectedOrganelle);
        }
        this.selectedOrganelle = clicked;
        this.applyHighlight(clicked);
        if (this.onCurrentViewChangeCallback) {
          this.onCurrentViewChangeCallback(clicked.data.name, clicked.data.nameEn);
        }
        return clicked.data.type;
      }
    }
    return null;
  }

  public clearSelected(): void {
    if (this.selectedOrganelle) {
      if (!this.hoveredOrganelle || this.hoveredOrganelle !== this.selectedOrganelle) {
        this.removeHighlight(this.selectedOrganelle);
      }
      this.selectedOrganelle = null;
    }
  }

  public getOrganellePosition(type: string): THREE.Vector3 | null {
    for (const organelle of this.organelles) {
      if (organelle.data.type === type) {
        return organelle.group.position.clone();
      }
    }
    return null;
  }

  public getFirstOfType(type: string): OrganelleInstance | null {
    for (const organelle of this.organelles) {
      if (organelle.data.type === type) return organelle;
    }
    return null;
  }

  public getAllOfType(type: string): OrganelleInstance[] {
    return this.organelles.filter(o => o.data.type === type);
  }

  public checkCollision(position: THREE.Vector3, cameraRadius: number = 0.8): boolean {
    for (const organelle of this.organelles) {
      const dist = position.distanceTo(organelle.group.position);
      if (dist < organelle.boundingRadius + cameraRadius + 0.3) {
        return true;
      }
    }
    const distFromCenter = position.length();
    if (distFromCenter > this.cellRadius - cameraRadius - 0.5) {
      return true;
    }
    return false;
  }

  public setOnHoverCallback(cb: (x: number, y: number, name: string, type: string) => void): void {
    this.onHoverCallback = cb;
  }

  public setOnHoverLeaveCallback(cb: () => void): void {
    this.onHoverLeaveCallback = cb;
  }

  public setOnClickCallback(cb: (type: string) => void): void {
    this.onClickCallback = cb;
  }

  public setOnCurrentViewChangeCallback(cb: (name: string, nameEn: string) => void): void {
    this.onCurrentViewChangeCallback = cb;
  }
}
