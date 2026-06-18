import { useRef, useState } from 'react';
import { useSoundStore } from '@/store/useSoundStore';
import { CityScene } from '@/scenes/CityScene';
import { SOUND_PRESETS } from '@/engine/SoundBlock';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const TOTAL = 3;

export function RecordDiscs({ canvasRef }: Props): JSX.Element {
  const { overlayUsed, addBlockByPresetId, currentAuthor } = useSoundStore();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragInfoRef = useRef<{ idx: number; pointerId: number; overlay: HTMLDivElement | null } | null>(null);

  const usedSlots = Array.from({ length: TOTAL }, (_, i) => i < overlayUsed);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    if (usedSlots[idx]) return;
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
    const overlay = document.createElement('div');
    overlay.className = 'record-disc';
    overlay.style.position = 'fixed';
    overlay.style.left = `${e.clientX - 20}px`;
    overlay.style.top = `${e.clientY - 20}px`;
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';
    document.body.appendChild(overlay);
    dragInfoRef.current = { idx, pointerId: e.pointerId, overlay };
    setDragIdx(idx);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current || e.pointerId !== dragInfoRef.current.pointerId) return;
    const ov = dragInfoRef.current.overlay;
    if (ov) {
      ov.style.left = `${e.clientX - 20}px`;
      ov.style.top = `${e.clientY - 20}px`;
    }
  };

  const findNearestHotspot = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return null;
    const direct = CityScene.getHotspotAtPoint(clientX, clientY, canvasRef.current);
    if (direct) return direct;
    const rect = canvasRef.current.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    let nearest: { h: typeof CityScene['hotspots'][number]; d: number } | null = null;
    for (const h of CityScene.hotspots) {
      const d = (h.x - px) ** 2 + (h.y - py) ** 2;
      if (!nearest || d < nearest.d) nearest = { h, d };
    }
    return nearest && nearest.d < 0.08 ? nearest.h : null;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const info = dragInfoRef.current;
    if (!info || e.pointerId !== info.pointerId) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    const target = findNearestHotspot(e.clientX, e.clientY);
    if (info.overlay) info.overlay.remove();
    dragInfoRef.current = null;
    setDragIdx(null);
    if (target) {
      const preset = SOUND_PRESETS.find((p) => p.category === target.category);
      if (preset) addBlockByPresetId(preset.id, target.id, true);
    }
  };

  if (!currentAuthor) return <></>;

  return (
    <div className="records-area">
      {Array.from({ length: TOTAL }).map((_, i) => (
        <div
          key={i}
          className={`record-disc ${usedSlots[i] ? 'used' : ''} ${dragIdx === i ? 'dragging' : ''}`}
          title={usedSlots[i] ? '已叠加' : '拖拽到场景光点上叠加音效'}
          onPointerDown={(e) => onPointerDown(e, i)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      ))}
    </div>
  );
}
