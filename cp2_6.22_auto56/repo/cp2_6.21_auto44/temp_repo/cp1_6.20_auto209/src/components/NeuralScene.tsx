import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface NeuronInitialData {
  id: number;
  name: string;
  position: { x: number; y: number; z: number };
  color: string;
}

export interface SynapseInitialData {
  id: number;
  from: number;
  to: number;
  color: string;
}

interface NeuralSceneProps {
  neurons: NeuronInitialData[];
  synapses: SynapseInitialData[];
  weights: number[];
  isRunning: boolean;
  frequency: number;
  onFPSUpdate?: (fps: number) => void;
}

export interface NeuralSceneHandle {
  triggerPulse: (neuronId: number) => void;
  triggerLTP: (synapseId: number) => void;
  triggerLTD: (synapseId: number) => void;
  resetVisuals: () => void;
}

const NEURON_COLORS = [
  '#FF6B9D', '#C56CF0', '#786FFA', '#4DABF7',
  '#38D9A9', '#FFD43B', '#FF8787', '#69DB7C'
];

const NeuralScene = forwardRef<NeuralSceneHandle, NeuralSceneProps>(({
  neurons,
  synapses,
  weights,
  isRunning,
  frequency,
  onFPSUpdate
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const neuronMeshesRef = useRef<Map<number, { mesh: THREE.Mesh; material: THREE.MeshPhongMaterial; pulseTime: number; glowMesh?: THREE.Mesh }>>(new Map());
  const synapseObjectsRef = useRef<Map<number, {
    group: THREE.Group;
    cylinder: THREE.Mesh;
    cylinderMaterial: THREE.MeshPhongMaterial;
    glowMesh?: THREE.Mesh;
    glowMaterial?: THREE.MeshBasicMaterial;
    ltpTime: number;
    ltdTime: number;
    baseRadius: number;
  }>>(new Map());
  const particlesRef = useRef<Array<{
    mesh: THREE.Mesh;
    synapseId: number;
    progress: number;
    speed: number;
    diffuseTime: number;
    isDiffusing: boolean;
  }>>([]);
  const animationIdRef = useRef<number>(0);
  const lastParticleSpawnRef = useRef<Map<number, number>>(new Map());
  const fpsFramesRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 15, 30);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 3, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.5;
      controls.minDistance = 2;
      controls.maxDistance = 20;
      controls.enablePan = false;
      controlsRef.current = controls;
    });

    const ambientLight = new THREE.AmbientLight(0x404080, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0x4a8cff, 1.5, 20);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x00d4ff, 1, 15);
    rimLight.position.set(5, -2, 5);
    scene.add(rimLight);

    createStarfield(scene);

    neurons.forEach((neuronData) => {
      createNeuron(scene, neuronData);
    });

    synapses.forEach((synapseData) => {
      createSynapse(scene, synapseData);
    });

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      const deltaTime = 1 / 60;
      const now = performance.now();

      fpsFramesRef.current++;
      if (now - fpsLastTimeRef.current >= 1000) {
        const fps = Math.round(fpsFramesRef.current * 1000 / (now - fpsLastTimeRef.current));
        onFPSUpdate?.(fps);
        fpsFramesRef.current = 0;
        fpsLastTimeRef.current = now;
      }

      neuronMeshesRef.current.forEach((neuron) => {
        neuron.mesh.rotation.y += 0.2 * deltaTime;
        neuron.mesh.rotation.x += 0.1 * deltaTime;

        if (neuron.pulseTime > 0) {
          neuron.pulseTime -= deltaTime;
          const pulseProgress = Math.max(0, neuron.pulseTime / 0.1);
          const emissiveIntensity = pulseProgress;
          neuron.material.emissive.setHex(0xffffff);
          neuron.material.emissiveIntensity = emissiveIntensity;
        } else {
          neuron.material.emissiveIntensity = 0;
        }
      });

      synapseObjectsRef.current.forEach((synapse) => {
        if (synapse.ltpTime > 0) {
          synapse.ltpTime -= deltaTime;
          const progress = Math.max(0, synapse.ltpTime / 2);
          const scale = 1 + 0.2 * (1 - Math.abs(progress - 0.5) * 2);
          synapse.cylinder.scale.setScalar(scale);
          if (synapse.glowMaterial) {
            synapse.glowMaterial.opacity = 0.6 * progress;
          }
        } else if (synapse.ltdTime > 0) {
          synapse.ltdTime -= deltaTime;
          const progress = Math.max(0, synapse.ltdTime / 2);
          const scale = 0.6 + 0.4 * (1 - progress);
          synapse.cylinder.scale.setScalar(scale);
          if (synapse.glowMaterial) {
            synapse.glowMaterial.opacity = 0.6 * progress;
          }
        } else {
          synapse.cylinder.scale.setScalar(1);
          if (synapse.glowMaterial) {
            synapse.glowMaterial.opacity = 0;
          }
        }
      });

      updateParticles(deltaTime);

      if (isRunning) {
        spawnParticles(now);
      }

      controlsRef.current?.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    weights.forEach((weight, index) => {
      const synapseData = synapses[index];
      if (!synapseData) return;
      const synapseObj = synapseObjectsRef.current.get(synapseData.id);
      if (!synapseObj) return;

      const radius = 0.05 + (weight / 2) * (0.2 - 0.05);
      const opacity = 0.3 + (weight / 2) * (1.0 - 0.3);
      synapseObj.baseRadius = radius;
      synapseObj.cylinder.scale.y = radius / 0.1;
      synapseObj.cylinderMaterial.opacity = opacity;

      if (synapseObj.glowMesh) {
        const glowScale = (radius * 2.5) / 0.15;
        synapseObj.glowMesh.scale.set(glowScale, 1, glowScale);
      }
    });
  }, [weights, synapses]);

  useEffect(() => {
    if (!isRunning) {
      particlesRef.current.forEach(p => {
        p.mesh.visible = false;
      });
      particlesRef.current = [];
      lastParticleSpawnRef.current.clear();
    }
  }, [isRunning]);

  const createStarfield = (scene: THREE.Scene) => {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 20 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.5, 0.5 + Math.random() * 0.3);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  };

  const createNeuron = (scene: THREE.Scene, neuronData: NeuronInitialData) => {
    const color = new THREE.Color(neuronData.color);
    
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      shininess: 100,
      specular: 0x444488,
      emissive: 0x000000,
      emissiveIntensity: 0
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(neuronData.position.x, neuronData.position.y, neuronData.position.z);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    const glowGeometry = new THREE.SphereGeometry(0.55, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    glowSphere.position.copy(sphere.position);
    scene.add(glowSphere);

    neuronMeshesRef.current.set(neuronData.id, {
      mesh: sphere,
      material: material,
      pulseTime: 0,
      glowMesh: glowSphere
    });

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = neuronData.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 248, 120);
    ctx.fillStyle = '#e0e0f0';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(neuronData.name, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    const label = new THREE.Sprite(labelMaterial);
    label.position.set(neuronData.position.x, neuronData.position.y + 0.9, neuronData.position.z);
    label.scale.set(1.2, 0.6, 1);
    scene.add(label);
  };

  const createSynapse = (scene: THREE.Scene, synapseData: SynapseInitialData) => {
    const fromNeuron = neurons.find(n => n.id === synapseData.from);
    const toNeuron = neurons.find(n => n.id === synapseData.to);
    if (!fromNeuron || !toNeuron) return;

    const from = new THREE.Vector3(fromNeuron.position.x, fromNeuron.position.y, fromNeuron.position.z);
    const to = new THREE.Vector3(toNeuron.position.x, toNeuron.position.y, toNeuron.position.z);

    const group = new THREE.Group();

    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    const midPoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

    const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.08, length * 0.9, 16);
    const cylinderMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(synapseData.color),
      transparent: true,
      opacity: 0.5,
      shininess: 60,
      specular: 0x222244
    });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

    cylinder.position.copy(midPoint);
    cylinder.lookAt(to);
    cylinder.rotateX(Math.PI / 2);
    group.add(cylinder);

    const glowGeometry = new THREE.CylinderGeometry(0.15, 0.12, length * 0.9, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4169E1,
      transparent: true,
      opacity: 0
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(midPoint);
    glowMesh.lookAt(to);
    glowMesh.rotateX(Math.PI / 2);
    group.add(glowMesh);

    const arrowGeometry = new THREE.ConeGeometry(0.12, 0.25, 12);
    const arrowMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(synapseData.color),
      transparent: true,
      opacity: 0.7
    });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    const arrowOffset = direction.clone().normalize().multiplyScalar(length * 0.4);
    arrow.position.copy(from.clone().add(arrowOffset));
    arrow.lookAt(to);
    arrow.rotateX(Math.PI / 2);
    group.add(arrow);

    scene.add(group);

    synapseObjectsRef.current.set(synapseData.id, {
      group,
      cylinder,
      cylinderMaterial,
      glowMesh,
      glowMaterial,
      ltpTime: 0,
      ltdTime: 0,
      baseRadius: 0.1
    });
  };

  const spawnParticles = (now: number) => {
    const particleInterval = 1000 / (frequency * 0.3);

    synapses.forEach((synapseData) => {
      const lastSpawn = lastParticleSpawnRef.current.get(synapseData.id) || 0;
      if (now - lastSpawn >= particleInterval) {
        lastParticleSpawnRef.current.set(synapseData.id, now);
        createParticle(synapseData.id);
      }
    });
  };

  const createParticle = (synapseId: number) => {
    const synapseData = synapses.find(s => s.id === synapseId);
    if (!synapseData) return;

    const fromNeuron = neurons.find(n => n.id === synapseData.from);
    const toNeuron = neurons.find(n => n.id === synapseData.to);
    if (!fromNeuron || !toNeuron) return;

    const geometry = new THREE.SphereGeometry(0.06, 12, 12);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 1
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    const from = new THREE.Vector3(fromNeuron.position.x, fromNeuron.position.y, fromNeuron.position.z);
    mesh.position.copy(from);

    const glow = new THREE.PointLight(0xFFD700, 0.5, 2);
    mesh.add(glow);

    sceneRef.current?.add(mesh);

    let inactiveParticle = particlesRef.current.find(p => !p.mesh.visible);
    if (inactiveParticle) {
      inactiveParticle.mesh = mesh;
      inactiveParticle.synapseId = synapseId;
      inactiveParticle.progress = 0;
      inactiveParticle.speed = 1.8;
      inactiveParticle.diffuseTime = 0;
      inactiveParticle.isDiffusing = false;
      inactiveParticle.mesh.visible = true;
      (inactiveParticle.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
    } else {
      particlesRef.current.push({
        mesh,
        synapseId,
        progress: 0,
        speed: 1.8,
        diffuseTime: 0,
        isDiffusing: false
      });
    }
  };

  const updateParticles = (deltaTime: number) => {
    particlesRef.current.forEach((particle) => {
      if (!particle.mesh.visible) return;

      const synapseData = synapses.find(s => s.id === particle.synapseId);
      if (!synapseData) return;

      const fromNeuron = neurons.find(n => n.id === synapseData.from);
      const toNeuron = neurons.find(n => n.id === synapseData.to);
      if (!fromNeuron || !toNeuron) return;

      const from = new THREE.Vector3(fromNeuron.position.x, fromNeuron.position.y, fromNeuron.position.z);
      const to = new THREE.Vector3(toNeuron.position.x, toNeuron.position.y, toNeuron.position.z);

      if (particle.isDiffusing) {
        particle.diffuseTime += deltaTime;
        const diffuseProgress = particle.diffuseTime / 0.2;
        const scale = 1 + diffuseProgress * 3;
        particle.mesh.scale.setScalar(scale);
        (particle.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - diffuseProgress;

        if (diffuseProgress >= 1) {
          particle.mesh.visible = false;
          particle.mesh.scale.setScalar(1);
        }
      } else {
        particle.progress += particle.speed * deltaTime;

        if (particle.progress >= 1) {
          particle.progress = 1;
          particle.isDiffusing = true;
          particle.diffuseTime = 0;
        }

        particle.mesh.position.lerpVectors(from, to, particle.progress);
      }
    });
  };

  useImperativeHandle(ref, () => ({
    triggerPulse: (neuronId: number) => {
      const neuron = neuronMeshesRef.current.get(neuronId);
      if (neuron) {
        neuron.pulseTime = 0.1;
      }
    },
    triggerLTP: (synapseId: number) => {
      const synapse = synapseObjectsRef.current.get(synapseId);
      if (synapse && synapse.glowMaterial) {
        synapse.ltpTime = 2;
        synapse.ltdTime = 0;
        synapse.glowMaterial.color.setHex(0x4169E1);
      }
    },
    triggerLTD: (synapseId: number) => {
      const synapse = synapseObjectsRef.current.get(synapseId);
      if (synapse && synapse.glowMaterial) {
        synapse.ltdTime = 2;
        synapse.ltpTime = 0;
        synapse.glowMaterial.color.setHex(0xDC143C);
      }
    },
    resetVisuals: () => {
      particlesRef.current.forEach(p => {
        p.mesh.visible = false;
      });
      particlesRef.current = [];
      lastParticleSpawnRef.current.clear();

      synapseObjectsRef.current.forEach((synapse) => {
        synapse.ltpTime = 0;
        synapse.ltdTime = 0;
        synapse.cylinder.scale.setScalar(1);
        synapse.cylinderMaterial.opacity = 0.5;
        synapse.cylinder.scale.y = 1;
        if (synapse.glowMaterial) {
          synapse.glowMaterial.opacity = 0;
        }
      });

      neuronMeshesRef.current.forEach((neuron) => {
        neuron.pulseTime = 0;
        neuron.material.emissiveIntensity = 0;
      });
    }
  }));

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'radial-gradient(ellipse at center, #0f0f2a 0%, #0a0a1a 70%, #050510 100%)'
      }}
    />
  );
});

NeuralScene.displayName = 'NeuralScene';

export { NEURON_COLORS };
export default NeuralScene;
