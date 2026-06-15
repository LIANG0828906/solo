import { SunAnalysis } from './components/SunAnalysis/SunAnalysis'
import { Controls } from './components/Controls/Controls'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <div className="app-sidebar">
        <Controls />
      </div>
      <div className="app-main">
        <SunAnalysis />
      </div>
    </div>
  )
}

export default App
