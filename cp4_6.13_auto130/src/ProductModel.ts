import * as THREE from 'three';

export type MaterialType = 'metal' | 'matte' | 'glass';

interface MaterialState {
  color: THREE.Color;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  transmission?: number;
  thickness?: number;
  ior?: number;
}

export class ProductModel {
  private group: THREE.Group;
  private meshes: THREE.Mesh[] = [];
  private autoRotate: boolean = true;
  private rotationSpeed: number;
  private currentScale: number = 1;
  private targetScale: number = 1;
  private minScale: number = 0.5;
  private maxScale: number = 5;
  private currentMaterial: MaterialType = 'metal';
  private targetMaterialState: MaterialState;
  private currentMaterialState: MaterialState;
  private materialTransitionSpeed: number = 2;
  private isTransitioning: boolean = false;
  private hoverSpotLight: THREE.SpotLight;
  private hoverActive: boolean = false;
  private baseColor: THREE.Color;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor() {
    this.group = new THREE.Group();
    this.rotationSpeed = (2 * Math.PI) / 10;
    this.baseColor = new THREE.Color(0x4a9eff);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.currentMaterialState = this.getMaterialPreset('metal');
    this.targetMaterialState = { ...this.currentMaterialState };

    this.createModel();
    this.hoverSpotLight = this.createHoverSpotLight();
  }

  private getMaterialPreset(type: MaterialType): MaterialState {
    const color = this.baseColor.clone();
    switch (type) {
      case 'metal':
        return {
          color: color,
          metalness: 0.9,
          roughness: 0.15,
          opacity: 1,
          transparent: false
        };
      case 'matte':
        return {
          color: color,
          metalness: 0.1,
          roughness: 0.8,
          opacity: 1,
          transparent: false
        };
      case 'glass':
        return {
          color: color,
          metalness: 0,
          roughness: 0.05,
          opacity: 0.3,
          transparent: true,
          transmission: 0.9,
          thickness: 0.5,
          ior: 1.5
        };
      default:
        return {
          color: color,
          metalness: 0.5,
          roughness: 0.5,
          opacity: 1,
          transparent: false
        };
    }
  }

