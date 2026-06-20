import type { MaterialCategory } from '../types';
import { ELEMENT_COLORS } from '../types';
import { useMaterialStore } from '../stores/useMaterialStore';
import { SceneManager } from '../scene/SceneManager';

export class Sidebar {
  private container: HTMLElement;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.container = document.getElementById('sidebar') as HTMLElement;
    this.sceneManager = sceneManager;
    this.render();
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    useMaterialStore.subscribe(
      (state) => state.currentMaterial,
      () => this.updateActiveItem()
    );
  }

  private render(): void {
    const state = useMaterialStore.getState();
    const { materials, currentMaterial, visualParams } = state;

    const materialsByCategory = this.groupByCategory(
      Object.values(materials)
    );

    this.container.innerHTML = `
      <div class="sidebar-scroll">
        <div class="sidebar-section">
          <div class="sidebar-title">材料选择</div>
          <div class="material-menu" id="material-menu">
            ${Object.entries(materialsByCategory)
              .map(
                ([cat, mats]) => `
              <div class="material-category">${cat}</div>
              ${mats
                .map(
                  (m) => `
                <div class="material-item ${m.id === currentMaterial ? 'active' : ''}" data-id="${m.id}">
                  <div class="material-dot" style="background: ${this.getCategoryColor(m.id)};"></div>
                  <span>${m.displayName}</span>
                </div>
              `
                )
                .join('')}
            `
              )
              .join('')}
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">可视化参数</div>
          
          <div class="param-row">
            <div class="param-label">
              <span>原子大小</span>
              <span class="param-value" id="atom-scale-val">${visualParams.atomScale.toFixed(1)}x</span>
            </div>
            <input type="range" class="slider" id="atom-scale" 
              min="0.5" max="2.0" step="0.1" value="${visualParams.atomScale}">
          </div>

          <div class="toggle-row">
            <span class="toggle-label">显示化学键</span>
            <div class="toggle ${visualParams.showBonds ? 'active' : ''}" id="toggle-bonds">
              <div class="toggle-knob"></div>
            </div>
          </div>

          <div class="toggle-row">
            <span class="toggle-label">随机生成缺陷</span>
            <div class="toggle ${visualParams.generateDefects ? 'active' : ''}" id="toggle-defects">
              <div class="toggle-knob"></div>
            </div>
          </div>

          <div class="param-row" style="margin-top: 12px;">
            <div class="param-label">
              <span>缺陷密度</span>
              <span class="param-value" id="defect-density-val">${(visualParams.defectDensity * 100).toFixed(0)}%</span>
            </div>
            <input type="range" class="slider" id="defect-density" 
              min="0" max="0.3" step="0.01" value="${visualParams.defectDensity}"
              ${visualParams.generateDefects ? '' : 'disabled style="opacity:0.4;"'}>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">元素图例</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${Object.entries(ELEMENT_COLORS)
              .map(
                ([el, color]) => `
              <div style="display:flex; align-items:center; gap:10px; font-size:12px; color:rgba(255,255,255,0.7);">
                <div style="width:12px; height:12px; border-radius:50%; background:${color}; box-shadow:0 0 6px ${color}66;"></div>
                <span>${el}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private getCategoryColor(id: MaterialCategory): string {
    switch (id) {
      case 'nanotube':
        return '#58A6FF';
      case 'graphene':
        return '#3FB950';
      case 'quantumdot':
        return '#F78166';
      default:
        return '#8B949E';
    }
  }

  private groupByCategory(materials: Array<{ id: MaterialCategory; category: string }>) {
    const groups: Record<string, typeof materials> = {};
    materials.forEach((m) => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }

  private bindEvents(): void {
    const menu = document.getElementById('material-menu');
    if (menu) {
      menu.querySelectorAll('.material-item').forEach((item) => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id') as MaterialCategory;
          this.switchMaterial(id);
        });
      });
    }

    const atomScale = document.getElementById('atom-scale') as HTMLInputElement;
    const atomScaleVal = document.getElementById('atom-scale-val');
    if (atomScale && atomScaleVal) {
      atomScale.addEventListener('input', () => {
        const val = parseFloat(atomScale.value);
        atomScaleVal.textContent = val.toFixed(1) + 'x';
        useMaterialStore.getState().setVisualParams({ atomScale: val });
      });
    }

    const toggleBonds = document.getElementById('toggle-bonds');
    if (toggleBonds) {
      toggleBonds.addEventListener('click', () => {
        const active = !toggleBonds.classList.contains('active');
        toggleBonds.classList.toggle('active', active);
        useMaterialStore.getState().setVisualParams({ showBonds: active });
      });
    }

    const toggleDefects = document.getElementById('toggle-defects');
    const defectDensity = document.getElementById('defect-density') as HTMLInputElement;
    if (toggleDefects) {
      toggleDefects.addEventListener('click', () => {
        const active = !toggleDefects.classList.contains('active');
        toggleDefects.classList.toggle('active', active);
        if (defectDensity) {
          defectDensity.disabled = !active;
          defectDensity.style.opacity = active ? '1' : '0.4';
        }
        useMaterialStore.getState().setVisualParams({ generateDefects: active });
      });
    }

    if (defectDensity) {
      const defectDensityVal = document.getElementById('defect-density-val');
      defectDensity.addEventListener('input', () => {
        const val = parseFloat(defectDensity.value);
        if (defectDensityVal) {
          defectDensityVal.textContent = (val * 100).toFixed(0) + '%';
        }
        useMaterialStore.getState().setVisualParams({ defectDensity: val });
      });
    }
  }

  private switchMaterial(id: MaterialCategory): void {
    const overlay = document.getElementById('fade-overlay');
    if (!overlay) {
      useMaterialStore.getState().setCurrentMaterial(id);
      return;
    }

    overlay.classList.add('active');
    setTimeout(() => {
      useMaterialStore.getState().setCurrentMaterial(id);
      setTimeout(() => {
        overlay.classList.remove('active');
      }, 200);
    }, 300);
  }

  private updateActiveItem(): void {
    const state = useMaterialStore.getState();
    const menu = document.getElementById('material-menu');
    if (!menu) return;

    menu.querySelectorAll('.material-item').forEach((item) => {
      const id = item.getAttribute('data-id');
      item.classList.toggle('active', id === state.currentMaterial);
    });
  }
}
