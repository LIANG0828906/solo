import { useCallback } from 'react';
import { Trash2, Download, Grid3X3, Palette } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { getMaterialConfig } from '@/materials/materialStore';
import { downloadJSON } from '@/utils/modelExporter';

export default function Toolbar() {
  const showGrid = useEditorStore((s) => s.showGrid);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const clearWorld = useEditorStore((s) => s.clearWorld);
  const currentMaterial = useEditorStore((s) => s.currentMaterial);
  const voxels = useEditorStore((s) => s.voxels);
  const showMaterialPanel = useEditorStore((s) => s.showMaterialPanel);
  const setShowMaterialPanel = useEditorStore((s) => s.setShowMaterialPanel);
  const toolMode = useEditorStore((s) => s.toolMode);
  const setToolMode = useEditorStore((s) => s.setToolMode);

  const config = getMaterialConfig(currentMaterial);

  const handleClear = useCallback(() => {
    if (voxels.length === 0) return;
    clearWorld();
  }, [clearWorld, voxels.length]);

  const handleExport = useCallback(() => {
    downloadJSON(voxels);
  }, [voxels]);

  const handleToggleGrid = useCallback(() => {
    setShowGrid(!showGrid);
  }, [showGrid, setShowGrid]);

  const handleToggleMaterialPanel = useCallback(() => {
    setShowMaterialPanel(!showMaterialPanel);
  }, [showMaterialPanel, setShowMaterialPanel]);

  return (
    <div className="flex flex-col gap-3 p-4 h-full md:h-auto">
      <div className="text-center md:block">
        <h1
          className="text-lg font-bold tracking-wider"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: 'linear-gradient(135deg, #00E5FF, #7C4DFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          VoxelForge
        </h1>
        <p className="text-[10px] text-gray-500 mt-0.5 hidden md:block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          3D 体素构建工具
        </p>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent hidden md:block" />

      <div className="md:block">
        <label
          className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block hidden md:block"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          工具模式
        </label>
        <div className="flex gap-1.5">
          <button
            onClick={() => setToolMode('add')}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
              toolMode === 'add'
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            放置
          </button>
          <button
            onClick={() => setToolMode('remove')}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
              toolMode === 'remove'
                ? 'bg-red-500/20 border-red-400/50 text-red-300 shadow-[0_0_10px_rgba(231,76,60,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            删除
          </button>
        </div>
        <p className="text-[9px] text-gray-500 mt-1.5 hidden md:block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {toolMode === 'add' ? '左键放置 · 右键删除' : '左键/右键点击删除'}
        </p>
      </div>

      <div className="hidden md:block">
        <label
          className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          当前材质
        </label>
        <div className="flex items-center gap-3">
          <div
            className="w-[50px] h-[50px] rounded-lg border-2 border-white/20 relative overflow-hidden shadow-lg"
            style={{
              backgroundColor: config.color,
              opacity: config.opacity,
              boxShadow:
                config.emissiveIntensity > 0
                  ? `0 0 16px ${config.color}60, inset 0 0 10px ${config.color}40, 0 4px 12px rgba(0,0,0,0.3)`
                  : '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,${config.roughness > 0.5 ? '0.08' : '0.25'}) 0%, transparent 50%, rgba(0,0,0,${config.roughness > 0.5 ? '0.15' : '0.05'}) 100%)`,
              }}
            />
            {config.emissiveIntensity > 0 && (
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${config.color}30, transparent 60%)`,
                }}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {config.name}
            </p>
            <p className="text-[10px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {config.color}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent hidden md:block" />

      <div className="hidden md:block space-y-3">
        <div>
          <button
            onClick={handleToggleGrid}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-2">
              <Grid3X3 size={14} className="text-gray-400" />
              <span className="text-xs text-gray-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                网格辅助
              </span>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                showGrid ? 'bg-[#2ECC71]' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md toggle-slider ${
                  showGrid ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
        </div>

        <div>
          <button
            onClick={handleToggleMaterialPanel}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-2">
              <Palette size={14} className="text-gray-400" />
              <span className="text-xs text-gray-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                材质面板
              </span>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                showMaterialPanel ? 'bg-[#2ECC71]' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md toggle-slider ${
                  showMaterialPanel ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent hidden md:block" />

      <div className="flex md:flex-col gap-2 flex-1 md:flex-none">
        <button
          onClick={handleExport}
          disabled={voxels.length === 0}
          className={`flex-1 md:w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border
            ${
              voxels.length === 0
                ? 'bg-gray-700/50 border-gray-600/30 text-gray-500 cursor-not-allowed'
                : 'bg-[#3498DB]/20 border-[#3498DB]/50 text-[#3498DB] hover:bg-[#3498DB]/30 hover:shadow-[0_0_15px_rgba(52,152,219,0.3)]'
            }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="flex items-center justify-center gap-2">
            <Download size={14} />
            <span className="hidden md:inline">导出 JSON</span>
          </span>
        </button>

        <button
          onClick={handleClear}
          disabled={voxels.length === 0}
          className={`flex-1 md:w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border
            ${
              voxels.length === 0
                ? 'bg-gray-700/50 border-gray-600/30 text-gray-500 cursor-not-allowed'
                : 'bg-[#E74C3C]/20 border-[#E74C3C]/50 text-[#E74C3C] hover:bg-[#E74C3C]/30 hover:shadow-[0_0_15px_rgba(231,76,60,0.3)]'
            }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="flex items-center justify-center gap-2">
            <Trash2 size={14} />
            <span className="hidden md:inline">清空世界</span>
          </span>
        </button>
      </div>

      <div className="mt-auto pt-2 hidden md:block">
        <div className="text-[9px] text-gray-500 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <p>体素: {voxels.length}</p>
          <p className="mt-1">左键操作 · 右键旋转</p>
        </div>
      </div>
    </div>
  );
}
