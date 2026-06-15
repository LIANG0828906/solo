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

class ImageProcessor {
  private model: bodyPix.BodyPix | null = null;
  private modelLoadingPromise: Promise<void> | null = null;
  private animationFrameId: number | null = null;
  private pendingComposite: boolean = false;

  async loadModel(): Promise<void> {
    if (this.model) return;
    if (this.modelLoadingPromise) return this.modelLoadingPromise;

    this.modelLoadingPromise = (async () => {
      await tf.ready();
      if (tf.getBackend() !== 'webgl') {
        try {
          await tf.setBackend('webgl');
        } catch {
          console.warn('WebGL not available, using CPU backend');
        }
      }
      
      this.model = await bodyPix.load({
        architecture: 'ResNet50',
        outputStride: 16,
        quantBytes: 2
      });
    })();

    return this.modelLoadingPromise;
  }

  async segmentPerson(image: HTMLImageElement): Promise<SegmentationResult> {
    if (!this.model) {
      await this.loadModel();
    }

    const startTime = performance.now();
    const segmentation = await this.model!.segmentPerson(image, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.5
    });
    
    const inferenceTime = performance.now() - startTime;
    console.log(`人像分割推理时间: ${inferenceTime.toFixed(2)}ms`);

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

  private applyGaussianBlur(data: Float32Array, width: number, height: number, radius: number): Float32Array {
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
          ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);
        }

        const scale = options.personScale;
        const offsetX = options.personOffset.x;
        const offsetY = options.personOffset.y;

        const scaledWidth = segmentation.width * scale;
        const scaledHeight = segmentation.height * scale;
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

  async exportToPNG(
    canvas: HTMLCanvasElement,
    resolution: { width: number; height: number }
  ): Promise<Blob> {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = resolution.width;
    exportCanvas.height = resolution.height;
    const exportCtx = exportCanvas.getContext('2d')!;

    exportCtx.drawImage(canvas, 0, 0, resolution.width, resolution.height);

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
