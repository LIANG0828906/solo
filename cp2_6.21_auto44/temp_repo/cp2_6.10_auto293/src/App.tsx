import { Scene } from './components/Scene'
import { ControlPanel } from './components/ControlPanel'
import { LogPanel } from './components/LogPanel'

function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a1a]">
      <div className="absolute inset-0">
        <Scene />
      </div>

      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex justify-center pt-6">
          <div className="backdrop-blur-xl bg-black/30 border border-cyan-500/20 rounded-full px-8 py-3 shadow-2xl shadow-cyan-500/5">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent tracking-wider">
              ✦ 光语星图 ✦
            </h1>
            <p className="text-center text-xs text-gray-500 mt-1 tracking-widest">
              STELLAR COMMUNICATION MATRIX
            </p>
          </div>
        </div>
      </div>

      <ControlPanel />
      <LogPanel />

      <div className="absolute top-6 right-6 z-10">
        <div className="backdrop-blur-xl bg-black/30 border border-gray-700/30 rounded-xl px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-400 text-xs">60 FPS</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-gray-400 text-xs">光讯网络在线</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
