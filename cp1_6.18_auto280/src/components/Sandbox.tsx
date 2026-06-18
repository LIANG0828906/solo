import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFossilStore } from '@/store/useFossilStore';
import { SANDBOX_SIZE } from '@/types';
import type { BoneFragment, SandParticle, StarParticle, AssemblyRipple } from '@/types';

interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  ground: THREE.Mesh;
  sandGroup: THREE.Group;
  boneGroup: THREE.Group;
  starGroup: THREE.Group;
  rippleGroup: THREE.Group;
  brushIndicator: THREE.Mesh;
  raycaster: THREE.Raycaster;
  plane: THREE.Plane;
  pointer: THREE.Vector2;
  worldPoint: THREE.Vector3;
  isDragging: boolean;
  lastTime: number;
  animId: number;
}

function hexToRgb(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function createBoneMesh(bone: BoneFragment): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xF5F5DC,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: false
  });

  if (bone.shape === 'cylinder') {
    const geom = new THREE.CylinderGeometry(bone.radius * 0.6, bone.radius * 0.7, bone.length, 10, 1);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.z = Math.PI / 2;
    group.add(mesh);
    const capGeom = new THREE.SphereGeometry(bone.radius * 0.7, 8, 6);
    const cap1 = new THREE.Mesh(capGeom, mat);
    cap1.position.x = bone.length / 2;
    group.add(cap1);
    const cap2 = new THREE.Mesh(capGeom, mat);
    cap2.position.x = -bone.length / 2;
    group.add(cap2);
  } else if (bone.shape === 'box') {
    const w = bone.length;
    const h = bone.radius * 0.9;
    const d = bone.radius * 0.5;
    const geom = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);
  } else {
    if (bone.name === 'skull') {
      const mainGeom = new THREE.SphereGeometry(bone.radius, 12, 10);
      const main = new THREE.Mesh(mainGeom, mat);
      main.scale.set(1.3, 1, 1);
      group.add(main);
      const jawGeom = new THREE.BoxGeometry(bone.radius * 1.4, bone.radius * 0.4, bone.radius * 0.7);
      const jaw = new THREE.Mesh(jawGeom, mat);
      jaw.position.set(0, -bone.radius * 0.55, bone.radius * 0.1);
      group.add(jaw);
      const snoutGeom = new THREE.BoxGeometry(bone.radius * 0.9, bone.radius * 0.5, bone.radius * 0.55);
      const snout = new THREE.Mesh(snoutGeom, mat);
      snout.position.set(bone.radius * 1.1, -bone.radius * 0.1, 0);
      group.add(snout);
    } else {
      const baseGeom = new THREE.BoxGeometry(bone.length, bone.radius * 0.9, bone.radius * 1.3);
      const base = new THREE.Mesh(baseGeom, mat);
      group.add(base);
      const cupGeom = new THREE.SphereGeometry(bone.radius * 0.7, 10, 8);
      const cup = new THREE.Mesh(cupGeom, mat);
      cup.position.set(bone.length * 0.35, 0, 0);
      cup.scale.set(0.9, 1.1, 1.1);
      group.add(cup);
    }
  }
  return group;
}

function rebuildSandMeshes(sandGroup: THREE.Group, particles: SandParticle[]) {
  while (sandGroup.children.length > 0) {
    const c = sandGroup.children[0];
    sandGroup.remove(c);
    if (c instanceof THREE.Mesh) {
      c.geometry.dispose();
      if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
      else c.material.dispose();
    }
  }
  const sphereGeom = new THREE.SphereGeometry(1, 8, 6);
  particles.forEach(p => {
    const mat = new THREE.MeshStandardMaterial({
      color: hexToRgb(p.color),
      transparent: true,
      opacity: p.alpha,
      roughness: 1,
      metalness: 0
    });
    const mesh = new THREE.Mesh(sphereGeom, mat);
    mesh.position.set(p.x, p.y, p.z);
    mesh.scale.setScalar(p.radius);
    mesh.userData.particleId = p.id;
    sandGroup.add(mesh);
    if (p.burstParticles) {
      p.burstParticles.forEach(bp => {
        const bmat = new THREE.MeshBasicMaterial({
          color: hexToRgb(p.color),
          transparent: true,
          opacity: Math.max(0, bp.life / 0.3)
        });
        const bmesh = new THREE.Mesh(sphereGeom, bmat);
        const t = 1 - bp.life / 0.3;
        bmesh.position.set(bp.ox + bp.dx * t, bp.oy + bp.dy * t - t * t * 0.5, bp.oz + bp.dz * t);
        bmesh.scale.setScalar(p.radius * 0.35 * (1 - t * 0.5));
        sandGroup.add(bmesh);
      });
    }
  });
}

