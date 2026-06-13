import useSimulationStore from '@/store/useSimulationStore';
import {
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Camera,
  ChevronLeft,
  ChevronRight,
  Zap,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';

export default function ControlPanel() {
  const {
    gravitySources,
    isRunning,
    speedScale,
    showPotentialGrid,
    showFieldIndicators,
    panelCollapsed,
    selectedSourceId,
    removeGravitySource,
    updateSourceMass,
    setSelectedSourceId,
    releaseParticle,
    toggleRunning,
    reset,
    setSpeedScale,
    togglePotentialGrid,
    toggleFieldIndicators,
    togglePanel,
  } = useSimulationStore();

  return (
    <div
      className="absolute left-0 top-0 bottom-0 flex flex-col overflow-y-auto transition-all duration-300 z-[100]"
      style={{
        width: panelCollapsed ? 60 : 320,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(15px)',
        borderRight: '1px solid rgba(255,255,255,0.2)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#00d4ff transparent',
        fontFamily: "'Rajdhani', sans-serif",
      }}
    >
      <style>{`
        div::-webkit-scrollbar { width: 4px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: #00d4ff; border-radius: 2px; }
      `}</style>

      {!panelCollapsed ? (
        <>
          <div className="relative px-5 pt-5 pb-3">
            <h1
              className="text-lg tracking-widest text-[#00d4ff]"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              VORTEXPATH
            </h1>
            <button
              onClick={togglePanel}
              className="absolute top-4 right-4 p-1.5 rounded-xl transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] text-[#00d4ff] hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                引力源
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                点击场景添加
              </span>
            </div>

            <div className="space-y-2">
              {gravitySources.map((source) => (
                <div
                  key={source.id}
                  onClick={() =>
                    setSelectedSourceId(
                      selectedSourceId === source.id ? null : source.id
                    )
                  }
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                    selectedSourceId === source.id
                      ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.1)]'
                      : 'border-white/10 bg-[rgba(255,255,255,0.05)] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background:
                            source.mass >= 0 ? '#00d4ff' : '#ff4444',
                        }}
                      />
                      <span className="text-white/80 text-sm">
                        质量: {source.mass}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGravitySource(source.id);
                      }}
                      className="p-1 rounded-lg text-white/40 hover:text-red-400 transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={1}
                    value={source.mass}
                    onChange={(e) =>
                      updateSourceMass(source.id, Number(e.target.value))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ff4444 0%, #444444 50%, #00d4ff 100%)`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 pb-4">
            <span className="text-sm font-semibold text-white/80 uppercase tracking-wider block mb-3">
              模拟控制
            </span>
            <div className="space-y-2">
              <button
                onClick={releaseParticle}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00d4ff] hover:bg-[#33e0ff] active:bg-[#00a8cc] text-[#1a1a2e] font-semibold shadow-lg transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
              >
                <Zap size={16} />
                释放质点
              </button>
              <div className="flex gap-2">
                <button
                  onClick={toggleRunning}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                >
                  {isRunning ? <Pause size={16} /> : <Play size={16} />}
                  {isRunning ? '暂停' : '继续'}
                </button>
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
                >
                  <RotateCcw size={16} />
                  重置
                </button>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/60 text-xs">速度缩放</span>
                  <span className="text-[#00d4ff] text-xs">
                    {speedScale.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={speedScale}
                  onChange={(e) => setSpeedScale(Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer accent-[#00d4ff]"
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            <span className="text-sm font-semibold text-white/80 uppercase tracking-wider block mb-3">
              可视化
            </span>
            <div className="space-y-2">
              <button
                onClick={togglePotentialGrid}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-white/10 hover:border-white/20 text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
              >
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-[#00d4ff]" />
                  <span className="text-sm">等势能面</span>
                </div>
                {showPotentialGrid ? (
                  <Eye size={16} className="text-[#00d4ff]" />
                ) : (
                  <EyeOff size={16} className="text-white/40" />
                )}
              </button>
              <button
                onClick={toggleFieldIndicators}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-white/10 hover:border-white/20 text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
              >
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-[#00d4ff]" />
                  <span className="text-sm">力场指示</span>
                </div>
                {showFieldIndicators ? (
                  <Eye size={16} className="text-[#00d4ff]" />
                ) : (
                  <EyeOff size={16} className="text-white/40" />
                )}
              </button>
            </div>
          </div>

          <div className="px-5 pb-5 mt-auto">
            <span className="text-sm font-semibold text-white/80 uppercase tracking-wider block mb-3">
              导出
            </span>
            <div className="space-y-2">
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-white/10 hover:border-white/20 text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
              >
                <Camera size={16} className="text-[#00d4ff]" />
                导出截图
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-white/10 hover:border-white/20 text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
              >
                <Download size={16} className="text-[#00d4ff]" />
                导出轨迹数据
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center pt-5 gap-3">
          <button
            onClick={togglePanel}
            className="p-2 rounded-xl transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] text-[#00d4ff] hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={releaseParticle}
            className="p-2 rounded-xl bg-[#00d4ff] text-[#1a1a2e] transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            title="释放质点"
          >
            <Zap size={18} />
          </button>
          <button
            onClick={toggleRunning}
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.1)] text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            title={isRunning ? '暂停' : '继续'}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={reset}
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.1)] text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            title="重置"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={togglePotentialGrid}
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.1)] text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            title="等势能面"
          >
            <Layers size={18} />
          </button>
          <button
            onClick={toggleFieldIndicators}
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.1)] text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            title="力场指示"
          >
            {showFieldIndicators ? (
              <Eye size={18} />
            ) : (
              <EyeOff size={18} />
            )}
          </button>
          <button
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.1)] text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            title="导出截图"
          >
            <Camera size={18} />
          </button>
          <button
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.1)] text-white transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            title="导出轨迹数据"
          >
            <Download size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
