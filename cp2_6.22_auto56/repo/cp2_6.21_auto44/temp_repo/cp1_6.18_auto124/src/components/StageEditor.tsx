import { useRef, useState, useEffect, useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import type { DragState, PropElement, Character } from '@/types';
import { getValidPosition, STAGE_WIDTH, STAGE_HEIGHT } from '@/engine/stagePhysics';
import { render as renderStage } from '@/renderer/stageRenderer';
import { X, Check, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function StageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [lightPopup, setLightPopup] = useState<{ x: number; y: number; r: number; g: number; b: number; intensity: number } | null>(null);
  const [soundPopup, setSoundPopup] = useState<{ x: number; y: number; file: File | null; name: string } | null>(null);

  const {
    props,
    characters,
    selectedElementId,
    activeTool,
    currentTime,
    addProp,
    updateProp,
    addCharacter,
    updateCharacter,
    selectElement,
    addLightKeyframe,
    addSoundKeyframe,
  } = useProjectStore();

  const rerender = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderStage(ctx, {
      props,
      characters,
      selectedElementId,
      dragState,
    });
  }, [props, characters, selectedElementId, dragState]);

  useEffect(() => {
    rerender();
  }, [rerender]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const findElementAt = (x: number, y: number): { type: 'prop' | 'character'; element: PropElement | Character } | null => {
    for (let i = props.length - 1; i >= 0; i--) {
      const prop = props[i];
      if (x >= prop.x && x <= prop.x + prop.width && y >= prop.y && y <= prop.y + prop.height) {
        return { type: 'prop', element: prop };
      }
    }
    for (let i = characters.length - 1; i >= 0; i--) {
      const char = characters[i];
      const dx = x - char.x;
      const dy = y - char.y;
      if (dx * dx + dy * dy <= 64) {
        return { type: 'character', element: char };
      }
    }
    return null;
  };

  const generateDistinctColor = (): string => {
    const existingColors = characters.map((c) => c.color);
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#FF8C42', '#6C5CE7', '#A8E6CF', '#FFD93D',
      '#FF6F91', '#00D2D3', '#FFA502', '#7BED9F', '#70A1FF',
    ];
    for (const color of colors) {
      if (!existingColors.includes(color)) return color;
    }
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 60%)`;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (activeTool === 'rect' || activeTool === 'circle') {
      const element: PropElement = {
        id: uuidv4(),
        type: activeTool === 'rect' ? 'rectangle' : 'circle',
        x: x - 30,
        y: y - 30,
        width: 60,
        height: 60,
        fillColor: activeTool === 'rect' ? '#5C6BC0' : '#EF5350',
        borderColor: '#FFFFFF',
      };
      const validPos = getValidPosition(element, element.x, element.y, props);
      element.x = validPos.x;
      element.y = validPos.y;
      addProp(element);
      selectElement(element.id);
      setDragState({
        elementId: element.id,
        startX: x,
        startY: y,
        offsetX: x - element.x,
        offsetY: y - element.y,
      });
      return;
    }

    if (activeTool === 'character') {
      const char: Character = {
        id: uuidv4(),
        name: `角色${characters.length + 1}`,
        x,
        y,
        color: generateDistinctColor(),
      };
      addCharacter(char);
      selectElement(char.id);
      setDragState({
        elementId: char.id,
        startX: x,
        startY: y,
        offsetX: 0,
        offsetY: 0,
      });
      return;
    }

    if (activeTool === 'light') {
      setLightPopup({ x: e.clientX, y: e.clientY, r: 255, g: 255, b: 255, intensity: 100 });
      return;
    }

    if (activeTool === 'sound') {
      setSoundPopup({ x: e.clientX, y: e.clientY, file: null, name: '' });
      return;
    }

    const hit = findElementAt(x, y);
    if (hit) {
      selectElement(hit.element.id);
      if (hit.type === 'prop') {
        const prop = hit.element as PropElement;
        setDragState({
          elementId: prop.id,
          startX: x,
          startY: y,
          offsetX: x - prop.x,
          offsetY: y - prop.y,
        });
      } else {
        const char = hit.element as Character;
        setDragState({
          elementId: char.id,
          startX: x,
          startY: y,
          offsetX: 0,
          offsetY: 0,
        });
      }
    } else {
      selectElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState) return;
    const { x, y } = getCanvasCoords(e);

    const prop = props.find((p) => p.id === dragState.elementId);
    if (prop) {
      const targetX = x - dragState.offsetX;
      const targetY = y - dragState.offsetY;
      const validPos = getValidPosition(prop, targetX, targetY, props);
      updateProp(prop.id, { x: validPos.x, y: validPos.y });
      return;
    }

    const char = characters.find((c) => c.id === dragState.elementId);
    if (char) {
      const clampedX = Math.max(8, Math.min(x, STAGE_WIDTH - 8));
      const clampedY = Math.max(8, Math.min(y, STAGE_HEIGHT - 8));
      updateCharacter(char.id, { x: clampedX, y: clampedY });
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  const handleLightConfirm = () => {
    if (!lightPopup) return;
    addLightKeyframe({
      id: uuidv4(),
      timestamp: currentTime,
      color: { r: lightPopup.r, g: lightPopup.g, b: lightPopup.b },
      intensity: lightPopup.intensity,
    });
    setLightPopup(null);
  };

  const handleSoundImport = async () => {
    if (!soundPopup || !soundPopup.file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const audioData = reader.result as string;
      const audio = new Audio(audioData);
      audio.addEventListener('loadedmetadata', () => {
        addSoundKeyframe({
          id: uuidv4(),
          timestamp: currentTime,
          name: soundPopup.name || soundPopup.file!.name.replace(/\.[^.]+$/, ''),
          audioData,
          duration: audio.duration * 1000,
        });
        setSoundPopup(null);
      });
    };
    reader.readAsDataURL(soundPopup.file);
  };

  return (
    <div className="relative" style={{ marginLeft: '4px' }}>
      <canvas
        ref={canvasRef}
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: `${STAGE_WIDTH}px`,
          height: `${STAGE_HEIGHT}px`,
          border: '2px solid #4A4A6A',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)',
          cursor: activeTool ? 'crosshair' : 'default',
        }}
      />

      {lightPopup && (
        <div
          style={{
            position: 'fixed',
            left: `${lightPopup.x + 10}px`,
            top: `${lightPopup.y + 10}px`,
            width: '200px',
            height: '250px',
            background: '#1E1E2E',
            borderRadius: '12px',
            padding: '16px',
            zIndex: 50,
            color: '#FFFFFF',
            fontSize: '12px',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">灯光配置</span>
            <button onClick={() => setLightPopup(null)} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-1">
                <span>R</span>
                <span>{lightPopup.r}</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={lightPopup.r}
                onChange={(e) => setLightPopup({ ...lightPopup, r: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>G</span>
                <span>{lightPopup.g}</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={lightPopup.g}
                onChange={(e) => setLightPopup({ ...lightPopup, g: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>B</span>
                <span>{lightPopup.b}</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                value={lightPopup.b}
                onChange={(e) => setLightPopup({ ...lightPopup, b: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>强度</span>
                <span>{lightPopup.intensity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={lightPopup.intensity}
                onChange={(e) => setLightPopup({ ...lightPopup, intensity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div
              style={{
                width: '100%',
                height: '32px',
                backgroundColor: `rgb(${lightPopup.r}, ${lightPopup.g}, ${lightPopup.b})`,
                borderRadius: '6px',
                opacity: lightPopup.intensity / 100,
              }}
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleLightConfirm}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white"
            >
              <Check size={14} />
              确认
            </button>
            <button
              onClick={() => setLightPopup(null)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
            >
              <X size={14} />
              取消
            </button>
          </div>
        </div>
      )}

      {soundPopup && (
        <div
          style={{
            position: 'fixed',
            left: `${soundPopup.x + 10}px`,
            top: `${soundPopup.y + 10}px`,
            width: '200px',
            height: '250px',
            background: '#1E1E2E',
            borderRadius: '12px',
            padding: '16px',
            zIndex: 50,
            color: '#FFFFFF',
            fontSize: '12px',
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">音效配置</span>
            <button onClick={() => setSoundPopup(null)} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block mb-1">音效文件</label>
              <input
                type="file"
                accept="audio/mp3,audio/wav,.mp3,.wav"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSoundPopup({
                    ...soundPopup,
                    file,
                    name: file ? soundPopup.name || file.name.replace(/\.[^.]+$/, '') : soundPopup.name,
                  });
                }}
                className="w-full text-xs"
              />
            </div>
            <div>
              <label className="block mb-1">名称</label>
              <input
                type="text"
                value={soundPopup.name}
                onChange={(e) => setSoundPopup({ ...soundPopup, name: e.target.value })}
                placeholder="音效名称"
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-white text-xs"
              />
            </div>
            {soundPopup.file && (
              <div className="text-xs text-gray-400 truncate">
                已选择: {soundPopup.file.name}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSoundImport}
              disabled={!soundPopup.file}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:opacity-50 rounded text-white"
            >
              <Upload size={14} />
              导入
            </button>
            <button
              onClick={() => setSoundPopup(null)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
            >
              <X size={14} />
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
