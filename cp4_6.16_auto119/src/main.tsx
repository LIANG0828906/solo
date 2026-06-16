import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { useMoodStore, loadRecordsFromDB } from './store'
import './styles/global.css'

async function initApp() {
  const records = await loadRecordsFromDB()
  useMoodStore.getState().setRecords(records)
}

initApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
})
