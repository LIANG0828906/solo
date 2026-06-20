import * as THREE from 'three';

export interface RingInfo {
  name: string;
  angle: number;
  normal: THREE.Vector3;
  axis: 'azimuth' | 'elevation' | 'rightAscension';
}

type RingMesh = THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>;

export class Armillary {
  group: THREE.Group;
  horizonRing!: RingMesh;
  meridianRing!: RingMesh;
  equatorRing!: RingMesh;
  zodiacRing!: RingMesh;
  rivets: THREE.Mesh[] = [];
  ringsMap: Map<THREE.Object3D, RingInfo> = new Map();
  private rivetMaterial: THREE.MeshStandardMaterial;
  private _highlightedRing: RingMesh | null = null;
  private latitude: number = 40;

  static readonly OUTER_RADIUS = 100;
  static readonly INNER_RADIUS = 88;
  static readonly RING_WIDTH = 6;
  static readonly RING_THICKNESS = 3;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Armillary';

    this.rivetMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xaa7700,
      emissiveIntensity: 0.2
    });

    this.build();
    this.setLatitude(40);
  }

  private build(): void {
    const scaleTexture = this.createScaleTexture();

    this.horizonRing = this.createRing(
      0x8B4513,
      new THREE.Euler(0, 0, 0),
      scaleTexture,
      '地平环',
      'azimuth'
    );
    this.group.add(this.horizonRing);

    this.meridianRing = this.createRing(
      0xC0C0C0,
      new THREE.Euler(Math.PI / 2, 0, 0),
      scaleTexture,
      '子午环',
      'elevation'
    );
    this.group.add(this.meridianRing);

    this.equatorRing = this.createRing(
      0xDAA520,
      new THREE.Euler(Math.PI / 2 - (23.5 * Math.PI / 180), 0, 0),
      scaleTexture,
      '赤道环',
      'rightAscension'
    );
    this.group.add(this.equatorRing);

    const zodiacGeom = new THREE.TorusGeometry(
      Armillary.OUTER_RADIUS - 3,
      Armillary.RING_THICKNESS * 0.5,
      16, 180
    );
    const zodiacMat = new THREE.MeshStandardMaterial({
      color: 0xB8860B,
      metalness: 0.85,
      roughness: 0.3,
      transparent: true,
      opacity: 0.7
    });
    this.zodiacRing = new THREE.Mesh(zodiacGeom, zodiacMat) as RingMesh;
    this.zodiacRing.rotation.set(
      Math.PI / 2 - (23.5 * Math.PI / 180),
      0, 0
    );
    this.group.add(this.zodiacRing);

    this.createRivets();
  }

  private createRing(
    colorHex: number,
    rotation: THREE.Euler,
    bumpTex: THREE.CanvasTexture,
    name: string,
    axis: RingInfo['axis']
  ): RingMesh {
    const meanRadius = (Armillary.OUTER_RADIUS + Armillary.INNER_RADIUS) / 2;
    const torusThickness = (Armillary.OUTER_RADIUS - Armillary.INNER_RADIUS) / 2;

    const geom = new THREE.TorusGeometry(
      meanRadius,
      torusThickness,
      24,
      360
    );

    const color = new THREE.Color(colorHex);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.85,
      roughness: 0.25,
      bumpMap: bumpTex,
      bumpScale: 0.5
    });

    const mesh = new THREE.Mesh(geom, mat) as RingMesh;
    mesh.rotation.copy(rotation);
    mesh.name = name;

    const normal = new THREE.Vector3(0, 0, 1).applyEuler(rotation).normalize();
    this.ringsMap.set(mesh, { name, angle: 0, normal, axis });

    return mesh;
  }

  private createScaleTexture(): THREE.CanvasTexture {
    const w = 512;
    const h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#2a1f0a');
    grad.addColorStop(0.5, '#4a3820');
    grad.addColorStop(1, '#2a1f0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let deg = 0; deg < 360; deg++) {
      const x = (deg / 360) * w;
      const isMajor = deg % 10 === 0;
      const isMedium = deg % 5 === 0;
      const tickH = isMajor ? h * 0.7 : isMedium ? h * 0.5 : h * 0.3;
      const tickW = isMajor ? 2.5 : isMedium ? 1.5 : 0.8;
      ctx.fillStyle = isMajor ? '#fff8dc' : '#d4c49a';
      ctx.fillRect(x, (h - tickH) / 2, tickW, tickH);

      if (isMajor) {
        ctx.fillStyle = '#fffacd';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(deg), x, h / 2);
      }
    }

    for (let i = 0; i < 2000; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const brightness = 30 + Math.random() * 40;
      ctx.fillStyle = `rgba(${brightness},${brightness * 0.8},${brightness * 0.5},0.3)`;
      ctx.fillRect(rx, ry, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.anisotropy = 8;
    return texture;
  }

  private createRivets(): void {
    const radius = 2;
    const geom = new THREE.SphereGeometry(radius, 16, 12);

    const positions: THREE.Vector3[] = [];
    const r = Armillary.OUTER_RADIUS - 1;

    positions.push(new THREE.Vector3(r, 0, 0));
    positions.push(new THREE.Vector3(-r, 0, 0));
    positions.push(new THREE.Vector3(0, r, 0));
    positions.push(new THREE.Vector3(0, -r, 0));
    positions.push(new THREE.Vector3(0, 0, r));
    positions.push(new THREE.Vector3(0, 0, -r));

    const mr = Armillary.OUTER_RADIUS - 1;
    const eqTilt = 23.5 * Math.PI / 180;
    positions.push(new THREE.Vector3(mr * Math.cos(eqTilt), mr * Math.sin(eqTilt), 0));
    positions.push(new THREE.Vector3(-mr * Math.cos(eqTilt), -mr * Math.sin(eqTilt), 0));
    positions.push(new THREE.Vector3(0, mr * Math.sin(eqTilt), mr * Math.cos(eqTilt)));
    positions.push(new THREE.Vector3(0, -mr * Math.sin(eqTilt), -mr * Math.cos(eqTilt)));

    positions.forEach((pos) => {
      const mesh = new THREE.Mesh(geom, this.rivetMaterial);
      mesh.position.copy(pos);
      mesh.name = '铆钉';
      this.group.add(mesh);
      this.rivets.push(mesh);
    });
  }

  setLatitude(latDeg: number): void {
    this.latitude = latDeg;
    const tilt = (90 - latDeg) * Math.PI / 180;
    this.group.rotation.x = tilt;
  }

  getLatitude(): number {
    return this.latitude;
  }

  highlightRing(mesh: RingMesh | null): void {
    if (this._highlightedRing && this._highlightedRing !== mesh) {
      const m = this._highlightedRing.material as THREE.MeshStandardMaterial;
      m.emissive = new THREE.Color(0x000000);
      m.emissiveIntensity = 0;
      this._highlightedRing.scale.set(1, 1, 1);
    }

    if (mesh && mesh !== this._highlightedRing) {
      const m = mesh.material as THREE.MeshStandardMaterial;
      m.emissive = new THREE.Color(0xF0E68C);
      m.emissiveIntensity = 0.5;
      mesh.scale.set(1.02, 1.02, 1.02);
    }

    this._highlightedRing = mesh;
  }

  getHighlightedRing(): RingMesh | null {
    return this._highlightedRing;
  }

  getRingInfo(mesh: THREE.Object3D): RingInfo | null {
    const info = this.ringsMap.get(mesh);
    if (!info) return null;
    const angle = this.calculateRingAngle(mesh as RingMesh);
    return { ...info, angle };
  }

  private calculateRingAngle(mesh: RingMesh): number {
    const info = this.ringsMap.get(mesh);
    if (!info) return 0;

    const worldUp = new THREE.Vector3(0, 1, 0);
    const forward = new THREE.Vector3(0, 0, -1);
    const ringNormal = info.normal.clone().applyEuler(this.group.rotation);

    if (info.axis === 'azimuth') {
      const proj = new THREE.Vector3(1, 0, 0);
      return proj.angle() * 180 / Math.PI;
    } else if (info.axis === 'elevation') {
      const dot = THREE.MathUtils.clamp(ringNormal.dot(worldUp), -1, 1);
      return 90 - (Math.acos(dot) * 180 / Math.PI);
    } else {
      const dot = THREE.MathUtils.clamp(ringNormal.dot(forward), -1, 1);
      return Math.acos(dot) * 180 / Math.PI;
    }
  }

  getRingMeshes(): THREE.Object3D[] {
    return [this.horizonRing, this.meridianRing, this.equatorRing, this.zodiacRing];
  }

  dispose(): void {
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.Material & {
            bumpMap?: THREE.Texture;
            map?: THREE.Texture;
          };
          if (mat.bumpMap) mat.bumpMap.dispose();
          if (mat.map) mat.map.dispose();
          m.dispose();
        });
      }
    });
    this.ringsMap.clear();
  }
}
