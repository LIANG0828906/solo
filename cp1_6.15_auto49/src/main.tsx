import React from 'react'
import ReactDOM from 'react-dom/client'
import Stage from './Stage'
import ControlPanel from './ControlPanel'
import './styles.css'

function App() {
  return (
    <div className="app-container">
      <Stage />
      <ControlPanel />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
