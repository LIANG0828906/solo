import Controls from './ui/controls'
import InfoPanel from './ui/infoPanel'

export default function App() {
  const handleHeartRateChange = (_rate: number) => {
  }

  return (
    <div style={{ width: '100%', height: '100%', pointerEvents: 'none', position: 'relative', zIndex: 1 }}>
      <div style={{ pointerEvents: 'auto' }}>
        <Controls onHeartRateChange={handleHeartRateChange} />
        <InfoPanel />
      </div>
    </div>
  )
}
