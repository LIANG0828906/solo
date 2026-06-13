export class Palette {
  constructor() {
    this.hue = 0;
    this.saturation = 100;
    this.lightness = 50;
    this.opacity = 100;
    this.recentColors = [];
    this.maxRecentColors = 12;
    this.onChange = null;
  }

  getColor() {
    const color = this.hslToRgb(this.hue, this.saturation, this.lightness);
    return this.rgbToHex(color);
  }

  getColorWithOpacity() {
    const color = this.hslToRgb(this.hue, this.saturation, this.lightness);
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${this.opacity / 100})`;
  }

  setHue(hue) {
    this.hue = Math.max(0, Math.min(360, hue));
    this.addToRecent();
    this.notifyChange();
  }

  setSaturation(saturation) {
    this.saturation = Math.max(0, Math.min(100, saturation));
    this.addToRecent();
    this.notifyChange();
  }

  setLightness(lightness) {
    this.lightness = Math.max(0, Math.min(100, lightness));
    this.addToRecent();
    this.notifyChange();
  }

  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(100, opacity));
    this.notifyChange();
  }

  setColor(hex) {
    const rgb = this.hexToRgb(hex);
    if (rgb) {
      const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
      this.hue = hsl.h;
      this.saturation = hsl.s;
      this.lightness = hsl.l;
      this.addToRecent();
      this.notifyChange();
    }
  }

  addToRecent() {
    const color = this.getColor();
    const index = this.recentColors.indexOf(color);
    
    if (index !== -1) {
      this.recentColors.splice(index, 1);
    }
    
    this.recentColors.unshift(color);
    
    if (this.recentColors.length > this.maxRecentColors) {
      this.recentColors.pop();
    }
  }

  getRecentColors() {
    return [...this.recentColors];
  }

  hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color);
    };
    
    return { r: f(0), g: f(8), b: f(4) };
  }

  rgbToHex(color) {
    const r = color.r.toString(16).padStart(2, '0');
    const g = color.g.toString(16).padStart(2, '0');
    const b = color.b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  notifyChange() {
    if (typeof this.onChange === 'function') {
      this.onChange({
        color: this.getColor(),
        opacity: this.opacity,
        recentColors: this.recentColors
      });
    }
  }

  drawHueRing(ctx, centerX, centerY, radius) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    for (let i = 0; i <= 360; i += 30) {
      const angle = (i * Math.PI) / 180;
      const x1 = centerX + (radius - 20) * Math.cos(angle);
      const y1 = centerY + (radius - 20) * Math.sin(angle);
      const x2 = centerX + radius * Math.cos(angle);
      const y2 = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `hsl(${i}, 100%, 50%)`;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 28, 0, Math.PI * 2);
    ctx.strokeStyle = '#3c3c3c';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawSLPanel(ctx) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const saturation = (x / width) * 100;
        const lightness = 100 - (y / height) * 100;
        
        const rgb = this.hslToRgb(this.hue, saturation, lightness);
        const i = (y * width + x) * 4;
        
        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
        data[i + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  getHueFromPosition(x, y, centerX, centerY) {
    const dx = x - centerX;
    const dy = y - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90) % 360;
    if (angle < 0) angle += 360;
    return angle;
  }

  getSLFromPosition(x, y, width, height) {
    const saturation = (x / width) * 100;
    const lightness = 100 - (y / height) * 100;
    return { saturation, lightness };
  }
}