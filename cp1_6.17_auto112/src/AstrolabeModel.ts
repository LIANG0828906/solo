import * as THREE from 'three';

export interface CoordinateData {
  eclipticLongitude: number;
  eclipticLatitude: number;
  altitude: number;
  azimuth: number;
}

export class AstrolabeModel {
  public readonly group: THREE.Group;
  private readonly celestialSphere: THREE.Group;
  private readonly outerRing: THREE.Mesh;
  private readonly innerRing: THREE.Mesh;
  private readonly pointer: THREE.Group;
  private readonly pointerTip: THREE.Mesh;
  private readonly centralStar: THREE.Group;
  private readonly backgroundStars: THREE.Points;
  private readonly starOriginalPositions: Float32Array;

  private innerTilt: number = 0;
  private pointerAzimuth: number = 0;
  private cameraElevation: number = 30;

  constructor() {
    this.group = new THREE.Group();
    this.celestialSphere = new THREE.Group();
    this.group.add(this.celestialSphere);

    this.createCelestialGrid();
    this.centralStar = this.createCentralStar();
    this.celestialSphere.add(this.centralStar);

    const starsResult = this.createBackgroundStars();
    this.backgroundStars = starsResult.points;
    this.starOriginalPositions = starsResult.positions;
    this.celestialSphere.add(this.backgroundStars);

    this.outerRing = this.createRing(30, 1.5, 0xB8860B);
    this.group.add(this.outerRing);

    this.innerRing = this.createRing(22, 1.5, 0xCD7F32);
    this.innerRing.rotation.x = Math.PI / 2;
    this.group.add(this.innerRing);

    this.pointer = new THREE.Group();
    const pointerRod = this.createPointerRod();
    this.pointer.add(pointerRod);
    this.pointerTip = this.createPointerTip();
    this.pointerTip.position.set(0, 0, -14);
    this.pointer.add(this.pointerTip);
    this.group.add(this.pointer);
  }

