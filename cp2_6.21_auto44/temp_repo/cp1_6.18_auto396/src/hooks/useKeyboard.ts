import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

export function useKeyboard() {
  const toggleOrbits = useStore((state) => state.toggleOrbits)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'o') {
        toggleOrbits()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleOrbits])
}
