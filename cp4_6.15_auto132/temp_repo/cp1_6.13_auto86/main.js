import { Brush } from './brush.js';
import { LayerManager } from './layer.js';
import { Palette } from './palette.js';

class DrawingApp {
  constructor() {
    this.brush = new Brush();
    this.layerManager = new LayerManager(5);
    this.palette = new Palette();
    
    this.maxUndoSteps = 20;
    this.undoHistory = [];
    this.undoIndex = -1;
    
    this.canvas = document.getElementById('mainCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.zoom = 1;
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    
    this.setupCanvas();
    this.setupUI();
    this.setupEventListeners();
    this.layerManager.addLayer('背景层');
  }

  setupCanvas() {
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  setupUI() {
    this.updateInkDisplay();
    this.updateUndoCount();
    this.setupPalette();
    this.setupLayerPanel();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', this.handleToolChange.bind(this));
    });
    
    document.getElementById('zoomSlider').addEventListener('input', this.handleZoomChange.bind(this));
    document.querySelector('.zoom-btn[data-action="zoom-in"]').addEventListener('click', () => this.changeZoom(1.1));
    document.querySelector('.zoom-btn[data-action="zoom-out"]').addEventListener('click', () => this.changeZoom(0.9));
    
    document.getElementById('undoBtn').addEventListener('click', this.undo.bind(this));
    
    document.querySelector('.tool-btn[data-tool="dip"]').addEventListener('click', () => {
      this.brush.dipInk();
      this.updateInkDisplay();
    });
    
    document.getElementById('floatLayerBtn').addEventListener('click', () => {
      document.getElementById('layerPanel').classList.toggle('open');
    });
    
    document.getElementById('floatColorBtn').addEventListener('click', () => {
      document.getElementById('colorPanel').classList.toggle('open');
    });
    
    document.getElementById('layerPanel').addEventListener('click', (e) => {
      if (e.target.closest('.sidebar-left')) {
        document.getElementById('layerPanel').classList.remove('open');
      }
    });
    
    document.getElementById('colorPanel').addEventListener('click', (e) => {
      if (e.target.closest('.sidebar-right')) {
        document.getElementById('colorPanel').classList.remove('open');
      }
    });
    
    setInterval(() => this.updateInkDisplay(), 50);
  }

  setupPalette() {
    const hueRing = document.getElementById('hueRing');
    const slPanel = document.getElementById('slPanel');
    const hueCtx = hueRing.getContext('2d');
    const slCtx = slPanel.getContext('2d');
    
    hueRing.width = 180;
    hueRing.height = 180;
    slPanel.width = 160;
    slPanel.height = 120;
    
    this.palette.drawHueRing(hueCtx, 90, 90, 85);
    this.palette.drawSLPanel(slCtx);
    
    this.updateHuePointer();
    this.updateSLPointer();
    this.updateColorPreview();
    this.updateRecentColors();
    
    hueRing.addEventListener('click', (e) => {
      const rect = hueRing.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hue = this.palette.getHueFromPosition(x, y, 90, 90);
      this.palette.setHue(hue);
      this.updateHuePointer();
      this.palette.drawSLPanel(slCtx);
      this.updateSLPointer();
    });
    
    slPanel.addEventListener('click', (e) => {
      const rect = slPanel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { saturation, lightness } = this.palette.getSLFromPosition(x, y, slPanel.width, slPanel.height);
      this.palette.setSaturation(saturation);
      this.palette.setLightness(lightness);
      this.updateSLPointer();
    });
    
    document.getElementById('opacitySlider').addEventListener('input', (e) => {
      this.palette.setOpacity(parseInt(e.target.value));
      document.getElementById('opacityValue').textContent = `${e.target.value}%`;
    });
    
    this.palette.onChange = (data) => {
      this.brush.setColor(data.color);
      this.updateColorPreview();
      this.updateRecentColors();
    };
  }

  updateHuePointer() {
    const pointer = document.getElementById('huePointer');
    const centerX = 90;
    const centerY = 90;
    const radius = 85 - 10;
    const angle = (this.palette.hue - 90) * Math.PI / 180;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    pointer.style.left = `${x}px`;
    pointer.style.top = `${y}px`;
    pointer.style.backgroundColor = `hsl(${this.palette.hue}, 100%, 50%)`;
  }

  updateSLPointer() {
    const pointer = document.getElementById('slPointer');
    const x = (this.palette.saturation / 100) * 160;
    const y = (100 - this.palette.lightness) / 100 * 120;
    pointer.style.left = `${x}px`;
    pointer.style.top = `${y}px`;
    pointer.style.backgroundColor = this.palette.getColor();
  }

