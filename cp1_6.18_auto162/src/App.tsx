import { useEffect } from 'react'
import StarCanvas from './ui/starCanvas'
import { useUserStore } from './stores/userStore'

export default function App() {
  const loadFromHash = useUserStore((s) => s.loadFromHash)

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (hash) {
      loadFromHash(decodeURIComponent(hash))
    }
  }, [loadFromHash])

  return <StarCanvas />
}
