import { getFloorplan, getAllFloorplans, validateFloorplan, FloorplanData } from './floorplan';
import { getAllStyles, StylePreset, hexToHSL } from './styleLibrary';
import { saveScheme, loadScheme, deleteScheme, listSchemes, SchemeData, RoomStyleState } from './store';
import { createRenderState, RenderState, renderExportFrame } from './renderer';
import { InteractionManager } from './interaction';

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floorplan: FloorplanData;
  private stylePresets: Map<string, StylePreset>;
  private renderState: RenderState;
  private interaction: InteractionManager | null = null;
  private drawerOpen: boolean = false;

  constructor() {
    const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas not found');
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx;

    this.floorplan = getFloorplan('default');
    this.stylePresets = new Map();
    this.renderState = createRenderState();

    this.initStyles();
    this.initCanvas();
    this.initDefaultRoomStyles();
    this.verifyFloorplanData();
    this.initUI();
    this.initInteraction();
    this.refreshSchemeGrid();
  }

  private initStyles(): void {
    const styles = getAllStyles();
    for (const s of styles) {
      this.stylePresets.set(s.id, s);
    }
  }

  private initCanvas(): void {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
    };
    resize();
    window.addEventListener('resize', resize);
  }

  private initDefaultRoomStyles(): void {
    for (const room of this.floorplan.rooms) {
      this.renderState.roomStyles[room.name] = {
        wallColor: room.defaultWallColor,
        floorColor: room.defaultFloorColor,
        furnitureColor: room.defaultFurnitureColor,
        styleId: 'nordic'
      };
    }
  }

  private verifyFloorplanData(): void {
    const fp = this.floorplan;
    for (const room of fp.rooms) {
      const poly = room.polygon;
      if (poly.length < 3) {
        console.error(`Room "${room.name}" has less than 3 vertices`);
        continue;
      }
      const first = poly[0];
      const last = poly[poly.length - 1];
      if (Math.abs(first.x - last.x) > 0.5 || Math.abs(first.y - last.y) > 0.5) {
        console.error(`Room "${room.name}" polygon is not closed`);
      }
      if (!room.defaultWallColor || !room.defaultFloorColor || !room.defaultFurnitureColor) {
        console.error(`Room "${room.name}" missing default colors`);
      }
    }
    if (!validateFloorplan(fp)) {
      console.error('Floorplan validation failed');
    }
  }

  private initUI(): void {
    this.initFloorplanSelect();
    this.initStylePanel();
    this.initDrawer();
    this.initExportButton();
  }

  private initFloorplanSelect(): void {
    const select = document.getElementById('floorplanSelect') as HTMLSelectElement;
    if (!select) return;
    const plans = getAllFloorplans();
    select.innerHTML = '';
    for (const p of plans) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => {
      this.floorplan = getFloorplan(select.value);
      this.initDefaultRoomStyles();
      if (this.interaction) {
        this.interaction.updateFloorplan(this.floorplan);
        this.interaction.loadRoomStyles(this.renderState.roomStyles);
      }
    });
  }

  private initStylePanel(): void {
    const panel = document.getElementById('stylePanel');
    if (!panel) return;

    const styles = getAllStyles();
    for (const s of styles) {
      const btn = document.createElement('button');
      btn.className = 'style-btn';
      btn.style.background = s.previewColor;
      btn.dataset.styleId = s.id;

      const tooltip = document.createElement('span');
      tooltip.className = 'style-tooltip';
      tooltip.textContent = s.name;
      btn.appendChild(tooltip);

      btn.addEventListener('click', () => {
        this.onStyleButtonClick(s.id);
        panel.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      panel.appendChild(btn);
    }
  }

  private onStyleButtonClick(styleId: string): void {
    const selectedRoom = this.renderState.selectedRoom;
    if (!selectedRoom) return;
    this.interaction?.applyStyleToRoom(selectedRoom, styleId);
  }

  private initDrawer(): void {
    const toggle = document.getElementById('drawerToggle');
    const drawer = document.getElementById('drawer');
    if (!toggle || !drawer) return;

    toggle.addEventListener('click', () => {
      this.drawerOpen = !this.drawerOpen;
      drawer.classList.toggle('open', this.drawerOpen);
      toggle.textContent = this.drawerOpen ? '▲ 方案管理' : '▼ 方案管理';
    });

    const saveBtn = document.getElementById('saveSchemeBtn');
    const saveModal = document.getElementById('saveModal');
    const cancelBtn = document.getElementById('cancelSaveBtn');
    const confirmBtn = document.getElementById('confirmSaveBtn');
    const nameInput = document.getElementById('schemeNameInput') as HTMLInputElement;

    if (saveBtn && saveModal) {
      saveBtn.addEventListener('click', () => {
        nameInput.value = '';
        saveModal.classList.add('visible');
        nameInput.focus();
      });

      cancelBtn?.addEventListener('click', () => {
        saveModal.classList.remove('visible');
      });

      confirmBtn?.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) return;
        this.saveCurrentScheme(name);
        saveModal.classList.remove('visible');
      });

      nameInput?.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const name = nameInput.value.trim();
          if (!name) return;
          this.saveCurrentScheme(name);
          saveModal.classList.remove('visible');
        }
      });
    }

    const previewModal = document.getElementById('previewModal');
    const closePreview = document.getElementById('closePreviewBtn');
    if (closePreview && previewModal) {
      closePreview.addEventListener('click', () => {
        previewModal.classList.remove('visible');
      });
    }
  }

  private saveCurrentScheme(name: string): void {
    const thumbnail = this.generateThumbnail();

    const scheme: SchemeData = {
      name,
      timestamp: Date.now(),
      roomStyles: { ...this.renderState.roomStyles },
      thumbnail
    };

    saveScheme(scheme);
    this.refreshSchemeGrid();
  }

  private generateThumbnail(): string {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 200;
    thumbCanvas.height = 140;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (!thumbCtx) return '';

    const scaleX = 200 / this.canvas.width;
    const scaleY = 140 / this.canvas.height;
    const scale = Math.min(scaleX, scaleY);

    thumbCtx.save();
    thumbCtx.scale(scale * (window.devicePixelRatio || 1), scale * (window.devicePixelRatio || 1));
    renderExportFrame(thumbCtx, this.floorplan, this.renderState, this.stylePresets);
    thumbCtx.restore();

    return thumbCanvas.toDataURL('image/png', 0.6);
  }

  private refreshSchemeGrid(): void {
    const grid = document.getElementById('schemeGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const schemes = listSchemes();

    for (const scheme of schemes) {
      const card = document.createElement('div');
      card.className = 'scheme-card';

      const nameEl = document.createElement('div');
      nameEl.className = 'scheme-name';
      nameEl.textContent = scheme.name;
      card.appendChild(nameEl);

      const thumb = document.createElement('div');
      thumb.className = 'scheme-thumb';
      if (scheme.thumbnail) {
        thumb.style.backgroundImage = `url(${scheme.thumbnail})`;
        thumb.style.backgroundSize = 'cover';
        thumb.style.backgroundPosition = 'center';
      }
      card.appendChild(thumb);

      thumb.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        this.previewScheme(scheme);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        deleteScheme(scheme.name);
        this.refreshSchemeGrid();
      });
      card.appendChild(deleteBtn);

      card.addEventListener('click', () => {
        this.loadSchemeData(scheme);
      });

      grid.appendChild(card);
    }
  }

  private previewScheme(scheme: SchemeData): void {
    const previewModal = document.getElementById('previewModal');
    const previewImage = document.getElementById('previewImage') as HTMLImageElement;
    if (!previewModal || !previewImage) return;

    previewImage.src = scheme.thumbnail;
    previewModal.classList.add('visible');
  }

  private loadSchemeData(scheme: SchemeData): void {
    const loaded = loadScheme(scheme.name);
    if (!loaded) return;

    const roomStyles: Record<string, RoomStyleState> = {};
    for (const [key, val] of Object.entries(loaded.roomStyles)) {
      roomStyles[key] = val as RoomStyleState;
    }
    this.renderState.roomStyles = roomStyles;
    this.interaction?.loadRoomStyles(roomStyles);
  }

  private initExportButton(): void {
    const btn = document.getElementById('exportBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      this.exportPNG();
    });
  }

  private exportPNG(): void {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1920;
    exportCanvas.height = 1080;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    const scaleX = 1920 / this.canvas.width;
    const scaleY = 1080 / this.canvas.height;
    const scale = Math.min(scaleX, scaleY) / (window.devicePixelRatio || 1);

    const offsetX = (1920 - this.canvas.width * scale) / 2;
    const offsetY = (1080 - this.canvas.height * scale) / 2;

    exportCtx.fillStyle = '#1a1a2e';
    exportCtx.fillRect(0, 0, 1920, 1080);

    exportCtx.save();
    exportCtx.translate(offsetX, offsetY);
    exportCtx.scale(scale, scale);

    renderExportFrame(exportCtx, this.floorplan, this.renderState, this.stylePresets);

    exportCtx.restore();

    const link = document.createElement('a');
    link.download = 'easydeco-export.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  private initInteraction(): void {
    this.interaction = new InteractionManager(
      this.canvas,
      this.ctx,
      this.floorplan,
      this.renderState,
      this.stylePresets,
      {
        onRoomHover: (roomName: string | null) => {
          const info = document.getElementById('roomInfo');
          if (!info) return;
          if (roomName) {
            info.textContent = roomName;
            info.classList.add('visible');
          } else {
            info.classList.remove('visible');
          }
        },
        onRoomSelect: (roomName: string | null) => {
          const info = document.getElementById('roomInfo');
          if (info && roomName) {
            info.textContent = roomName;
            info.classList.add('visible');
          }
        },
        onStyleChange: () => {},
        onSchemeChange: () => {}
      }
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
