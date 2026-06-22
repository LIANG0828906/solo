import { useEffect, useState } from 'react'
import Scene from './components/Scene'
import Sidebar from './components/Sidebar'

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        background: 'linear-gradient(to bottom, #0d0d2b, #1a1a3e)',
        position: 'relative',
      }}
    >
      <div
        style={{
          flex: isMobile ? '1' : '0 0 70%',
          width: '100%',
          height: isMobile ? 'calc(100% - 60px)' : '100%',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Scene />
      </div>
      <Sidebar isMobile={isMobile} />
    </div>
  )
}

export default App
