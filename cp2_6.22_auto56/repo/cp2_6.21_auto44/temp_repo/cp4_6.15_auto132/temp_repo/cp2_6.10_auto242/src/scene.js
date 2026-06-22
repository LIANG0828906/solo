import * as THREE from 'three';

const LAYER_COLORS = [
  new THREE.Color(0x4a3c31),
  new THREE.Color(0xc6a87c),
  new THREE.Color(0xa09888),
  new THREE.Color(0x6b5344),
  new THREE.Color(0x8b7355),
  new THREE.Color(0x5c4033),
  new THREE.Color(0x9a8a6a),
  new THREE.Color(0x7a6a5a)
];

class RockLayerScene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.layers = [];
    this.soundWaves = [];
    this.particlesSystem = null;
    this.particlePositions = null;
    this.particleColors = null;
    this.particleSizes = null;
    this.maxParticles = 2000;
    this.activeParticleCount = 0;
    this.frequency = 50;
    this.wavelength = 0.5;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.lastEmitTime = 0;
    this.emitInterval = 30;
    this.onReflection = null;
    this.onLayerClick = null;
    this.tempVector = new THREE.Vector3();
    this.tempNormal = new THREE.Vector3(0, 0, 1);
    
    this.init();
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x3d1c02);
    this.scene.fog = new THREE.Fog(0x3d1c02, 20, 60);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 2, 18);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.createLayers();
    this.createParticlesSystem();
    this.setupEventListeners();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xc6a87c, 0.3, 50);
    pointLight.position.set(0, 10, 5);
    this.scene.add(pointLight);
  }

  createLayers() {
    const layerGroup = new THREE.Group();
    const layerWidth = 40;
    const layerDepth = 15;
    const minHeight = 0.8;
    const maxHeight = 2.5;
    const numLayers = 8;
    
    let currentY = -numLayers * maxHeight / 2;

    for (let i = 0; i < numLayers; i++) {
      const height = minHeight + Math.random() * (maxHeight - minHeight);
      const color = LAYER_COLORS[Math.floor(Math.random() * LAYER_COLORS.length)].clone();
      const opacity = 0.6 + Math.random() * 0.35;
      const density = 0.3 + Math.random() * 0.7;

      const geometry = new THREE.PlaneGeometry(layerWidth, height, 20, 5);
      
      const positions = geometry.attributes.position;
      for (let j = 0; j < positions.count; j++) {
        const x = positions.getX(j);
        const y = positions.getY(j);
        const noise = (Math.sin(x * 0.3 + i) * 0.05 + Math.cos(x * 0.1 + i * 0.5) * 0.03);
        positions.setZ(j, noise);
      }
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        color: color,
        transparent: true,
        opacity: opacity,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, currentY + height / 2, 0);
      mesh.rotation.x = 0;
      mesh.receiveShadow = true;
      mesh.castShadow = true;

      const edgeGeometry = new THREE.EdgesGeometry(geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xc6a87c,
        transparent: true,
        opacity: 0.15
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      mesh.add(edges);

      layerGroup.add(mesh);

      this.layers.push({
        id: i,
        y: currentY + height / 2,
        top: currentY + height,
        bottom: currentY,
        height: height,
        color: color,
        opacity: opacity,
        density: density,
        mesh: mesh,
        originalPosition: mesh.position.clone(),
        shakeOffset: new THREE.Vector3(),
        shakeTime: 0
      });

      currentY += height;
    }

    this.scene.add(layerGroup);
    this.layerGroup = layerGroup;
  }

  createParticlesSystem() {
    this.particlePositions = new Float32Array(this.maxParticles * 3);
    this.particleColors = new Float32Array(this.maxParticles * 3);
    this.particleSizes = new Float32Array(this.maxParticles);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.particleSizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.particlesSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particlesSystem);
  }

  setupEventListeners() {
    this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('mouseup', () => this.onMouseUp());
    this.container.addEventListener('mouseleave', () => this.onMouseUp());

    window.addEventListener('resize', () => this.onResize());
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.handleClick(e);
  }

  onMouseMove(e) {
    if (this.isDragging) {
      const now = Date.now();
      if (now - this.lastEmitTime > this.emitInterval) {
        this.handleClick(e);
        this.lastEmitTime = now;
      }
    }
  }

  onMouseUp() {
    this.isDragging = false;
  }

  handleClick(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.layers.map(l => l.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const layer = this.layers.find(l => l.mesh === hit.object);
      
      if (layer) {
        this.emitSoundWave(hit.point, layer);
        this.triggerLayerShake(layer);
        
        if (this.onLayerClick) {
          this.onLayerClick(layer, hit.point);
        }
      }
    }
  }

  emitSoundWave(position, originLayer) {
    const waveCount = 24;
    
    for (let i = 0; i < waveCount; i++) {
      const angle = (i / waveCount) * Math.PI * 2;
      const direction = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      ).normalize();

      const wave = {
        position: position.clone(),
        direction: direction,
        velocity: 8 + this.frequency * 0.05,
        frequency: this.frequency,
        wavelength: this.wavelength,
        amplitude: 1.0,
        life: 3.0,
        maxLife: 3.0,
        birthTime: performance.now() / 1000,
        currentLayer: originLayer,
        reflections: 0,
        maxReflections: 5,
        trail: []
      };

      this.soundWaves.push(wave);
    }
  }

  triggerLayerShake(layer) {
    layer.shakeTime = 0.3;
    layer.shakeOffset.set(0, 0, 0);
  }

  update(deltaTime) {
    this.updateLayers(deltaTime);
    this.updateSoundWaves(deltaTime);
    this.updateParticles();
    
    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateLayers(deltaTime) {
    for (const layer of this.layers) {
      if (layer.shakeTime > 0) {
        layer.shakeTime -= deltaTime;
        const intensity = layer.shakeTime / 0.3;
        layer.shakeOffset.x = (Math.random() - 0.5) * 0.1 * intensity;
        layer.shakeOffset.y = (Math.random() - 0.5) * 0.05 * intensity;
        layer.mesh.position.copy(layer.originalPosition).add(layer.shakeOffset);
      } else {
        layer.mesh.position.copy(layer.originalPosition);
      }
    }
  }

  updateSoundWaves(deltaTime) {
    for (let i = this.soundWaves.length - 1; i >= 0; i--) {
      const wave = this.soundWaves[i];
      
      wave.life -= deltaTime;
      
      if (wave.life <= 0) {
        this.soundWaves.splice(i, 1);
        continue;
      }

      const moveDistance = wave.velocity * deltaTime;
      const oldPos = wave.position.clone();
      wave.position.addScaledVector(wave.direction, moveDistance);

      wave.amplitude *= (1 - deltaTime * 0.3);

      const newLayer = this.getLayerAtPosition(wave.position.y);
      if (newLayer && newLayer !== wave.currentLayer) {
        this.handleLayerCrossing(wave, oldPos, wave.currentLayer, newLayer);
      }

      if (Math.abs(wave.position.x) > 25 || wave.position.y < -20 || wave.position.y > 10) {
        this.soundWaves.splice(i, 1);
      }

      wave.trail.push({
        position: wave.position.clone(),
        alpha: wave.life / wave.maxLife,
        amplitude: wave.amplitude
      });
      if (wave.trail.length > 15) {
        wave.trail.shift();
      }
    }
  }

  handleLayerCrossing(wave, oldPos, fromLayer, toLayer) {
    const densityDiff = Math.abs(toLayer.density - fromLayer.density);
    const reflectionCoefficient = densityDiff / (toLayer.density + fromLayer.density);
    const transmissionCoefficient = 1 - reflectionCoefficient;

    const reflectionStrength = reflectionCoefficient * wave.amplitude;
    
    if (wave.reflections < wave.maxReflections && reflectionStrength > 0.05) {
      const reflectedWave = {
        position: oldPos.clone(),
        direction: wave.direction.clone().multiplyScalar(-1),
        velocity: wave.velocity,
        frequency: wave.frequency,
        wavelength: wave.wavelength,
        amplitude: reflectionStrength,
        life: wave.maxLife * 0.7,
        maxLife: wave.maxLife,
        birthTime: performance.now() / 1000,
        currentLayer: fromLayer,
        reflections: wave.reflections + 1,
        maxReflections: wave.maxReflections,
        trail: []
      };
      this.soundWaves.push(reflectedWave);

      if (this.onReflection) {
        this.onReflection({
          amplitude: reflectionStrength,
          frequency: wave.frequency,
          layerId: toLayer.id,
          density: toLayer.density,
          position: oldPos.clone()
        });
      }
    }

    wave.amplitude *= transmissionCoefficient;
    wave.currentLayer = toLayer;
  }

  getLayerAtPosition(y) {
    for (const layer of this.layers) {
      if (y >= layer.bottom && y <= layer.top) {
        return layer;
      }
    }
    return null;
  }

  updateParticles() {
    this.activeParticleCount = 0;

    for (const wave of this.soundWaves) {
      this.addWaveParticle(wave.position, wave.amplitude, wave.frequency, wave.life / wave.maxLife);
      
      for (const trail of wave.trail) {
        this.addWaveParticle(trail.position, trail.amplitude * 0.5, wave.frequency, trail.alpha * 0.5);
      }
    }

    for (let i = this.activeParticleCount; i < this.maxParticles; i++) {
      const idx = i * 3;
      this.particlePositions[idx] = 0;
      this.particlePositions[idx + 1] = -100;
      this.particlePositions[idx + 2] = 0;
      this.particleSizes[i] = 0;
    }

    this.particlesSystem.geometry.attributes.position.needsUpdate = true;
    this.particlesSystem.geometry.attributes.color.needsUpdate = true;
    this.particlesSystem.geometry.attributes.size.needsUpdate = true;
  }

  addWaveParticle(position, amplitude, frequency, alpha) {
    if (this.activeParticleCount >= this.maxParticles) return;

    const idx = this.activeParticleCount * 3;
    
    const phaseOffset = (performance.now() / 1000 * frequency * 0.5) % (Math.PI * 2);
    const waveOffset = Math.sin(phaseOffset) * 0.05;

    this.particlePositions[idx] = position.x + (Math.random() - 0.5) * 0.1;
    this.particlePositions[idx + 1] = position.y + (Math.random() - 0.5) * 0.1 + waveOffset;
    this.particlePositions[idx + 2] = position.z + (Math.random() - 0.5) * 0.1;

    const glowIntensity = Math.min(1, amplitude * alpha);
    this.particleColors[idx] = 0.2 + glowIntensity * 0.8;
    this.particleColors[idx + 1] = 1.0;
    this.particleColors[idx + 2] = 0.08 + glowIntensity * 0.2;

    this.particleSizes[this.activeParticleCount] = 0.08 + amplitude * 0.2;

    this.activeParticleCount++;
  }

  setFrequency(frequency) {
    this.frequency = frequency;
    this.wavelength = 200 / frequency;
  }

  getFrequency() {
    return this.frequency;
  }

  getWavelength() {
    return this.wavelength;
  }

  reset() {
    this.soundWaves = [];
    this.activeParticleCount = 0;
    
    for (let i = 0; i < this.maxParticles; i++) {
      const idx = i * 3;
      this.particlePositions[idx] = 0;
      this.particlePositions[idx + 1] = -100;
      this.particlePositions[idx + 2] = 0;
      this.particleSizes[i] = 0;
    }
    
    this.particlesSystem.geometry.attributes.position.needsUpdate = true;
    this.particlesSystem.geometry.attributes.color.needsUpdate = true;
    this.particlesSystem.geometry.attributes.size.needsUpdate = true;
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

export default RockLayerScene;
