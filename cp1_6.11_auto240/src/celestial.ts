import * as THREE from 'three';
import type { Intersection } from 'three';

export interface StarData {
  id: number;
  position: THREE.Vector3;
  magnitude: number;
  color: THREE.Color;
  name: string;
  constellation: string;
}

export interface PlanetState {
  name: '金星' | '木星' | '水星' | '火星' | '土星';
  color: number;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  initialMeanAnomaly: number;
  periodDays: number;
  mesh: THREE.Mesh;
  orbitLine: THREE.Line;
  visible: boolean;
}

export interface EclipseEvent {
  type: 'solar' | 'lunar' | null;
  coneMesh?: THREE.Group;
  labelSprite?: THREE.Sprite;
}

const TWENTY_EIGHT_MANSION = [
  '角木蛟', '亢金龙', '氐土貉', '房日兔', '心月狐', '尾火虎', '箕水豹',
  '斗木獬', '牛金牛', '女土蝠', '虚日鼠', '危月燕', '室火猪', '壁水獝',
  '奎木狼', '娄金狗', '胃土雉', '昴日鸡', '毕月乌', '觜火猴', '参水猿',
  '井木犴', '鬼金羊', '柳土獐', '星日马', '张月鹿', '翼火蛇', '轸水蚓'
];

const STAR_NAMES = [
  '天枢', '天璇', '天玑', '天权', '玉衡', '开阳', '摇光',
  '紫微', '太微', '天市', '天狼', '南河', '北河', '参宿',
  '轩辕', '角宿', '亢宿', '氐宿', '房宿', '心宿', '尾宿',
  '箕宿', '斗宿', '牛宿', '女宿', '虚宿', '危宿', '室宿',
  '壁宿', '奎宿', '娄宿', '胃宿', '昴宿', '毕宿', '觜宿',
  '参宿四', '参宿七', '天狼星', '老人星', '大角星', '织女一',
  '河鼓二', '天津四', '北落师门', '毕宿五', '心宿二', '角宿一'
];

const DEG2RAD = Math.PI / 180;

export class CelestialSphere {
  group: THREE.Group;
  stars!: THREE.Points;
  starData: StarData[] = [];
  sun!: THREE.Mesh;
  moon!: THREE.Mesh;
  zodiacRing!: THREE.Line;
  lunarOrbitRing!: THREE.Line;
  planets: Map<string, PlanetState> = new Map();
  eclipseState: EclipseEvent = { type: null };

  private sphereRadius: number;
  private sunLongitude: number = 0;
  private moonLongitude: number = 0;
  private moonLatitude: number = 0;
  private moonMaterial!: THREE.MeshStandardMaterial;
  private currentMoonPhase: number = -1;
  private moonPhaseCanvas!: HTMLCanvasElement;
  private moonPhaseCtx!: CanvasRenderingContext2D;
  private moonPhaseTexture!: THREE.CanvasTexture;
  private groupTiltX: number = 0;
  private sunLight!: THREE.PointLight;

  private readonly ECLIPTIC_OBLIQUITY = 23.5 * DEG2RAD;
  private readonly LUNAR_INCLINATION = 5.145 * DEG2RAD;
  private readonly J2000 = Date.UTC(2000, 0, 1, 12, 0, 0) / 86400000;

  constructor(radius: number) {
    this.sphereRadius = radius;
    this.group = new THREE.Group();
    this.group.name = 'CelestialSphere';

    this.initMoonPhaseCanvas();
    this.build();
  }

  private initMoonPhaseCanvas(): void {
    this.moonPhaseCanvas = document.createElement('canvas');
    this.moonPhaseCanvas.width = 512;
    this.moonPhaseCanvas.height = 512;
    this.moonPhaseCtx = this.moonPhaseCanvas.getContext('2d')!;
    this.moonPhaseTexture = new THREE.CanvasTexture(this.moonPhaseCanvas);
    this.moonPhaseTexture.anisotropy = 8;
  }

