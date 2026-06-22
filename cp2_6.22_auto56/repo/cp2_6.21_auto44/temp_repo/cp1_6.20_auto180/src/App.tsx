import { useState } from 'react'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'

function App() {
  const [time, setTime] = useState(12)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Scene time={time} />
      <ControlPanel time={time} onTimeChange={setTime} />
    </div>
  )
}

export default App
