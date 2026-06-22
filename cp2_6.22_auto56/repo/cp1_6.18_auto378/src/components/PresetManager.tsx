import { useState, useEffect, useRef } from 'react';
import { useGradientStore } from '../store/useGradientStore';
import { generateGradientCSS } from '../utils/gradientUtils';
import { Save, Trash2 } from 'lucide-react';
import type { Preset } from '../types/gradient';

export function PresetManager() {
  const { presets, savePreset, loadPreset, deletePreset } = useGradientStore();
  const [presetName, setPresetName] = useState('');
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);
  const [fadeInIds, setFadeInIds] = useState<Set<string>>(new Set());
  const prevPresetsRef = useRef<Preset[]>([]);

  useEffect(() => {
    const newIds = new Set<string>();
    presets.forEach((preset) => {
      const exists = prevPresetsRef.current.find((p) => p.id === preset.id);
      if (!exists) {
        newIds.add(preset.id);
      }
    });
    if (newIds.size > 0) {
      setFadeInIds(newIds);
      setTimeout(() => {
        setFadeInIds(new Set());
      }, 300);
    }
    prevPresetsRef.current = presets;
  }, [presets]);

  const handleSave = () => {
    const name = presetName.trim() || `预设 ${presets.length + 1}`;
    savePreset(name);
    setPresetName('');
  };

  const handleLoad = (id: string) => {
    loadPreset(id);
    setLoadedPresetId(id);
    setTimeout(() => {
      setLoadedPresetId(null);
    }, 300);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deletePreset(id);
  };

  return (
    <div className="w-full bg-[#252536] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-semibold">预设方案</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="预设名称"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="px-3 py-1.5 bg-[#1e1e2e] text-white text-sm rounded-lg border border-[#3a3a50] focus:border-[#4CAF50] focus:outline-none transition-colors w-40"
          />
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#4CAF50] text-white text-sm rounded-lg hover:bg-[#45a049] hover:-translate-y-0.5 transition-all duration-200"
          >
            <Save size={14} />
            保存
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#3a3a50] scrollbar-track-transparent"
          style={{ scrollbarWidth: 'thin' }}
        >
          {presets.length === 0 ? (
            <div className="w-full h-[120px] flex items-center justify-center text-gray-500 text-sm">
              暂无预设方案，点击保存按钮创建第一个预设
            </div>
          ) : (
            presets.map((preset) => {
              const gradientCSS = generateGradientCSS(preset.config);
              const isLoaded = loadedPresetId === preset.id;
              const isFadingIn = fadeInIds.has(preset.id);

              return (
                <div
                  key={preset.id}
                  onClick={() => handleLoad(preset.id)}
                  className={`flex-shrink-0 cursor-pointer transition-all duration-200 hover:-translate-y-1 group ${
                    isFadingIn ? 'animate-[fadeIn_0.3s_ease-out]' : ''
                  }`}
                >
                  <div
                    className={`w-[100px] h-[100px] rounded-xl mb-2 relative overflow-hidden transition-all duration-300 ${
                      isLoaded ? 'scale-95 opacity-70' : ''
                    }`}
                    style={{
                      background: gradientCSS,
                      boxShadow: isLoaded
                        ? '0 0 20px rgba(76,175,80,0.5)'
                        : '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    <button
                      onClick={(e) => handleDelete(e, preset.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/70"
                      title="删除预设"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs truncate">{preset.name}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
