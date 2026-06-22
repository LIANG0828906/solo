import type { AtomData, BondData } from './MoleculeData'
import { calculateBondLength, calculateBondAngle, getAspirinMolecule, getCaffeineMolecule } from './MoleculeData'
import { useMoleculeStore, type MoleculeStore } from './store'
import type { MoleculeScene } from './MoleculeScene'

const ELEMENT_COLORS: Record<string, string> = {
  H: '#ffffff',
  C: '#909090',
  N: '#3050f8',
  O: '#ff0d0d',
  F: '#90e050',
  Cl: '#1ff01f',
  Br: '#a62929',
  I: '#940094',
  S: '#ffff30',
  P: '#ff8000',
  B: '#ffb5b5',
  Li: '#cc80ff',
  Na: '#ab5cf2',
  K: '#8f40d4',
  Ca: '#3dff00',
  Fe: '#e06633',
  Zn: '#7d80b0',
  Cu: '#c88033',
  Mg: '#8aff00',
  Mn: '#9c7ac7',
  Al: '#bfa6a6',
  Si: '#f0c8a0',
}

const BOND_TYPE_NAMES: Record<number, string> = {
  1: '单键',
  2: '双键',
  3: '三键',
  4: '芳香键',
}

class UIPanel {
  root: HTMLElement
  store: typeof useMoleculeStore
  scene: MoleculeScene
  leftPanel: HTMLElement | null = null
  rightPanel: HTMLElement | null = null
  atomListEl: HTMLElement | null = null
  bondInfoEl: HTMLElement | null = null
  importModal: HTMLElement | null = null
  toastEl: HTMLElement | null = null
  unsubscribe: (() => void) | null = null

  private searchKeyword: string = ''
  private bondEditToggleBtn: HTMLElement | null = null
  private isLeftCollapsed: boolean = false
  private isRightCollapsed: boolean = false

  constructor(root: HTMLElement, store: typeof useMoleculeStore, scene: MoleculeScene) {
    this.root = root
    this.store = store
    this.scene = scene
  }

  build(): void {
    this._injectStyles()
    this._createTopToolbar()
    this._createLeftPanel()
    this._createRightPanel()
    this._createImportModal()
    this._createToastContainer()
    this.bindEvents()
  }

