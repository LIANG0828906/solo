import GameScene from './components/GameScene'
import UIOverlay from './components/UIOverlay'

export default function App() {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#0B0C1E',
    }}>
      <GameScene />
      <UIOverlay />
    </div>
  )
}