  updateColorPreview() {
    document.getElementById('colorPreview').style.backgroundColor = this.palette.getColor();
    document.getElementById('colorHex').textContent = this.palette.getColor().toUpperCase();
  }

  updateRecentColors() {
    const grid = document.getElementById('colorGrid');
    grid.innerHTML = '';
    this.palette.getRecentColors().forEach(color => {
      const div = document.createElement('div');
      div.className = 'color-item';
      div.style.backgroundColor = color;
      div.addEventListener('click', () => {
        this.palette.setColor(color);
        this.updateHuePointer();
        this.updateSLPointer();
        this.palette.drawSLPanel(document.getElementById('slPanel').getContext('2d'));
      });
      grid.appendChild(div);
    });
  }

  setupLayerPanel() {
    this.layerManager.onChange = () => {
      this.renderLayers();
      this.redrawCanvas();
    };
    
    document.querySelector('.add-layer-btn').addEventListener('click', () => {
      this.layerManager.addLayer();
    });
    
    this.renderLayers();
  }

  renderLayers() {
    const list = document.getElementById('layerList');
    list.innerHTML = '';
    
    this.layerManager.getLayers().forEach((layer, index) => {
      const item = document.createElement('div');
      item.className = `layer-item${this.layerManager.currentLayerIndex === index ? ' active' : ''}`;
      item.dataset.index = index;
      
      item.innerHTML = `
        <div class="layer-thumbnail"></div>
        <div class="layer-info">
          <div class="layer-name">${layer.name}</div>
          <div class="layer-status">${layer.visible ? '可见' : '隐藏'} ${layer.locked ? '| 锁定' : ''}</div>
        </div>
        <div class="layer-actions">
          <button class="layer-action-btn" data-action="visibility" title="${layer.visible ? '隐藏' : '显示'}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              ${layer.visible ? '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>' : '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .38-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .38-.39.39-1.03 0-1.41l-1.06-1.06zM21 12c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1zm-18 0c0-.55-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1h2c.55 0 1-.45 1-1zM6.95 6.95a.996.996 0 00-1.41 0L3.46 9.3c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.08-1.06c.38-.39.39-1.03 0-1.41zm10.1 10.1a.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06c.38-.39.39-1.03 0-1.41zM12 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>'}
            </svg>
          </button>
          <button class="layer-action-btn" data-action="lock" title="${layer.locked ? '解锁' : '锁定'}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              ${layer.locked ? '<path d="M12 1a5 5 0 00-5 5v4H4v6h6v6a5 5 0 0010 0v-6h6v-6h-6V6a5 5 0 00-5-5zm3 18H9v-2h6v2zm0-4H9v-2h6v2zm0-4H9V8h6v2z"/>' : '<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm6 12H9v-2h6v2zm0-4H9v-2h6v2z"/>'}
            </svg>
          </button>
          <button class="layer-action-btn" data-action="up" title="上移" ${index >= this.layerManager.getLayers().length - 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5H7z"/>
            </svg>
          </button>
          <button class="layer-action-btn" data-action="down" title="下移" ${index <= 0 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5H7z"/>
            </svg>
          </button>
          <button class="layer-action-btn" data-action="delete" title="删除" ${this.layerManager.getLayers().length <= 1 ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      `;
      
      const thumbnail = item.querySelector('.layer-thumbnail');
      thumbnail.appendChild(layer.thumbnail);
      
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.layer-action-btn')) {
          this.layerManager.setCurrentLayer(index);
        }
      });
      
