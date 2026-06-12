import { useState, useCallback, useRef, useEffect } from 'react';
import type { Race, CharacterClass, ColorPart, CharacterColors, LayerVisibility } from '@/types/character';
import { DEFAULT_COLORS, RACE_OPTIONS, CLASS_OPTIONS, PRESET_COLORS } from '@/types/character';
import { RACE_TEMPLATES, EXPORT_SIZE } from '@/utils/pixelTemplates';
import CharacterPreview from './components/CharacterPreview';
import ControlPanel from './components/ControlPanel';
import './App.css';

type LayerKey = keyof LayerVisibility;
const LAYER_ORDER: LayerKey[] = ['body', 'clothes', 'weapon', 'hair', 'accessory'];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomizeColors(base: CharacterColors): CharacterColors {
  const parts: ColorPart[] = ['skin', 'clothes', 'hair', 'weapon', 'accessory'];
  const result: Partial<CharacterColors> = {};
  for (const p of parts) {
    if (p === 'skin') {
      result[p] = pickRandom(['#f5d0c5', '#e8b89d', '#c68863', '#8d5524', '#e8d5f0', '#6bcb77'] as const);
    } else {
      result[p] = pickRandom(PRESET_COLORS as unknown as readonly string[]) as string;
    }
  }
  return { ...base, ...(result as CharacterColors) };
}

const FULL_VISIBILITY: LayerVisibility = {
  body: 1, clothes: 1, weapon: 1, hair: 1, accessory: 1,
};

const ZERO_VISIBILITY: LayerVisibility = {
  body: 0, clothes: 0, weapon: 0, hair: 0, accessory: 0,
};

export default function App() {
  const [race, setRace] = useState<Race>('human');
  const [characterClass, setCharacterClass] = useState<CharacterClass>('warrior');
  const [colors, setColors] = useState<CharacterColors>(DEFAULT_COLORS.human);
  const [activePart, setActivePart] = useState<ColorPart>('skin');
  const [hairIndex, setHairIndex] = useState(0);
  const [visibility, setVisibility] = useState<LayerVisibility>(FULL_VISIBILITY);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const animationRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current != null) {
        cancelAnimationFrame(animationRef.current);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleRaceChange = useCallback((newRace: Race) => {
    setRace(newRace);
    setColors(DEFAULT_COLORS[newRace]);
    setHairIndex(RACE_TEMPLATES[newRace].defaultHairIndex);
  }, []);

  const handleClassChange = useCallback((newClass: CharacterClass) => {
    setCharacterClass(newClass);
  }, []);

  const handleColorChange = useCallback((part: ColorPart, color: string) => {
    setColors((prev) => ({ ...prev, [part]: color }));
  }, []);

  const handlePartChange = useCallback((part: ColorPart) => {
    setActivePart(part);
  }, []);

  const runRandomizeAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    setRace(pickRandom(RACE_OPTIONS).value);
    const newClass = pickRandom(CLASS_OPTIONS).value;
    setCharacterClass(newClass);
    setHairIndex(Math.floor(Math.random() * 3));
    setColors((prev) => randomizeColors(prev));
    setActivePart(pickRandom(['skin', 'clothes', 'hair', 'weapon', 'accessory'] as const));

    const totalDuration = 300;
    const layerStagger = totalDuration / LAYER_ORDER.length;
    const startTime = performance.now();

    setVisibility({ ...ZERO_VISIBILITY });

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const newVis: LayerVisibility = { ...ZERO_VISIBILITY };

      LAYER_ORDER.forEach((layer, idx) => {
        const layerStart = idx * layerStagger;
        const layerProgress = Math.max(0, Math.min(1, (elapsed - layerStart) / layerStagger));
        const eased = 1 - Math.pow(1 - layerProgress, 3);
        newVis[layer] = eased;
      });

      setVisibility(newVis);

      if (elapsed < totalDuration + 20) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setVisibility({ ...FULL_VISIBILITY });
        setIsAnimating(false);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isAnimating]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      if (!workerRef.current) {
        const WorkerModule = await import('./utils/exportWorker?worker');
        workerRef.current = new WorkerModule.default();
      }
      const worker = workerRef.current;

      const previewCanvas = document.querySelector<HTMLCanvasElement>('.preview-canvas');
      if (!previewCanvas) {
        throw new Error('找不到预览Canvas');
      }
      const srcCtx = previewCanvas.getContext('2d');
      if (!srcCtx) {
        throw new Error('无法获取Canvas上下文');
      }

      const raceTpl = RACE_TEMPLATES[race];
      const baseW = raceTpl.body.width;
      const baseH = raceTpl.body.height;

      const scale = Math.min(previewCanvas.width / baseW, previewCanvas.height / baseH);
      const offsetX = Math.floor((previewCanvas.width - baseW * scale) / 2);
      const offsetY = Math.floor((previewCanvas.height - baseH * scale) / 2);

      const pixelW = baseW * scale;
      const pixelH = baseH * scale;
      const imageData = srcCtx.getImageData(offsetX, offsetY, pixelW, pixelH);

      const exportPromise = new Promise<Blob | null>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('导出超时'));
        }, 10000);

        worker.onmessage = (e: MessageEvent) => {
          clearTimeout(timeout);
          if (e.data.type === 'export-complete') {
            if (e.data.error) {
              reject(new Error(e.data.error));
            } else {
              resolve(e.data.blob ?? null);
            }
          }
        };

        worker.onerror = (err) => {
          clearTimeout(timeout);
          reject(new Error(err.message));
        };

        worker.postMessage(
          {
            type: 'export',
            width: imageData.width,
            height: imageData.height,
            pixelBuffer: new Uint8ClampedArray(imageData.data),
            targetSize: EXPORT_SIZE,
          },
          [imageData.data.buffer],
        );
      });

      const blob = await exportPromise;
      if (!blob) {
        throw new Error('导出失败');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixel-character-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('导出失败:', err);
      alert(err instanceof Error ? err.message : '导出精灵图失败');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, race]);

  const character = { race, characterClass, colors };

  return (
    <div className="app-root">
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <main className="layout">
        <section className="preview-section">
          <div className="section-header">
            <h1 className="page-title">
              <span className="title-line">PIXEL</span>
              <span className="title-line accent">CHARACTER</span>
              <span className="title-line">GENERATOR</span>
            </h1>
          </div>

          <div className="preview-stage">
            <CharacterPreview
              character={character}
              hairIndex={hairIndex}
              visibility={visibility}
            />
          </div>

          <div className="status-row">
            <div className="status-item">
              <span className="status-label">种族</span>
              <span className="status-value">{race.toUpperCase()}</span>
            </div>
            <div className="status-divider" />
            <div className="status-item">
              <span className="status-label">职业</span>
              <span className="status-value">{characterClass.toUpperCase()}</span>
            </div>
            <div className="status-divider" />
            <div className="status-item">
              <span className="status-label">尺寸</span>
              <span className="status-value">{EXPORT_SIZE}×{EXPORT_SIZE}</span>
            </div>
          </div>
        </section>

        <ControlPanel
          race={race}
          characterClass={characterClass}
          colors={colors}
          activePart={activePart}
          isAnimating={isAnimating}
          isExporting={isExporting}
          onRaceChange={handleRaceChange}
          onClassChange={handleClassChange}
          onActivePartChange={handlePartChange}
          onColorChange={handleColorChange}
          onRandomize={runRandomizeAnimation}
          onExport={handleExport}
        />
      </main>
    </div>
  );
}
