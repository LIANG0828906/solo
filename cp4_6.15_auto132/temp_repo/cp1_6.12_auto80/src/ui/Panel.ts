import type { MoleculeData } from '../data/MoleculeStore';
import { MoleculeStore } from '../data/MoleculeStore';
import { CPK_COLORS } from '../renderer/MoleculeRenderer';

export interface PanelCallbacks {
  onAtomSelect?: (atomId: string) => void;
  onBondSelect?: (bondId: string) => void;
}

export class Panel {
  private treeContainer: HTMLElement;
  private detailContainer: HTMLElement;
  private moleculeSelect: HTMLSelectElement;

  private moleculeStore: MoleculeStore;
  private currentMolecule: MoleculeData | null;
  private selectedAtomId: string | null;
  private selectedBondId: string | null;

  private callbacks: PanelCallbacks;

  private atomsExpanded: boolean;
  private bondsExpanded: boolean;

  constructor(moleculeStore: MoleculeStore, callbacks: PanelCallbacks = {}) {
    this.moleculeStore = moleculeStore;
    this.callbacks = callbacks;
    this.currentMolecule = null;
    this.selectedAtomId = null;
    this.selectedBondId = null;
    this.atomsExpanded = true;
    this.bondsExpanded = true;

    const treeEl = document.getElementById('molecule-tree');
    const detailEl = document.getElementById('detail-content');
    const selectEl = document.getElementById('molecule-select') as HTMLSelectElement;
    const panelEl = document.getElementById('side-panel');
    const collapseBtn = document.getElementById('panel-collapse');
    const toggleBtn = document.getElementById('panel-toggle');

    if (!treeEl || !detailEl || !selectEl || !panelEl || !collapseBtn || !toggleBtn) {
      throw new Error('Panel elements not found');
    }

    this.treeContainer = treeEl;
    this.detailContainer = detailEl;
    this.moleculeSelect = selectEl;

    this.populateSelect();
    this.bindEvents();
    this.renderEmpty();
  }

  private populateSelect(): void {
    const molecules = this.moleculeStore.getAllMolecules();
    molecules.forEach(mol => {
      const option = document.createElement('option');
      option.value = mol.id;
      option.textContent = `${mol.name} (${mol.formula})`;
      this.moleculeSelect.appendChild(option);
    });
  }