function rebuildBoneMeshes(boneGroup: THREE.Group, bones: BoneFragment[], now: number) {
  while (boneGroup.children.length > 0) {
    const c = boneGroup.children[0];
    boneGroup.remove(c);
    c.traverse(o => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
  }
  bones.forEach(b => {
    const mesh = createBoneMesh(b);
    const displayY = b.cleaned && !b.assembled ? b.y + b.liftOffset : b.y;
    mesh.position.set(b.x, displayY, b.z);
    mesh.rotation.set(b.rotationX, b.rotationY, b.rotationZ);
    if (now < b.glowUntil) {
      const glowT = (b.glowUntil - now) / 500;
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: glowT * 0.6,
        side: THREE.BackSide
      });
      mesh.traverse(o => {
        if (o instanceof THREE.Mesh) {
          const halo = new THREE.Mesh(o.geometry, glowMat);
          halo.scale.multiplyScalar(1.12);
          mesh.add(halo);
        }
      });
    }
    boneGroup.add(mesh);
  });
}

function rebuildStarMeshes(starGroup: THREE.Group, stars: StarParticle[]) {
  while (starGroup.children.length > 0) {
    const c = starGroup.children[0];
    starGroup.remove(c);
    if (c instanceof THREE.Mesh) {
      c.geometry.dispose();
      if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
      else c.material.dispose();
    }
  }
  const g = new THREE.SphereGeometry(1, 6, 4);
  stars.forEach(s => {
    const m = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: s.alpha,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(s.x, s.y, s.z);
    mesh.scale.setScalar(s.size * 0.03);
    starGroup.add(mesh);
  });
}

