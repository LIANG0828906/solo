import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TieDyeEngine } from '../utils/TieDyeEngine';
import { DyeParams } from '../utils/types';

interface FabricCanvasProps {
  width: number;
  height: number;
  params: DyeParams | null;
  showSeal: boolean;
  sealChar: string;
}

export interface FabricCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getImageData: () => ImageData | null;
}

export const FabricCanvas = forwardRef<FabricCanvasHandle, FabricCanvasProps>(
  function FabricCanvas({ width, height, params, showSeal, sealChar }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<TieDyeEngine | null>(null);
    const currentPixelsRef = useRef<Uint8ClampedArray | null>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getImageData: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      },
    }));

    useEffect(() => {
      engineRef.current = new TieDyeEngine(width, height);
      resetCanvas();
    }, [width, height]);

    useEffect(() => {
      if (!params || !engineRef.current) return;

      const newPixels = engineRef.current.generatePattern(params);
      
      if (currentPixelsRef.current && params.dyeRound > 1) {
        currentPixelsRef.current = engineRef.current.layerPattern(
          currentPixelsRef.current,
          newPixels,
          0.6 + (params.dyeRound - 1) * 0.1
        );
      } else {
        currentPixelsRef.current = newPixels;
      }

      renderPixels(currentPixelsRef.current);
    }, [params]);

    const resetCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      currentPixelsRef.current = null;
      engineRef.current?.regenerateSeed();
    };

    const renderPixels = (pixels: Uint8ClampedArray) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = new ImageData(pixels, width, height);
      ctx.putImageData(imageData, 0, 0);

      if (showSeal && sealChar) {
        drawSeal(ctx, sealChar);
      }
    };

    const drawSeal = (ctx: CanvasRenderingContext2D, char: string) => {
      const sealSize = 48;
      const padding = 16;
      const x = width - sealSize - padding;
      const y = height - sealSize - padding;

      ctx.save();
      
      const gradient = ctx.createLinearGradient(x, y, x + sealSize, y + sealSize);
      gradient.addColorStop(0, '#c0392b');
      gradient.addColorStop(1, '#922b21');
      ctx.fillStyle = gradient;
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.beginPath();
      ctx.roundRect(x, y, sealSize, sealSize, 4);
      ctx.fill();
      
      ctx.restore();

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 28px 'Ma Shan Zheng', cursive";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, x + sealSize / 2, y + sealSize / 2);
      ctx.restore();
    };

    return (
      <div className="fabric-display" style={{ width, height }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block"
        />
      </div>
    );
  }
);
