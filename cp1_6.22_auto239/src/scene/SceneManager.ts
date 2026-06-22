import * as THREE from 'three';
import { GearGenerator, GearParams } from './GearGenerator';

export interface GearData {
  id: string;
  params: GearParams;
  group: THREE.Group;
  position: THREE.Vector3;
  rotation: number;
  meshedWith: string | null;
  isDragging: boolean;
  targetPosition: THREE.Vector3;
}

export interface MeshPair {
  gear1Id: string;
  gear2Id: string;
  ratio: number;
}

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  gears: Map<string, GearData> = new Map();
  meshPairs: MeshPair[] = [];
  selectedGears: Set<string> = new Set();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private domElement: HTMLElement;
  private contactHighlights: Map<string, THREE.PointLight> = new Map();
  private gearIdCounter = 0;
  onGearUpdate?: (gearId: string) => void;
  onGearSelect?: (selectedIds: string[]) => void;
  onWarning?: (message: string) => void;
  onMeshSuccess?: () => void;
  draggingGearId: string | null = null;
  private dragOffset: THREE.Vector3 = new THREE.Vector3();
  private contactAnimationTime = 0;

  constructor(container: HTMLElement) {
    this.domElement = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1E293B);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 200, 200);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.setupGround();
    this.setupEventListeners();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    this.scene.add(directionalLight);
  }

  private setupGround(): void {
    const gridSize = 400;
    const gridDivisions = 40;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x334155, 0x334155);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.6;
    this.scene.add(gridHelper);

    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    canvas.addEventListener('wheel', (e) => this.onWheel(e));

    window.addEventListener('resize', () => this.onResize());
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onMouseDown(event: MouseEvent): void {
    this.updateMouse(event);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const gearMeshes: THREE.Object3D[] = [];
    this.gears.forEach((gear) => {
      gear.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          gearMeshes.push(child);
        }
      });
    });

    const intersects = this.raycaster.intersectObjects(gearMeshes);

    if (intersects.length > 0) {
      let clickedGearId: string | null = null;
      this.gears.forEach((gear, id) => {
        if (gear.group.children.includes(intersects[0].object) ||
            gear.group === intersects[0].object ||
            gear.group.children.some(c => c === intersects[0].object.parent)) {
          clickedGearId = id;
        }
      });

      if (clickedGearId) {
        if (event.shiftKey || event.ctrlKey) {
          if (this.selectedGears.has(clickedGearId)) {
            this.selectedGears.delete(clickedGearId);
            this.setGearSelected(clickedGearId, false);
          } else {
            this.selectedGears.add(clickedGearId);
            this.setGearSelected(clickedGearId, true);
          }
        } else {
          this.selectedGears.forEach(id => this.setGearSelected(id, false));
          this.selectedGears.clear();
          this.selectedGears.add(clickedGearId);
          this.setGearSelected(clickedGearId, true);
        }

        this.onGearSelect?.(Array.from(this.selectedGears));

        this.draggingGearId = clickedGearId;
        const gear = this.gears.get(clickedGearId)!;
        gear.isDragging = true;
        this.dragOffset.copy(gear.group.position).sub(
          this.getIntersectionPointOnGround().sub(new THREE.Vector3(0, gear.group.position.y, 0))
        );
        gear.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.Material).transparent = true;
            (child.material as THREE.MeshStandardMaterial).opacity = 0.6;
          }
        });
      }
    } else {
      this.selectedGears.forEach(id => this.setGearSelected(id, false));
      this.selectedGears.clear();
      this.onGearSelect?.([]);
    }
  }

  private getIntersectionPointOnGround(): THREE.Vector3 {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.raycaster.ray.intersectPlane(plane, point);
    return point;
  }

  private onMouseMove(event: MouseEvent): void {
    this.updateMouse(event);

    if (this.draggingGearId) {
      const gear = this.gears.get(this.draggingGearId);
      if (!gear) return;

      const intersectPoint = this.getIntersectionPointOnGround();
      const newPos = intersectPoint.add(this.dragOffset);
      newPos.y = gear.params.module * 0.75;

      gear.group.position.lerp(newPos, 0.8);
      gear.position.copy(gear.group.position);

      this.updateMeshedGears(this.draggingGearId);
    }
  }

  private onMouseUp(_event: MouseEvent): void {
    if (this.draggingGearId) {
      const gear = this.gears.get(this.draggingGearId);
      if (gear) {
        gear.isDragging = false;
        const snappedPos = new THREE.Vector3(
          Math.round(gear.group.position.x),
          gear.group.position.y,
          Math.round(gear.group.position.z)
        );
        gear.targetPosition.copy(snappedPos);
        gear.position.copy(snappedPos);

        gear.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            (child.material as THREE.Material).transparent = false;
            (child.material as THREE.MeshStandardMaterial).opacity = 1;
          }
        });

        this.checkMeshDisconnect(this.draggingGearId);
        this.onGearUpdate?.(this.draggingGearId);
      }
      this.draggingGearId = null;
    }
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomSpeed = 0.1;
    const direction = event.deltaY > 0 ? 1 : -1;
    const newPos = this.camera.position.clone().multiplyScalar(1 + direction * zoomSpeed);
    this.camera.position.lerp(newPos, 0.5);
  }

  private onResize(): void {
    this.camera.aspect = this.domElement.clientWidth / this.domElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.domElement.clientWidth, this.domElement.clientHeight);
  }

  createGear(params: GearParams): string {
    const id = `gear_${++this.gearIdCounter}`;
    const group = GearGenerator.buildGearMesh(params);

    const x = (Math.random() - 0.5) * 80;
    const z = (Math.random() - 0.5) * 80;
    const y = params.module * 0.75;

    group.position.set(x, y, z);

    this.scene.add(group);

    const gearData: GearData = {
      id,
      params: { ...params },
      group,
      position: new THREE.Vector3(x, y, z),
      rotation: 0,
      meshedWith: null,
      isDragging: false,
      targetPosition: new THREE.Vector3(x, y, z)
    };

    this.gears.set(id, gearData);
    return id;
  }

  deleteGear(gearId: string): void {
    const gear = this.gears.get(gearId);
    if (!gear) return;

    if (gear.meshedWith) {
      this.disconnectGears(gearId, gear.meshedWith);
    }

    this.meshPairs = this.meshPairs.filter(p => p.gear1Id !== gearId && p.gear2Id !== gearId);

    this.scene.remove(gear.group);
    gear.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.gears.delete(gearId);
    this.selectedGears.delete(gearId);

    const highlight = this.contactHighlights.get(gearId);
    if (highlight) {
      this.scene.remove(highlight);
      this.contactHighlights.delete(gearId);
    }
  }

  updateGear(gearId: string, params: Partial<GearParams>): void {
    const gear = this.gears.get(gearId);
    if (!gear) return;

    const oldGroup = gear.group;
    this.scene.remove(oldGroup);

    gear.params = { ...gear.params, ...params };
    gear.group = GearGenerator.buildGearMesh(gear.params);
    gear.group.position.copy(gear.position);
    gear.group.rotation.y = gear.rotation;
    gear.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(gear.group);

    if (this.selectedGears.has(gearId)) {
      this.setGearSelected(gearId, true);
    }

    if (gear.meshedWith) {
      const partner = this.gears.get(gear.meshedWith);
      if (partner) {
        const pair = this.meshPairs.find(p =>
          (p.gear1Id === gearId && p.gear2Id === gear.meshedWith) ||
          (p.gear2Id === gearId && p.gear1Id === gear.meshedWith)
        );
        if (pair) {
          pair.ratio = gear.params.teeth / partner.params.teeth;
        }
      }
    }

    this.onGearUpdate?.(gearId);
  }

  checkMesh(gear1Id: string, gear2Id: string): boolean {
    const gear1 = this.gears.get(gear1Id);
    const gear2 = this.gears.get(gear2Id);
    if (!gear1 || !gear2) return false;

    if (gear1.params.module !== gear2.params.module) {
      this.onWarning?.('模数不同的齿轮无法啮合！');
      return false;
    }

    if (gear1.params.pressureAngle !== gear2.params.pressureAngle) {
      this.onWarning?.('压力角不同的齿轮无法啮合！');
      return false;
    }

    const distance = gear1.position.distanceTo(gear2.position);
    const pitch1 = GearGenerator.getPitchRadius(gear1.params.teeth, gear1.params.module);
    const pitch2 = GearGenerator.getPitchRadius(gear2.params.teeth, gear2.params.module);
    const idealDistance = pitch1 + pitch2;
    const tolerance = idealDistance * 0.1;

    if (Math.abs(distance - idealDistance) > tolerance) {
      this.onWarning?.(`中心距不正确！理想距离: ${idealDistance.toFixed(1)}，当前距离: ${distance.toFixed(1)}`);
      return false;
    }

    return true;
  }

  meshGears(gear1Id: string, gear2Id: string): boolean {
    if (!this.checkMesh(gear1Id, gear2Id)) return false;

    const gear1 = this.gears.get(gear1Id);
    const gear2 = this.gears.get(gear2Id);
    if (!gear1 || !gear2) return false;

    const angleToGear2 = Math.atan2(
      gear2.position.z - gear1.position.z,
      gear2.position.x - gear1.position.x
    );

    const toothAngle1 = (2 * Math.PI) / gear1.params.teeth;
    const toothAngle2 = (2 * Math.PI) / gear2.params.teeth;

    const targetRotation1 = angleToGear2 + Math.PI;
    gear1.rotation = targetRotation1 % (toothAngle1);
    gear1.group.rotation.y = gear1.rotation;

    const angleToGear1 = angleToGear2 + Math.PI;
    const targetRotation2 = angleToGear1;
    gear2.rotation = targetRotation2 % (toothAngle2);
    gear2.group.rotation.y = gear2.rotation;

    gear1.meshedWith = gear2Id;
    gear2.meshedWith = gear1Id;

    const existingPair = this.meshPairs.find(p =>
      (p.gear1Id === gear1Id && p.gear2Id === gear2Id) ||
      (p.gear2Id === gear1Id && p.gear1Id === gear2Id)
    );

    if (!existingPair) {
      this.meshPairs.push({
        gear1Id,
        gear2Id,
        ratio: gear1.params.teeth / gear2.params.teeth
      });
    }

    this.triggerMeshAnimation(gear1Id, gear2Id);
    this.onMeshSuccess?.();
    return true;
  }

  private triggerMeshAnimation(gear1Id: string, gear2Id: string): void {
    [gear1Id, gear2Id].forEach(id => {
      const gear = this.gears.get(id);
      if (!gear) return;

      const light = new THREE.PointLight(0x22C55E, 2, 50);
      light.position.copy(gear.group.position);
      light.position.y += 10;
      this.scene.add(light);

      let intensity = 2;
      const startTime = performance.now();
      const animate = () => {
        const elapsed = (performance.now() - startTime) / 500;
        if (elapsed >= 1) {
          this.scene.remove(light);
          return;
        }
        intensity = 2 * (1 - elapsed);
        light.intensity = intensity;
        requestAnimationFrame(animate);
      };
      animate();
    });
  }

  private disconnectGears(gear1Id: string, gear2Id: string): void {
    const gear1 = this.gears.get(gear1Id);
    const gear2 = this.gears.get(gear2Id);
    if (gear1) gear1.meshedWith = null;
    if (gear2) gear2.meshedWith = null;
    this.meshPairs = this.meshPairs.filter(p =>
      !(p.gear1Id === gear1Id && p.gear2Id === gear2Id) &&
      !(p.gear2Id === gear1Id && p.gear1Id === gear2Id)
    );
  }

  private checkMeshDisconnect(gearId: string): void {
    const gear = this.gears.get(gearId);
    if (!gear || !gear.meshedWith) return;

    if (!this.checkMesh(gearId, gear.meshedWith)) {
      this.disconnectGears(gearId, gear.meshedWith);
    }
  }

  private updateMeshedGears(activeGearId: string): void {
    const activeGear = this.gears.get(activeGearId);
    if (!activeGear || !activeGear.meshedWith) return;

    const partnerId = activeGear.meshedWith;
    const partner = this.gears.get(partnerId);
    if (!partner || partner.isDragging) return;

    const pair = this.meshPairs.find(p =>
      (p.gear1Id === activeGearId && p.gear2Id === partnerId) ||
      (p.gear2Id === activeGearId && p.gear1Id === partnerId)
    );
    if (!pair) return;

    const pitch1 = GearGenerator.getPitchRadius(activeGear.params.teeth, activeGear.params.module);
    const pitch2 = GearGenerator.getPitchRadius(partner.params.teeth, partner.params.module);
    const idealDistance = pitch1 + pitch2;

    const dir = new THREE.Vector3()
      .subVectors(partner.position, activeGear.position)
      .normalize();

    partner.targetPosition.copy(activeGear.position).add(dir.multiplyScalar(idealDistance));
    partner.targetPosition.y = partner.params.module * 0.75;
    partner.position.copy(partner.targetPosition);
    partner.group.position.copy(partner.position);
  }

  rotateGear(gearId: string, deltaAngle: number): void {
    const gear = this.gears.get(gearId);
    if (!gear) return;

    gear.rotation += deltaAngle;
    gear.group.rotation.y = gear.rotation;

    if (gear.meshedWith) {
      this.propagateRotation(gearId, deltaAngle, new Set([gearId]));
    }
  }

  private propagateRotation(sourceId: string, deltaAngle: number, visited: Set<string>): void {
    const source = this.gears.get(sourceId);
    if (!source || !source.meshedWith) return;

    const partnerId = source.meshedWith;
    if (visited.has(partnerId)) return;
    visited.add(partnerId);

    const partner = this.gears.get(partnerId);
    if (!partner) return;

    const ratio = source.params.teeth / partner.params.teeth;
    partner.rotation -= deltaAngle * ratio;
    partner.group.rotation.y = partner.rotation;

    if (partner.meshedWith) {
      this.propagateRotation(partnerId, -deltaAngle * ratio, visited);
    }
  }

  private setGearSelected(gearId: string, selected: boolean): void {
    const gear = this.gears.get(gearId);
    if (!gear) return;

    gear.group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isSelectionOutline !== undefined) {
        gear.group.remove(child);
      }
    });

    if (selected) {
      const pitchRadius = GearGenerator.getPitchRadius(gear.params.teeth, gear.params.module);
      const outlineGeometry = new THREE.RingGeometry(pitchRadius + 5, pitchRadius + 7, 64);
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0x3B82F6,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
      outline.rotation.x = -Math.PI / 2;
      outline.position.y = gear.params.module * 1.5 + 0.5;
      outline.userData.isSelectionOutline = true;
      outline.userData.baseOpacity = 0.8;
      gear.group.add(outline);
    }
  }

  update(deltaTime: number): void {
    this.contactAnimationTime += deltaTime;
    const breathe = 0.6 + Math.sin(performance.now() / 750) * 0.4;

    this.gears.forEach((gear) => {
      if (!gear.isDragging) {
        gear.group.position.lerp(gear.targetPosition, 0.15);
        gear.position.copy(gear.group.position);
      }

      gear.group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isSelectionOutline) {
          (child.material as THREE.MeshBasicMaterial).opacity = child.userData.baseOpacity * breathe;
        }
      });
    });

    this.renderer.render(this.scene, this.camera);
  }

  getScreenPosition(gearId: string): { x: number; y: number } | null {
    const gear = this.gears.get(gearId);
    if (!gear) return null;

    const worldPos = gear.group.position.clone();
    worldPos.y += GearGenerator.getPitchRadius(gear.params.teeth, gear.params.module) + 15;

    const projected = worldPos.project(this.camera);
    const rect = this.domElement.getBoundingClientRect();

    return {
      x: (projected.x * 0.5 + 0.5) * rect.width,
      y: (-projected.y * 0.5 + 0.5) * rect.height
    };
  }

  getAllGearIds(): string[] {
    return Array.from(this.gears.keys());
  }

  getGearData(gearId: string): GearData | undefined {
    return this.gears.get(gearId);
  }
}
