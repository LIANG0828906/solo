import { GameCanvas } from './ui/GameCanvas'
import { Hud } from './ui/Hud'

export default function App() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#0A0E27',
        minWidth: 900,
      }}
    >
      <GameCanvas />
      <Hud />
    </div>
  )
}