  private _injectStyles(): void {
    const style = document.createElement('style')
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .glass-panel {
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }

      .ui-left-panel {
        position: fixed;
        top: 80px;
        left: 20px;
        width: 280px;
        max-height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
        z-index: 100;
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .ui-left-panel.panel-collapsed {
        transform: translateX(calc(-100% + 36px));
      }

      .ui-right-panel {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 300px;
        max-height: calc(100vh - 120px);
        display: flex;
        flex-direction: column;
        z-index: 100;
        transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .ui-right-panel.panel-collapsed {
        transform: translateX(calc(100% - 36px));
      }

      .panel-header {
        display: flex;
        align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        gap: 10px;
      }

      .panel-toggle-btn {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .panel-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .panel-title {
        font-size: 15px;
        font-weight: 600;
        flex: 1;
        letter-spacing: 0.5px;
      }

      .panel-body {
        padding: 14px 16px;
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .search-input {
        width: 100%;
        padding: 9px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.2);
        color: #fff;
        font-size: 13px;
        outline: none;
        transition: all 0.2s;
      }

      .search-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      .search-input:focus {
        border-color: rgba(100, 150, 255, 0.5);
        background: rgba(0, 0, 0, 0.3);
      }

      .atom-list-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-right: 4px;
        margin: 0 -4px;
      }

      .atom-list-container::-webkit-scrollbar {
        width: 6px;
      }

      .atom-list-container::-webkit-scrollbar-track {
        background: transparent;
      }

      .atom-list-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
      }

      .atom-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;
      }

      .atom-row:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .atom-row.selected {
        background: rgba(255, 215, 0, 0.1);
        border-color: rgba(255, 215, 0, 0.5);
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
      }

      .atom-row.first-selected {
        background: rgba(100, 150, 255, 0.12);
        border-color: rgba(100, 150, 255, 0.6);
        box-shadow: 0 0 12px rgba(100, 150, 255, 0.25);
      }

      .atom-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 26px;
        height: 26px;
        padding: 0 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        font-size: 11px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.75);
        flex-shrink: 0;
      }

      .atom-element-circle {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: #000;
        flex-shrink: 0;
        box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.3);
      }

      .coords {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .coord-item {
        font-size: 11px;
        font-family: 'SF Mono', Consolas, monospace;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .coord-label {
        width: 10px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .coord-x { color: #ff6b6b; }
      .coord-y { color: #51cf66; }
      .coord-z { color: #339af0; }

      .panel-footer {
        padding: 12px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        gap: 8px;
      }

      .btn {
        flex: 1;
        padding: 8px 16px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
        color: #fff;
        background: linear-gradient(135deg, rgba(100, 150, 255, 0.4), rgba(100, 150, 255, 0.2));
        border: 1px solid rgba(100, 150, 255, 0.3);
      }

      .btn:hover {
        background: linear-gradient(135deg, rgba(100, 150, 255, 0.55), rgba(100, 150, 255, 0.3));
        border-color: rgba(100, 150, 255, 0.5);
        transform: translateY(-1px);
      }

      .btn:active {
        transform: translateY(0);
      }

      .btn-danger {
        background: linear-gradient(135deg, rgba(255, 80, 80, 0.5), rgba(255, 80, 80, 0.25));
        border-color: rgba(255, 80, 80, 0.4);
      }

      .btn-danger:hover {
        background: linear-gradient(135deg, rgba(255, 80, 80, 0.65), rgba(255, 80, 80, 0.35));
        border-color: rgba(255, 80, 80, 0.6);
      }

      .toggle-btn {
        padding: 10px 16px;
        border-radius: 10px;
        border: 2px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.2);
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.25s;
        width: 100%;
      }

      .toggle-btn:hover {
        border-color: rgba(255, 255, 255, 0.25);
        color: rgba(255, 255, 255, 0.9);
      }

      .toggle-btn.active {
        border-color: rgba(80, 140, 255, 0.8);
        background: rgba(80, 140, 255, 0.15);
        color: #fff;
        box-shadow: 0 0 16px rgba(80, 140, 255, 0.35);
      }

      .bond-legend {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
      }

      .bond-legend-title {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }

      .bond-legend-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
      }

      .bond-preview {
        display: flex;
        flex-direction: column;
        gap: 3px;
        width: 40px;
        align-items: center;
      }

      .bond-line {
        height: 2px;
        width: 32px;
        border-radius: 1px;
      }

      .bond-line.single { background: #888; }
      .bond-line.double { background: #9775fa; }
      .bond-line.triple { background: #ff922b; }
      .bond-line.aromatic {
        background: transparent;
        border-top: 2px dashed #20c997;
      }

      .bond-info-section {
        padding: 14px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .section-title {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .bond-type-display {
        font-size: 20px;
        font-weight: 700;
        text-align: center;
        padding: 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
      }

      .measurement-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
      }

      .measurement-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
      }

      .measurement-value {
        font-size: 18px;
        font-weight: 700;
        font-family: 'SF Mono', Consolas, monospace;
      }

      .measurement-value.bond-length { color: #4dabf7; }
      .measurement-value.bond-angle { color: #69db7c; }

      .angle-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
        max-height: 160px;
        overflow-y: auto;
        padding-right: 4px;
      }

      .angle-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 7px 10px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 6px;
        font-size: 12px;
      }

      .angle-atoms {
        font-family: 'SF Mono', Consolas, monospace;
        color: rgba(255, 255, 255, 0.85);
      }

      .empty-hint {
        padding: 16px;
        text-align: center;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        line-height: 1.6;
      }

      .top-toolbar {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 200;
        display: flex;
        gap: 10px;
        padding: 10px 16px;
      }

      .top-toolbar .btn {
        flex: none;
        min-width: auto;
        padding: 10px 18px;
        font-size: 13px;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        z-index: 1000;
        display: none;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
      }

      .modal-overlay.open {
        display: flex;
      }

      .modal-content {
        width: 90%;
        max-width: 560px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 22px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .modal-title {
        font-size: 17px;
        font-weight: 600;
      }

      .modal-close-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .modal-close-btn:hover {
        background: rgba(255, 80, 80, 0.2);
        border-color: rgba(255, 80, 80, 0.4);
      }

      .modal-body {
        padding: 20px 22px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        flex: 1;
        overflow-y: auto;
      }

      .modal-textarea {
        width: 100%;
        min-height: 240px;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.3);
        color: #fff;
        font-size: 12px;
        font-family: 'SF Mono', Consolas, monospace;
        line-height: 1.5;
        outline: none;
        resize: vertical;
        transition: all 0.2s;
      }

      .modal-textarea::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }

      .modal-textarea:focus {
        border-color: rgba(100, 150, 255, 0.5);
      }

      .modal-footer {
        padding: 16px 22px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .modal-footer .btn {
        flex: none;
        min-width: 100px;
      }

      .toast-container {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 3000;
        display: none;
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }

      .toast-container.show {
        display: flex;
      }

      .toast {
        padding: 12px 24px;
        border-radius: 10px;
        background: rgba(20, 20, 20, 0.95);
        color: #fff;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .toast.error {
        background: rgba(180, 40, 40, 0.95);
        border-color: rgba(255, 100, 100, 0.3);
      }

      @keyframes toastIn {
        from {
          opacity: 0;
          transform: translateY(16px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (max-width: 1279px) {
        .ui-left-panel {
          transform: translateX(calc(-100% + 36px));
        }

        .ui-left-panel:not(.panel-collapsed) {
          transform: translateX(0);
        }

        .ui-right-panel {
          width: 260px;
          font-size: 0.92em;
        }

        .panel-title {
          font-size: 13px;
        }

        .measurement-value {
          font-size: 16px;
        }

        .bond-type-display {
          font-size: 17px;
        }
      }
    `
    document.head.appendChild(style)
  }

  private _createTopToolbar(): void {
    const toolbar = document.createElement('div')
    toolbar.className = 'glass-panel top-toolbar'

    const importBtn = document.createElement('button')
    importBtn.className = 'btn'
    importBtn.textContent = '📁 导入'
    importBtn.onclick = () => this._openImportModal()

    const exportBtn = document.createElement('button')
    exportBtn.className = 'btn'
    exportBtn.textContent = '💾 导出MOL'
    exportBtn.onclick = () => this._handleExport()

    const resetBtn = document.createElement('button')
    resetBtn.className = 'btn'
    resetBtn.textContent = '↻ 重置视图'
    resetBtn.onclick = () => {
      const scene = this.scene as unknown as { controls?: { reset: () => void } }
      if (scene.controls && typeof scene.controls.reset === 'function') {
        scene.controls.reset()
      }
    }

    toolbar.appendChild(importBtn)
    toolbar.appendChild(exportBtn)
    toolbar.appendChild(resetBtn)
    this.root.appendChild(toolbar)
  }

  private _createLeftPanel(): void {
    this.leftPanel = document.createElement('div')
    this.leftPanel.className = 'glass-panel ui-left-panel'

    const header = document.createElement('div')
    header.className = 'panel-header'

    const toggleBtn = document.createElement('button')
    toggleBtn.className = 'panel-toggle-btn'
    toggleBtn.textContent = '<'
    toggleBtn.onclick = () => this._toggleLeftPanel()

    const title = document.createElement('span')
    title.className = 'panel-title'
    title.textContent = '原子列表'

    header.appendChild(toggleBtn)
    header.appendChild(title)

    const body = document.createElement('div')
    body.className = 'panel-body'

    const searchInput = document.createElement('input')
    searchInput.className = 'search-input'
    searchInput.type = 'text'
    searchInput.placeholder = '搜索元素或编号...'
    searchInput.oninput = (e) => {
      this.searchKeyword = (e.target as HTMLInputElement).value.trim().toLowerCase()
      this._updateAtomList()
    }

    this.atomListEl = document.createElement('div')
    this.atomListEl.className = 'atom-list-container'

    body.appendChild(searchInput)
    body.appendChild(this.atomListEl)

    const footer = document.createElement('div')
    footer.className = 'panel-footer'

    const caffeineBtn = document.createElement('button')
    caffeineBtn.className = 'btn'
    caffeineBtn.textContent = '☕ 咖啡因'
    caffeineBtn.onclick = () => {
      this.store.getState().setMolecule(getCaffeineMolecule())
    }

    const aspirinBtn = document.createElement('button')
    aspirinBtn.className = 'btn'
    aspirinBtn.textContent = '💊 阿司匹林'
    aspirinBtn.onclick = () => {
      this.store.getState().setMolecule(getAspirinMolecule())
    }

    footer.appendChild(caffeineBtn)
    footer.appendChild(aspirinBtn)

    this.leftPanel.appendChild(header)
    this.leftPanel.appendChild(body)
    this.leftPanel.appendChild(footer)

    this.root.appendChild(this.leftPanel)
  }

  private _createRightPanel(): void {
    this.rightPanel = document.createElement('div')
    this.rightPanel.className = 'glass-panel ui-right-panel'

    const header = document.createElement('div')
    header.className = 'panel-header'

    const title = document.createElement('span')
    title.className = 'panel-title'
    title.textContent = '键编辑器'

    const toggleBtn = document.createElement('button')
    toggleBtn.className = 'panel-toggle-btn'
    toggleBtn.textContent = '>'
    toggleBtn.onclick = () => this._toggleRightPanel()

    header.appendChild(title)
    header.appendChild(toggleBtn)

    const body = document.createElement('div')
    body.className = 'panel-body'

    this.bondEditToggleBtn = document.createElement('button')
    this.bondEditToggleBtn.className = 'toggle-btn'
    this.bondEditToggleBtn.textContent = '🔗 键编辑模式: OFF'
    this.bondEditToggleBtn.onclick = () => {
      this.store.getState().toggleBondEditMode()
    }

    const legend = document.createElement('div')
    legend.className = 'bond-legend'

    const legendTitle = document.createElement('div')
    legendTitle.className = 'bond-legend-title'
    legendTitle.textContent = '键类型图例'

    const createLegendItem = (lines: string[], name: string): HTMLElement => {
      const item = document.createElement('div')
      item.className = 'bond-legend-item'

      const preview = document.createElement('div')
      preview.className = 'bond-preview'
      lines.forEach((cls) => {
        const line = document.createElement('div')
        line.className = `bond-line ${cls}`
        preview.appendChild(line)
      })

      const label = document.createElement('span')
      label.textContent = name

      item.appendChild(preview)
      item.appendChild(label)
      return item
    }

    legend.appendChild(legendTitle)
    legend.appendChild(createLegendItem(['single'], '单键'))
    legend.appendChild(createLegendItem(['double', 'double'], '双键'))
    legend.appendChild(createLegendItem(['triple', 'triple', 'triple'], '三键'))
    legend.appendChild(createLegendItem(['aromatic'], '芳香键'))

    const infoSection = document.createElement('div')
    infoSection.className = 'bond-info-section'

    const infoTitle = document.createElement('div')
    infoTitle.className = 'section-title'
    infoTitle.textContent = '当前键信息'

    this.bondInfoEl = document.createElement('div')
    this.bondInfoEl.style.display = 'flex'
    this.bondInfoEl.style.flexDirection = 'column'
    this.bondInfoEl.style.gap = '8px'

    infoSection.appendChild(infoTitle)
    infoSection.appendChild(this.bondInfoEl)

    body.appendChild(this.bondEditToggleBtn)
    body.appendChild(legend)
    body.appendChild(infoSection)

    this.rightPanel.appendChild(header)
    this.rightPanel.appendChild(body)

    this.root.appendChild(this.rightPanel)
  }

  private _createImportModal(): void {
    this.importModal = document.createElement('div')
    this.importModal.className = 'modal-overlay'
    this.importModal.onclick = (e) => {
      if (e.target === this.importModal) {
        this._closeImportModal()
      }
    }

    const content = document.createElement('div')
    content.className = 'glass-panel modal-content'

    const header = document.createElement('div')
    header.className = 'modal-header'

    const title = document.createElement('span')
    title.className = 'modal-title'
    title.textContent = '📁 导入分子文件'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close-btn'
    closeBtn.textContent = '✕'
    closeBtn.onclick = () => this._closeImportModal()

    header.appendChild(title)
    header.appendChild(closeBtn)

    const body = document.createElement('div')
    body.className = 'modal-body'

    const textarea = document.createElement('textarea')
    textarea.className = 'modal-textarea'
    textarea.placeholder = '在此粘贴 MOL 或 SDF 格式文件内容...'
    textarea.id = 'import-textarea'

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.mol,.sdf'
    fileInput.style.display = 'none'
    fileInput.id = 'import-file-input'
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const content = ev.target?.result as string
          textarea.value = content
        }
        reader.readAsText(file)
      }
    }

    const uploadBtn = document.createElement('button')
    uploadBtn.className = 'btn'
    uploadBtn.textContent = '📎 上传文件'
    uploadBtn.onclick = () => fileInput.click()

    body.appendChild(textarea)
    body.appendChild(fileInput)
    body.appendChild(uploadBtn)

    const footer = document.createElement('div')
    footer.className = 'modal-footer'

    const parseBtn = document.createElement('button')
    parseBtn.className = 'btn'
    parseBtn.textContent = '✓ 解析导入'
    parseBtn.onclick = () => {
      const text = textarea.value
      if (!text.trim()) {
        this.showToast('请输入内容或上传文件', true)
        return
      }
      try {
        const success = this.store.getState().importMOL(text)
        if (success) {
          this.showToast('导入成功')
          this._closeImportModal()
          textarea.value = ''
        } else {
          this.showToast('导入失败：格式无效', true)
        }
      } catch (err) {
        this.showToast(`导入错误：${(err as Error).message}`, true)
      }
    }

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'btn'
    cancelBtn.textContent = '✕ 关闭'
    cancelBtn.onclick = () => this._closeImportModal()

    footer.appendChild(cancelBtn)
    footer.appendChild(parseBtn)

    content.appendChild(header)
    content.appendChild(body)
    content.appendChild(footer)

    this.importModal.appendChild(content)
    this.root.appendChild(this.importModal)
  }

  private _createToastContainer(): void {
    this.toastEl = document.createElement('div')
    this.toastEl.className = 'toast-container'
    this.root.appendChild(this.toastEl)
  }

  private _toggleLeftPanel(): void {
    if (!this.leftPanel) return
    this.isLeftCollapsed = !this.isLeftCollapsed
    this.leftPanel.classList.toggle('panel-collapsed', this.isLeftCollapsed)
    const btn = this.leftPanel.querySelector('.panel-toggle-btn')
    if (btn) {
      btn.textContent = this.isLeftCollapsed ? '>' : '<'
    }
  }

  private _toggleRightPanel(): void {
    if (!this.rightPanel) return
    this.isRightCollapsed = !this.isRightCollapsed
    this.rightPanel.classList.toggle('panel-collapsed', this.isRightCollapsed)
    const btn = this.rightPanel.querySelector('.panel-toggle-btn')
    if (btn) {
      btn.textContent = this.isRightCollapsed ? '<' : '>'
    }
  }

  private _openImportModal(): void {
    if (this.importModal) {
      this.importModal.classList.add('open')
    }
  }

  private _closeImportModal(): void {
    if (this.importModal) {
      this.importModal.classList.remove('open')
    }
  }

  private _handleExport(): void {
    const state = this.store.getState()
    const molText = state.exportMOL()
    const name = state.molecule.name || 'molecule'
    const blob = new Blob([molText], { type: 'chemical/x-mdl-molfile' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.mol`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    this.showToast('导出成功')
  }

  bindEvents(): void {
    this.unsubscribe = this.store.subscribe(() => {
      this._updateAtomList()
      this._updateBondInfo()
      this._updateBondEditModeUI()
    })

    this._updateAtomList()
    this._updateBondInfo()
    this._updateBondEditModeUI()
  }

  _updateAtomList(): void {
    if (!this.atomListEl) return

    const state = this.store.getState()
    const atoms = state.molecule.atoms
    const { selectedAtomId, firstBondAtomId } = state

    this.atomListEl.innerHTML = ''

    const filtered = atoms.filter((atom) => {
      if (!this.searchKeyword) return true
      const kw = this.searchKeyword
      return (
        atom.element.toLowerCase().includes(kw) ||
        atom.index.toString().includes(kw)
      )
    })

    if (filtered.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty-hint'
      empty.textContent = '未找到匹配的原子'
      this.atomListEl.appendChild(empty)
      return
    }

    filtered.forEach((atom) => {
      const selected = atom.id === selectedAtomId
      const firstBond = atom.id === firstBondAtomId
      const row = this._createAtomRow(atom, selected, firstBond)
      row.onclick = () => {
        state.selectAtom(atom.id)
      }
      this.atomListEl!.appendChild(row)
    })
  }

  _createAtomRow(atom: AtomData, selected: boolean, firstBond: boolean): HTMLElement {
    const row = document.createElement('div')
    row.className = 'atom-row'
    if (firstBond) {
      row.classList.add('first-selected')
    } else if (selected) {
      row.classList.add('selected')
    }

    const indexBadge = document.createElement('span')
    indexBadge.className = 'atom-index'
    indexBadge.textContent = atom.index.toString()

    const elementCircle = document.createElement('span')
    elementCircle.className = 'atom-element-circle'
    elementCircle.style.background = ELEMENT_COLORS[atom.element] || '#cccccc'
    elementCircle.textContent = atom.element

    const coords = document.createElement('div')
    coords.className = 'coords'

    const xItem = document.createElement('span')
    xItem.className = 'coord-item coord-x'
    xItem.innerHTML = `<span class="coord-label">X</span>${atom.x.toFixed(2)}`

    const yItem = document.createElement('span')
    yItem.className = 'coord-item coord-y'
    yItem.innerHTML = `<span class="coord-label">Y</span>${atom.y.toFixed(2)}`

    const zItem = document.createElement('span')
    zItem.className = 'coord-item coord-z'
    zItem.innerHTML = `<span class="coord-label">Z</span>${atom.z.toFixed(2)}`

    coords.appendChild(xItem)
    coords.appendChild(yItem)
    coords.appendChild(zItem)

    row.appendChild(indexBadge)
    row.appendChild(elementCircle)
    row.appendChild(coords)

    return row
  }

  _updateBondInfo(): void {
    if (!this.bondInfoEl) return

    const state = this.store.getState()
    const { selectedBondId, selectedAtomId, molecule } = state

    this.bondInfoEl.innerHTML = ''

    if (selectedBondId) {
      const bond = molecule.bonds.find((b) => b.id === selectedBondId)
      if (bond) {
        const atom1 = molecule.atoms.find((a) => a.id === bond.atom1Id)
        const atom2 = molecule.atoms.find((a) => a.id === bond.atom2Id)

        if (atom1 && atom2) {
          const bondTypeDisplay = document.createElement('div')
          bondTypeDisplay.className = 'bond-type-display'
          bondTypeDisplay.textContent = `${BOND_TYPE_NAMES[bond.type] || '未知'}`
          bondTypeDisplay.style.color =
            bond.type === 1 ? '#888' :
            bond.type === 2 ? '#9775fa' :
            bond.type === 3 ? '#ff922b' : '#20c997'

          const bondLength = calculateBondLength(atom1, atom2)

          const lengthRow = document.createElement('div')
          lengthRow.className = 'measurement-row'
          lengthRow.innerHTML = `
            <span class="measurement-label">键长 (${atom1.element}${atom1.index}-${atom2.element}${atom2.index})</span>
            <span class="measurement-value bond-length">${bondLength.toFixed(3)} Å</span>
          `

          this.bondInfoEl.appendChild(bondTypeDisplay)
          this.bondInfoEl.appendChild(lengthRow)

          const deleteBtn = document.createElement('button')
          deleteBtn.className = 'btn btn-danger'
          deleteBtn.textContent = '🗑 删除键'
          deleteBtn.style.marginTop = '8px'
          deleteBtn.onclick = () => {
            state.removeBond(bond.id)
            this.showToast('键已删除')
          }
          this.bondInfoEl.appendChild(deleteBtn)

          return
        }
      }
    }

    if (selectedAtomId) {
      const centerAtom = molecule.atoms.find((a) => a.id === selectedAtomId)
      if (centerAtom) {
        const adjacentIds: string[] = []
        molecule.bonds.forEach((b) => {
          if (b.atom1Id === selectedAtomId) adjacentIds.push(b.atom2Id)
          else if (b.atom2Id === selectedAtomId) adjacentIds.push(b.atom1Id)
        })

        if (adjacentIds.length >= 2) {
          const title = document.createElement('div')
          title.style.cssText = 'font-size:14px;font-weight:600;color:#fff;padding:4px 0;'
          title.textContent = `${centerAtom.element}${centerAtom.index} 的键角`

          const angleList = document.createElement('div')
          angleList.className = 'angle-list'

          for (let i = 0; i < adjacentIds.length; i++) {
            for (let j = i + 1; j < adjacentIds.length; j++) {
              const a1 = molecule.atoms.find((a) => a.id === adjacentIds[i])
              const a2 = molecule.atoms.find((a) => a.id === adjacentIds[j])
              if (a1 && a2) {
                const angle = calculateBondAngle(centerAtom, a1, a2)
                const item = document.createElement('div')
                item.className = 'angle-item'
                item.innerHTML = `
                  <span class="angle-atoms">${a1.element}${a1.index}-${centerAtom.element}${centerAtom.index}-${a2.element}${a2.index}</span>
                  <span class="measurement-value bond-angle">${angle.toFixed(1)}°</span>
                `
                angleList.appendChild(item)
              }
            }
          }

          this.bondInfoEl.appendChild(title)
          this.bondInfoEl.appendChild(angleList)
          return
        }

        const hint = document.createElement('div')
        hint.className = 'empty-hint'
        hint.textContent = `已选中 ${centerAtom.element}${centerAtom.index}\n相邻原子数量不足（需≥2）以计算键角`
        this.bondInfoEl.appendChild(hint)
        return
      }
    }

    const emptyHint = document.createElement('div')
    emptyHint.className = 'empty-hint'
    emptyHint.innerHTML = `
      <div style="margin-bottom:8px;">🔍 请选择原子或键</div>
      <div style="font-size:11px;opacity:0.7;">选择键查看键长<br>选择原子查看相邻键角</div>
    `
    this.bondInfoEl.appendChild(emptyHint)
  }

  _updateBondEditModeUI(): void {
    if (!this.bondEditToggleBtn) return
    const state = this.store.getState()
    const active = state.bondEditMode
    this.bondEditToggleBtn.classList.toggle('active', active)
    this.bondEditToggleBtn.textContent = active ? '🔗 键编辑模式: ON' : '🔗 键编辑模式: OFF'
  }

  showToast(msg: string, isError: boolean = false): void {
    if (!this.toastEl) return

    this.toastEl.classList.add('show')

    const toast = document.createElement('div')
    toast.className = 'toast' + (isError ? ' error' : '')
    toast.textContent = msg

    this.toastEl.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(8px)'
      toast.style.transition = 'all 0.25s'
      setTimeout(() => {
        toast.remove()
        if (this.toastEl && this.toastEl.children.length === 0) {
          this.toastEl.classList.remove('show')
        }
      }, 250)
    }, 3000)
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }

    if (this.leftPanel) {
      this.leftPanel.remove()
      this.leftPanel = null
    }
    if (this.rightPanel) {
      this.rightPanel.remove()
      this.rightPanel = null
    }
    if (this.importModal) {
      this.importModal.remove()
      this.importModal = null
    }
    if (this.toastEl) {
      this.toastEl.remove()
      this.toastEl = null
    }

    this.atomListEl = null
    this.bondInfoEl = null
    this.bondEditToggleBtn = null
  }
}

export default UIPanel
