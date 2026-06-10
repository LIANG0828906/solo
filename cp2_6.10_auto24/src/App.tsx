import BattleField from './components/BattleField'
import ControlPanel from './components/ControlPanel'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 py-8">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-amber-400 mb-2 text-center drop-shadow-lg">
          霹雳车 - 投石机瞄准模拟
        </h1>
        <p className="text-amber-200 mb-6 text-center">
          三国时期 · 曹魏军中霹雳车匠师
        </p>

        <div className="mb-6">
          <BattleField />
        </div>

        <div>
          <ControlPanel />
        </div>

        <div className="mt-8 text-gray-400 text-sm text-center max-w-2xl">
          <p className="mb-2">⚔️ 游戏说明：</p>
          <p>调整配重重量（影响射程）和发射角度，配合风向后发射石弹。</p>
          <p>击中不同目标可获得100分，连续击中3次触发金色连击特效。</p>
          <p>累计300分解锁更高难度关卡：羊马墙（更厚的城墙）和瓮城（双重城墙）。</p>
        </div>
      </div>
    </div>
  )
}

export default App