  private build(): void {
    this.createStars(2500);
    this.createZodiacRing();
    this.createLunarOrbitRing();
    this.createSunMoon();
    this.createPlanets();
    this.createEclipseEffects();
  }

  createStars(count: number): void {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const phi_step = Math.PI * (1 + Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const theta = phi_step * i;

      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);

      const r = this.sphereRadius * (0.995 + Math.random() * 0.01);
      positions[i * 3] = x * r;
      positions[i * 3 + 1] = y * r;
      positions[i * 3 + 2] = z * r;

      const brightness = 0.5 + Math.random() * 0.5;
      const colorT = Math.random();
      const baseColor = new THREE.Color(0xFFFFFF).lerp(new THREE.Color(0xFFFACD), colorT);
      baseColor.multiplyScalar(brightness);

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;

      const magnitude = Math.random() * 6;
      sizes[i] = 1.0 + (6 - magnitude) * 0.5;

      const longitude = (theta * 180 / Math.PI + 360) % 360;
      const latitude = 90 - (phi * 180 / Math.PI);
      const mansionIdx = Math.floor(longitude / (360 / 28)) % 28;
      const starIdx = i % STAR_NAMES.length;

      this.starData.push({
        id: i,
        position: new THREE.Vector3(x * r, y * r, z * r),
        magnitude,
        color: baseColor.clone(),
        name: `${STAR_NAMES[starIdx]}${String(i).padStart(3, '0')}`,
        constellation: TWENTY_EIGHT_MANSION[mansionIdx]
      });
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starCanvas = document.createElement('canvas');
    starCanvas.width = 64;
    starCanvas.height = 64;
    const sctx = starCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,240,0.7)');
    grad.addColorStop(0.6, 'rgba(255,250,220,0.3)');
    grad.addColorStop(1, 'rgba(255,240,200,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);
    const starSprite = new THREE.CanvasTexture(starCanvas);

    const mat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      map: starSprite,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.stars = new THREE.Points(geom, mat);
    this.stars.name = 'Stars';
    this.group.add(this.stars);
  }

