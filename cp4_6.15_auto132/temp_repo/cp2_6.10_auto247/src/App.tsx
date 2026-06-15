import { LeftPanel, RightPanel } from './components/Panel'
import Canvas from './components/Canvas'

export default function App() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      background: '#f5f5f0'
    }}>
      <LeftPanel />
      <Canvas />
      <RightPanel />
    </div>
  )
}
