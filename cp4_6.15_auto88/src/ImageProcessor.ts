import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';

export interface SegmentationResult {
  mask: Uint8ClampedArray;
  width: number;
  height: number;
  data: Float32Array;
}

export interface ProcessOptions {
  edgeSoftness: number;
  personScale: number;
  personOffset: { x: number; y: number };
}

export interface ExportOptions {
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
}

class ImageProcessor {
  private model: bodyPix.BodyPix | null = null;
  private modelLoadingPromise: Promise<void> | null = null;
  private animationFrameId: number | null = null;
  private pendingComposite: boolean = false;
  private isGPUBackend: boolean = false;

  async loadModel(): Promise<void> {
    if (this.model) return;
    if (this.modelLoadingPromise) return this.modelLoadingPromise;

    this.modelLoadingPromise = (async () => {
      await tf.ready();
      
      try {
        if (tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl');
          await tf.ready();
        }
        this.isGPUBackend = tf.getBackend() === 'webgl';
        console.log(`使用 ${this.isGPUBackend ? 'GPU (WebGL)' : 'CPU'} 后端进行推理`);
      } catch {
        console.warn('WebGL GPU 不可用，回退到 CPU 后端');
        this.isGPUBackend = false;
        try {
          await tf.setBackend('cpu');
          await tf.ready();
        } catch (cpuError) {
          console.error('CPU 后端也不可用:', cpuError);
          throw new Error('无法初始化 TensorFlow.js 后端');
        }
      }
      
      try {
        if (this.isGPUBackend) {
          this.model = await bodyPix.load({
            architecture: 'ResNet50',
            outputStride: 16,
            quantBytes: 2
          });
        } else {
          this.model = await bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            multiplier: 0.75,
            quantBytes: 2
          });
        }
      } catch (loadError) {
        console.warn('主模型加载失败，尝试加载轻量模型:', loadError);
        this.model = await bodyPix.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.5,
          quantBytes: 2
        });
      }
    })();

    return this.modelLoadingPromise;
  }

  private async ensureModel(): Promise<bodyPix.BodyPix> {
    if (!this.model) {
      await this.loadModel();
    }
    if (!this.model) {
      throw new Error('模型加载失败');
    }
    return this.model;
  }

  async segmentPerson(
    image: HTMLImageElement,
    options: { segmentationThreshold?: number } = {}
  ): Promise<SegmentationResult> {
    const model = await this.ensureModel();

    const segmentationThreshold = options.segmentationThreshold ?? 0.5;

    const startTime = performance.now();
    
    const segmentation = await model.segmentPerson(image, {
      flipHorizontal: false,
      internalResolution: this.isGPUBackend ? 'medium' : 'low',
      segmentationThreshold
    });
    
    const inferenceTime = performance.now() - startTime;
    console.log(`人像分割推理时间: ${inferenceTime.toFixed(2)}ms (${this.isGPUBackend ? 'GPU' : 'CPU'})`);

    const { width, height } = image;
    const mask = new Uint8ClampedArray(width * height * 4);
    const data = new Float32Array(width * height);

    const segData = segmentation.data;
    for (let i = 0; i < segData.length; i++) {
      const value = segData[i] ? 1 : 0;
      data[i] = value;
      const j = i * 4;
      mask[j] = 0;
      mask[j + 1] = 0;
      mask[j + 2] = 0;
      mask[j + 3] = value > 0.5 ? 255 : 0;
    }

    return { mask, width, height, data };
  }

  private applyGaussianBlur(
    data: Float32Array,
    width: number,
    height: number,
    radius: number
  ): Float32Array {
    if (radius <= 0) return data;
    
    const result = new Float32Array(data.length);
    const kernelSize = Math.max(3, Math.floor(radius * 2 + 1));
    const sigma = radius / 2;
    const kernel: number[] = [];
    let sum = 0;

    for (let i = 0; i < kernelSize; i++) {
      const x = i - kernelSize / 2;
      const value = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel.push(value);
      sum += value;
    }

    for (let i = 0; i < kernelSize; i++) {
      kernel[i] /= sum;
    }

    const temp = new Float32Array(data.length);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        for (let k = 0; k < kernelSize; k++) {
          const px = Math.min(Math.max(x + k - kernelSize / 2, 0), width - 1);
          value += data[y * width + px] * kernel[k];
        }
        temp[y * width + x] = value;
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let value = 0;
        for (let k = 0; k < kernelSize; k++) {
          const py = Math.min(Math.max(y + k - kernelSize / 2, 0), height - 1);
          value += temp[py * width + x] * kernel[k];
        }
        result[y * width + x] = value;
      }
    }

    return result;
  }

  async compositeImage(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    personImg: HTMLImageElement,
    background: HTMLImageElement | string,
    segmentation: SegmentationResult,
    options: ProcessOptions
  ): Promise<void> {
    if (this.pendingComposite) {
      this.pendingComposite = true;
      return;
    }
    this.pendingComposite = true;

    const renderFrame = () => {
      try {
        const blurRadius = options.edgeSoftness / 20;
        const blurredData = this.applyGaussianBlur(
          segmentation.data,
          segmentation.width,
          segmentation.height,
          blurRadius
        );

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        if (typeof background === 'string') {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } else {
          const bgRatio = background.width / background.height;
          const canvasRatio = canvasWidth / canvasHeight;
          let bgDrawWidth: number;
          let bgDrawHeight: number;
          let bgDrawX: number;
          let bgDrawY: number;

          if (bgRatio > canvasRatio) {
            bgDrawHeight = canvasHeight;
            bgDrawWidth = canvasHeight * bgRatio;
            bgDrawX = (canvasWidth - bgDrawWidth) / 2;
            bgDrawY = 0;
          } else {
            bgDrawWidth = canvasWidth;
            bgDrawHeight = canvasWidth / bgRatio;
            bgDrawX = 0;
            bgDrawY = (canvasHeight - bgDrawHeight) / 2;
          }

          ctx.drawImage(background, bgDrawX, bgDrawY, bgDrawWidth, bgDrawHeight);
        }

        const personRatio = segmentation.width / segmentation.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let baseWidth: number;
        let baseHeight: number;

        if (personRatio > canvasRatio) {
          baseWidth = canvasWidth * 0.6;
          baseHeight = baseWidth / personRatio;
        } else {
          baseHeight = canvasHeight * 0.7;
          baseWidth = baseHeight * personRatio;
        }

        const scaledWidth = baseWidth * options.personScale;
        const scaledHeight = baseHeight * options.personScale;

        const offsetX = options.personOffset.x * canvasWidth;
        const offsetY = options.personOffset.y * canvasHeight;

        const drawX = (canvasWidth - scaledWidth) / 2 + offsetX;
        const drawY = (canvasHeight - scaledHeight) / 2 + offsetY;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = segmentation.width;
        tempCanvas.height = segmentation.height;
        const tempCtx = tempCanvas.getContext('2d')!;

        tempCtx.drawImage(personImg, 0, 0);
        
        const imageData = tempCtx.getImageData(0, 0, segmentation.width, segmentation.height);
        const pixels = imageData.data;

        for (let i = 0; i < blurredData.length; i++) {
          const alpha = Math.min(1, blurredData[i]);
          const j = i * 4;
          pixels[j + 3] = Math.floor(alpha * 255);
        }

        tempCtx.putImageData(imageData, 0, 0);

        ctx.save();
        ctx.globalAlpha = 1;
        ctx.drawImage(tempCanvas, drawX, drawY, scaledWidth, scaledHeight);
        ctx.restore();

      } finally {
        const wasPending = this.pendingComposite;
        this.pendingComposite = false;
        if (wasPending) {
          requestAnimationFrame(renderFrame);
        }
      }
    };

    requestAnimationFrame(renderFrame);
  }

  drawScanLine(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    progress: number
  ): void {
    const scanY = progress * canvasHeight;
    
    const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    gradient.addColorStop(0, 'rgba(233, 69, 96, 0)');
    gradient.addColorStop(0.3, 'rgba(233, 69, 96, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.7, 'rgba(233, 69, 96, 0.6)');
    gradient.addColorStop(1, 'rgba(233, 69, 96, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, scanY - 20, canvasWidth, 40);
    
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(canvasWidth, scanY);
    ctx.stroke();
    ctx.restore();
  }

  async exportToPNG(
    canvas: HTMLCanvasElement,
    options: ExportOptions = {}
  ): Promise<Blob> {
    const { maxWidth = 1920, maxHeight = 1080, maintainAspectRatio = true } = options;
    
    const exportCanvas = document.createElement('canvas');
    
    if (maintainAspectRatio) {
      const originalRatio = canvas.width / canvas.height;
      const targetRatio = maxWidth / maxHeight;
      
      let exportWidth: number;
      let exportHeight: number;
      
      if (originalRatio > targetRatio) {
        exportWidth = maxWidth;
        exportHeight = Math.round(maxWidth / originalRatio);
      } else {
        exportHeight = maxHeight;
        exportWidth = Math.round(maxHeight * originalRatio);
      }
      
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
    } else {
      exportCanvas.width = maxWidth;
      exportCanvas.height = maxHeight;
    }
    
    const exportCtx = exportCanvas.getContext('2d')!;
    exportCtx.imageSmoothingEnabled = true;
    exportCtx.imageSmoothingQuality = 'high';
    
    exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    return new Promise((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate PNG'));
      }, 'image/png', 1.0);
    });
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.model) {
      tf.disposeVariables();
      this.model = null;
    }
  }
}

export const imageProcessor = new ImageProcessor();
