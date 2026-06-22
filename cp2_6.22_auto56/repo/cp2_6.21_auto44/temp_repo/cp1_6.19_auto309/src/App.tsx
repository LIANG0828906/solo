import { TimerPanel } from './components/TimerPanel'
import { InterruptLog } from './components/InterruptLog'
import { DailyReport } from './components/DailyReport'
import './styles.css'

function App() {
  return (
    <div className="app-container">
      <div className="app-title">专注实验室</div>
      <TimerPanel />
      <InterruptLog />
      <DailyReport />
    </div>
  )
}

export default App
