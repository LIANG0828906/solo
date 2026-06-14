import * as THREE from 'three';
import type { SceneManager, BooleanOperation } from './SceneManager';
import { HistoryManager, Snapshot } from './HistoryManager';
import type { GeometryType, GeometryObject } from './GeometryFactory';
import { createDragPreview } from './GeometryFactory';

interface UIHandlerOptions {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sceneManager: SceneManager;
  historyManager: HistoryManager;
  onDropGeometry: (type: GeometryType, pos: { x: number; y: number; z: number }) => void;
}

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export class UIHandler {
  private options: UIHandlerOptions;
  private dom: { [key: string]: HTMLElement | null } = {};
  private dragType: GeometryType | null = null;
  private dragGhost: HTMLElement | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private hoverPos = new THREE.Vector3();
  private draggingObject: GeometryObject | null = null;
  private dragOffset = new THREE.Vector3();

  constructor(options: UIHandlerOptions) {
    this.options = options;
    this.cacheDom();
    this.bindEvents();
    this.refreshBooleanButtons();
    this.refreshSnapshots();
  }

  private cacheDom(): void {
    const ids = [
      'left-toolbar',
      'right-panel',
      'properties-panel',
      'selected-count',
      'snapshots-container',
      'empty-history',
      'capture-overlay',
      'drag-ghost',
      'mobile-menu-btn',
      'mobile-history-btn',
      'close-props',
      'delete-geo',
      'capture-btn',
      'clear-btn',
      'prop-scale',
      'prop-scale-val',
      'prop-pos-x',
      'prop-pos-x-val',
      'prop-pos-y',
      'prop-pos-y-val',
      'prop-pos-z',
      'prop-pos-z-val',
      'prop-rot-x',
      'prop-rot-x-val',
      'prop-rot-y',
      'prop-rot-y-val',
      'prop-rot-z',
      'prop-rot-z-val',
    ];
    for (const id of ids) {
      this.dom[id] = document.getElementById(id);
    }
    this.dragGhost = document.getElementById('drag-ghost');
  }

  private bindEvents(): void {
    const { canvas, sceneManager, historyManager } = this.options;

    document.querySelectorAll<HTMLElement>('.tool-btn').forEach((btn) => {
      const type = btn.dataset.type as GeometryType;
      if (!type) return;

      btn.addEventListener('dragstart', (e) => {
        e.dataTransfer!.setData('text/plain', type);
        e.dataTransfer!.effectAllowed = 'copy';
        btn.classList.add('dragging');
        this.dragType = type;

        const ghostCanvas = this.dragGhost?.querySelector('canvas');
        if (ghostCanvas) {
          createDragPreview(type, ghostCanvas);
        }
        if (this.dragGhost) {
          this.dragGhost.classList.remove('hidden');
          this.dragGhost.style.left = `${e.clientX - 48}px`;
          this.dragGhost.style.top = `${e.clientY - 48}px`;
        }
      });

      btn.addEventListener('dragend', () => {
        btn.classList.remove('dragging');
        this.dragType = null;
        if (this.dragGhost) this.dragGhost.classList.add('hidden');
      });

      btn.addEventListener('click', () => {
        this.options.onDropGeometry(type, { x: 0, y: 0, z: 0 });
      });
    });

    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.dragGhost) {
        this.dragGhost.style.left = `${e.clientX - 48}px`;
        this.dragGhost.style.top = `${e.clientY - 48}px`;
      }
    });

    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
      this.updateRaycast(e);
    });

    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer!.getData('text/plain') as GeometryType;
      if (!type) return;

      this.updateRaycast(e);
      const intersect = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.groundPlane, intersect);
      const pos = intersect || new THREE.Vector3(0, 0, 0);
      this.options.onDropGeometry(type, {
        x: Math.round(pos.x * 10) / 10,
        y: 0.5,
        z: Math.round(pos.z * 10) / 10,
      });
    });

    canvas.addEventListener('pointerdown', (e) => {
      this.updateRaycast(e);
      const hits = this.raycaster.intersectObjects(this.getPickableMeshes(), true);
      let hitMesh: THREE.Object3D | null = null;
      for (const h of hits) {
        let obj: THREE.Object3D | null = h.object;
        while (obj && !(obj as any).userData?.geometryId) {
          obj = obj.parent;
        }
        if (obj && (obj as any).userData?.geometryId) {
          hitMesh = obj;
          break;
        }
      }

      if (hitMesh) {
        const geoObj = this.options.sceneManager.getObjectByMesh(hitMesh);
        if (geoObj) {
          this.draggingObject = geoObj;
          const intersectPt = new THREE.Vector3();
          this.raycaster.ray.intersectPlane(this.groundPlane, intersectPt);
          if (intersectPt) {
            this.dragOffset
              .copy(geoObj.group.position)
              .sub(new THREE.Vector3(intersectPt.x, geoObj.group.position.y, intersectPt.z));
          }
          this.options.sceneManager.select(geoObj.data.id);
          (canvas as any).setPointerCapture?.(e.pointerId);
          return;
        }
      }

      this.options.sceneManager.clearSelection();
      this.hidePropertiesPanel();
    });

    canvas.addEventListener('pointermove', (e) => {
      this.updateRaycast(e);

      if (this.draggingObject) {
        const intersect = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.groundPlane, intersect);
        if (intersect) {
          const newX = Math.round((intersect.x + this.dragOffset.x) * 10) / 10;
          const newZ = Math.round((intersect.z + this.dragOffset.z) * 10) / 10;
          this.options.sceneManager.updatePosition(
            this.draggingObject.data.id,
            newX,
            this.draggingObject.group.position.y,
            newZ
          );
          this.syncPropertySliders(this.draggingObject);
        }
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      if (this.draggingObject) {
        (canvas as any).releasePointerCapture?.(e.pointerId);
        this.draggingObject = null;
      }
    });

    canvas.addEventListener('pointercancel', () => {
      this.draggingObject = null;
    });

    document.querySelectorAll<HTMLElement>('.bool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const op = btn.dataset.op as BooleanOperation;
        if (!op) return;
        const result = sceneManager.performBooleanOperation(op);
        if (result) {
          setTimeout(() => this.showPropertiesPanel(result), 100);
        } else {
          this.flashBooleanError();
        }
      });
    });

    sceneManager.setSelectionChangeCallback((selected) => {
      this.refreshBooleanButtons();
      if (this.dom['selected-count']) {
        (this.dom['selected-count'] as HTMLElement).textContent = selected.length.toString();
      }
      if (selected.length > 0) {
        this.showPropertiesPanel(selected[selected.length - 1]);
      }
    });

    historyManager.setUpdateCallback(() => this.refreshSnapshots());

    this.dom['close-props']?.addEventListener('click', () => this.hidePropertiesPanel());
    this.dom['delete-geo']?.addEventListener('click', () => {
      const selected = sceneManager.getSelectedObjects();
      if (selected.length > 0) {
        const target = selected[selected.length - 1];
        sceneManager.removeGeometry(target.data.id);
        this.hidePropertiesPanel();
      }
    });

    this.bindSlider('prop-scale', 'prop-scale-val', (val, obj) => {
      sceneManager.updateScale(obj.data.id, val);
    });
    this.bindSlider('prop-pos-x', 'prop-pos-x-val', (val, obj) => {
      sceneManager.updatePosition(obj.data.id, val, obj.data.position.y, obj.data.position.z);
    });
    this.bindSlider('prop-pos-y', 'prop-pos-y-val', (val, obj) => {
      sceneManager.updatePosition(obj.data.id, obj.data.position.x, val, obj.data.position.z);
    });
    this.bindSlider('prop-pos-z', 'prop-pos-z-val', (val, obj) => {
      sceneManager.updatePosition(obj.data.id, obj.data.position.x, obj.data.position.y, val);
    });
    this.bindSlider('prop-rot-x', 'prop-rot-x-val', (val, obj) => {
      sceneManager.updateRotation(obj.data.id, val, obj.data.rotation.y, obj.data.rotation.z);
    });
    this.bindSlider('prop-rot-y', 'prop-rot-y-val', (val, obj) => {
      sceneManager.updateRotation(obj.data.id, obj.data.rotation.x, val, obj.data.rotation.z);
    });
    this.bindSlider('prop-rot-z', 'prop-rot-z-val', (val, obj) => {
      sceneManager.updateRotation(obj.data.id, obj.data.rotation.x, obj.data.rotation.y, val);
    });

    this.dom['capture-btn']?.addEventListener('click', () => this.takeSnapshot());
    this.dom['clear-btn']?.addEventListener('click', () => {
      if (sceneManager.getAllObjects().length === 0) return;
      if (confirm('确定要清空所有几何体吗？')) {
        sceneManager.clearAll();
        this.hidePropertiesPanel();
      }
    });

    this.dom['mobile-menu-btn']?.addEventListener('click', () => {
      this.dom['left-toolbar']?.classList.toggle('open');
      this.dom['right-panel']?.classList.remove('open');
    });
    this.dom['mobile-history-btn']?.addEventListener('click', () => {
      this.dom['right-panel']?.classList.toggle('open');
      this.dom['left-toolbar']?.classList.remove('open');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        const selected = sceneManager.getSelectedObjects();
        if (selected.length > 0) {
          sceneManager.removeGeometry(selected[selected.length - 1].data.id);
          this.hidePropertiesPanel();
        }
      }
      if (e.key === 'Escape') {
        sceneManager.clearSelection();
        this.hidePropertiesPanel();
        this.dom['left-toolbar']?.classList.remove('open');
        this.dom['right-panel']?.classList.remove('open');
      }
    });
  }

  private getPickableMeshes(): THREE.Object3D[] {
    const meshes: THREE.Object3D[] = [];
    for (const obj of this.options.sceneManager.getAllObjects()) {
      meshes.push(obj.mesh);
      if (obj.wireframe) meshes.push(obj.wireframe);
    }
    return meshes;
  }

  private updateRaycast(e: PointerEvent | DragEvent): void {
    const rect = this.options.canvas.getBoundingClientRect();
    const cx = 'clientX' in e ? e.clientX : (e as DragEvent).clientX;
    const cy = 'clientY' in e ? e.clientY : (e as DragEvent).clientY;
    this.mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.options.camera);
  }

  private bindSlider(
    sliderId: string,
    valId: string,
    onChange: (value: number, obj: GeometryObject) => void
  ): void {
    const slider = this.dom[sliderId] as HTMLInputElement | null;
    const val = this.dom[valId] as HTMLElement | null;
    if (!slider || !val) return;

    slider.addEventListener('input', () => {
      const num = parseFloat(slider.value);
      val.textContent = num % 1 === 0 ? num.toFixed(1) : num.toFixed(1);
      const selected = this.options.sceneManager.getSelectedObjects();
      if (selected.length > 0) {
        onChange(num, selected[selected.length - 1]);
      }
    });
  }

  private showPropertiesPanel(obj: GeometryObject): void {
    const panel = this.dom['properties-panel'];
    if (!panel) return;
    panel.classList.remove('hidden');
    this.syncPropertySliders(obj);
  }

  private hidePropertiesPanel(): void {
    this.dom['properties-panel']?.classList.add('hidden');
  }

  private syncPropertySliders(obj: GeometryObject): void {
    const setVal = (sliderId: string, valId: string, value: number, fixed = 1) => {
      const s = this.dom[sliderId] as HTMLInputElement | null;
      const v = this.dom[valId] as HTMLElement | null;
      if (s) s.value = value.toString();
      if (v) v.textContent = value.toFixed(fixed);
    };
    setVal('prop-scale', 'prop-scale-val', obj.data.scale);
    setVal('prop-pos-x', 'prop-pos-x-val', obj.data.position.x);
    setVal('prop-pos-y', 'prop-pos-y-val', obj.data.position.y);
    setVal('prop-pos-z', 'prop-pos-z-val', obj.data.position.z);
    setVal('prop-rot-x', 'prop-rot-x-val', obj.data.rotation.x, 0);
    setVal('prop-rot-y', 'prop-rot-y-val', obj.data.rotation.y, 0);
    setVal('prop-rot-z', 'prop-rot-z-val', obj.data.rotation.z, 0);
  }

  private refreshBooleanButtons(): void {
    const selected = this.options.sceneManager.getSelectedObjects();
    const disabled = selected.length !== 2;
    document.querySelectorAll<HTMLButtonElement>('.bool-btn').forEach((btn) => {
      btn.disabled = disabled;
    });
  }

  private flashBooleanError(): void {
    document.querySelectorAll<HTMLElement>('.bool-btn').forEach((btn) => {
      btn.animate(
        [
          { backgroundColor: '', borderColor: '' },
          { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
          { backgroundColor: '', borderColor: '' },
        ],
        { duration: 600 }
      );
    });
  }

  private takeSnapshot(): void {
    const overlay = this.dom['capture-overlay'];
    if (overlay) {
      overlay.classList.remove('hidden');
      setTimeout(() => overlay.classList.add('hidden'), 350);
    }

    const objects = this.options.sceneManager.getAllObjects();
    this.options.historyManager.saveSnapshot(objects);
  }

  private refreshSnapshots(): void {
    const container = this.dom['snapshots-container'];
    const empty = this.dom['empty-history'];
    if (!container) return;

    const snapshots: Snapshot[] = this.options.historyManager.getSnapshots();
    container.innerHTML = '';

    if (snapshots.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');

    for (const snap of snapshots) {
      const item = document.createElement('div');
      item.className = 'snapshot-item';
      item.style.animation = 'fade-in 0.3s ease';

      const img = document.createElement('img');
      img.src = snap.thumbnail;
      img.alt = snap.name;
      img.className = 'snapshot-thumb';
      img.draggable = false;
      item.appendChild(img);

      const info = document.createElement('div');
      info.className = 'snapshot-info';
      const name = document.createElement('div');
      name.className = 'snapshot-name';
      name.textContent = snap.name;
      const time = document.createElement('div');
      time.className = 'snapshot-time';
      time.textContent = formatTime(snap.timestamp);
      info.appendChild(name);
      info.appendChild(time);
      item.appendChild(info);

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-snapshot';
      delBtn.textContent = '×';
      delBtn.title = '删除快照';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.options.historyManager.deleteSnapshot(snap.id);
      });
      item.appendChild(delBtn);

      item.addEventListener('click', () => {
        this.options.historyManager.restoreSnapshot(snap.id, () => {
          this.options.sceneManager.clearAll();
        });
        this.hidePropertiesPanel();
      });

      container.appendChild(item);
    }
  }
}
