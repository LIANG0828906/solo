import * as THREE from 'three';

export class UnderwaterScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private causticsMesh: THREE.Mesh;
  private causticsMaterial: THREE.ShaderMaterial;
  private lightRays: THREE.Mesh;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private targetRotationX = 0.3;
  private targetRotationY = 0;
  private currentRotationX = 0.3;
  private currentRotationY = 0;
  private targetDistance = 28;
  private currentDistance = 28;
  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private cameraTarget = new THREE.Vector3(0, -2, 0);
  private ambientLight!: THREE.AmbientLight;
  private pointLight!: THREE.PointLight;
  private directionalLight!: THREE.DirectionalLight;

  constructor(container: HTMLElement) {
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1a3a);
    this.scene.fog = new THREE.FogExp2(0x0a1833, 0.018);

    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    this.camera.position.set(0, 0, this.currentDistance);
    this.camera.lookAt(this.cameraTarget);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.85;
    container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.particles = this.createParticles();
    this.causticsMesh = this.createCaustics();
    this.causticsMaterial = this.causticsMesh.material as THREE.ShaderMaterial;
    this.lightRays = this.createLightRays();
    this.createSeabed();
    this.bindEvents(container);
    this.updateCamera();
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x2a4d7d, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0x5a8fc4, 0.8);
    this.directionalLight.position.set(8, 25, 12);
    this.scene.add(this.directionalLight);

    this.pointLight = new THREE.PointLight(0x4a9cff, 1.2, 60, 2);
    this.pointLight.position.set(0, 5, 0);
    this.scene.add(this.pointLight);
  }

  private createParticles(): THREE.Points {
    const count = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * -40 + 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = 0.008 + Math.random() * 0.015;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      sizes[i] = Math.random() * 1.8 + 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x9ecfff) },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPosition.z;
          vAlpha = smoothstep(80.0, 10.0, dist) * 0.7;
          gl_PointSize = size * (300.0 / dist);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    return points;
  }

  private createCaustics(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(160, 160, 1, 1);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x8fc3ff) },
        uIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        float fbm(vec2 p, int octaves) {
          float v = 0.0;
          float a = 0.5;
          float freq = 1.0;
          for (int i = 0; i < 8; i++) {
            if (i >= octaves) break;
            v += a * noise(p * freq);
            freq *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        float caustic(vec2 uv, float t, float scale, float speed, float intensity) {
          vec2 offset = vec2(cos(t * 0.3), sin(t * 0.25)) * 0.15;
          vec2 p = uv * scale + offset;

          vec2 wave1 = vec2(
            sin(p.x * 2.3 + t * speed * 1.2) * cos(p.y * 1.7 - t * speed * 0.8),
            cos(p.x * 1.9 - t * speed * 0.9) * sin(p.y * 2.1 + t * speed * 1.1)
          );

          vec2 wave2 = vec2(
            sin(p.x * 3.7 + t * speed * 0.7) * cos(p.y * 2.9 + t * speed * 1.3),
            cos(p.x * 3.1 + t * speed * 1.4) * sin(p.y * 3.3 - t * speed * 0.6)
          );

          vec2 distorted = uv * scale * 1.5 + wave1 * 0.3 + wave2 * 0.15 + offset * 2.0;

          float n1 = fbm(distorted + t * 0.1, 5);
          float n2 = fbm(distorted * 1.8 + vec2(t * 0.15, -t * 0.12), 4);

          float combined = n1 * n2 * 2.5 + 0.25;

          float causticPattern = pow(max(0.0, combined - 0.35), 2.2) * intensity;

          float detail = fbm(distorted * 3.5 + t * 0.2, 3) * 0.25;
          causticPattern += detail * max(0.0, combined - 0.4) * 1.5;

          return causticPattern;
        }

        void main() {
          vec2 uv = vUv * 6.0;
          float t = uTime * 0.35;

          float c1 = caustic(uv, t, 1.0, 1.0, 1.0);
          float c2 = caustic(uv + 5.5, t * 1.2, 0.7, 0.8, 0.6);
          float c3 = caustic(uv - 3.3, t * 0.7, 1.6, 1.3, 0.4);

          float totalCaustic = (c1 + c2 * 0.6 + c3 * 0.3) * 0.75;
          totalCaustic = smoothstep(0.0, 0.9, totalCaustic);

          vec3 brightColor = uColor * 1.5;
          vec3 midColor = uColor * 0.7;

          vec3 col = mix(vec3(0.0), midColor, smoothstep(0.0, 0.4, totalCaustic));
          col = mix(col, brightColor, smoothstep(0.4, 0.85, totalCaustic));
          col += vec3(1.0, 1.0, 1.0) * smoothstep(0.7, 1.0, totalCaustic) * 0.6;

          float alpha = totalCaustic * 0.42 * uIntensity;

          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 16, 0);
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    return mesh;
  }

  private createLightRays(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(35, 50, 8, 1, true);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x8ac4ff) },
      },
      vertexShader: `
        varying float vY;
        varying vec3 vNormal;
        void main() {
          vY = (position.y + 25.0) / 50.0;
          vNormal = normal;
          vec3 pos = position;
          pos.x += sin(position.y * 0.15 + uTime * 0.5) * 2.0;
          pos.z += cos(position.y * 0.12 + uTime * 0.4) * 2.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying float vY;
        varying vec3 vNormal;
        void main() {
          float edge = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
          float fade = pow(1.0 - vY, 2.0);
          float alpha = edge * fade * 0.15;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -10, -5);
    this.scene.add(mesh);
    return mesh;
  }

  private createSeabed(): void {
    const geometry = new THREE.PlaneGeometry(160, 160, 60, 60);
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const noise =
        Math.sin(x * 0.12) * 0.6 +
        Math.cos(z * 0.15) * 0.8 +
        Math.sin(x * 0.05 + z * 0.07) * 1.8 +
        (Math.random() - 0.5) * 0.3;
      positions.setY(i, noise);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x2a4a3a,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
    });

    const seabed = new THREE.Mesh(geometry, material);
    seabed.rotation.x = -Math.PI / 2;
    seabed.position.y = -15;
    this.scene.add(seabed);

    for (let i = 0; i < 60; i++) {
      const rockGeo = new THREE.IcosahedronGeometry(0.5 + Math.random() * 1.5, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.3, 0.15 + Math.random() * 0.15),
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true,
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + Math.random() * 55;
      rock.position.set(
        Math.cos(angle) * radius,
        -14 + Math.random() * 2,
        Math.sin(angle) * radius
      );
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.scale.setScalar(0.6 + Math.random() * 1.2);
      this.scene.add(rock);
    }

    this.createSeaweed();
  }

  private createSeaweed(): void {
    const group = new THREE.Group();
    for (let i = 0; i < 80; i++) {
      const segments = 6;
      const height = 3 + Math.random() * 5;
      const points: THREE.Vector3[] = [];
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const sway = Math.sin(t * Math.PI) * (1 + Math.random() * 1.5);
        points.push(new THREE.Vector3(sway * 0.3, t * height, 0));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, segments, 0.06 + Math.random() * 0.08, 6, false);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.35 + Math.random() * 0.1, 0.55, 0.28),
        roughness: 0.85,
        side: THREE.DoubleSide,
      });
      const weed = new THREE.Mesh(geo, mat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 18 + Math.random() * 40;
      weed.position.set(
        Math.cos(angle) * radius,
        -14.5,
        Math.sin(angle) * radius
      );
      weed.rotation.y = Math.random() * Math.PI * 2;
      weed.userData.swaySpeed = 0.3 + Math.random() * 0.5;
      weed.userData.swayOffset = Math.random() * Math.PI * 2;
      group.add(weed);
    }
    group.name = 'seaweed';
    this.scene.add(group);
  }

  private bindEvents(container: HTMLElement): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      const rect = container.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isDragging) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.targetRotationY += dx * 0.005;
        this.targetRotationX += dy * 0.005;
        this.targetRotationX = Math.max(-1.2, Math.min(1.0, this.targetRotationX));
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      this.isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (_) {
        // ignore
      }
    });

    canvas.addEventListener('pointercancel', (e) => {
      this.isDragging = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (_) {
        // ignore
      }
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetDistance += e.deltaY * 0.02;
      this.targetDistance = Math.max(10, Math.min(60, this.targetDistance));
    }, { passive: false });

    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  private updateCamera(): void {
    const damping = 0.08;
    this.currentRotationX += (this.targetRotationX - this.currentRotationX) * damping;
    this.currentRotationY += (this.targetRotationY - this.currentRotationY) * damping;
    this.currentDistance += (this.targetDistance - this.currentDistance) * damping;

    const x = Math.sin(this.currentRotationY) * Math.cos(this.currentRotationX) * this.currentDistance;
    const y = Math.sin(this.currentRotationX) * this.currentDistance;
    const z = Math.cos(this.currentRotationY) * Math.cos(this.currentRotationX) * this.currentDistance;

    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y + 2,
      this.cameraTarget.z + z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  public update(): void {
    const time = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    this.updateCamera();

    const mat = this.particles.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = time;

    const positions = this.particles.geometry.attributes.position as THREE.BufferAttribute;
    const velocities = this.particles.geometry.attributes.velocity as THREE.BufferAttribute;
    const posArr = positions.array as Float32Array;
    const velArr = velocities.array as Float32Array;
    const bounds = { x: 70, y: 25, z: 70 };
    const yMin = -35;

    for (let i = 0; i < positions.count; i++) {
      const idx = i * 3;
      posArr[idx] += velArr[idx] + Math.sin(time + i) * 0.005;
      posArr[idx + 1] += velArr[idx + 1];
      posArr[idx + 2] += velArr[idx + 2] + Math.cos(time * 0.8 + i) * 0.005;

      if (posArr[idx + 1] > bounds.y || posArr[idx + 1] < yMin) {
        posArr[idx] = (Math.random() - 0.5) * bounds.x * 2;
        posArr[idx + 1] = posArr[idx + 1] > bounds.y ? yMin : bounds.y;
        posArr[idx + 2] = (Math.random() - 0.5) * bounds.z * 2;
        velArr[idx] = (Math.random() - 0.5) * 0.02;
        velArr[idx + 1] = 0.008 + Math.random() * 0.015;
        velArr[idx + 2] = (Math.random() - 0.5) * 0.02;
      }

      if (Math.abs(posArr[idx]) > bounds.x) {
        velArr[idx] *= -1;
        posArr[idx] = Math.sign(posArr[idx]) * bounds.x;
      }
      if (Math.abs(posArr[idx + 2]) > bounds.z) {
        velArr[idx + 2] *= -1;
        posArr[idx + 2] = Math.sign(posArr[idx + 2]) * bounds.z;
      }
    }
    positions.needsUpdate = true;

    this.causticsMaterial.uniforms.uTime.value = time;
    this.causticsMesh.rotation.z = time * 0.02;

    const rayMat = this.lightRays.material as THREE.ShaderMaterial;
    rayMat.uniforms.uTime.value = time;

    this.pointLight.position.x = Math.sin(time * 0.3) * 10;
    this.pointLight.position.z = Math.cos(time * 0.3) * 10;

    const seaweed = this.scene.getObjectByName('seaweed');
    if (seaweed) {
      seaweed.children.forEach((w) => {
        const speed = (w.userData.swaySpeed as number) || 0.5;
        const offset = (w.userData.swayOffset as number) || 0;
        w.rotation.z = Math.sin(time * speed + offset) * 0.2;
        w.rotation.x = Math.cos(time * speed * 0.7 + offset) * 0.15;
      });
    }

    this.renderer.render(this.scene, this.camera);
    void delta;
  }

  public getRaycasterTargets(objects: THREE.Object3D[]): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  public getPointerPosition(): THREE.Vector2 {
    return this.pointer.clone();
  }

  public screenToWorld(screenX: number, screenY: number, depth: number = 15): THREE.Vector3 {
    const vec = new THREE.Vector3(screenX, screenY, 0.5);
    vec.unproject(this.camera);
    const dir = vec.sub(this.camera.position).normalize();
    return this.camera.position.clone().add(dir.multiplyScalar(depth));
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public dispose(): void {
    this.renderer.dispose();
  }
}
