import {
  Atom,
  AtomSpecs,
  AtomType,
  eventBus,
  moleculeData,
  PresetMolecules,
  ConstraintResult,
} from './MoleculeData';
import { SceneManager } from './SceneManager';

const SHARE_STORAGE_KEY = 'molecule_share_codes_v1';

type ShareMap = Record<string, string>;

function loadShareMap(): ShareMap {
  try {
    const raw = localStorage.getItem(SHARE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShareMap) : {};
  } catch {
    return {};
  }
}

function saveShareMap(map: ShareMap): void {
  try {
    localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    void 0;
  }
}

function hash8(input: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0, len = input.length; i < len; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const num = (4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0;
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  let n = num;
  for (let i = 0; i < 8; i++) {
    out += alphabet.charAt(n % alphabet.length);
    n = Math.floor(n / alphabet.length) + i * 131;
  }
  return out;
}

export class UIController {
  private scene: SceneManager;
  private currentSelectedAtomId: string | null = null;
  private syncing = false;

  private sel: HTMLSelectElement;
  private panel: HTMLElement;
  private panelClose: HTMLButtonElement;
  private panelName: HTMLElement;
  private atomTypeSel: HTMLSelectElement;
  private posX: HTMLInputElement;
  private posY: HTMLInputElement;
  private posZ: HTMLInputElement;
  private posXVal: HTMLElement;
  private posYVal: HTMLElement;
  private posZVal: HTMLElement;
  private btnExport: HTMLButtonElement;
  private shareCode: HTMLElement;
  private loadInput: HTMLInputElement;
  private btnLoad: HTMLButtonElement;
  private toast: HTMLElement;
  private toastTimer = 0;

  private pendingUIUpdate: number | null = null;
  private pendingConstraintCheck: number | null = null;

  constructor(scene: SceneManager) {
    this.scene = scene;
    const $ = (id: string) => {
      const el = document.getElementById(id);
      if (!el) throw new Error(`#${id} not found`);
      return el;
    };
    this.sel = $('molecule-select') as HTMLSelectElement;
    this.panel = $('edit-panel') as HTMLElement;
    this.panelClose = $('panel-close') as HTMLButtonElement;
    this.panelName = $('panel-atom-name') as HTMLElement;
    this.atomTypeSel = $('atom-type') as HTMLSelectElement;
    this.posX = $('pos-x') as HTMLInputElement;
    this.posY = $('pos-y') as HTMLInputElement;
    this.posZ = $('pos-z') as HTMLInputElement;
    this.posXVal = $('pos-x-val') as HTMLElement;
    this.posYVal = $('pos-y-val') as HTMLElement;
    this.posZVal = $('pos-z-val') as HTMLElement;
    this.btnExport = $('btn-export') as HTMLButtonElement;
    this.shareCode = $('share-code') as HTMLElement;
    this.loadInput = $('load-input') as HTMLInputElement;
    this.btnLoad = $('btn-load') as HTMLButtonElement;
    this.toast = $('toast') as HTMLElement;

    this.populatePresets();
    this.bind();
    this.onAtomSelected({ atomId: null, selectedAtomIds: [] });
  }

  private populatePresets(): void {
    const frag = document.createDocumentFragment();
    const labels: Record<string, string> = {
      h2o: 'H₂O 水分子',
      co2: 'CO₂ 二氧化碳',
      ch4: 'CH₄ 甲烷',
      nh3: 'NH₃ 氨',
      c2h6: 'C₂H₆ 乙烷',
      c6h6: 'C₆H₆ 苯',
    };
    for (const key of Object.keys(PresetMolecules)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = labels[key] ?? `${PresetMolecules[key].formula} ${PresetMolecules[key].name}`;
      frag.appendChild(opt);
    }
    this.sel.innerHTML = '';
    this.sel.appendChild(frag);
    this.sel.value = 'h2o';
  }

  private bind(): void {
    this.sel.addEventListener('change', () => {
      const key = this.sel.value;
      eventBus.emit('ui:molecule-selected', key);
      if (!moleculeData.loadPreset(key)) {
        this.showToast('未知分子类型', 'error');
      } else {
        this.showToast(`已加载 ${PresetMolecules[key]?.formula ?? key}`);
      }
      this.clearShareCode();
    });

    this.panelClose.addEventListener('click', () => {
      moleculeData.selectAtom(null);
    });

    this.atomTypeSel.addEventListener('change', () => {
      if (this.syncing || !this.currentSelectedAtomId) return;
      const type = this.atomTypeSel.value as AtomType;
      eventBus.emit('ui:atom-edited', { atomId: this.currentSelectedAtomId, changes: { type } });
      moleculeData.updateAtom(this.currentSelectedAtomId, { type });
      this.scheduleConstraintRefresh();
    });

    const onSlider = () => {
      if (this.syncing || !this.currentSelectedAtomId) return;
      const x = Number(this.posX.value);
      const y = Number(this.posY.value);
      const z = Number(this.posZ.value);
      this.posXVal.textContent = x.toFixed(2);
      this.posYVal.textContent = y.toFixed(2);
      this.posZVal.textContent = z.toFixed(2);
      eventBus.emit('ui:atom-edited', { atomId: this.currentSelectedAtomId, changes: { x, y, z } });
      moleculeData.updateAtom(this.currentSelectedAtomId, { x, y, z });
      this.scheduleConstraintRefresh();
    };
    this.posX.addEventListener('input', onSlider);
    this.posY.addEventListener('input', onSlider);
    this.posZ.addEventListener('input', onSlider);

    this.btnExport.addEventListener('click', () => this.handleExport());
    this.btnLoad.addEventListener('click', () => this.handleLoad());
    this.loadInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleLoad();
    });

    eventBus.on('atom:selected', (info) => this.onAtomSelected(info));
    eventBus.on('atom:updated', (info) => this.onAtomUpdated(info));
    eventBus.on('molecule:changed', () => this.scheduleBondLabelRefresh());
    eventBus.on('constraint:result', (res) => this.onConstraint(res));
    eventBus.on('toast:show', ({ message, type }) => this.showToast(message, type));
  }

  private scheduleBondLabelRefresh(): void {
    setTimeout(() => this.scene.forceRefreshBondLabels(), 30);
  }

  private scheduleConstraintRefresh(): void {
    if (this.pendingConstraintCheck != null) return;
    this.pendingConstraintCheck = window.setTimeout(() => {
      this.pendingConstraintCheck = null;
      const mol = moleculeData.getMolecule();
      if (!mol) return;
      import('./ConstraintSolver').then(({ constraintSolver }) => {
        const res = constraintSolver.solve(mol);
        eventBus.emit('constraint:result', res);
      });
    }, 20);
  }

  private scheduleUIRefresh(): void {
    if (this.pendingUIUpdate != null) return;
    this.pendingUIUpdate = window.requestAnimationFrame(() => {
      this.pendingUIUpdate = null;
      this.syncUI();
    });
  }

  private onAtomSelected(info: { atomId: string | null; selectedAtomIds: string[] }): void {
    const id = info.selectedAtomIds[info.selectedAtomIds.length - 1] ?? info.atomId;
    this.currentSelectedAtomId = id ?? null;
    if (!id) {
      this.panel.classList.remove('show');
      return;
    }
    this.panel.classList.add('show');
    this.syncUI();
  }

  private onAtomUpdated(info: { atomId: string; changes: Partial<Atom> }): void {
    if (info.atomId === this.currentSelectedAtomId) {
      this.scheduleUIRefresh();
    }
  }

  private onConstraint(res: ConstraintResult): void {
    void res;
    if (this.currentSelectedAtomId) this.syncUI();
  }

  private syncUI(): void {
    if (!this.currentSelectedAtomId) return;
    const atom = moleculeData.getAtom(this.currentSelectedAtomId);
    if (!atom) return;
    this.syncing = true;
    try {
      const spec = AtomSpecs[atom.type];
      this.panelName.textContent = `${atom.type} - ${spec.name}原子`;
      if (this.atomTypeSel.value !== atom.type) this.atomTypeSel.value = atom.type;
      const update = (inp: HTMLInputElement, val: HTMLElement, v: number) => {
        if (Number(inp.value) !== v) inp.value = v.toFixed(1);
        val.textContent = v.toFixed(2);
      };
      update(this.posX, this.posXVal, atom.x);
      update(this.posY, this.posYVal, atom.y);
      update(this.posZ, this.posZVal, atom.z);
    } finally {
      this.syncing = false;
    }
  }

  private handleExport(): void {
    const json = moleculeData.toJSON();
    try {
      navigator.clipboard.writeText(json).then(
        () => this.showToast('分子结构已复制到剪贴板', 'success'),
        () => this.fallbackCopy(json)
      );
    } catch {
      this.fallbackCopy(json);
    }
    const code = hash8(json);
    const map = loadShareMap();
    map[code] = json;
    saveShareMap(map);
    this.shareCode.textContent = code;
  }

  private fallbackCopy(text: string): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast('分子结构已复制', 'success');
    } catch {
      this.showToast('复制失败，请手动复制', 'error');
    }
    document.body.removeChild(ta);
  }

  private handleLoad(): void {
    const raw = this.loadInput.value.trim().toUpperCase();
    if (!raw) {
      this.showToast('请输入分享码', 'error');
      return;
    }
    const map = loadShareMap();
    const json = map[raw];
    if (!json) {
      this.showToast('无效的分享码（本地未找到）', 'error');
      return;
    }
    const ok = moleculeData.fromJSON(json);
    if (ok) {
      this.showToast('分子已恢复', 'success');
      this.shareCode.textContent = raw;
      this.sel.value = '';
    } else {
      this.showToast('数据损坏，无法加载', 'error');
    }
  }

  private clearShareCode(): void {
    this.shareCode.textContent = '--------';
  }

  private showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    this.toast.textContent = message;
    this.toast.className = `toast show ${type === 'info' ? '' : type}`;
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove('show');
    }, 2400);
  }
}
