import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LightSourceData } from './LightSource';
import { EventBus, Events } from '@/events/EventBus';

interface LightEntry {
  id: string;
  light: THREE.Light;
  helper: THREE.Mesh;
  halo?: THREE.Sprite;
  wireframe?: THREE.Mesh;
  spotTarget?: THREE.Object3D;
}

export class SceneManager {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private container!: HTMLElement;

  private lightEntries: Map<string, LightEntry> = new Map();
  private selectedId: string | null = null;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private isDragging = false;
  private draggedId: string | null = null;
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragOffset = new THREE.Vector3();
  private helperMeshes: THREE.Mesh[] = [];

  private ambientLight!: THREE.AmbientLight;
  private defaultDirLight!: THREE.DirectionalLight;
  private animFrameId: number = 0;

  init(container: HTMLElement): void {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(10, 8, 10);
    this.camera.lookAt(0, 1.2, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.2, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;
    this.controls.update();

    this.createDefaultLights();
    this.createRoom();
    this.resize();
    this.bindEvents();
    this.animate();
  }

  private createDefaultLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.defaultDirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.defaultDirLight.position.set(5, 5, -7);
    this.defaultDirLight.castShadow = true;
    this.defaultDirLight.shadow.mapSize.set(2048, 2048);
    this.defaultDirLight.shadow.camera.left = -8;
    this.defaultDirLight.shadow.camera.right = 8;
    this.defaultDirLight.shadow.camera.top = 6;
    this.defaultDirLight.shadow.camera.bottom = -2;
    this.defaultDirLight.shadow.camera.near = 0.1;
    this.defaultDirLight.shadow.camera.far = 20;
    this.scene.add(this.defaultDirLight);
  }

