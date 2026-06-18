import { useMemo, useRef, useEffect } from 'react';
import { useGradientStore } from '../store/useGradientStore';
import { generateGradientCSS, generateGradientCanvas, downloadBlob } from '../utils/gradientUtils';
import { DIRECTIONS } from '../types/gradient';

export function CanvasRender() {
  const { config, isExporting, setDirection, setExporting } = useGradientStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gradientCSS = useMemo(() => {
    return generateGradientCSS(config);
  }, [config]);

  const borderGradientCSS = useMemo(() => {
    const reversedConfig = {
      ...config,
      colorStops: [...config.colorStops].reverse(),
    };
    return generateGradientCSS(reversedConfig);
  }, [config]);

  const handleExport = async () => {
    if (isExporting) return;

    setExporting(true);

    const timeoutId = setTimeout(() => {
      setExporting(false);
    }, 1000);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      generateGradientCanvas(ctx, config, 1080, 1080);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (blob) {
        downloadBlob(blob, `gradient-${Date.now()}.png`);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      clearTimeout(timeoutId);
      setTimeout(() => {
        setExporting(false);
      }, 500);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    generateGradientCanvas(ctx, config, 600, 600);
  }, [config]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-3">
        {DIRECTIONS.map((dir) => (
          <button
            key={dir.value}
            onClick={() => setDirection(dir.value)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 ${
              config.direction === dir.value
                ? 'bg-[#4CAF50] shadow-[0_0_12px_rgba(76,175,80,0.4)]'
                : 'bg-[#252536] hover:bg-[#35354a]'
            }`}
            title={dir.label}
          >
            <div
              className="w-[45px] h-[45px] rounded-md flex items-center justify-center"
              style={{
                background: `linear-gradient(${dir.value}, rgba(255,255,255,0.2), rgba(255,255,255,0.05))`,
              }}
            >
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderBottom: '10px solid white',
                  transform: `rotate(${dir.angle}deg)`,
                  opacity: config.direction === dir.value ? 1 : 0.7,
                }}
              />
            </div>
          </button>
        ))}
      </div>

      <div
        className="relative w-[600px] h-[600px] rounded-2xl p-[3px]"
        style={{
          background: borderGradientCSS,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="w-full h-full rounded-[14px] overflow-hidden"
          style={{ background: gradientCSS }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="hidden"
          />
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="px-8 py-3 bg-[#4CAF50] text-white font-medium rounded-lg hover:bg-[#45a049] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <div
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              style={{ animationDuration: '0.8s' }}
            />
            导出中...
          </>
        ) : (
          <>导出 PNG (1080×1080)</>
        )}
      </button>
    </div>
  );
}
