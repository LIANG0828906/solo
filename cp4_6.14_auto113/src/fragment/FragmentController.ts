import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { globalEvents, FragmentData } from '../types';

export class FragmentController {
  private sceneManager: SceneManager;
  private fragmentCounter: number = 0;
  private loader: GLTFLoader = new GLTFLoader();
  private splitAnimations: Map<string, { velocity: THREE.Vector3; startTime: number }> = new Map();

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
    this.setupGlobalEvents();
    this.setupFileInput();
  }

  private setupGlobalEvents(): void {
    globalEvents.on('group:split', (groupId: number) => this.splitGroup(groupId));
  }

  private setupFileInput(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const btnLoad = document.getElementById('btn-load');

    btnLoad?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        this.loadFragments(Array.from(files));
      }
      fileInput.value = '';
    });
  }

  public async loadFragments(files: File[]): Promise<void> {
    const loadedCount = this.sceneManager.fragments.size;
    const totalToLoad = files.length;

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const url = URL.createObjectURL(file);
        const mesh = await this.loadGLTF(url);
        URL.revokeObjectURL(url);

        const index = loadedCount + i;
        const angle = (index / Math.max(loadedCount + totalToLoad, 1)) * Math.PI * 2;
        const radius = 5;
        const pos = new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );

        mesh.rotation.set(0, 0, 0);
        mesh.position.set(0, 0, 0);
        const bbox = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        mesh.position.sub(center);
        mesh.position.y -= bbox.min.y;

        const id = `frag_${++this.fragmentCounter}`;
        const finalMesh = new THREE.Group();
        finalMesh.add(mesh);
        this.sceneManager.addFragment(finalMesh, id, pos);
        this.updateFragmentInfoPanel();
      } catch (err) {
        console.error('加载碎片失败:', err);
      }
    }
  }

  private loadGLTF(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        reject
      );
    });
  }

  public generateDemoFragments(): void {
    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      const geo = new THREE.TorusGeometry(1.5 + Math.random() * 0.5, 0.3, 16, 32, Math.PI * (0.3 + Math.random() * 0.4));
      const color = new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 0.4 + Math.random() * 0.3, 0.4 + Math.random() * 0.2);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);

      const id = `frag_${++this.fragmentCounter}`;
      const angle = (i / 4) * Math.PI * 2;
      const pos = new THREE.Vector3(Math.cos(angle) * 5, 0, Math.sin(angle) * 5);
      this.sceneManager.addFragment(group, id, pos);
    }
    this.updateFragmentInfoPanel();
  }

  public splitGroup(groupId: number): void {
    const fragmentsToSplit: FragmentData[] = [];
    this.sceneManager.fragments.forEach((f) => {
      if (f.groupId === groupId) {
        fragmentsToSplit.push(f);
      }
    });

    if (fragmentsToSplit.length < 2) return;

    const center = new THREE.Vector3();
    fragmentsToSplit.forEach((f) => {
      const p = new THREE.Vector3();
      f.mesh.getWorldPosition(p);
      center.add(p);
    });
    center.divideScalar(fragmentsToSplit.length);

    const now = performance.now();
    fragmentsToSplit.forEach((f) => {
      const pos = new THREE.Vector3();
      f.mesh.getWorldPosition(pos);
      let dir = pos.clone().sub(center);
      if (dir.length() < 0.001) {
        dir.set(
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        );
      }
      dir.normalize();
      const velocity = dir.multiplyScalar(0.5);
      this.splitAnimations.set(f.id, { velocity, startTime: now });
      f.groupId = null;
    });

    this.animateSplit();
    this.updateFragmentInfoPanel();
  }

  private animateSplit = (): void => {
    if (this.splitAnimations.size === 0) return;

    const now = performance.now();
    const toRemove: string[] = [];

    this.splitAnimations.forEach((anim, id) => {
      const elapsed = (now - anim.startTime) / 1000;
      if (elapsed >= 0.5) {
        toRemove.push(id);
        return;
      }
      const f = this.sceneManager.fragments.get(id);
      if (f) {
        f.mesh.position.add(anim.velocity.clone().multiplyScalar(1));
      }
    });

    toRemove.forEach((id) => this.splitAnimations.delete(id));
    if (this.splitAnimations.size > 0) {
      requestAnimationFrame(this.animateSplit);
    }
  };

  public updateFragmentInfoPanel(): void {
    const section = document.getElementById('fragment-info');
    if (!section) return;

    const noSel = document.getElementById('no-selection');
    let selectedId: string | null = null;
    this.sceneManager.fragments.forEach((f, id) => {
      if (f.highlightWire) {
        const mat = f.highlightWire.material as THREE.LineBasicMaterial;
        if (mat.opacity > 0.3) selectedId = id;
      }
    });

    if (!selectedId) {
      if (noSel) noSel.style.display = 'block';
      section.querySelectorAll('.info-row').forEach((r) => r.remove());
      return;
    }

    if (noSel) noSel.style.display = 'none';
    const f = this.sceneManager.fragments.get(selectedId);
    if (!f) return;

    section.querySelectorAll('.info-row').forEach((r) => r.remove());

    const rows = [
      { label: '碎片编号', value: f.id },
      { label: '顶点数', value: f.vertexCount.toString() },
      { label: '是否有纹理', value: f.hasTexture ? '是' : '否' },
      { label: '所在组', value: f.groupId !== null ? `组 ${f.groupId}` : '独立' },
    ];

    rows.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'info-row';
      row.innerHTML = `<span class="label">${r.label}</span><span class="value">${r.value}</span>`;
      section.appendChild(row);
    });
  }
}
