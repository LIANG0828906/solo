import { Plus, RotateCcw, Radio, Activity } from 'lucide-react'
import { useNodeStore } from '@/hooks/useNodeStore'
import { useAudio } from '@/hooks/useAudio'

export const ControlPanel = () => {
  const {
    signalStrength,
    mode,
    setSignalStrength,
    setMode,
    resetCamera,
    connectingFrom,
    setConnectingFrom
  } = useNodeStore()

  const { initAudioContext, playSynthSound } = useAudio()

  const handleAddNode = () => {
    initAudioContext()
    playSynthSound()
    const randomPos: [number, number, number] = [
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 5
    ]
    useNodeStore.getState().addNode(randomPos)
  }

  const handleResetCamera = () => {
    initAudioContext()
    resetCamera()
  }

  const handleCancelConnection = () => {
    setConnectingFrom(null)
  }

  return (
    <div className="fixed left-6 bottom-6 z-10">
      <div className="backdrop-blur-xl bg-black/40 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl shadow-cyan-500/10 min-w-[280px]">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-cyan-400 font-bold text-sm tracking-widest uppercase">
            控制面板
          </h2>
        </div>

        <div className="space-y-5">
          <button
            onClick={handleAddNode}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/50 hover:border-cyan-400 rounded-xl transition-all duration-300 group"
          >
            <Plus className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-cyan-300 font-medium">生成光讯节点</span>
          </button>

          {connectingFrom && (
            <button
              onClick={handleCancelConnection}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-400 rounded-xl transition-all duration-300"
            >
              <span className="text-red-300 text-sm">取消连线</span>
            </button>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-purple-300 text-sm font-medium flex items-center gap-2">
                <Radio className="w-4 h-4" />
                信号强度
              </label>
              <span className="text-cyan-400 font-mono text-sm bg-cyan-500/10 px-2 py-0.5 rounded">
                {signalStrength}%
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={signalStrength}
                onChange={(e) => setSignalStrength(Number(e.target.value))}
                className="w-full h-2 bg-gray-800/50 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #00d4ff 0%, #a855f7 ${signalStrength}%, #1f2937 ${signalStrength}%, #1f2937 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>微弱</span>
              <span>强烈</span>
            </div>
          </div>

          <button
            onClick={handleResetCamera}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500 rounded-xl transition-all duration-300 group"
          >
            <RotateCcw className="w-4 h-4 text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-gray-300 text-sm">重置视角</span>
          </button>

          <div className="pt-3 border-t border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                显示模式
              </span>
            </div>
            <div className="flex bg-gray-800/50 rounded-xl p-1">
              <button
                onClick={() => setMode('normal')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  mode === 'normal'
                    ? 'bg-gradient-to-r from-cyan-500/30 to-cyan-500/10 text-cyan-300 border border-cyan-500/50'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                普通模式
              </button>
              <button
                onClick={() => setMode('spectrum')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  mode === 'spectrum'
                    ? 'bg-gradient-to-r from-purple-500/30 to-purple-500/10 text-purple-300 border border-purple-500/50'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                频谱模式
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 leading-relaxed">
            💡 <span className="text-gray-400">点击场景空白处创建节点</span>
            <br />
            🔗 <span className="text-gray-400">按下节点拖拽到另一节点连线</span>
            <br />
            ✨ <span className="text-gray-400">点击节点触发脉冲效果</span>
          </p>
        </div>
      </div>
    </div>
  )
}
