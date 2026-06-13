export class Layer {
  constructor(id, name = '图层') {
    this.id = id;
    this.name = name;
    this.visible = true;
    this.locked = false;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.thumbnail = document.createElement('canvas');
    this.thumbnailCtx = this.thumbnail.getContext('2d');
    this.thumbnail.width = 32;
    this.thumbnail.height = 32;
  }

  resize(width, height) {
    const oldCanvas = this.canvas;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    
    if (oldCanvas.width > 0) {
      this.ctx.drawImage(oldCanvas, 0, 0);
    }
    
    this.updateThumbnail();
  }

  updateThumbnail() {
    this.thumbnailCtx.fillStyle = '#1e1e1e';
    this.thumbnailCtx.fillRect(0, 0, 32, 32);
    
    if (this.canvas.width > 0 && this.canvas.height > 0) {
      this.thumbnailCtx.drawImage(
        this.canvas,
        0, 0, this.canvas.width, this.canvas.height,
        0, 0, 32, 32
      );
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.updateThumbnail();
  }

  getSnapshot() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  setSnapshot(imageData) {
    this.ctx.putImageData(imageData, 0, 0);
    this.updateThumbnail();
  }
}

export class LayerManager {
  constructor(maxLayers = 5) {
    this.layers = [];
    this.currentLayerIndex = 0;
    this.maxLayers = maxLayers;
    this.onChange = null;
  }

  addLayer(name = null) {
    if (this.layers.length >= this.maxLayers) {
      return null;
    }
    
    const layerName = name || `图层 ${this.layers.length + 1}`;
    const layer = new Layer(`layer-${Date.now()}`, layerName);
    
    if (this.layers.length === 0) {
      this.layers.push(layer);
    } else {
      this.layers.splice(this.currentLayerIndex + 1, 0, layer);
      this.currentLayerIndex++;
    }
    
    this.notifyChange();
    return layer;
  }

  removeLayer(index) {
    if (this.layers.length <= 1) return false;
    if (index < 0 || index >= this.layers.length) return false;
    
    this.layers.splice(index, 1);
    
    if (this.currentLayerIndex >= this.layers.length) {
      this.currentLayerIndex = Math.max(0, this.layers.length - 1);
    }
    
    this.notifyChange();
    return true;
  }

  setCurrentLayer(index) {
    if (index >= 0 && index < this.layers.length) {
      this.currentLayerIndex = index;
      this.notifyChange();
    }
  }

  getCurrentLayer() {
    return this.layers[this.currentLayerIndex] || null;
  }

  moveLayerUp(index) {
    if (index >= this.layers.length - 1) return false;
    
    const temp = this.layers[index];
    this.layers[index] = this.layers[index + 1];
    this.layers[index + 1] = temp;
    
    if (this.currentLayerIndex === index) {
      this.currentLayerIndex++;
    } else if (this.currentLayerIndex === index + 1) {
      this.currentLayerIndex--;
    }
    
    this.notifyChange();
    return true;
  }

  moveLayerDown(index) {
    if (index <= 0) return false;
    
    const temp = this.layers[index];
    this.layers[index] = this.layers[index - 1];
    this.layers[index - 1] = temp;
    
    if (this.currentLayerIndex === index) {
      this.currentLayerIndex--;
    } else if (this.currentLayerIndex === index - 1) {
      this.currentLayerIndex++;
    }
    
    this.notifyChange();
    return true;
  }

  toggleVisibility(index) {
    if (index >= 0 && index < this.layers.length) {
      this.layers[index].visible = !this.layers[index].visible;
      this.notifyChange();
    }
  }

  toggleLock(index) {
    if (index >= 0 && index < this.layers.length) {
      this.layers[index].locked = !this.layers[index].locked;
      this.notifyChange();
    }
  }

  resizeAll(width, height) {
    this.layers.forEach(layer => layer.resize(width, height));
  }

  render(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    this.layers.forEach(layer => {
      if (layer.visible && layer.canvas.width > 0) {
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });
  }

  notifyChange() {
    if (typeof this.onChange === 'function') {
      this.onChange();
    }
  }

  getLayers() {
    return [...this.layers];
  }

  getLayerCount() {
    return this.layers.length;
  }

  canAddLayer() {
    return this.layers.length < this.maxLayers;
  }
}