import { useGameStore } from '../store/useGameStore'

export default function ControlPanel() {
  const {
    counterweight,
    setCounterweight,
    launchAngle,
    setLaunchAngle,
    isFiring,
    isProjectileFlying,
    startFiring,
    targets,
    currentTargetId,
    setCurrentTarget,
    generateRandomWind,
    wind,
    resetTargets,
    consecutiveHits
  } = useGameStore()

  const handleFire = () => {
    if (!isFiring && !isProjectileFlying) {
      startFiring()
    }
  }

  return (
    <div className="bg-gradient-to-r from-amber-900 to-amber-800 p-6 rounded-lg shadow-xl border-4 border-amber-700" style={{ width: '1000px' }}>
      <h2 className="text-2xl font-bold text-amber-100 mb-4 text-center">霹雳车控制台</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-950/50 p-4 rounded-lg">
          <label className="block text-amber-200 mb-2 font-semibold">
            配重重量: <span className="text-yellow-400 text-xl">{counterweight} 斤</span>
          </label>
          <input
            type="range"
            min="200"
            max="800"
            step="50"
            value={counterweight}
            onChange={(e) => setCounterweight(Number(e.target.value))}
            disabled={isFiring || isProjectileFlying}
            className="w-full h-3 bg-amber-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              accentColor: '#fbbf24'
            }}
          />
          <div className="flex justify-between text-xs text-amber-400 mt-1">
            <span>200斤</span>
            <span>500斤</span>
            <span>800斤</span>
          </div>
        </div>

        <div className="bg-amber-950/50 p-4 rounded-lg">
          <label className="block text-amber-200 mb-2 font-semibold">
            发射角度: <span className="text-yellow-400 text-xl">{launchAngle}°</span>
          </label>
          <input
            type="range"
            min="25"
            max="65"
            step="1"
            value={launchAngle}
            onChange={(e) => setLaunchAngle(Number(e.target.value))}
            disabled={isFiring || isProjectileFlying}
            className="w-full h-3 bg-amber-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              accentColor: '#fbbf24'
            }}
          />
          <div className="flex justify-between text-xs text-amber-400 mt-1">
            <span>25°</span>
            <span>45°</span>
            <span>65°</span>
          </div>
        </div>

        <div className="bg-amber-950/50 p-4 rounded-lg flex flex-col justify-center items-center">
          <div className="text-amber-200 mb-2 font-semibold text-center">
            当前风向: <span className="text-yellow-400">{wind.direction === 'right' ? '东风 →' : '← 西风'}</span>
            <span className="text-yellow-400 ml-2">{wind.speed}级</span>
          </div>
          <button
            onClick={generateRandomWind}
            disabled={isFiring || isProjectileFlying}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            观测风向
          </button>
        </div>
      </div>

      <div className="mt-6 bg-amber-950/50 p-4 rounded-lg">
        <h3 className="text-amber-200 font-semibold mb-3">选择攻击目标</h3>
        <div className="flex flex-wrap gap-3">
          {targets.map((target) => (
            <button
              key={target.id}
              onClick={() => !target.destroyed && setCurrentTarget(target.id)}
              disabled={target.destroyed || isFiring || isProjectileFlying}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentTargetId === target.id
                  ? 'bg-yellow-500 text-amber-900 ring-2 ring-yellow-300'
                  : target.destroyed
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-700 text-amber-100 hover:bg-amber-600'
              }`}
            >
              {target.name}
              {target.destroyed && ' (已摧毁)'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-6 items-center">
        {consecutiveHits >= 3 && (
          <div className="text-yellow-400 font-bold text-xl animate-pulse">
            🔥 连击 x{consecutiveHits}! 🔥
          </div>
        )}

        <button
          onClick={handleFire}
          disabled={isFiring || isProjectileFlying}
          className="px-12 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xl font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-red-800"
        >
          {isFiring || isProjectileFlying ? '发射中...' : '发 射!'}
        </button>

        <button
          onClick={resetTargets}
          disabled={isFiring || isProjectileFlying}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          重置目标
        </button>
      </div>

      <div className="mt-4 text-center text-amber-300 text-sm">
        提示: 调整配重和角度后，白色虚线为预测弹道。命中目标加100分，连续命中3次触发连击特效！
      </div>
    </div>
  )
}