  createZodiacRing(): void {
    const segments = 720;
    const points: THREE.Vector3[] = [];
    const r = this.sphereRadius * 0.92;

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = r * Math.cos(t);
      const z = r * Math.sin(t) * Math.cos(this.ECLIPTIC_OBLIQUITY);
      const y = r * Math.sin(t) * Math.sin(this.ECLIPTIC_OBLIQUITY);
      points.push(new THREE.Vector3(x, y, z));
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: 0xFFD700,
      linewidth: 1,
      dashSize: 6,
      gapSize: 3,
      transparent: true,
      opacity: 0.7
    });

    this.zodiacRing = new THREE.Line(geom, mat);
    this.zodiacRing.computeLineDistances();
    this.zodiacRing.name = '黄道';
    this.group.add(this.zodiacRing);
  }

  createLunarOrbitRing(): void {
    const segments = 720;
    const points: THREE.Vector3[] = [];
    const r = this.sphereRadius * 0.90;
    const nodeLongitude = 0;

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x_ecl = r * Math.cos(t);
      const y_ecl = r * Math.sin(t) * Math.sin(this.LUNAR_INCLINATION);
      const z_ecl = r * Math.sin(t) * Math.cos(this.LUNAR_INCLINATION);

      const x = x_ecl * Math.cos(nodeLongitude) - z_ecl * Math.sin(nodeLongitude);
      const z = x_ecl * Math.sin(nodeLongitude) + z_ecl * Math.cos(nodeLongitude);
      const y = y_ecl * Math.cos(this.ECLIPTIC_OBLIQUITY) - z_ecl_equatorial_component(x_ecl, y_ecl, z_ecl) * Math.sin(this.ECLIPTIC_OBLIQUITY);
      const z_eq = y_ecl * Math.sin(this.ECLIPTIC_OBLIQUITY) + z_ecl_equatorial_component(x_ecl, y_ecl, z_ecl) * Math.cos(this.ECLIPTIC_OBLIQUITY);

      points.push(new THREE.Vector3(x, y, z_eq));
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: 0xC0C0C0,
      linewidth: 1,
      dashSize: 5,
      gapSize: 3,
      transparent: true,
      opacity: 0.6
    });

    this.lunarOrbitRing = new THREE.Line(geom, mat);
    this.lunarOrbitRing.computeLineDistances();
    this.lunarOrbitRing.name = '白道';
    this.group.add(this.lunarOrbitRing);
  }

  createSunMoon(): void {
    const sunGeom = new THREE.SphereGeometry(6, 32, 24);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xFF4500
    });
    this.sun = new THREE.Mesh(sunGeom, sunMat);
    this.sun.name = '太阳';
    this.group.add(this.sun);

    this.sunLight = new THREE.PointLight(0xFFF5E1, 1.2, 0, 2);
    this.sunLight.position.copy(this.sun.position);
    this.group.add(this.sunLight);

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const gctx = glowCanvas.getContext('2d')!;
    const glowGrad = gctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    glowGrad.addColorStop(0, 'rgba(255,180,60,0.9)');
    glowGrad.addColorStop(0.3, 'rgba(255,120,30,0.5)');
    glowGrad.addColorStop(1, 'rgba(255,60,0,0)');
    gctx.fillStyle = glowGrad;
    gctx.fillRect(0, 0, 256, 256);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sunGlow = new THREE.Sprite(glowMat);
    sunGlow.scale.set(20, 20, 1);
    this.sun.add(sunGlow);

    const moonGeom = new THREE.SphereGeometry(5, 32, 24);
    this.generateMoonPhaseTexture(0.5);
    this.moonMaterial = new THREE.MeshStandardMaterial({
      map: this.moonPhaseTexture,
      roughness: 0.9,
      metalness: 0.0
    });
    this.moon = new THREE.Mesh(moonGeom, this.moonMaterial);
    this.moon.name = '月亮';
    this.group.add(this.moon);
  }

  createPlanets(): void {
    const planetDefs: Array<{
      name: PlanetState['name'];
      color: number;
      semiMajorAxis: number;
      eccentricity: number;
      inclination: number;
      periodDays: number;
    }> = [
      { name: '水星', color: 0x708090, semiMajorAxis: 10, eccentricity: 0.2056, inclination: 7, periodDays: 87.97 },
      { name: '金星', color: 0xFFD700, semiMajorAxis: 15, eccentricity: 0.0068, inclination: 3.4, periodDays: 224.7 },
      { name: '火星', color: 0xFF4500, semiMajorAxis: 20, eccentricity: 0.0934, inclination: 1.9, periodDays: 686.97 },
      { name: '木星', color: 0xFFA500, semiMajorAxis: 25, eccentricity: 0.0489, inclination: 1.3, periodDays: 4332.59 },
      { name: '土星', color: 0x8B4513, semiMajorAxis: 30, eccentricity: 0.0565, inclination: 2.5, periodDays: 10759.22 }
    ];

    planetDefs.forEach((def, idx) => {
      const geom = new THREE.SphereGeometry(4, 24, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.2,
        roughness: 0.7,
        metalness: 0.3
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = def.name;
      mesh.visible = false;
      this.group.add(mesh);

      const orbitGeom = this.buildOrbitGeometry(def.semiMajorAxis, def.eccentricity, def.inclination * DEG2RAD, idx);
      const orbitMat = new THREE.LineDashedMaterial({
        color: def.color,
        linewidth: 1,
        dashSize: 4,
        gapSize: 3,
        transparent: true,
        opacity: 0.35
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      orbitLine.computeLineDistances();
      orbitLine.visible = false;
      orbitLine.name = `${def.name}轨道`;
      this.group.add(orbitLine);

      this.planets.set(def.name, {
        name: def.name,
        color: def.color,
        semiMajorAxis: def.semiMajorAxis,
        eccentricity: def.eccentricity,
        inclination: def.inclination * DEG2RAD,
        initialMeanAnomaly: (idx * 73) % 360 * DEG2RAD,
        periodDays: def.periodDays,
        mesh,
        orbitLine,
        visible: false
      });
    });
  }

  private buildOrbitGeometry(a: number, e: number, inc: number, seed: number): THREE.BufferGeometry {
    const segments = 360;
    const points: THREE.Vector3[] = [];
    const nodeAngle = (seed * 37) * DEG2RAD;

    for (let i = 0; i <= segments; i++) {
      const nu = (i / segments) * Math.PI * 2;
      const r = a * (1 - e * e) / (1 + e * Math.cos(nu));

      const x_orbit = r * Math.cos(nu);
      const y_orbit = r * Math.sin(nu);

      const x_inc = x_orbit;
      const y_inc = y_orbit * Math.cos(inc);
      const z_inc = y_orbit * Math.sin(inc);

      const x = x_inc * Math.cos(nodeAngle) - z_inc * Math.sin(nodeAngle);
      const z = x_inc * Math.sin(nodeAngle) + z_inc * Math.cos(nodeAngle);
      const y = y_inc * Math.cos(this.ECLIPTIC_OBLIQUITY) - z * Math.sin(this.ECLIPTIC_OBLIQUITY);
      const z_eq = y_inc * Math.sin(this.ECLIPTIC_OBLIQUITY) + z * Math.cos(this.ECLIPTIC_OBLIQUITY);

      const scale = (this.sphereRadius * 0.85) / 30;
      points.push(new THREE.Vector3(x * scale, y * scale, z_eq * scale));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  private createEclipseEffects(): void {
  }

  private daysSinceJ2000(jd: number): number {
    return jd - this.J2000;
  }

  updateSunPosition(jd: number): void {
    const D = this.daysSinceJ2000(jd);
    const L0 = (280.4665 + 0.9856474 * D) % 360;
    const g = ((357.5291 + 0.9856003 * D) % 360) * DEG2RAD;
    const lambda = (L0 + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) % 360;
    this.sunLongitude = lambda;

    const eclLon = lambda * DEG2RAD;
    const r = this.sphereRadius * 0.92;
    const x = r * Math.cos(eclLon);
    const y_ecl = r * Math.sin(eclLon);
    const z_ecl = 0;

    const y = y_ecl * Math.cos(this.ECLIPTIC_OBLIQUITY);
    const z = y_ecl * Math.sin(this.ECLIPTIC_OBLIQUITY);

    this.sun.position.set(x, y, z);
    this.sunLight.position.copy(this.sun.position);
  }

  updateMoonPosition(jd: number): void {
    const D = this.daysSinceJ2000(jd);

    const L = (218.316 + 13.176396 * D) % 360;
    const M = (134.963 + 13.064993 * D) % 360;
    const F = (93.272 + 13.229350 * D) % 360;
    const Omega = (125.044 - 0.0529538 * D) % 360;

    const lambda = (L + 6.289 * Math.sin(M * DEG2RAD)) % 360;
    const beta = 5.128 * Math.sin(F * DEG2RAD);

    this.moonLongitude = lambda;
    this.moonLatitude = beta;

    const r = this.sphereRadius * 0.90;
    const lon = lambda * DEG2RAD;
    const lat = beta * DEG2RAD;
    const OmegaRad = Omega * DEG2RAD;

    let x_ecl = r * Math.cos(lon) * Math.cos(lat);
    let y_ecl = r * Math.sin(lon) * Math.cos(lat);
    let z_ecl = r * Math.sin(lat);

    const cosO = Math.cos(OmegaRad);
    const sinO = Math.sin(OmegaRad);
    const x_rot = x_ecl * cosO - z_ecl * sinO;
    const z_rot = x_ecl * sinO + z_ecl * cosO;

    const y = y_ecl * Math.cos(this.ECLIPTIC_OBLIQUITY) - z_rot * Math.sin(this.ECLIPTIC_OBLIQUITY);
    const z = y_ecl * Math.sin(this.ECLIPTIC_OBLIQUITY) + z_rot * Math.cos(this.ECLIPTIC_OBLIQUITY);

    this.moon.position.set(x_rot, y, z);

    const phase = this.getMoonPhaseValue();
    if (Math.abs(phase - this.currentMoonPhase) > 0.005) {
      this.generateMoonPhaseTexture(phase);
      this.currentMoonPhase = phase;
    }
  }

  getMoonPhaseValue(): number {
    let diff = (this.moonLongitude - this.sunLongitude + 360) % 360;
    return diff / 360;
  }

  generateMoonPhaseTexture(phase: number): void {
    const ctx = this.moonPhaseCtx;
    const W = this.moonPhaseCanvas.width;
    const H = this.moonPhaseCanvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 10;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    const p = phase;

    const litGradient = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R);
    litGradient.addColorStop(0, '#FFFBE6');
    litGradient.addColorStop(0.5, '#E8E0C0');
    litGradient.addColorStop(1, '#B0A880');

    if (p <= 0.5) {
      ctx.fillStyle = litGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      const ellipseW = Math.abs(Math.cos(p * Math.PI * 2)) * R;
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      if (p < 0.25) {
        ctx.ellipse(cx, cy, ellipseW, R, 0, -Math.PI / 2, Math.PI / 2);
      } else {
        ctx.ellipse(cx, cy, ellipseW, R, 0, Math.PI / 2, -Math.PI / 2);
      }
      ctx.fill();
    } else {
      ctx.fillStyle = litGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI / 2, -Math.PI / 2);
      ctx.fill();

      const ellipseW = Math.abs(Math.cos(p * Math.PI * 2)) * R;
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      if (p < 0.75) {
        ctx.ellipse(cx, cy, ellipseW, R, 0, Math.PI / 2, -Math.PI / 2);
      } else {
        ctx.ellipse(cx, cy, ellipseW, R, 0, -Math.PI / 2, Math.PI / 2);
      }
      ctx.fill();
    }

    const craters = [
      { x: -0.3, y: -0.2, r: 0.12 },
      { x: 0.2, y: 0.3, r: 0.15 },
      { x: 0.4, y: -0.1, r: 0.08 },
      { x: -0.1, y: 0.45, r: 0.10 },
      { x: -0.4, y: 0.25, r: 0.07 },
      { x: 0.1, y: -0.4, r: 0.06 },
      { x: 0.3, y: 0.1, r: 0.09 }
    ];
    craters.forEach((cr) => {
      const x = cx + cr.x * R;
      const y = cy + cr.y * R;
      const rad = cr.r * R;
      const cg = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 0, x, y, rad);
      cg.addColorStop(0, 'rgba(140,130,100,0.6)');
      cg.addColorStop(0.7, 'rgba(90,85,70,0.5)');
      cg.addColorStop(1, 'rgba(60,55,45,0.3)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    });

    for (let i = 0; i < 200; i++) {
      const x = cx + (Math.random() - 0.5) * 2 * R * 0.95;
      const y = cy + (Math.random() - 0.5) * 2 * R * 0.95;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < R) {
        const gray = 120 + Math.floor(Math.random() * 60);
        ctx.fillStyle = `rgba(${gray},${gray - 15},${gray - 30},${0.15 + Math.random() * 0.2})`;
        const s = 0.5 + Math.random() * 2;
        ctx.fillRect(x, y, s, s);
      }
    }

    ctx.restore();

    const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R);
    rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
    rimGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    this.moonPhaseTexture.needsUpdate = true;
  }

  updatePlanets(jd: number): void {
    const D = this.daysSinceJ2000(jd);
    const scale = (this.sphereRadius * 0.85) / 30;

    this.planets.forEach((planet) => {
      const n = (2 * Math.PI) / planet.periodDays;
      const M = planet.initialMeanAnomaly + n * D;
      const e = planet.eccentricity;
      const E = M + e * Math.sin(M);
      const nu = 2 * Math.atan2(
        Math.sqrt((1 + e) / (1 - e)) * Math.sin(E / 2),
        Math.cos(E / 2)
      );
      const r = planet.semiMajorAxis * (1 - e * Math.cos(E));

      const x_orbit = r * Math.cos(nu);
      const y_orbit = r * Math.sin(nu);

      const x_inc = x_orbit;
      const y_inc = y_orbit * Math.cos(planet.inclination);
      const z_inc = y_orbit * Math.sin(planet.inclination);

      const nodeAngle = planet.initialMeanAnomaly * 0.5;
      const cosN = Math.cos(nodeAngle);
      const sinN = Math.sin(nodeAngle);
      const x = (x_inc * cosN - z_inc * sinN) * scale;
      const z_rot = (x_inc * sinN + z_inc * cosN) * scale;
      const y = (y_inc * Math.cos(this.ECLIPTIC_OBLIQUITY) - z_rot * Math.sin(this.ECLIPTIC_OBLIQUITY));
      const z_eq = (y_inc * Math.sin(this.ECLIPTIC_OBLIQUITY) + z_rot * Math.cos(this.ECLIPTIC_OBLIQUITY));

      planet.mesh.position.set(x, y, z_eq);
    });
  }

  setPlanetVisible(name: string, visible: boolean): void {
    const planet = this.planets.get(name);
    if (planet) {
      planet.visible = visible;
      planet.mesh.visible = visible;
      planet.orbitLine.visible = visible;
    }
  }

  detectEclipse(): EclipseEvent {
    this.clearEclipse();

    let deltaLon = (this.moonLongitude - this.sunLongitude + 540) % 360 - 180;
    const absDelta = Math.abs(deltaLon);
    const absBeta = Math.abs(this.moonLatitude);

    const LON_TOL = 1.5;
    const LAT_TOL = 1.0;

    if (absBeta < LAT_TOL) {
      if (absDelta < LON_TOL) {
        this.eclipseState = { type: 'solar' };
        this.buildEclipseCone('solar');
      } else if (Math.abs(absDelta - 180) < LON_TOL) {
        this.eclipseState = { type: 'lunar' };
        this.buildEclipseCone('lunar');
      }
    }

    return this.eclipseState;
  }

  private buildEclipseCone(type: 'solar' | 'lunar'): void {
    const coneGroup = new THREE.Group();

    if (type === 'solar') {
      const sunToMoon = new THREE.Vector3().subVectors(this.moon.position, this.sun.position);
      const dir = sunToMoon.clone().normalize();
      const dist = this.moon.position.length() * 0.9;

      const coneGeom = new THREE.ConeGeometry(8, dist, 32, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(coneGeom, coneMat);

      const offset = this.sun.position.clone().add(dir.clone().multiplyScalar(dist / 2));
      cone.position.copy(offset);
      cone.lookAt(this.sun.position);
      cone.rotateX(Math.PI / 2);
      coneGroup.add(cone);

      this.eclipseState.labelSprite = this.createLabelSprite('日食（朔日）', 0xFF4500);
      this.eclipseState.labelSprite.position.copy(this.moon.position).add(new THREE.Vector3(0, 8, 0));
      this.group.add(this.eclipseState.labelSprite);

    } else {
      const earthToMoon = this.moon.position.clone();
      const dir = earthToMoon.clone().normalize();
      const dist = earthToMoon.length() * 0.5;

      const coneGeom = new THREE.ConeGeometry(10, dist, 32, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.position.copy(dir.clone().multiplyScalar(dist / 2));
      cone.lookAt(new THREE.Vector3(0, 0, 0));
      cone.rotateX(Math.PI / 2);
      coneGroup.add(cone);

      this.eclipseState.labelSprite = this.createLabelSprite('月食（望日）', 0xC0C0C0);
      this.eclipseState.labelSprite.position.copy(this.moon.position).add(new THREE.Vector3(0, 8, 0));
      this.group.add(this.eclipseState.labelSprite);
    }

    this.eclipseState.coneMesh = coneGroup;
    this.group.add(coneGroup);
  }

  private createLabelSprite(text: string, colorHex: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    roundRect(ctx, 10, 10, 492, 108, 16);
    ctx.fill();

    ctx.strokeStyle = '#' + new THREE.Color(colorHex).getHexString();
    ctx.lineWidth = 3;
    roundRect(ctx, 10, 10, 492, 108, 16);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(25, 6.25, 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  clearEclipse(): void {
    if (this.eclipseState.coneMesh) {
      this.group.remove(this.eclipseState.coneMesh);
      this.eclipseState.coneMesh.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) (mesh.material as THREE.Material).dispose();
      });
    }
    if (this.eclipseState.labelSprite) {
      this.group.remove(this.eclipseState.labelSprite);
      const mat = this.eclipseState.labelSprite.material as THREE.SpriteMaterial;
      if (mat.map) mat.map.dispose();
      mat.dispose();
    }
    this.eclipseState = { type: null };
  }

  setLatitude(latDeg: number): void {
    const tilt = (90 - latDeg) * DEG2RAD;
    this.group.rotation.x = tilt;
    this.groupTiltX = tilt;
  }

  pickStar(intersection: Intersection): StarData | null {
    if (intersection.object !== this.stars) return null;
    const idx = intersection.index;
    if (idx === undefined || idx >= this.starData.length) return null;
    return this.starData[idx];
  }

  getSunLongitude(): number {
    return (this.sunLongitude + 360) % 360;
  }

  getMoonLongitude(): number {
    return (this.moonLongitude + 360) % 360;
  }

  getVisiblePlanets(altitudeThreshold: number = 5): string[] {
    const visible: string[] = [];
    const threshold = altitudeThreshold * DEG2RAD;
    const up = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(this.groupTiltX, 0, 0));

    this.planets.forEach((planet) => {
      if (!planet.visible) return;
      const pos = planet.mesh.position.clone().normalize();
      const dot = THREE.MathUtils.clamp(pos.dot(up), -1, 1);
      const altitude = Math.asin(dot);
      if (altitude > threshold) {
        visible.push(planet.name);
      }
    });

    return visible;
  }

  getPlanetMeshes(): THREE.Mesh[] {
    return Array.from(this.planets.values()).map(p => p.mesh);
  }

  dispose(): void {
    this.clearEclipse();
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const line = obj as THREE.Line;
      const points = obj as THREE.Points;
      const sprite = obj as THREE.Sprite;

      if (mesh.geometry) mesh.geometry.dispose();
      if (line.geometry) line.geometry.dispose();
      if (points.geometry) points.geometry.dispose();

      const materials: THREE.Material[] = [];
      if (mesh.material) materials.push(...(Array.isArray(mesh.material) ? mesh.material : [mesh.material]));
      if (line.material) materials.push(...(Array.isArray(line.material) ? line.material : [line.material]));
      if (points.material) materials.push(...(Array.isArray(points.material) ? points.material : [points.material]));
      if (sprite.material) materials.push(sprite.material);

      materials.forEach((m) => {
        const mat = m as THREE.Material & {
          map?: THREE.Texture; bumpMap?: THREE.Texture;
          emissiveMap?: THREE.Texture;
        };
        if (mat.map) mat.map.dispose();
        if (mat.bumpMap) mat.bumpMap.dispose();
        if (mat.emissiveMap) mat.emissiveMap.dispose();
        m.dispose();
      });
    });
    this.moonPhaseTexture.dispose();
    this.starData = [];
    this.planets.clear();
  }
}

function z_ecl_equatorial_component(x: number, y: number, z: number): number {
  return z;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
