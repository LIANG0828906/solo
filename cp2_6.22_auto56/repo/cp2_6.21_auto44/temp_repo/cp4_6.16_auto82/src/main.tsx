import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useStore } from './store'
import './index.css'

function Root() {
  const initStore = useStore(s => s.initStore)
  const initialized = useStore(s => s.initialized)

  useEffect(() => {
    initStore()
  }, [initStore])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-bark-muted font-sans text-sm animate-pulse">加载中...</div>
      </div>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