      item.querySelectorAll('.layer-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          switch (action) {
            case 'visibility':
              this.layerManager.toggleVisibility(index);
              break;
            case 'lock':
              this.layerManager.toggleLock(index);
              break;
            case 'up':
              this.layerManager.moveLayerUp(index);
              break;
            case 'down':
              this.layerManager.moveLayerDown(index);
              break;
            case 'delete':
              this.layerManager.removeLayer(index);
              break;
          }
        });
      });
      
      list.appendChild(item);
    });
  }

  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.zoom;
    const y = (e.clientY - rect.top) / this.zoom;
    
    const currentLayer = this.layerManager.getCurrentLayer();
    if (currentLayer && currentLayer.locked) return;
    
    this.saveSnapshot();
    this.brush.startDrawing(x, y);
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.zoom;
    const y = (e.clientY - rect.top) / this.zoom;
    
    this.brush.updateDrawing(x, y);
    
    if (this.brush.drawing) {
      const currentLayer = this.layerManager.getCurrentLayer();
      if (currentLayer) {
        this.brush.draw(currentLayer.ctx, x, y);
      }
      this.redrawCanvas();
    }
  }

  handleMouseUp(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.zoom;
    const y = (e.clientY - rect.top) / this.zoom;
    
    const currentLayer = this.layerManager.getCurrentLayer();
    if (currentLayer && this.brush.drawing) {
      this.brush.draw(currentLayer.ctx, x, y, true);
      currentLayer.updateThumbnail();
    }
    
    this.brush.endDrawing();
    this.redrawCanvas();
  }

  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / this.zoom;
    const y = (touch.clientY - rect.top) / this.zoom;
    
    const currentLayer = this.layerManager.getCurrentLayer();
    if (currentLayer && currentLayer.locked) return;
    
    this.saveSnapshot();
    this.brush.startDrawing(x, y);
  }

  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / this.zoom;
    const y = (touch.clientY - rect.top) / this.zoom;
    
    this.brush.updateDrawing(x, y);
    
    if (this.brush.drawing) {
      const currentLayer = this.layerManager.getCurrentLayer();
      if (currentLayer) {
        this.brush.draw(currentLayer.ctx, x, y);
      }
      this.redrawCanvas();
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    
    const currentLayer = this.layerManager.getCurrentLayer();
    if (currentLayer && this.brush.drawing) {
      const trail = this.brush.endDrawing();
      if (trail && trail.length > 0) {
        const lastPoint = trail[trail.length - 1];
        this.brush.draw(currentLayer.ctx, lastPoint.x, lastPoint.y, true);
      }
      currentLayer.updateThumbnail();
    }
    
    this.brush.endDrawing();
    this.redrawCanvas();
  }

  handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
    }
    
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      this.brush.dipInk();
    }
  }

  handleToolChange(e) {
    const tool = e.currentTarget.dataset.tool;
    this.brush.setTool(tool);
    
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
  }

  handleZoomChange(e) {
    this.zoom = parseInt(e.target.value) / 100;
    document.getElementById('zoomValue').textContent = `${e.target.value}%`;
    this.canvas.style.transform = `scale(${this.zoom})`;
  }

  changeZoom(factor) {
    const newZoom = Math.max(0.5, Math.min(4, this.zoom * factor));
    this.zoom = newZoom;
    document.getElementById('zoomSlider').value = Math.round(newZoom * 100);
    document.getElementById('zoomValue').textContent = `${Math.round(newZoom * 100)}%`;
    this.canvas.style.transform = `scale(${this.zoom})`;
  }

  saveSnapshot() {
    const layersSnapshot = [];
    this.layerManager.getLayers().forEach(layer => {
      layersSnapshot.push({
        id: layer.id,
        snapshot: layer.getSnapshot(),
        visible: layer.visible,
        locked: layer.locked,
        name: layer.name
      });
    });
    
    this.undoHistory = this.undoHistory.slice(0, this.undoIndex + 1);
    this.undoHistory.push(layersSnapshot);
    
    if (this.undoHistory.length > this.maxUndoSteps) {
      this.undoHistory.shift();
    }
    
    this.undoIndex = this.undoHistory.length - 1;
    this.updateUndoCount();
  }

  undo() {
    if (this.undoIndex <= 0) return;
    
    this.undoIndex--;
    const snapshot = this.undoHistory[this.undoIndex];
    
    this.layerManager.getLayers().forEach((layer, index) => {
      const savedLayer = snapshot.find(s => s.id === layer.id);
      if (savedLayer) {
        layer.setSnapshot(savedLayer.snapshot);
        layer.visible = savedLayer.visible;
        layer.locked = savedLayer.locked;
        layer.name = savedLayer.name;
      }
    });
    
    this.redrawCanvas();
    this.renderLayers();
    this.updateUndoCount();
  }

  updateUndoCount() {
    const count = this.undoIndex + 1;
    document.getElementById('undoCount').textContent = `撤销 (${count}/${this.maxUndoSteps})`;
    document.getElementById('undoBtn').disabled = this.undoIndex <= 0;
  }

  updateInkDisplay() {
    const ink = this.brush.getInkLevel();
    document.getElementById('inkBar').style.width = `${ink}%`;
    document.getElementById('inkValue').textContent = `墨量: ${Math.round(ink)}%`;
    
    const inkBar = document.getElementById('inkBar');
    if (this.brush.recovering) {
      inkBar.classList.add('ink-recovering');
    } else {
      inkBar.classList.remove('ink-recovering');
    }
  }

  redrawCanvas() {
    this.layerManager.render(this.ctx);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DrawingApp();
});