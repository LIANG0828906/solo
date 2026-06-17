import { ParticleScene } from '@/components/ParticleScene'
import { AudioPlayer } from '@/components/AudioPlayer'
import { ParameterPanel } from '@/components/ParameterPanel'

function App() {
  return (
    <div className="app">
      <div className="app-bg" />
      <ParameterPanel />
      <ParticleScene />
      <AudioPlayer />
    </div>
  )
}

export default App