  private createCelestialGrid(): void {
    const radius = 50;
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x6B8EAA,
      transparent: true,
      opacity: 0.3
    });

    for (let lat = -90; lat <= 90; lat += 30) {
      const points: THREE.Vector3[] = [];
      const latRad = (lat * Math.PI) / 180;
      const r = radius * Math.cos(latRad);
      const y = radius * Math.sin(latRad);
      for (let lon = 0; lon <= 360; lon += 2) {
        const lonRad = (lon * Math.PI) / 180;
        points.push(new THREE.Vector3(
          r * Math.cos(lonRad),
          y,
          r * Math.sin(lonRad)
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      this.celestialSphere.add(line);
    }

    for (let lon = 0; lon < 360; lon += 15) {
      const points: THREE.Vector3[] = [];
      const lonRad = (lon * Math.PI) / 180;
      for (let lat = -90; lat <= 90; lat += 2) {
        const latRad = (lat * Math.PI) / 180;
        const r = radius * Math.cos(latRad);
        const y = radius * Math.sin(latRad);
        points.push(new THREE.Vector3(
          r * Math.cos(lonRad),
          y,
          r * Math.sin(lonRad)
        ));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, gridMaterial);
      this.celestialSphere.add(line);
    }
  }

  private createCentralStar(): THREE.Group {
    const group = new THREE.Group();

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#FF8C00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(128, 128, 128, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    const coreGeometry = new THREE.SphereGeometry(4, 64, 64);
    const coreMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 512;
    haloCanvas.height = 512;
    const haloCtx = haloCanvas.getContext('2d')!;
    const haloGradient = haloCtx.createRadialGradient(256, 256, 0, 256, 256, 256);
    haloGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    haloGradient.addColorStop(0.4, 'rgba(255, 140, 0, 0.3)');
    haloGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
    haloCtx.fillStyle = haloGradient;
    haloCtx.fillRect(0, 0, 512, 512);
    const haloTexture = new THREE.CanvasTexture(haloCanvas);

    const haloGeometry = new THREE.PlaneGeometry(40, 40);
    const haloMaterial = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const halo1 = new THREE.Mesh(haloGeometry, haloMaterial);
    group.add(halo1);
    const halo2 = new THREE.Mesh(haloGeometry, haloMaterial);
    halo2.rotation.y = Math.PI / 2;
    group.add(halo2);
    const halo3 = new THREE.Mesh(haloGeometry, haloMaterial);
    halo3.rotation.x = Math.PI / 2;
    group.add(halo3);

    return group;
  }

  private createBackgroundStars(): { points: THREE.Points; positions: Float32Array } {
    const starCount = 36;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const radius = 52;

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const colorType = Math.random();
      let color: THREE.Color;
      if (colorType < 0.4) {
        color = new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.5 + Math.random() * 0.3, 0.7 + Math.random() * 0.2);
      } else if (colorType < 0.7) {
        color = new THREE.Color().setHSL(0.12 + Math.random() * 0.05, 0.6 + Math.random() * 0.3, 0.7 + Math.random() * 0.2);
      } else {
        color = new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.7 + Math.random() * 0.3, 0.65 + Math.random() * 0.2);
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 2 + Math.random() * 2;
    }

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const spriteCtx = spriteCanvas.getContext('2d')!;
    const spriteGradient = spriteCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    spriteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    spriteGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    spriteGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    spriteCtx.fillStyle = spriteGradient;
    spriteCtx.fillRect(0, 0, 64, 64);
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 3,
      map: spriteTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    return { points, positions: new Float32Array(positions) };
  }

  private createRing(radius: number, width: number, color: number): THREE.Mesh {
    const geometry = new THREE.TorusGeometry(radius, width / 2, 32, 128);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.9,
      roughness: 0.25,
      emissive: color,
      emissiveIntensity: 0.1
    });
    const ring = new THREE.Mesh(geometry, material);
    return ring;
  }

  private createPointerRod(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.4, 0.4, 28, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      metalness: 0.95,
      roughness: 0.2,
      emissive: 0xC0C0C0,
      emissiveIntensity: 0.05
    });
    const rod = new THREE.Mesh(geometry, material);
    rod.rotation.x = Math.PI / 2;
    return rod;
  }

  private createPointerTip(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFF3333,
      transparent: true,
      opacity: 1
    });
    return new THREE.Mesh(geometry, material);
  }

  public setInnerTilt(degrees: number): void {
    this.innerTilt = degrees;
    this.innerRing.rotation.x = Math.PI / 2 + (degrees * Math.PI) / 180;
    this.celestialSphere.rotation.x = (degrees * Math.PI) / 180;
  }

  public setPointerAzimuth(degrees: number): void {
    this.pointerAzimuth = degrees;
    this.pointer.rotation.y = (degrees * Math.PI) / 180;
    this.celestialSphere.rotation.y = (degrees * Math.PI) / 180;
  }

  public setCameraElevation(degrees: number): void {
    this.cameraElevation = degrees;
  }

  public getInnerTilt(): number {
    return this.innerTilt;
  }

  public getPointerAzimuth(): number {
    return this.pointerAzimuth;
  }

  public getCameraElevation(): number {
    return this.cameraElevation;
  }

  public getCoordinates(): CoordinateData {
    const pointerAzimuthRad = (this.pointerAzimuth * Math.PI) / 180;
    const innerTiltRad = (this.innerTilt * Math.PI) / 180;

    const eclipticLongitude = this.pointerAzimuth;
    const eclipticLatitude = this.innerTilt;

    const x = Math.cos(innerTiltRad) * Math.sin(pointerAzimuthRad);
    const y = Math.sin(innerTiltRad);
    const z = Math.cos(innerTiltRad) * Math.cos(pointerAzimuthRad);

    const altitude = Math.asin(y) * 180 / Math.PI;
    const azimuth = Math.atan2(x, z) * 180 / Math.PI;
    const normalizedAzimuth = ((azimuth % 360) + 360) % 360;

    return {
      eclipticLongitude: Number(eclipticLongitude.toFixed(2)),
      eclipticLatitude: Number(eclipticLatitude.toFixed(2)),
      altitude: Number(altitude.toFixed(2)),
      azimuth: Number(normalizedAzimuth.toFixed(2))
    };
  }

  public update(delta: number): void {
    this.centralStar.rotation.y += delta * 0.1;
    this.centralStar.children.forEach((child, idx) => {
      if (idx > 0) {
        child.lookAt(new THREE.Vector3(0, 0, 0));
      }
    });
  }
}
