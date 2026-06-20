import * as THREE from 'three';

interface HistoryPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface CanvasSize {
  w: number;
  h: number;
}

export class HeatmapExporter {
  static buildHeatmap(
    targetHistory: HistoryPoint[],
    durationSeconds: number,
    canvasSize: CanvasSize
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }

    const now = Date.now();
    const cutoff = now - durationSeconds * 1000;
    const filtered = targetHistory.filter((p) => p.timestamp >= cutoff);

    if (filtered.length === 0) {
      return canvas;
    }

    const xs = filtered.map((p) => p.x);
    const zs = filtered.map((p) => p.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const padding = 0.1;
    const rangeX = Math.max(maxX - minX, 0.001);
    const rangeZ = Math.max(maxZ - minZ, 0.001);
    const padX = rangeX * padding;
    const padZ = rangeZ * padding;
    const scaleX = canvasSize.w / (rangeX + padX * 2);
    const scaleZ = canvasSize.h / (rangeZ + padZ * 2);
    const scale = Math.min(scaleX, scaleZ);

    const offsetX = (canvasSize.w - (rangeX + padX * 2) * scale) / 2;
    const offsetZ = (canvasSize.h - (rangeZ + padZ * 2) * scale) / 2;

    const toCanvas = (x: number, z: number) => ({
      cx: offsetX + (x - minX + padX) * scale,
      cz: offsetZ + (maxZ - z + padZ) * scale,
    });

    ctx.globalCompositeOperation = 'lighter';

    const baseRadius = Math.min(canvasSize.w, canvasSize.h) * 0.06;
    const intensity = 0.15;

    for (const point of filtered) {
      const { cx, cz } = toCanvas(point.x, point.z);
      const radius = baseRadius;

      const gradient = ctx.createRadialGradient(cx, cz, 0, cx, cz, radius);

      for (let i = 0; i <= 1; i += 0.1) {
        const alpha = (1 - i) * intensity;
        const color = HeatmapExporter.heatColor(i);
        gradient.addColorStop(i, `rgba(${color.r},${color.g},${color.b},${alpha})`);
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cz, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    return canvas;
  }

  static overlayOntoScene(
    heatmapCanvas: HTMLCanvasElement,
    r3fCanvas: HTMLCanvasElement
  ): HTMLCanvasElement {
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = heatmapCanvas.width;
    resultCanvas.height = heatmapCanvas.height;
    const ctx = resultCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }

    const renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(resultCanvas.width, resultCanvas.height);

    const scene = HeatmapExporter.extractSceneFromCanvas(r3fCanvas);
    if (!scene) {
      ctx.drawImage(r3fCanvas, 0, 0, resultCanvas.width, resultCanvas.height);
      ctx.globalAlpha = 0.6;
      ctx.drawImage(heatmapCanvas, 0, 0);
      ctx.globalAlpha = 1;
      renderer.dispose();
      return resultCanvas;
    }

    const camera = new THREE.OrthographicCamera(
      -10,
      10,
      10,
      -10,
      0.1,
      1000
    );
    camera.position.set(0, 20, 0);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, -1);

    renderer.render(scene, camera);

    const gl = renderer.getContext();
    const pixels = new Uint8Array(resultCanvas.width * resultCanvas.height * 4);
    gl.readPixels(
      0,
      0,
      resultCanvas.width,
      resultCanvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    );

    const imageData = ctx.createImageData(resultCanvas.width, resultCanvas.height);
    for (let y = 0; y < resultCanvas.height; y++) {
      for (let x = 0; x < resultCanvas.width; x++) {
        const srcIdx = ((resultCanvas.height - 1 - y) * resultCanvas.width + x) * 4;
        const dstIdx = (y * resultCanvas.width + x) * 4;
        imageData.data[dstIdx] = pixels[srcIdx];
        imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
        imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
        imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
      }
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.globalAlpha = 0.6;
    ctx.drawImage(heatmapCanvas, 0, 0);
    ctx.globalAlpha = 1;

    renderer.dispose();
    return resultCanvas;
  }

  static exportPNG(canvas: HTMLCanvasElement, filename: string): void {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static heatColor(t: number): { r: number; g: number; b: number } {
    const clamped = Math.max(0, Math.min(1, t));
    if (clamped < 0.25) {
      const k = clamped / 0.25;
      return {
        r: 0,
        g: Math.round(k * 255),
        b: 255,
      };
    }
    if (clamped < 0.5) {
      const k = (clamped - 0.25) / 0.25;
      return {
        r: 0,
        g: 255,
        b: Math.round(255 * (1 - k)),
      };
    }
    if (clamped < 0.75) {
      const k = (clamped - 0.5) / 0.25;
      return {
        r: Math.round(k * 255),
        g: 255,
        b: 0,
      };
    }
    const k = (clamped - 0.75) / 0.25;
    return {
      r: 255,
      g: Math.round(255 * (1 - k)),
      b: 0,
    };
  }

  private static extractSceneFromCanvas(
    r3fCanvas: HTMLCanvasElement
  ): THREE.Scene | null {
    try {
      const fiber = (r3fCanvas as unknown as { __r3f?: { scene?: THREE.Scene } }).__r3f;
      if (fiber && fiber.scene) {
        return fiber.scene;
      }
    } catch {
      // ignore
    }
    return null;
  }
}