  private bindEvents(): void {
    this.moleculeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const molId = target.value;
      if (molId) {
        const mol = this.moleculeStore.getMolecule(molId);
        if (mol) {
          this.setMolecule(mol);
        }
      }
    });

    const collapseBtn = document.getElementById('panel-collapse');
    const sidePanel = document.getElementById('side-panel');
    const panelToggle = document.getElementById('panel-toggle');

    if (collapseBtn && sidePanel) {
      collapseBtn.addEventListener('click', () => {
        sidePanel.classList.add('collapsed');
        collapseBtn.classList.add('rotated');
        if (panelToggle) {
          panelToggle.classList.remove('hidden');
          panelToggle.classList.add('open');
        }
      });
    }

    if (panelToggle && sidePanel && collapseBtn) {
      panelToggle.addEventListener('click', () => {
        if (sidePanel.classList.contains('collapsed')) {
          sidePanel.classList.remove('collapsed');
          sidePanel.classList.add('open');
          collapseBtn.classList.remove('rotated');
          panelToggle.classList.add('hidden');
        } else {
          sidePanel.classList.add('collapsed');
          sidePanel.classList.remove('open');
          collapseBtn.classList.add('rotated');
          panelToggle.classList.remove('hidden');
        }
      });
    }

    this.handleResponsive();
    window.addEventListener('resize', () => this.handleResponsive());
  }

  private handleResponsive(): void {
    const sidePanel = document.getElementById('side-panel');
    const panelToggle = document.getElementById('panel-toggle');
    const toolbar = document.getElementById('toolbar');
    const collapseBtn = document.getElementById('panel-collapse');

    if (!sidePanel || !panelToggle || !toolbar || !collapseBtn) return;

    if (window.innerWidth <= 1200) {
      if (!sidePanel.classList.contains('open')) {
        sidePanel.classList.add('collapsed');
      }
      panelToggle.classList.remove('hidden');
      toolbar.style.left = '16px';
    } else {
      if (!sidePanel.classList.contains('collapsed')) {
        panelToggle.classList.add('hidden');
      }
      toolbar.style.left = sidePanel.classList.contains('collapsed') ? '16px' : '276px';
    }
  }

  public setMolecule(molecule: MoleculeData): void {
    this.currentMolecule = molecule;
    this.selectedAtomId = null;
    this.selectedBondId = null;
    this.renderTree();
    this.renderEmptyDetail();
  }

  public getSelectedMoleculeId(): string | null {
    return this.moleculeSelect.value || null;
  }

  private renderEmpty(): void {
    this.treeContainer.innerHTML = '<div class="detail-empty">请选择分子</div>';
  }

  private renderEmptyDetail(): void {
    this.detailContainer.innerHTML = '点击原子或化学键查看详情';
    this.detailContainer.classList.add('detail-empty');
  }

  private renderTree(): void {
    if (!this.currentMolecule) {
      this.renderEmpty();
      return;
    }

    this.detailContainer.classList.remove('detail-empty');

    const mol = this.currentMolecule;
    let html = '';

    html += `<div class="tree-group">
      <div class="tree-group-header" data-group="atoms">
        <span class="tree-toggle ${this.atomsExpanded ? 'expanded' : ''}">▶</span>
        <span>原子 (${mol.atoms.length})</span>
      </div>
      <div class="tree-group-children ${this.atomsExpanded ? 'expanded' : ''}">`;

    mol.atoms.forEach(atom => {
      const color = this.getElementColorHex(atom.element);
      html += `<div class="tree-item atom-item ${this.selectedAtomId === atom.id ? 'selected' : ''}" data-atom="${atom.id}">
        <span class="atom-dot" style="background: ${color}"></span>
        <span>${atom.id} (${atom.element})</span>
      </div>`;
    });

    html += `</div></div>`;

    html += `<div class="tree-group">
      <div class="tree-group-header" data-group="bonds">
        <span class="tree-toggle ${this.bondsExpanded ? 'expanded' : ''}">▶</span>
        <span>化学键 (${mol.bonds.length})</span>
      </div>
      <div class="tree-group-children ${this.bondsExpanded ? 'expanded' : ''}">`;

    mol.bonds.forEach(bond => {
      const typeText = this.getBondTypeText(bond.type);
      html += `<div class="tree-item bond-item ${this.selectedBondId === bond.id ? 'selected' : ''}" data-bond="${bond.id}">
        <span class="bond-icon ${bond.type}"></span>
        <span>${bond.atom1}—${bond.atom2}</span>
        <span style="color: #666; margin-left: auto; font-size: 10px;">${typeText}</span>
      </div>`;
    });

    html += `</div></div>`;

    this.treeContainer.innerHTML = html;

    this.treeContainer.querySelectorAll('.tree-group-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.getAttribute('data-group');
        if (group === 'atoms') {
          this.atomsExpanded = !this.atomsExpanded;
        } else if (group === 'bonds') {
          this.bondsExpanded = !this.bondsExpanded;
        }
        this.renderTree();
      });
    });

    this.treeContainer.querySelectorAll('.atom-item').forEach(item => {
      item.addEventListener('click', () => {
        const atomId = item.getAttribute('data-atom');
        if (atomId) {
          this.selectAtom(atomId);
          this.callbacks.onAtomSelect?.(atomId);
        }
      });
    });

    this.treeContainer.querySelectorAll('.bond-item').forEach(item => {
      item.addEventListener('click', () => {
        const bondId = item.getAttribute('data-bond');
        if (bondId) {
          this.selectBond(bondId);
          this.callbacks.onBondSelect?.(bondId);
        }
      });
    });
  }

  private getElementColorHex(element: string): string {
    const color = CPK_COLORS[element] || CPK_COLORS.default;
    return '#' + color.toString(16).padStart(6, '0');
  }

  private getBondTypeText(type: string): string {
    switch (type) {
      case 'single': return '单键';
      case 'double': return '双键';
      case 'aromatic': return '苯环键';
      default: return type;
    }
  }

  public selectAtom(atomId: string): void {
    if (!this.currentMolecule) return;

    this.selectedAtomId = atomId;
    this.selectedBondId = null;
    this.renderTree();
    this.renderAtomDetail(atomId);
  }

  public selectBond(bondId: string): void {
    if (!this.currentMolecule) return;

    this.selectedBondId = bondId;
    this.selectedAtomId = null;
    this.renderTree();
    this.renderBondDetail(bondId);
  }

  public clearSelection(): void {
    this.selectedAtomId = null;
    this.selectedBondId = null;
    this.renderTree();
    this.renderEmptyDetail();
  }

  private renderAtomDetail(atomId: string): void {
    if (!this.currentMolecule) return;

    const atom = this.moleculeStore.getAtomById(this.currentMolecule, atomId);
    if (!atom) return;

    const neighbors = this.moleculeStore.getNeighborAtoms(this.currentMolecule, atomId);

    let html = '';
    html += `<div class="detail-row"><span class="detail-label">原子名称</span><span class="detail-value">${atom.id}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">元素符号</span><span class="detail-value">${atom.element}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">坐标 X</span><span class="detail-value">${atom.x.toFixed(3)}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">坐标 Y</span><span class="detail-value">${atom.y.toFixed(3)}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">坐标 Z</span><span class="detail-value">${atom.z.toFixed(3)}</span></div>`;

    if (neighbors.length > 0) {
      html += `<div class="detail-section"><div class="detail-section-title">相邻原子</div>`;
      neighbors.forEach(n => {
        html += `<div class="neighbor-item">
          <span class="atom-dot" style="background: ${this.getElementColorHex(n.atom.element)}; width: 8px; height: 8px;"></span>
          <span>${n.atom.id} (${n.atom.element})</span>
          <span style="margin-left: auto; color: #888;">${n.distance.toFixed(3)} Å</span>
        </div>`;
      });
      html += `</div>`;
    }

    this.detailContainer.innerHTML = html;
    this.detailContainer.classList.remove('detail-empty');
  }

  private renderBondDetail(bondId: string): void {
    if (!this.currentMolecule) return;

    const bond = this.moleculeStore.getBondById(this.currentMolecule, bondId);
    if (!bond) return;

    const atom1 = this.moleculeStore.getAtomById(this.currentMolecule, bond.atom1);
    const atom2 = this.moleculeStore.getAtomById(this.currentMolecule, bond.atom2);
    const length = this.moleculeStore.calculateBondLength(this.currentMolecule, bond);

    const typeText = this.getBondTypeText(bond.type);

    let html = '';
    html += `<div class="detail-row"><span class="detail-label">化学键</span><span class="detail-value">${bond.atom1}—${bond.atom2}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">键类型</span><span class="detail-value">${typeText}</span></div>`;
    html += `<div class="detail-row"><span class="detail-label">键长</span><span class="detail-value">${length.toFixed(3)} Å</span></div>`;

    if (atom1 && atom2) {
      html += `<div class="detail-section"><div class="detail-section-title">参与原子</div>`;
      html += `<div class="neighbor-item">
        <span class="atom-dot" style="background: ${this.getElementColorHex(atom1.element)}; width: 8px; height: 8px;"></span>
        <span>${atom1.id} (${atom1.element})</span>
      </div>`;
      html += `<div class="neighbor-item">
        <span class="atom-dot" style="background: ${this.getElementColorHex(atom2.element)}; width: 8px; height: 8px;"></span>
        <span>${atom2.id} (${atom2.element})</span>
      </div>`;
      html += `</div>`;
    }

    this.detailContainer.innerHTML = html;
    this.detailContainer.classList.remove('detail-empty');
  }

  public getSelectElement(): HTMLSelectElement {
    return this.moleculeSelect;
  }
}
