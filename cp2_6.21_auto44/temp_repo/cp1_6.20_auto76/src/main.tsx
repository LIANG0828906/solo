import React from 'react'
import ReactDOM from 'react-dom/client'
import { ColorStateProvider } from '@ColorModule/ColorStateContext'
import TuningPanel from '@UIModule/TuningPanel'
import UploadPanel from '@UIModule/UploadPanel'
import CollectionsDrawer from '@UIModule/CollectionsDrawer'
import './styles/global.css'

const App: React.FC = () => {
  return (
    <ColorStateProvider>
      <div className="app-container">
        <TuningPanel />
        <UploadPanel />
        <CollectionsDrawer />
      </div>
    </ColorStateProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
