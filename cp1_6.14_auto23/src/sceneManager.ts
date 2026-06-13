import * as THREE from 'three';
import type { SceneInstance, LightType, LightingPresets, GlobalLightState } from './main.js';

export interface LightRecord {
  id: string;
  type: LightType;
  light: THREE.PointLight | THREE.SpotLight;
  helper: THREE.Object3D;
  halo: THREE.Mesh;
  params: {
    intensity: number;
    color: string;
    distance: number;
    decay: number;
    angle?: number;
    penumbra?: number;
  };
}

type Mode = 'day' | 'night';
type Listener = (event: SceneManagerEvent) => void;

interface SceneManagerEvent {
  type:
    | 'light-added'
    | 'light-removed'
    | 'light-selected'
    | 'light-deselected'
    | 'light-updated'
    | 'mode-changed';
  id?: string;
  mode?: Mode;
  record?: LightRecord;
}

const SHADOW_MAP_SIZE = 1024;

class SceneManager {
  private instance: SceneInstance | null = null;
  private presets: LightingPresets | null = null;
  private lights: Map<string, LightRecord> = new Map();
  private selectedId: string | null = null;
  private mode: Mode = 'day';
  private listeners: Set<Listener> = new Set();
  private idCounter = 0;
  private hovered: THREE.Object3D | null = null;
  private draggingId: string | null = null;
  private dragOffset = new THREE.Vector3();
  private modeTransitionStart = 0;
  private modeTransitionDuration = 2.0;
  private modeTransitionActive = false;
  private fromState: GlobalLightState | null = null;
  private toState: GlobalLightState | null = null;
  private startBg: THREE.Color | null = null;
  private targetBg: THREE.Color | null = null;
  private addPending: LightType | null = null;

