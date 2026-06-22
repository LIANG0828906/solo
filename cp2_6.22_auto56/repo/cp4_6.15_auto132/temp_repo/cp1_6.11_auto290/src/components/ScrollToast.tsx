import { useEffect, useState } from 'react'

interface ScrollToastProps {
  message: string
  visible: boolean
}

export default function ScrollToast({ message, visible }: ScrollToastProps) {
  const [animClass, setAnimClass] = useState('')

  useEffect(() => {
    if (visible) {
      setAnimClass('scroll-toast-enter')
      const timer = setTimeout(() => {
        setAnimClass('scroll-toast-exit')
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setAnimClass('')
    }
  }, [visible])

  if (!visible && !animClass) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className={`overflow-hidden ${animClass}`}
        style={{ maxWidth: '400px', width: '90%' }}
      >
        <div
          className="flex items-center justify-center py-4 px-6 rounded-b-lg"
          style={{
            backgroundColor: '#8B0000',
            color: '#FFF8DC',
            fontFamily: "'LiSu', 'STLiti', serif",
            fontSize: '1.2rem',
            letterSpacing: '0.1em',
            boxShadow: '0 4px 12px rgba(139,0,0,0.4)',
          }}
        >
          <span
            style={{
              borderLeft: '3px solid #D4AF37',
              borderRight: '3px solid #D4AF37',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            {message}
          </span>
        </div>
      </div>
    </div>
  )
}
