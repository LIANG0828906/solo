import { useEffect } from 'react'
import MirrorView from './components/MirrorView'
import { useStore } from './store'

export default function App() {
  const loadRecords = useStore((s) => s.addMessage)

  useEffect(() => {
    fetch('/api/records')
      .then((r) => r.json())
      .then((data) => {
        data.records?.forEach((r: any) => {
          loadRecords(r)
        })
      })
      .catch(() => {})
  }, [loadRecords])

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <MirrorView />
    </div>
  )
}
