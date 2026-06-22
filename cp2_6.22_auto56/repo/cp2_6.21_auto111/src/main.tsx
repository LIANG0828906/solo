import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App'
import './index.css'
import * as socket from './utils/socket'
import { usePollStore } from './store/pollStore'

function Root() {
  const setSocketConnected = usePollStore((state) => state.setSocketConnected)

  useEffect(() => {
    socket.connect()

    const checkInterval = setInterval(() => {
      setSocketConnected(socket.getConnectionStatus())
    }, 1000)

    return () => {
      clearInterval(checkInterval)
    }
  }, [setSocketConnected])

  return (
    <Router>
      <App />
    </Router>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
