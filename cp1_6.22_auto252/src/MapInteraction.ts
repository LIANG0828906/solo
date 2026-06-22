import * as THREE from 'three';
import type { Photo } from './types';

const EARTH_RADIUS = 250;

export interface MarkerHandle {
  id: string;
  position: THREE.Vector3;
  photo: Photo;
  sprite: THREE.Sprite;
  pulse: THREE.Sprite;
  pulseScale: number;
}

export function latLngToVec3(lat: number, lng: number, radius = EARTH_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function makeGlowTexture(color = '#FFD700', size = 128, strength = 1.0): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  grd.addColorStop(0, color);
  grd.addColorStop(0.25, color + 'DD');
  grd.addColorStop(0.55, color + '55');
  grd.addColorStop(1, color + '00');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeCoreTexture(color = '#FFFFFF', glow = '#FFD700', size = 64): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  grd.addColorStop(0, color);
  grd.addColorStop(0.35, color);
  grd.addColorStop(0.5, glow + 'BB');
  grd.addColorStop(1, glow + '00');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export class MapInteraction {
  private markers: Map<string, MarkerHandle> = new Map();
  private coreTexture: THREE.Texture;
  private glowTexture: THREE.Texture;
  public markersGroup: THREE.Group;
  public selectedId: string | null = null;
  public onMarkerClick: ((photo: Photo | null) => void) | null = null;
  public onRequestFlyTo: ((target: THREE.Vector3, duration: number) => void) | null = null;

  constructor() {
    this.coreTexture = makeCoreTexture();
    this.glowTexture = makeGlowTexture();
    this.markersGroup = new THREE.Group();
    this.markersGroup.name = 'MarkersGroup';
  }

  dispose() {
    this.coreTexture.dispose();
    this.glowTexture.dispose();
    this.markers.clear();
  }

  clearMarkers() {
    while (this.markersGroup.children.length > 0) {
      const obj = this.markersGroup.children[0];
      this.markersGroup.remove(obj);
      if ((obj as THREE.Sprite).isSprite) {
        const mat = (obj as THREE.Sprite).material as THREE.SpriteMaterial;
        mat?.dispose?.();
      }
    }
    this.markers.clear();
  }

  setPhotos(photos: Photo[]) {
    this.clearMarkers();
    photos.forEach((p) => this.addMarker(p));
  }

  private addMarker(photo: Photo) {
    const pos = latLngToVec3(photo.location.lat, photo.location.lng);
    const coreMat = new THREE.SpriteMaterial({
      map: this.coreTexture,
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Sprite(coreMat);
    core.scale.set(6, 6, 1);
    core.position.copy(pos);
    core.renderOrder = 10;
    (core as any).photoId = photo.id;
    (core as any).isCore = true;

    const pulseMat = new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: 0xffd700,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    const pulse = new THREE.Sprite(pulseMat);
    pulse.scale.set(14, 14, 1);
    pulse.position.copy(pos);
    pulse.renderOrder = 9;

    this.markersGroup.add(core);
    this.markersGroup.add(pulse);

    this.markers.set(photo.id, {
      id: photo.id,
      position: pos,
      photo,
      sprite: core,
      pulse,
      pulseScale: 1,
    });
  }

  updateMarkers(time: number) {
    this.markers.forEach((m) => {
      const t = (time * 0.0016 + (m.sprite.id % 17) * 0.37) % 1;
      const pulse = 1 + 0.7 * t + 0.25 * Math.sin(time * 0.004 + m.sprite.id);
      const scale = 14 * pulse;
      m.pulse.scale.set(scale, scale, 1);
      (m.pulse.material as THREE.SpriteMaterial).opacity = 0.85 * (1 - t * 0.85);

      const isSel = this.selectedId === m.id;
      const coreScale = isSel ? 9 : 6;
      m.sprite.scale.set(coreScale + 0.6 * Math.sin(time * 0.005 + m.sprite.id), coreScale + 0.6 * Math.sin(time * 0.005 + m.sprite.id), 1);
      (m.sprite.material as THREE.SpriteMaterial).color.setHex(isSel ? 0x60a5fa : 0xffffff);
    });
  }

  handleClick(camera: THREE.Camera, screenX: number, screenY: number, width: number, height: number): Photo | null {
    const ndc = new THREE.Vector2(
      (screenX / width) * 2 - 1,
      -(screenY / height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);
    raycaster.far = 1200;
    const candidates: THREE.Object3D[] = [];
    this.markersGroup.traverse((o) => {
      if ((o as any).isCore) candidates.push(o);
    });
    const hits = raycaster.intersectObjects(candidates, false);
    if (hits.length > 0) {
      const obj = hits[0].object as any;
      const id = obj.photoId as string;
      const m = this.markers.get(id);
      if (m) {
        this.selectMarker(id);
        this.onMarkerClick?.(m.photo);
        return m.photo;
      }
    }
    return null;
  }

  selectMarker(id: string | null) {
    this.selectedId = id;
    this.markers.forEach((m) => {
      const mat = m.sprite.material as THREE.SpriteMaterial;
      if (m.id === id) {
        mat.color.setHex(0x60a5fa);
      } else {
        mat.color.setHex(0xffffff);
      }
    });
  }

  clearSelection() {
    this.selectedId = null;
    this.markers.forEach((m) => {
      const mat = m.sprite.material as THREE.SpriteMaterial;
      mat.color.setHex(0xffffff);
    });
  }

  flyToPhoto(photoId: string, duration = 600) {
    const m = this.markers.get(photoId);
    if (!m) return;
    const target = m.position.clone().normalize().multiplyScalar(EARTH_RADIUS + 320);
    this.selectMarker(photoId);
    this.onRequestFlyTo?.(target, duration);
  }

  projectToScreen(camera: THREE.Camera, photoId: string, width: number, height: number): { x: number; y: number; visible: boolean } | null {
    const m = this.markers.get(photoId);
    if (!m) return null;
    const vec = m.position.clone().project(camera);
    const x = (vec.x * 0.5 + 0.5) * width;
    const y = (-vec.y * 0.5 + 0.5) * height;
    const dir = m.position.clone().sub(camera.position).normalize();
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const dot = dir.dot(camDir);
    const visible = x > -200 && x < width + 200 && y > -200 && y < height + 200 && dot < 0;
    return { x, y, visible };
  }
}