function rebuildRipples(rippleGroup: THREE.Group, ripples: AssemblyRipple[]) {
  while (rippleGroup.children.length > 0) {
    const c = rippleGroup.children[0];
    rippleGroup.remove(c);
    if (c instanceof THREE.Mesh) {
      c.geometry.dispose();
      if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
      else c.material.dispose();
    }
  }
  ripples.forEach(r => {
    const geom = new THREE.RingGeometry(Math.max(0.01, r.radius - 0.05), r.radius, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: r.alpha,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(r.x, r.y, r.z);
    rippleGroup.add(mesh);
  });
}

export default function Sandbox() {
  const mountRef = useRef<HTMLDivElement>(null);
  const refsRef = useRef<SceneRefs | null>(null);
  const storeInitRef = useRef(false);
  const toolSettings = useFossilStore(s => s.toolSettings);
  const brushSizeRef = useRef(toolSettings.brushSize);
  brushSizeRef.current = toolSettings.brushSize;

  useEffect(() => {
    if (!mountRef.current) return;

    const store = useFossilStore.getState();
    if (!storeInitRef.current) {
      store.initScene();
      storeInitRef.current = true;
    }

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0F0C29');
    scene.fog = new THREE.Fog('#0F0C29', 25, 55);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(10, 14, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xB39DD8, 0.55);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xFFFFFF, 0.9);
    dir.position.set(8, 15, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -20;
    dir.shadow.camera.right = 20;
    dir.shadow.camera.top = 20;
    dir.shadow.camera.bottom = -20;
    scene.add(dir);
    const point = new THREE.PointLight(0xFFE4B5, 0.6, 30);
    point.position.set(0, 5, 0);
    scene.add(point);

    const halfSize = SANDBOX_SIZE / 2;
    const cells = 15;
    const cellSize = SANDBOX_SIZE / cells;
    const groundGroup = new THREE.Group();
    const dark = new THREE.Color('#3E2723');
    const light = new THREE.Color('#5D4037');
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const g = new THREE.PlaneGeometry(cellSize, cellSize);
        const t = (i + j) / (cells * 2);
        const color = dark.clone().lerp(light, t + (Math.random() - 0.5) * 0.1);
        const m = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
        const mesh = new THREE.Mesh(g, m);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(-halfSize + cellSize * (i + 0.5), 0, -halfSize + cellSize * (j + 0.5));
        mesh.receiveShadow = true;
        groundGroup.add(mesh);
      }
    }
    scene.add(groundGroup);

    const sandGroup = new THREE.Group();
    scene.add(sandGroup);
    const boneGroup = new THREE.Group();
    scene.add(boneGroup);
    const starGroup = new THREE.Group();
    scene.add(starGroup);
    const rippleGroup = new THREE.Group();
    scene.add(rippleGroup);

    const brushGeom = new THREE.RingGeometry(0.01, 1, 32);
    const brushMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const brushIndicator = new THREE.Mesh(brushGeom, brushMat);
    brushIndicator.rotation.x = -Math.PI / 2;
    brushIndicator.position.y = 0.05;
    brushIndicator.visible = false;
    scene.add(brushIndicator);

    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pointer = new THREE.Vector2();
    const worldPoint = new THREE.Vector3();

    const refs: SceneRefs = {
      renderer, scene, camera,
      ground: groundGroup as unknown as THREE.Mesh,
      sandGroup, boneGroup, starGroup, rippleGroup,
      brushIndicator, raycaster, plane, pointer, worldPoint,
      isDragging: false,
      lastTime: performance.now(),
      animId: 0
    };
    refsRef.current = refs;

    function updateWorldPointFromEvent(clientX: number, clientY: number) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, worldPoint);
    }

    const onPointerDown = (e: PointerEvent) => {
      updateWorldPointFromEvent(e.clientX, e.clientY);
      refs.isDragging = true;
      brushIndicator.visible = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      updateWorldPointFromEvent(e.clientX, e.clientY);
      const br = 0.25 + brushSizeRef.current * 0.1;
      brushIndicator.scale.set(br, br, br);
      if (worldPoint) {
        brushIndicator.position.set(worldPoint.x, 0.05, worldPoint.z);
      }
      if (refs.isDragging) {
        const st = useFossilStore.getState();
        st.removeParticlesInRadius(worldPoint.x, worldPoint.z, 1 / 60);
        st.checkBoneCollision(worldPoint.x, worldPoint.z);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      refs.isDragging = false;
      brushIndicator.visible = false;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    };
    const onPointerLeave = () => {
      refs.isDragging = false;
      brushIndicator.visible = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let lastStateVersion = 0;
    function animate() {
      refs.animId = requestAnimationFrame(animate);
      const now = performance.now();
      let dt = (now - refs.lastTime) / 1000;
      if (dt > 0.05) dt = 0.05;
      refs.lastTime = now;

      useFossilStore.getState().updateAnimations(dt, now);

      const st = useFossilStore.getState();
      const version = st.sandParticles.length * 31 + st.boneFragments.length * 7 +
        (st.fullyAssembled ? 101 : 0) + st.assemblyRipples.length * 13;
      if (version !== lastStateVersion || dt > 0) {
        lastStateVersion = version;
        rebuildSandMeshes(sandGroup, st.sandParticles);
        rebuildBoneMeshes(boneGroup, st.boneFragments, now);
        rebuildStarMeshes(starGroup, st.starParticles);
        rebuildRipples(rippleGroup, st.assemblyRipples);
      }

      const angle = now / 15000;
      camera.position.x = Math.cos(angle) * 18;
      camera.position.z = Math.sin(angle) * 18;
      camera.position.y = 13;
      camera.lookAt(0, 0.5, 0);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(refs.animId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      scene.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'relative', touchAction: 'none', cursor: 'crosshair' }}
    />
  );
}