  private createRoom(): void {
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, roughness: 0.8, metalness: 0.0,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), wallMat.clone());
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 3;
    ceiling.receiveShadow = true;
    this.scene.add(ceiling);

    const frontWallShape = new THREE.Shape();
    frontWallShape.moveTo(-5, 0);
    frontWallShape.lineTo(5, 0);
    frontWallShape.lineTo(5, 3);
    frontWallShape.lineTo(-5, 3);
    frontWallShape.lineTo(-5, 0);

    const winHole = new THREE.Path();
    winHole.moveTo(-1, 0.8);
    winHole.lineTo(1, 0.8);
    winHole.lineTo(1, 2.3);
    winHole.lineTo(-1, 2.3);
    winHole.lineTo(-1, 0.8);
    frontWallShape.holes.push(winHole);

    const frontWall = new THREE.Mesh(
      new THREE.ShapeGeometry(frontWallShape), wallMat
    );
    frontWall.position.z = -4;
    frontWall.receiveShadow = true;
    frontWall.castShadow = true;
    this.scene.add(frontWall);

    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: 0x888888, roughness: 0.5, metalness: 0.3,
    });
    const frameThickness = 0.05;
    const frameDepth = 0.1;
    const frameGeo = new THREE.BoxGeometry(2 + frameThickness * 2, frameThickness, frameDepth);
    const topFrame = new THREE.Mesh(frameGeo, windowFrameMat);
    topFrame.position.set(0, 2.3, -4 + frameDepth / 2);
    this.scene.add(topFrame);
    const bottomFrame = new THREE.Mesh(frameGeo, windowFrameMat);
    bottomFrame.position.set(0, 0.8, -4 + frameDepth / 2);
    this.scene.add(bottomFrame);
    const sideFrameGeo = new THREE.BoxGeometry(frameThickness, 1.5, frameDepth);
    const leftFrame = new THREE.Mesh(sideFrameGeo, windowFrameMat);
    leftFrame.position.set(-1, 1.55, -4 + frameDepth / 2);
    this.scene.add(leftFrame);
    const rightFrame = new THREE.Mesh(sideFrameGeo, windowFrameMat);
    rightFrame.position.set(1, 1.55, -4 + frameDepth / 2);
    this.scene.add(rightFrame);
    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(2, frameThickness * 0.6, frameDepth * 0.5), windowFrameMat
    );
    crossH.position.set(0, 1.55, -4 + frameDepth / 2);
    this.scene.add(crossH);
    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness * 0.6, 1.5, frameDepth * 0.5), windowFrameMat
    );
    crossV.position.set(0, 1.55, -4 + frameDepth / 2);
    this.scene.add(crossV);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 3), wallMat);
    backWall.rotation.y = Math.PI;
    backWall.position.set(0, 1.5, 4);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-5, 1.5, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(8, 3), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(5, 1.5, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x333333);
    gridHelper.position.y = 0.001;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);
  }

  addLight(data: LightSourceData): void {
    if (this.lightEntries.has(data.id)) return;

    const lightObj = this.createThreeLightFromData(data);

    const entry = this.createLightHelper(data, lightObj);
    this.lightEntries.set(data.id, entry);

    if (data.id === this.selectedId) {
      this.showWireframe(entry, data);
    }
  }

  removeLight(id: string): void {
    const entry = this.lightEntries.get(id);
    if (!entry) return;
    this.scene.remove(entry.light);
    if (entry.spotTarget) this.scene.remove(entry.spotTarget);
    this.scene.remove(entry.helper);
    if (entry.halo) this.scene.remove(entry.halo);
    if (entry.wireframe) this.scene.remove(entry.wireframe);
    this.helperMeshes = this.helperMeshes.filter(m => m !== entry.helper);
    this.lightEntries.delete(id);
  }

  updateLight(id: string, updates: Partial<LightSourceData>): void {
    const entry = this.lightEntries.get(id);
    if (!entry) return;

    const current = this.getLightDataFromEntry(entry);
    const merged = { ...current, ...updates };
    if (updates.position) merged.position = [...updates.position] as [number, number, number];

    this.updateThreeLightFromData(entry.light, merged);
    entry.helper.position.set(...merged.position);
    if (entry.halo) entry.halo.position.set(...merged.position);
    if (entry.spotTarget) {
      entry.spotTarget.position.set(merged.position[0], 0, merged.position[2]);
    }
    if (entry.wireframe) {
      this.scene.remove(entry.wireframe);
      entry.wireframe = undefined as any;
    }
    if (id === this.selectedId) {
      this.showWireframe(entry, merged);
    }

    this.updateHelperColor(entry, merged.color, merged.type);
  }

  selectLight(id: string | null): void {
    if (this.selectedId && this.selectedId !== id) {
      const prev = this.lightEntries.get(this.selectedId);
      if (prev && prev.wireframe) {
        this.scene.remove(prev.wireframe);
        prev.wireframe = undefined as any;
      }
    }
    this.selectedId = id;
    if (id) {
      const entry = this.lightEntries.get(id);
      if (entry) {
        const data = this.getLightDataFromEntry(entry);
        this.showWireframe(entry, data);
      }
    }
  }

  applyLights(lights: LightSourceData[]): void {
    const existingIds = new Set(this.lightEntries.keys());
    for (const ld of lights) {
      if (this.lightEntries.has(ld.id)) {
        this.updateLight(ld.id, ld);
      } else {
        this.addLight(ld);
      }
      existingIds.delete(ld.id);
    }
    for (const id of existingIds) {
      this.removeLight(id);
    }
  }

  captureCurrentView(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  captureTopDownThumbnail(w: number, h: number): string {
    const rt = new THREE.WebGLRenderTarget(w, h);
    const topCam = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 10);
    topCam.position.set(0, 8, 0);
    topCam.lookAt(0, 0, 0);
    topCam.up.set(0, 0, -1);

    this.renderer.setRenderTarget(rt);
    this.renderer.render(this.scene, topCam);

    const buf = new Uint8Array(w * h * 4);
    this.renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf);
    this.renderer.setRenderTarget(null);
    rt.dispose();

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(w, h);
    for (let row = 0; row < h; row++) {
      const srcRow = h - 1 - row;
      for (let col = 0; col < w; col++) {
        const si = (srcRow * w + col) * 4;
        const di = (row * w + col) * 4;
        imgData.data[di] = buf[si];
        imgData.data[di + 1] = buf[si + 1];
        imgData.data[di + 2] = buf[si + 2];
        imgData.data[di + 3] = buf[si + 3];
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  resize(): void {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  private createThreeLightFromData(data: LightSourceData): THREE.Light {
    let light: THREE.Light;
    switch (data.type) {
      case 'point': {
        const pl = new THREE.PointLight(data.color, data.intensity, data.decay);
        pl.castShadow = true;
        pl.shadow.mapSize.set(1024, 1024);
        pl.shadow.bias = -0.001;
        light = pl;
        break;
      }
      case 'spot': {
        const sl = new THREE.SpotLight(
          data.color, data.intensity, data.decay,
          data.spotAngle, data.spotPenumbra
        );
        sl.castShadow = true;
        sl.shadow.mapSize.set(1024, 1024);
        sl.shadow.bias = -0.001;
        const target = new THREE.Object3D();
        target.position.set(data.position[0], 0, data.position[2]);
        this.scene.add(target);
        (light as any)._spotTarget = target;
        sl.target = target;
        light = sl;
        break;
      }
      case 'directional': {
        const dl = new THREE.DirectionalLight(data.color, data.intensity);
        dl.castShadow = true;
        dl.shadow.mapSize.set(1024, 1024);
        dl.shadow.camera.left = -6;
        dl.shadow.camera.right = 6;
        dl.shadow.camera.top = 6;
        dl.shadow.camera.bottom = -2;
        light = dl;
        break;
      }
    }
    light.position.set(...data.position);
    this.scene.add(light);
    return light;
  }

  private updateThreeLightFromData(light: THREE.Light, data: LightSourceData): void {
    light.color.set(data.color);
    light.intensity = data.intensity;
    light.position.set(...data.position);
    if (light instanceof THREE.PointLight) {
      light.distance = data.decay;
    }
    if (light instanceof THREE.SpotLight) {
      light.distance = data.decay;
      light.angle = data.spotAngle;
      light.penumbra = data.spotPenumbra;
      light.target.position.set(data.position[0], 0, data.position[2]);
    }
  }

  private createLightHelper(data: LightSourceData, light: THREE.Light): LightEntry {
    const entry: LightEntry = { id: data.id, light, helper: null as any };

    let helperGeo: THREE.BufferGeometry;
    let helperColor: number;

    switch (data.type) {
      case 'point':
        helperGeo = new THREE.SphereGeometry(0.2, 16, 16);
        helperColor = 0xffdd00;
        break;
      case 'spot':
        helperGeo = new THREE.ConeGeometry(0.15, 0.35, 12);
        helperColor = 0xffaa00;
        break;
      case 'directional':
        helperGeo = new THREE.SphereGeometry(0.18, 12, 12);
        helperColor = 0xaaccff;
        break;
    }

    const helperMat = new THREE.MeshBasicMaterial({
      color: helperColor,
      transparent: true,
      opacity: 0.9,
    });
    const helperMesh = new THREE.Mesh(helperGeo, helperMat);
    helperMesh.position.set(...data.position);
    helperMesh.userData.lightId = data.id;
    this.scene.add(helperMesh);
    this.helperMeshes.push(helperMesh);
    entry.helper = helperMesh;

    if (data.type === 'point' || data.type === 'spot') {
      const haloSprite = this.createHaloSprite(data.color);
      haloSprite.position.set(...data.position);
      this.scene.add(haloSprite);
      entry.halo = haloSprite;
    }

    if (data.type === 'spot') {
      const sl = light as THREE.SpotLight;
      entry.spotTarget = sl.target;
      helperMesh.rotation.x = Math.PI;
    }

    return entry;
  }

  private createHaloSprite(color: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    const c = new THREE.Color(color);
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);
    gradient.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
    gradient.addColorStop(0.4, `rgba(${r},${g},${b},0.2)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 1.2, 1);
    return sprite;
  }

  private updateHelperColor(entry: LightEntry, color: string, type: string): void {
    if (entry.halo) {
      this.scene.remove(entry.halo);
      entry.halo = this.createHaloSprite(color);
      entry.halo.position.copy(entry.helper.position);
      this.scene.add(entry.halo);
    }
  }

  private showWireframe(entry: LightEntry, data: LightSourceData): void {
    if (entry.wireframe) {
      this.scene.remove(entry.wireframe);
    }

    const wfMat = new THREE.MeshBasicMaterial({
      color: 0x00cccc,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    let wfMesh: THREE.Mesh;
    if (data.type === 'point') {
      wfMesh = new THREE.Mesh(
        new THREE.SphereGeometry(data.decay, 16, 12), wfMat
      );
    } else if (data.type === 'spot') {
      const height = data.decay;
      const radius = data.decay * Math.tan(data.spotAngle);
      wfMesh = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 16, 1, true), wfMat
      );
      wfMesh.position.set(data.position[0], data.position[1] - height / 2, data.position[2]);
      this.scene.add(wfMesh);
      entry.wireframe = wfMesh;
      return;
    } else {
      wfMesh = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 4), wfMat
      );
    }

    wfMesh.position.set(...data.position);
    this.scene.add(wfMesh);
    entry.wireframe = wfMesh;
  }

  private getLightDataFromEntry(entry: LightEntry): LightSourceData {
    const light = entry.light;
    const pos = light.position;
    const base: LightSourceData = {
      id: entry.id,
      type: 'point',
      color: '#' + light.color.getHexString(),
      intensity: light.intensity,
      position: [pos.x, pos.y, pos.z],
      decay: 5,
      spotAngle: Math.PI / 4,
      spotPenumbra: 0.3,
    };

    if (light instanceof THREE.PointLight) {
      base.type = 'point';
      base.decay = light.distance;
    } else if (light instanceof THREE.SpotLight) {
      base.type = 'spot';
      base.decay = light.distance;
      base.spotAngle = light.angle;
      base.spotPenumbra = light.penumbra;
    } else if (light instanceof THREE.DirectionalLight) {
      base.type = 'directional';
    }

    return base;
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('resize', () => this.resize());
  }

  private getNDC(event: PointerEvent): THREE.Vector2 {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.mouse.copy(this.getNDC(event));
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.helperMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const lightId = hit.userData.lightId as string;
      if (lightId) {
        this.isDragging = true;
        this.draggedId = lightId;
        this.controls.enabled = false;

        const entry = this.lightEntries.get(lightId);
        if (entry) {
          this.dragPlane.set(new THREE.Vector3(0, 1, 0), -entry.helper.position.y);
          const planeIntersect = new THREE.Vector3();
          this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);
          if (planeIntersect) {
            this.dragOffset.copy(entry.helper.position).sub(planeIntersect);
          }
        }

        EventBus.emit(Events.SCENE_LIGHT_CLICK, { id: lightId });
      }
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isDragging || !this.draggedId) return;

    this.mouse.copy(this.getNDC(event));
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const planeIntersect = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);
    if (!planeIntersect) return;

    const newPos = planeIntersect.add(this.dragOffset);
    const clampedX = Math.max(-4.5, Math.min(4.5, newPos.x));
    const clampedZ = Math.max(-3.5, Math.min(3.5, newPos.z));

    const entry = this.lightEntries.get(this.draggedId);
    if (entry) {
      const currentData = this.getLightDataFromEntry(entry);
      const updatedPos: [number, number, number] = [clampedX, currentData.position[1], clampedZ];

      entry.helper.position.set(...updatedPos);
      entry.light.position.set(...updatedPos);
      if (entry.halo) entry.halo.position.set(...updatedPos);
      if (entry.spotTarget) entry.spotTarget.position.set(clampedX, 0, clampedZ);
      if (entry.wireframe) {
        this.scene.remove(entry.wireframe);
        const merged = { ...currentData, position: updatedPos };
        this.showWireframe(entry, merged);
      }

      EventBus.emit(Events.SCENE_DRAG_UPDATE, {
        id: this.draggedId,
        position: updatedPos,
      });
    }
  };

  private onPointerUp = (): void => {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedId = null;
      this.controls.enabled = true;
    }
  };

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