  bindInstance(instance: SceneInstance, presets: LightingPresets) {
    this.instance = instance;
    this.presets = presets;
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private emit(ev: SceneManagerEvent) {
    for (const l of this.listeners) l(ev);
  }

  getLights(): LightRecord[] {
    return Array.from(this.lights.values());
  }

  getMode(): Mode {
    return this.mode;
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  getLight(id: string): LightRecord | undefined {
    return this.lights.get(id);
  }

  bootstrap() {
    if (!this.instance) return;
    const canvas = this.instance.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.applyState(this.presets!.day, false);
  }

  queueAddLight(type: LightType) {
    this.addPending = type;
    const canvas = this.instance?.renderer.domElement;
    if (canvas) canvas.style.cursor = 'crosshair';
  }

  cancelAddLight() {
    this.addPending = null;
    const canvas = this.instance?.renderer.domElement;
    if (canvas) canvas.style.cursor = '';
  }

  addLight(type: LightType, position: [number, number, number]): LightRecord {
    if (!this.instance || !this.presets) throw new Error('not bound');
    this.idCounter++;
    const id = `${type === 'point' ? 'P' : 'S'}${String(this.idCounter).padStart(3, '0')}`;

    let light: THREE.PointLight | THREE.SpotLight;
    let helper: THREE.Object3D;
    let halo: THREE.Mesh;
    const color = type === 'point' ? '#fff3d1' : '#ffd8a8';

    if (type === 'point') {
      const pl = new THREE.PointLight(color, 1.2, 12, 2);
      pl.castShadow = true;
      pl.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
      pl.shadow.camera.near = 0.1;
      pl.shadow.camera.far = 20;
      pl.shadow.bias = -0.0005;
      pl.shadow.radius = 3;
      light = pl;

      const geom = new THREE.SphereGeometry(0.08, 20, 16);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
      const bulb = new THREE.Mesh(geom, mat);
      const wire = new THREE.Mesh(
        new THREE.RingGeometry(0.13, 0.14, 32),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
      );
      wire.rotation.x = Math.PI / 2;
      helper = new THREE.Group();
      helper.add(bulb);
      helper.add(wire);
      (helper as THREE.Group).userData.bulb = bulb;
      (helper as THREE.Group).userData.wire = wire;

      const haloGeom = new THREE.SphereGeometry(0.22, 24, 20);
      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      halo = new THREE.Mesh(haloGeom, haloMat);
    } else {
      const sl = new THREE.SpotLight(color, 1.6, 14, Math.PI / 6, 0.3, 2);
      sl.castShadow = true;
      sl.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
      sl.shadow.camera.near = 0.2;
      sl.shadow.camera.far = 25;
      sl.shadow.bias = -0.0005;
      sl.shadow.radius = 2;
      sl.target.position.set(0, 0, -2);
      light = sl;

      const coneGeom = new THREE.ConeGeometry(0.12, 0.22, 18, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.position.y = 0.11;
      cone.rotation.x = Math.PI;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.01, 8, 24),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
      );
      ring.rotation.x = Math.PI / 2;
      helper = new THREE.Group();
      helper.add(cone);
      helper.add(ring);
      (helper as THREE.Group).userData.cone = cone;

      const haloGeom = new THREE.ConeGeometry(0.6, 1.2, 24, 1, true);
      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      halo = new THREE.Mesh(haloGeom, haloMat);
      halo.position.y = -0.6;
      halo.rotation.x = Math.PI;
    }

    light.position.set(...position);
    helper.position.set(...position);
    halo.position.set(...position);
    if (light instanceof THREE.SpotLight) {
      this.instance.scene.add(light.target);
      light.target.position.set(position[0], 0.1, position[2] - 1.5);
      helper.userData.isSpot = true;
    }

    const scene = this.instance.scene;
    scene.add(light);
    scene.add(helper);
    scene.add(halo);

    const active = this.mode === 'night' ? 1 : 0.25;
    light.intensity = 1.2 * active;

    const record: LightRecord = {
      id,
      type,
      light,
      helper,
      halo,
      params: {
        intensity: 50,
        color,
        distance: type === 'point' ? 12 : 14,
        decay: 2,
        angle: type === 'spot' ? 30 : undefined,
        penumbra: type === 'spot' ? 0.3 : undefined,
      },
    };
    helper.userData.lightId = id;
    helper.userData.record = record;
    this.lights.set(id, record);
    this.applyArtificialVisibility();
    this.emit({ type: 'light-added', id, record });
    this.selectLight(id);
    return record;
  }

  removeLight(id: string) {
    if (!this.instance) return;
    const rec = this.lights.get(id);
    if (!rec) return;
    const scene = this.instance.scene;
    scene.remove(rec.light);
    if (rec.light instanceof THREE.SpotLight && rec.light.target) {
      scene.remove(rec.light.target);
    }
    scene.remove(rec.helper);
    scene.remove(rec.halo);
    rec.light.dispose?.();
    this.lights.delete(id);
    if (this.selectedId === id) {
      this.selectedId = null;
      this.emit({ type: 'light-deselected' });
    }
    this.emit({ type: 'light-removed', id });
  }

  selectLight(id: string | null) {
    for (const rec of this.lights.values()) {
      this.setSelectedVisuals(rec, rec.id === id);
    }
    const prev = this.selectedId;
    this.selectedId = id;
    if (id && prev !== id) {
      this.emit({ type: 'light-selected', id, record: this.lights.get(id) });
    } else if (!id && prev) {
      this.emit({ type: 'light-deselected' });
    }
  }

  private setSelectedVisuals(rec: LightRecord, selected: boolean) {
    const group = rec.helper as THREE.Group;
    const wire = group.userData.wire as THREE.Mesh | undefined;
    if (wire) {
      const m = wire.material as THREE.MeshBasicMaterial;
      if (selected) {
        m.color.set('#60a5fa');
        m.opacity = 1;
      } else {
        m.color.set(rec.params.color);
        m.opacity = 0.75;
      }
    }
    const torus = group.children.find((c) => c.geometry?.type === 'TorusGeometry') as THREE.Mesh | undefined;
    if (torus) {
      const m = torus.material as THREE.MeshBasicMaterial;
      m.color.set(selected ? '#60a5fa' : rec.params.color);
      m.opacity = selected ? 1 : 0.8;
    }
    const haloMat = rec.halo.material as THREE.MeshBasicMaterial;
    haloMat.opacity = selected ? (rec.type === 'point' ? 0.3 : 0.1) : (rec.type === 'point' ? 0.18 : 0.06);
  }

  updateLight(id: string, patch: Partial<LightRecord['params']>) {
    const rec = this.lights.get(id);
    if (!rec || !this.instance) return;
    Object.assign(rec.params, patch);
    if (patch.intensity !== undefined) {
      const activeFactor = this.mode === 'night' ? 1 : 0.25;
      rec.light.intensity = (patch.intensity / 50) * 1.2 * activeFactor;
      (rec.halo.material as THREE.MeshBasicMaterial).opacity =
        (this.selectedId === id ? 0.3 : 0.18) * (0.4 + (patch.intensity / 100) * 1.2);
    }
    if (patch.color) {
      rec.light.color.set(patch.color);
      this.setHelperColor(rec, patch.color);
      (rec.halo.material as THREE.MeshBasicMaterial).color.set(patch.color);
    }
    if (patch.distance !== undefined) {
      rec.light.distance = patch.distance;
      if (rec.light instanceof THREE.SpotLight && rec.light.shadow) {
        rec.light.shadow.camera.far = Math.max(patch.distance + 2, 6);
        rec.light.shadow.camera.updateProjectionMatrix();
      }
    }
    if (patch.decay !== undefined) rec.light.decay = patch.decay;
    if (rec.light instanceof THREE.SpotLight) {
      if (patch.angle !== undefined) {
        rec.light.angle = THREE.MathUtils.degToRad(patch.angle);
        const mat = (rec.halo.material as THREE.MeshBasicMaterial);
        mat.needsUpdate = true;
      }
      if (patch.penumbra !== undefined) rec.light.penumbra = patch.penumbra;
    }
    this.emit({ type: 'light-updated', id, record: rec });
  }

  private setHelperColor(rec: LightRecord, color: string) {
    const group = rec.helper as THREE.Group;
    const c = new THREE.Color(color);
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material && 'color' in (mesh.material as THREE.Material)) {
        const m = mesh.material as THREE.MeshBasicMaterial;
        if ((child as any) === group.userData.wire && this.selectedId === rec.id) return;
        m.color.copy(c);
      }
    });
  }

  setMode(mode: Mode) {
    if (!this.instance || !this.presets || mode === this.mode) return;
    this.fromState = this.cloneState(this.mode === 'day' ? this.presets.day : this.presets.night);
    this.toState = this.cloneState(mode === 'day' ? this.presets.day : this.presets.night);
    this.startBg = (this.instance.scene.background as THREE.Color).clone();
    this.targetBg = new THREE.Color(this.toState.backgroundTint);
    this.modeTransitionStart = performance.now();
    this.modeTransitionActive = true;
    this.mode = mode;
    this.emit({ type: 'mode-changed', mode });
  }

  private cloneState(s: GlobalLightState): GlobalLightState {
    return JSON.parse(JSON.stringify(s));
  }

  private applyState(s: GlobalLightState, smooth: boolean) {
    if (!this.instance) return;
    this.instance.ambientLight.color.set(s.ambient.color);
    this.instance.ambientLight.intensity = s.ambient.intensity;
    this.instance.directionalLight.color.set(s.directional.color);
    this.instance.directionalLight.intensity = s.directional.intensity;
    this.instance.directionalLight.position.set(...s.directional.position);
    this.instance.directionalLight.shadow.radius = (1 - s.directional.shadowSoftness) * 5 + 0.5;
    if (!smooth) {
      (this.instance.scene.background as THREE.Color).set(s.backgroundTint);
    }
    this.applyArtificialVisibility();
  }

  private applyArtificialVisibility() {
    if (!this.presets) return;
    const active = this.mode === 'night' ? this.presets.night.artificialLightsActive : this.presets.day.artificialLightsActive;
    const factor = active ? 1 : 0.25;
    for (const rec of this.lights.values()) {
      const targetIntensity = (rec.params.intensity / 50) * 1.2 * factor;
      rec.light.intensity = targetIntensity;
      const haloOpacityBase =
        (this.selectedId === rec.id ? 0.3 : 0.18) * (0.4 + (rec.params.intensity / 100) * 1.2);
      (rec.halo.material as THREE.MeshBasicMaterial).opacity = haloOpacityBase * (active ? 1 : 0.6);
      (rec.halo.material as THREE.MeshBasicMaterial).transparent = true;
      rec.helper.visible = true;
    }
  }

  update(dt: number) {
    if (!this.instance) return;
    if (this.modeTransitionActive && this.fromState && this.toState && this.startBg && this.targetBg) {
      const t = Math.min(1, (performance.now() - this.modeTransitionStart) / (this.modeTransitionDuration * 1000));
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const a = this.fromState;
      const b = this.toState;
      const lerp = (x: number, y: number) => x + (y - x) * ease;
      this.instance.ambientLight.intensity = lerp(a.ambient.intensity, b.ambient.intensity);
      this.instance.ambientLight.color.lerpColors(new THREE.Color(a.ambient.color), new THREE.Color(b.ambient.color), ease);
      this.instance.directionalLight.intensity = lerp(a.directional.intensity, b.directional.intensity);
      this.instance.directionalLight.color.lerpColors(
        new THREE.Color(a.directional.color),
        new THREE.Color(b.directional.color),
        ease
      );
      this.instance.directionalLight.position.lerpVectors(
        new THREE.Vector3(...a.directional.position),
        new THREE.Vector3(...b.directional.position),
        ease
      );
      this.instance.directionalLight.shadow.radius =
        (1 - lerp(a.directional.shadowSoftness, b.directional.shadowSoftness)) * 5 + 0.5;
      (this.instance.scene.background as THREE.Color).copy(this.startBg).lerp(this.targetBg, ease);
      const fog = this.instance.scene.fog as THREE.Fog;
      if (fog) fog.color.copy(this.instance.scene.background as THREE.Color);

      const activeFactor = lerp(
        a.artificialLightsActive ? 1 : 0.25,
        b.artificialLightsActive ? 1 : 0.25
      );
      for (const rec of this.lights.values()) {
        rec.light.intensity = (rec.params.intensity / 50) * 1.2 * activeFactor;
      }
      if (t >= 1) {
        this.modeTransitionActive = false;
        this.applyState(this.toState, false);
      }
    }

    for (const rec of this.lights.values()) {
      if (rec.light instanceof THREE.SpotLight) {
        const p = rec.light.position;
        rec.helper.lookAt(rec.light.target.position);
        const scale = 0.6 + Math.tan(rec.light.angle) * 1.4;
        rec.halo.scale.set(scale, 1.4, scale);
        rec.halo.position.copy(p);
        const dir = new THREE.Vector3().subVectors(rec.light.target.position, p).normalize();
        rec.halo.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      } else {
        const pulse = 0.96 + Math.sin(performance.now() * 0.002 + rec.helper.position.x) * 0.04;
        rec.helper.children.forEach((c) => {
          const mesh = c as THREE.Mesh;
          if (mesh.material && 'opacity' in mesh.material) {
            (mesh.material as THREE.MeshBasicMaterial).transparent = true;
          }
        });
        rec.halo.scale.setScalar(pulse * (1 + rec.params.intensity / 200));
      }
    }
  }

  private getHitLightId(clientX: number, clientY: number): string | null {
    if (!this.instance) return null;
    const { camera, renderer, raycaster, pointer } = this.instance;
    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const helpers = Array.from(this.lights.values()).map((r) => r.helper);
    const hits = raycaster.intersectObjects(helpers, true);
    if (hits.length > 0) {
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj) {
        if (obj.userData?.lightId) return obj.userData.lightId as string;
        obj = obj.parent;
      }
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.instance) return;
    const id = this.getHitLightId(e.clientX, e.clientY);
    if (this.addPending) {
      const pos = this.instance.getGroundIntersection(e.clientX, e.clientY);
      if (pos) {
        this.addLight(this.addPending, [pos.x, Math.max(0.8, pos.y), pos.z]);
      }
      this.cancelAddLight();
      return;
    }
    if (id) {
      this.draggingId = id;
      this.selectLight(id);
      this.instance.controls.enabled = false;
      const rec = this.lights.get(id)!;
      const pos = this.instance.getGroundIntersection(e.clientX, e.clientY);
      if (pos) {
        this.dragOffset.copy(rec.light.position).sub(pos);
      }
    } else {
      this.selectLight(null);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.instance) return;
    const canvas = this.instance.renderer.domElement;
    if (this.draggingId) {
      const rec = this.lights.get(this.draggingId);
      if (rec) {
        const pos = this.instance.getGroundIntersection(e.clientX, e.clientY);
        if (pos) {
          const newPos = pos.clone().add(this.dragOffset);
          newPos.y = Math.max(0.4, Math.min(4, newPos.y));
          rec.light.position.copy(newPos);
          rec.helper.position.copy(newPos);
          if (rec.type !== 'spot') rec.halo.position.copy(newPos);
          if (rec.light instanceof THREE.SpotLight) {
            const prev = rec.light.position.clone().sub(new THREE.Vector3().copy(newPos));
            rec.light.target.position.sub(prev);
          }
          this.emit({ type: 'light-updated', id: rec.id, record: rec });
        }
      }
      return;
    }
    if (this.addPending) {
      canvas.style.cursor = 'crosshair';
      return;
    }
    const id = this.getHitLightId(e.clientX, e.clientY);
    if (id !== this.hovered?.userData?.lightId) {
      const prev = this.hovered;
      if (prev) {
        const recId = (prev as any).userData?.lightId;
        const rec = this.lights.get(recId);
        if (rec && recId !== this.selectedId) {
          this.setSelectedVisuals(rec, false);
        }
      }
      if (id) {
        const rec = this.lights.get(id);
        if (rec) {
          this.hovered = rec.helper;
          canvas.style.cursor = 'grab';
        }
      } else {
        this.hovered = null;
        canvas.style.cursor = '';
      }
    }
  };

  private onPointerUp = () => {
    if (!this.instance) return;
    if (this.draggingId) {
      const rec = this.lights.get(this.draggingId);
      if (rec) {
        this.emit({ type: 'light-updated', id: rec.id, record: rec });
      }
      this.draggingId = null;
      this.instance.controls.enabled = true;
    }
  };
}

export const sceneManager = new SceneManager();
