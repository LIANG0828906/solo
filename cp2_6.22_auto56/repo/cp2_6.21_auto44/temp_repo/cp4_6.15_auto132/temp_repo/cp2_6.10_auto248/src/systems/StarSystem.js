import * as THREE from 'three';

const STAR_TYPES = {
  MAIN_SEQUENCE: {
    name: 'main_sequence',
    color: 0xffdd44,
    minRadius: 0.8,
    maxRadius: 2.5,
    minMass: 0.5,
    maxMass: 3.0,
    probability: 0.4,
    emissionIntensity: 1.5
  },
  RED_GIANT: {
    name: 'red_giant',
    color: 0xff6644,
    minRadius: 3.0,
    maxRadius: 6.0,
    minMass: 2.0,
    maxMass: 5.0,
    probability: 0.15,
    emissionIntensity: 1.2
  },
  WHITE_DWARF: {
    name: 'white_dwarf',
    color: 0xaaddff,
    minRadius: 0.3,
    maxRadius: 0.6,
    minMass: 0.8,
    maxMass: 1.4,
    probability: 0.12,
    emissionIntensity: 0.8
  },
  PULSAR: {
    name: 'pulsar',
    color: 0x66ffaa,
    minRadius: 0.2,
    maxRadius: 0.4,
    minMass: 1.4,
    maxMass: 2.5,
    probability: 0.06,
    emissionIntensity: 2.0,
    pulseSpeed: 3.0
  },
  BLACK_HOLE: {
    name: 'black_hole',
    color: 0x000000,
    minRadius: 0.5,
    maxRadius: 1.2,
    minMass: 3.0,
    maxMass: 10.0,
    probability: 0.04,
    emissionIntensity: 0.0,
    accretionDisk: true
  },
  NEUTRON_STAR: {
    name: 'neutron_star',
    color: 0xaa66ff,
    minRadius: 0.15,
    maxRadius: 0.35,
    minMass: 1.2,
    maxMass: 2.0,
    probability: 0.08,
    emissionIntensity: 1.8
  },
  BLUE_GIANT: {
    name: 'blue_giant',
    color: 0x6688ff,
    minRadius: 2.5,
    maxRadius: 5.0,
    minMass: 3.0,
    maxMass: 8.0,
    probability: 0.15,
    emissionIntensity: 2.5
  }
};

const PLANET_COLORS = [
  0x886644, 0x4488aa, 0xaa6644, 0x66aa88,
  0xcc8866, 0x88aacc, 0xaaaacc, 0xddaa88
];

const MAX_BODIES = 30;
const GRAVITATIONAL_CONSTANT = 0.0005;
const WAVE_LINE_COUNT = 3;
const WAVE_POINTS = 100;

class StarSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.bodies = [];
    this.gravityWaves = [];
    this.starfield = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.draggedBody = null;
    this.dragOffset = new THREE.Vector3();
    this.dragVelocity = new THREE.Vector3();
    this.lastPointerPosition = new THREE.Vector2();
    this.time = 0;

    this._initStarfield();
    this._initEventListeners();
  }

  _initStarfield() {
    const starCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness;

      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  _initEventListeners() {
    this._boundOnPointerDown = this.onPointerDown.bind(this);
    this._boundOnPointerMove = this.onPointerMove.bind(this);
    this._boundOnPointerUp = this.onPointerUp.bind(this);
  }

  createStar(type, position) {
    if (this.bodies.length >= MAX_BODIES) {
      console.warn('Maximum number of bodies reached');
      return null;
    }

    if (!type) {
      type = this._selectRandomStarType();
    }

    const starType = STAR_TYPES[type] || STAR_TYPES.MAIN_SEQUENCE;
    const radius = starType.minRadius + Math.random() * (starType.maxRadius - starType.minRadius);
    const mass = starType.minMass + Math.random() * (starType.maxMass - starType.minMass);

    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: starType.color,
      emissive: starType.color,
      emissiveIntensity: starType.emissionIntensity,
      metalness: 0.1,
      roughness: 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position || new THREE.Vector3());

    const body = {
      type: 'star',
      subType: starType.name,
      mesh,
      radius,
      mass,
      velocity: new THREE.Vector3(),
      color: starType.color,
      orbitalParent: null,
      orbitalRadius: 0,
      orbitalAngle: Math.random() * Math.PI * 2,
      orbitalSpeed: 0,
      rotationSpeed: 0.005 + Math.random() * 0.01,
      pulsePhase: 0,
      pulseSpeed: starType.pulseSpeed || 0
    };

    this._addBody(body);
    this._createGravityWaves(body);

    if (starType.accretionDisk) {
      this._createAccretionDisk(body);
    }

    const pointLight = new THREE.PointLight(starType.color, 2, 100);
    mesh.add(pointLight);

    return body;
  }

  createPlanet(orbitalParent, orbitalRadius) {
    if (this.bodies.length >= MAX_BODIES) {
      console.warn('Maximum number of bodies reached');
      return null;
    }

    const radius = 0.3 + Math.random() * 0.8;
    const mass = 0.01 + Math.random() * 0.1;
    const color = PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];

    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.7
    });

    const mesh = new THREE.Mesh(geometry, material);

    const angle = Math.random() * Math.PI * 2;
    mesh.position.x = orbitalParent.mesh.position.x + Math.cos(angle) * orbitalRadius;
    mesh.position.y = orbitalParent.mesh.position.y + (Math.random() - 0.5) * 2;
    mesh.position.z = orbitalParent.mesh.position.z + Math.sin(angle) * orbitalRadius;

    const orbitalSpeed = Math.sqrt(GRAVITATIONAL_CONSTANT * orbitalParent.mass / orbitalRadius) * 0.1;

    const body = {
      type: 'planet',
      subType: 'terrestrial',
      mesh,
      radius,
      mass,
      velocity: new THREE.Vector3(),
      color,
      orbitalParent,
      orbitalRadius,
      orbitalAngle: angle,
      orbitalSpeed,
      rotationSpeed: 0.01 + Math.random() * 0.02,
      hasRing: Math.random() > 0.7
    };

    if (body.hasRing) {
      this._createRing(body);
    }

    this._addBody(body);
    return body;
  }

  _createRing(planet) {
    const innerRadius = planet.radius * 1.5;
    const outerRadius = planet.radius * 2.5;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const material = new THREE.MeshBasicMaterial({
      color: planet.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    planet.mesh.add(ring);
    planet.ring = ring;
  }

  _createAccretionDisk(blackHole) {
    const innerRadius = blackHole.radius * 1.5;
    const outerRadius = blackHole.radius * 4;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff8844,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });

    const disk = new THREE.Mesh(geometry, material);
    disk.rotation.x = Math.PI / 2;
    blackHole.mesh.add(disk);
    blackHole.accretionDisk = disk;
  }

  _createGravityWaves(star) {
    for (let i = 0; i < WAVE_LINE_COUNT; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(WAVE_POINTS * 3);
      const colors = new Float32Array(WAVE_POINTS * 3);

      const color = new THREE.Color(star.color);
      for (let j = 0; j < WAVE_POINTS; j++) {
        const j3 = j * 3;
        const alpha = 1 - j / WAVE_POINTS;
        positions[j3] = 0;
        positions[j3 + 1] = 0;
        positions[j3 + 2] = 0;
        colors[j3] = color.r * alpha;
        colors[j3 + 1] = color.g * alpha;
        colors[j3 + 2] = color.b * alpha;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(geometry, material);
      line.userData = {
        star,
        phase: i * Math.PI * 2 / WAVE_LINE_COUNT,
        speed: 0.5 + i * 0.2,
        maxRadius: star.radius * 15
      };

      this.scene.add(line);
      this.gravityWaves.push(line);
    }
  }

  _selectRandomStarType() {
    const rand = Math.random();
    let cumulative = 0;
    for (const [type, config] of Object.entries(STAR_TYPES)) {
      cumulative += config.probability;
      if (rand < cumulative) {
        return type;
      }
    }
    return 'MAIN_SEQUENCE';
  }

  _addBody(body) {
    this.bodies.push(body);
    this.scene.add(body.mesh);
  }

  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index > -1) {
      this.bodies.splice(index, 1);
      this.scene.remove(body.mesh);

      this.gravityWaves = this.gravityWaves.filter(wave => {
        if (wave.userData.star === body) {
          this.scene.remove(wave);
          return false;
        }
        return true;
      });
    }
  }

  update(deltaTime) {
    this.time += deltaTime;

    this._updateBodies(deltaTime);
    this._updateGravityWaves(deltaTime);
    this._updateStarfield(deltaTime);
    this._updateDraggedBody(deltaTime);
  }

  _updateBodies(deltaTime) {
    for (const body of this.bodies) {
      body.mesh.rotation.y += body.rotationSpeed;

      if (body.type === 'star') {
        if (body.subType === 'pulsar') {
          body.pulsePhase += body.pulseSpeed * deltaTime;
          const pulse = 0.5 + 0.5 * Math.sin(body.pulsePhase);
          body.mesh.material.emissiveIntensity = pulse * 3;
          body.mesh.scale.setScalar(1 + pulse * 0.1);
        }

        if (body.accretionDisk) {
          body.accretionDisk.rotation.z += deltaTime * 2;
        }
      }

      if (body.orbitalParent && body.orbitalParent.mesh.parent) {
        body.orbitalAngle += body.orbitalSpeed * deltaTime;
        const parentPos = body.orbitalParent.mesh.position;
        body.mesh.position.x = parentPos.x + Math.cos(body.orbitalAngle) * body.orbitalRadius;
        body.mesh.position.z = parentPos.z + Math.sin(body.orbitalAngle) * body.orbitalRadius;
      }
    }

    this._applyGravity(deltaTime);
  }

  _applyGravity(deltaTime) {
    const stars = this.bodies.filter(b => b.type === 'star');
    const planets = this.bodies.filter(b => b.type === 'planet' && !b.orbitalParent);

    for (const planet of planets) {
      const force = new THREE.Vector3();
      for (const star of stars) {
        const direction = new THREE.Vector3().subVectors(
          star.mesh.position,
          planet.mesh.position
        );
        const distance = direction.length();
        if (distance > 0.1) {
          const magnitude = GRAVITATIONAL_CONSTANT * star.mass * planet.mass / (distance * distance);
          direction.normalize().multiplyScalar(magnitude);
          force.add(direction);
        }
      }

      planet.velocity.add(force.multiplyScalar(deltaTime));
      planet.mesh.position.add(planet.velocity.clone().multiplyScalar(deltaTime));
    }
  }

  _updateGravityWaves(deltaTime) {
    for (const wave of this.gravityWaves) {
      const { star, phase, speed, maxRadius } = wave.userData;
      const positions = wave.geometry.attributes.position.array;
      const colors = wave.geometry.attributes.color.array;
      const starPos = star.mesh.position;
      const color = new THREE.Color(star.color);

      for (let i = 0; i < WAVE_POINTS; i++) {
        const i3 = i * 3;
        const t = i / (WAVE_POINTS - 1);
        const radius = t * maxRadius;
        const wavePhase = this.time * speed + phase + t * 3;
        const amplitude = Math.sin(wavePhase) * 0.3 * (1 - t);
        const angle = t * Math.PI * 4 + phase;

        positions[i3] = starPos.x + Math.cos(angle) * radius + Math.cos(wavePhase) * amplitude;
        positions[i3 + 1] = starPos.y + amplitude * 2;
        positions[i3 + 2] = starPos.z + Math.sin(angle) * radius + Math.sin(wavePhase) * amplitude;

        const alpha = (1 - t) * 0.8;
        colors[i3] = color.r * alpha;
        colors[i3 + 1] = color.g * alpha;
        colors[i3 + 2] = color.b * alpha;
      }

      wave.geometry.attributes.position.needsUpdate = true;
      wave.geometry.attributes.color.needsUpdate = true;
    }
  }

  _updateStarfield(deltaTime) {
    if (this.starfield) {
      this.starfield.rotation.y += deltaTime * 0.01;
      this.starfield.rotation.x += deltaTime * 0.005;
    }
  }

  _updateDraggedBody(deltaTime) {
    if (!this.draggedBody) {
      for (const body of this.bodies) {
        if (body.velocity.length() > 0.001) {
          body.velocity.multiplyScalar(0.95);
          body.mesh.position.add(body.velocity.clone().multiplyScalar(deltaTime * 60));
        }
      }
    }
  }

  onPointerDown(event) {
    const body = this.getBodyAtPosition(event);
    if (body) {
      this.draggedBody = body;
      body.velocity.set(0, 0, 0);

      this._updatePointer(event);
      this.raycaster.setFromCamera(this.pointer, this.camera);

      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        body.mesh.position
      );
      const intersection = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(plane, intersection);

      if (intersection) {
        this.dragOffset.copy(body.mesh.position).sub(intersection);
      }

      this.lastPointerPosition.set(event.clientX, event.clientY);
    }
  }

  onPointerMove(event) {
    if (!this.draggedBody) return;

    this._updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 1, 0),
      this.draggedBody.mesh.position
    );
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);

    if (intersection) {
      const newPos = intersection.add(this.dragOffset);
      const delta = newPos.clone().sub(this.draggedBody.mesh.position);
      this.draggedBody.mesh.position.copy(newPos);
      this.dragVelocity.copy(delta).multiplyScalar(10);

      const pointerDelta = new THREE.Vector2(
        event.clientX - this.lastPointerPosition.x,
        event.clientY - this.lastPointerPosition.y
      );
      this.dragVelocity.x += pointerDelta.x * 0.01;
      this.dragVelocity.z += pointerDelta.y * 0.01;
    }

    this.lastPointerPosition.set(event.clientX, event.clientY);
  }

  onPointerUp(event) {
    if (this.draggedBody) {
      this.draggedBody.velocity.copy(this.dragVelocity);
      this.draggedBody = null;
      this.dragVelocity.set(0, 0, 0);
    }
  }

  getBodyAtPosition(event) {
    this._updatePointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const meshes = this.bodies.map(b => b.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      return this.bodies.find(b => b.mesh === hitMesh || b.mesh.children.includes(hitMesh));
    }
    return null;
  }

  _updatePointer(event) {
    const rect = event.target.getBoundingClientRect
      ? event.target.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  updateBodyParameters(body, params) {
    if (params.mass !== undefined) {
      body.mass = Math.max(0.01, params.mass);
    }
    if (params.color !== undefined) {
      body.color = params.color;
      if (body.mesh.material.color) {
        body.mesh.material.color.setHex(params.color);
      }
      if (body.mesh.material.emissive) {
        body.mesh.material.emissive.setHex(params.color);
      }
    }
    if (params.orbitalRadius !== undefined && body.orbitalParent) {
      body.orbitalRadius = Math.max(1, params.orbitalRadius);
      body.orbitalSpeed = Math.sqrt(GRAVITATIONAL_CONSTANT * body.orbitalParent.mass / body.orbitalRadius) * 0.1;
    }
    if (params.radius !== undefined) {
      body.radius = Math.max(0.1, params.radius);
      const newGeometry = new THREE.SphereGeometry(body.radius, 32, 32);
      body.mesh.geometry.dispose();
      body.mesh.geometry = newGeometry;
    }
  }

  generateSolarSystem(center = new THREE.Vector3()) {
    const star = this.createStar(null, center);
    if (!star) return null;

    const planetCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < planetCount; i++) {
      const orbitalRadius = (star.radius * 3) + i * (3 + Math.random() * 2);
      this.createPlanet(star, orbitalRadius);
    }

    return star;
  }

  generateRandomSystem() {
    if (this.bodies.length >= MAX_BODIES) return;

    const systemCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < systemCount && this.bodies.length < MAX_BODIES; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 80
      );
      this.generateSolarSystem(position);
    }
  }

  dispose() {
    for (const body of this.bodies) {
      body.mesh.geometry.dispose();
      if (Array.isArray(body.mesh.material)) {
        body.mesh.material.forEach(m => m.dispose());
      } else {
        body.mesh.material.dispose();
      }
      this.scene.remove(body.mesh);
    }
    this.bodies = [];

    for (const wave of this.gravityWaves) {
      wave.geometry.dispose();
      wave.material.dispose();
      this.scene.remove(wave);
    }
    this.gravityWaves = [];

    if (this.starfield) {
      this.starfield.geometry.dispose();
      this.starfield.material.dispose();
      this.scene.remove(this.starfield);
      this.starfield = null;
    }
  }
}

export default StarSystem;
export { STAR_TYPES, MAX_BODIES, GRAVITATIONAL_CONSTANT };