  private createMaterial(state: MaterialState): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
    if (state.transparent && state.transmission !== undefined) {
      return new THREE.MeshPhysicalMaterial({
        color: state.color,
        metalness: state.metalness,
        roughness: state.roughness,
        transparent: state.transparent,
        opacity: state.opacity,
        transmission: state.transmission,
        thickness: state.thickness || 0.5,
        ior: state.ior || 1.5,
        envMapIntensity: 1
      });
    }
    return new THREE.MeshStandardMaterial({
      color: state.color,
      metalness: state.metalness,
      roughness: state.roughness,
      transparent: state.transparent,
      opacity: state.opacity
    });
  }

  private createModel(): void {
    const bodyGeometry = new THREE.CylinderGeometry(1, 0.8, 2.5, 64, 1, false);
    const bodyMaterial = this.createMaterial(this.currentMaterialState);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0;
    body.castShadow = true;
    body.receiveShadow = true;
    this.meshes.push(body);
    this.group.add(body);

    const bottomGeometry = new THREE.CircleGeometry(0.8, 64);
    const bottomMaterial = this.createMaterial(this.currentMaterialState);
    const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = -1.25;
    bottom.castShadow = true;
    bottom.receiveShadow = true;
    this.meshes.push(bottom);
    this.group.add(bottom);

    const rimGeometry = new THREE.TorusGeometry(1, 0.08, 16, 64);
    const rimMaterial = this.createMaterial(this.currentMaterialState);
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.25;
    rim.castShadow = true;
    rim.receiveShadow = true;
    this.meshes.push(rim);
    this.group.add(rim);

    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1, 0.8, 0),
      new THREE.Vector3(1.6, 0.5, 0),
      new THREE.Vector3(1.6, -0.5, 0),
      new THREE.Vector3(1, -0.8, 0)
    ]);
    const handleGeometry = new THREE.TubeGeometry(handleCurve, 32, 0.12, 16, false);
    const handleMaterial = this.createMaterial(this.currentMaterialState);
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.castShadow = true;
    handle.receiveShadow = true;
    this.meshes.push(handle);
    this.group.add(handle);

    const innerGeometry = new THREE.CylinderGeometry(0.92, 0.75, 2.3, 64, 1, true);
    const innerMaterial = this.createMaterial({
      ...this.currentMaterialState,
      opacity: this.currentMaterialState.opacity * 0.7,
      transparent: true
    });
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.position.y = -0.1;
    inner.castShadow = false;
    inner.receiveShadow = true;
    this.meshes.push(inner);
    this.group.add(inner);

    this.group.position.y = 0;
  }

  private createHoverSpotLight(): THREE.SpotLight {
    const spotLight = new THREE.SpotLight(0xffffff, 0);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 2;
    spotLight.distance = 10;
    spotLight.castShadow = false;
    return spotLight;
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
    scene.add(this.hoverSpotLight);
    scene.add(this.hoverSpotLight.target);
  }

  public update(deltaTime: number): void {
    if (this.autoRotate) {
      this.group.rotation.y += this.rotationSpeed * deltaTime;
    }

    if (Math.abs(this.currentScale - this.targetScale) > 0.001) {
      this.currentScale += (this.targetScale - this.currentScale) * 10 * deltaTime;
      this.group.scale.setScalar(this.currentScale);
    }

    if (this.isTransitioning) {
      this.updateMaterialState(this.currentMaterialState, this.targetMaterialState, this.materialTransitionSpeed * deltaTime);
      this.applyMaterialState(this.currentMaterialState);
      
      const diff = this.getMaterialStateDiff(this.currentMaterialState, this.targetMaterialState);
      if (diff < 0.001) {
        this.isTransitioning = false;
        this.currentMaterialState = { ...this.targetMaterialState };
        this.applyMaterialState(this.currentMaterialState);
      }
    }

    if (this.hoverActive) {
      this.hoverSpotLight.intensity = Math.min(this.hoverSpotLight.intensity + deltaTime * 5, 2);
    } else {
      this.hoverSpotLight.intensity = Math.max(this.hoverSpotLight.intensity - deltaTime * 5, 0);
    }
  }

  private updateMaterialState(current: MaterialState, target: MaterialState, t: number): void {
    current.color.lerp(target.color, t);
    current.metalness = THREE.MathUtils.lerp(current.metalness, target.metalness, t);
    current.roughness = THREE.MathUtils.lerp(current.roughness, target.roughness, t);
    current.opacity = THREE.MathUtils.lerp(current.opacity, target.opacity, t);
    current.transparent = target.transparent;
    if (target.transmission !== undefined && current.transmission !== undefined) {
      current.transmission = THREE.MathUtils.lerp(current.transmission, target.transmission, t);
    }
    if (target.thickness !== undefined && current.thickness !== undefined) {
      current.thickness = THREE.MathUtils.lerp(current.thickness, target.thickness, t);
    }
  }

  private getMaterialStateDiff(a: MaterialState, b: MaterialState): number {
    let diff = 0;
    diff += a.color.distanceTo(b.color);
    diff += Math.abs(a.metalness - b.metalness);
    diff += Math.abs(a.roughness - b.roughness);
    diff += Math.abs(a.opacity - b.opacity);
    return diff;
  }

  private applyMaterialState(state: MaterialState): void {
    this.meshes.forEach((mesh, index) => {
      const material = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
      
      material.color.copy(state.color);
      material.metalness = state.metalness;
      material.roughness = state.roughness;
      material.opacity = index === 4 ? state.opacity * 0.7 : state.opacity;
      material.transparent = state.transparent || index === 4;
      
      if (isMeshPhysicalMaterial(material) && state.transmission !== undefined) {
        material.transmission = state.transmission;
        material.thickness = state.thickness || 0.5;
        material.ior = state.ior || 1.5;
      }
    });
  }

  public setAutoRotation(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  public getAutoRotation(): boolean {
    return this.autoRotate;
  }

  public setScale(scale: number): void {
    this.targetScale = Math.max(this.minScale, Math.min(this.maxScale, scale));
  }

  public getScale(): number {
    return this.targetScale;
  }

  public setMaterial(type: MaterialType): void {
    if (this.currentMaterial === type) return;
    this.currentMaterial = type;
    const preset = this.getMaterialPreset(type);
    preset.color = this.baseColor.clone();
    this.targetMaterialState = preset;

    const wasGlass = this.currentMaterialState.transmission !== undefined;
    const isGlass = preset.transmission !== undefined;
    
    if (wasGlass !== isGlass) {
      this.replaceMaterials(preset);
      this.currentMaterialState = { ...preset };
      this.isTransitioning = false;
    } else {
      this.isTransitioning = true;
    }
  }

  private replaceMaterials(state: MaterialState): void {
    this.meshes.forEach((mesh, index) => {
      const newState = index === 4
        ? { ...state, opacity: state.opacity * 0.7, transparent: true }
        : state;
      mesh.material = this.createMaterial(newState);
    });
  }

  public setColor(color: string | number | THREE.Color): void {
    this.baseColor.set(color);
    this.targetMaterialState.color = this.baseColor.clone();
    this.isTransitioning = true;
  }

  public getColor(): THREE.Color {
    return this.baseColor.clone();
  }

  public getMeshes(): THREE.Mesh[] {
    return this.meshes;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public handleHover(normalizedX: number, normalizedY: number, camera: THREE.Camera): void {
    this.mouse.set(normalizedX, normalizedY);
    this.raycaster.setFromCamera(this.mouse, camera);
    
    const intersects = this.raycaster.intersectObjects(this.meshes);
    
    if (intersects.length > 0) {
      this.hoverActive = true;
      const point = intersects[0].point;
      const faceNormal = intersects[0].face?.normal;
      
      if (faceNormal) {
        const normal = faceNormal.clone();
        normal.transformDirection(this.group.matrixWorld);
        this.hoverSpotLight.position.copy(point).add(normal.multiplyScalar(2));
        this.hoverSpotLight.target.position.copy(point);
        this.hoverSpotLight.target.updateMatrixWorld();
      }
    } else {
      this.hoverActive = false;
    }
  }

  public handleHoverOut(): void {
    this.hoverActive = false;
  }

  public isHovered(): boolean {
    return this.hoverActive;
  }

  public getRaycaster(): THREE.Raycaster {
    return this.raycaster;
  }

  public getMouse(): THREE.Vector2 {
    return this.mouse;
  }
}

function isMeshPhysicalMaterial(_mat: THREE.Material): _mat is THREE.MeshPhysicalMaterial {
  return 'transmission' in _mat;
}
