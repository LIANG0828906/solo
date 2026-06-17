import { useEffect } from 'react'
import Board from './components/Board'
import { useBoardStore } from './store'
import { BroadcastAction } from './types'

export default function App() {
  const loadFromDB = useBoardStore((s) => s.loadFromDB)
  const applyRemoteAction = useBoardStore((s) => s.applyRemoteAction)

  useEffect(() => {
    loadFromDB()
    const channel = new BroadcastChannel('taskpulse-sync')
    window.__taskpulse_channel__ = channel
    channel.onmessage = (event) => {
      const action = event.data as BroadcastAction
      applyRemoteAction(action)
    }
    return () => {
      channel.close()
      delete window.__taskpulse_channel__
    }
  }, [loadFromDB, applyRemoteAction])

  return (
    <div className="app-root">
      <Board />
    </div>
  )
}
