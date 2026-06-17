import React from 'react';
import { usePixelStore, SceneElement } from '../store';
import { assetManager } from '../AssetManager';
import { sceneEditor } from '../SceneEditor';

export const PropertyPanel: React.FC = () => {
  const selectedElementId = usePixelStore(s => s.selectedElementId);
  const frames = usePixelStore(s => s.frames);
  const currentFrameIndex = usePixelStore(s => s.currentFrameIndex);
  const isPlaying = usePixelStore(s => s.isPlaying);
  const updateElement = usePixelStore(s => s.updateElement);
  const removeElement = usePixelStore(s => s.removeElement);

  if (isPlaying || !selectedElementId) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{
          width: 200,
          background: '#1E2024',
          borderRadius: 8,
          color: '#555A60',
          fontSize: 13,
        }}
      >
        {!isPlaying ? '点击画布元素查看属性' : '播放中无法编辑'}
      </div>
    );
  }

  const currentFrame = frames[currentFrameIndex];
  const element = currentFrame?.elements.find((el: SceneElement) => el.id === selectedElementId);
  if (!element) return null;

  const asset = assetManager.getAsset(element.assetId);

  const handleUpdate = (updates: Partial<SceneElement>) => {
    updateElement(element.id, updates);
  };

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: 200,
        background: '#1E2024',
        borderRadius: 8,
        color: '#E0E0E0',
      }}
    >
      <div className="p-3 border-b" style={{ borderColor: '#3A3D42' }}>
        <div className="text-sm font-bold" style={{ color: '#F5A623' }}>
          {asset?.name ?? '未知素材'}
        </div>
        <div className="text-xs mt-1" style={{ color: '#888' }}>
          {asset?.category === 'sprite' ? '精灵' : asset?.category === 'prop' ? '道具' : '气泡'}
        </div>
      </div>

      <div className="p-3 space-y-4">
        <div>
          <label className="text-xs block mb-1" style={{ color: '#BB86FC' }}>
            坐标 (格子)
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs" style={{ color: '#888' }}>X</label>
              <input
                type="number"
                min={0}
                max={31}
                value={element.x}
                className="w-full mt-1 px-2 py-1 text-sm rounded"
                style={{
                  background: '#2A2C30',
                  color: '#E0E0E0',
                  border: '1px solid #555A60',
                  outline: 'none',
                }}
                onChange={(e) => handleUpdate({ x: Math.max(0, Math.min(31, parseInt(e.target.value) || 0)) })}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs" style={{ color: '#888' }}>Y</label>
              <input
                type="number"
                min={0}
                max={31}
                value={element.y}
                className="w-full mt-1 px-2 py-1 text-sm rounded"
                style={{
                  background: '#2A2C30',
                  color: '#E0E0E0',
                  border: '1px solid #555A60',
                  outline: 'none',
                }}
                onChange={(e) => handleUpdate({ y: Math.max(0, Math.min(31, parseInt(e.target.value) || 0)) })}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs block mb-1" style={{ color: '#BB86FC' }}>
            缩放 ({element.scale}x)
          </label>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.25}
            value={element.scale}
            className="w-full"
            style={{ accentColor: '#F5A623' }}
            onChange={(e) => handleUpdate({ scale: parseFloat(e.target.value) })}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: '#888' }}>
            <span>0.5x</span>
            <span>2.0x</span>
          </div>
        </div>

        <div>
          <label className="text-xs block mb-1" style={{ color: '#BB86FC' }}>
            透明度 ({element.opacity}%)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={element.opacity}
            className="w-full"
            style={{
              accentColor: '#BB86FC',
              background: `linear-gradient(to right, rgba(187,134,252,0.2), rgba(187,134,252,1))`,
            }}
            onChange={(e) => handleUpdate({ opacity: parseInt(e.target.value) })}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: '#888' }}>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <button
          className="w-full py-2 text-sm rounded transition-all duration-200"
          style={{
            background: '#e74c3c',
            color: '#fff',
            borderRadius: 6,
          }}
          onClick={() => {
            removeElement(element.id);
            sceneEditor.selectElement(null);
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          删除元素
        </button>
      </div>
    </div>
  );
};
