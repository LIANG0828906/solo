import { useState, useEffect, useCallback } from 'react'
import PageHome from './PageHome'
import PagePersonal from './PagePersonal'

type Page = 'home' | 'personal'

export interface Bottle {
  id: string
  text: string
  imageUrl?: string
  createdAt: string
  feedbackEmoji: {
    encourage: number
    speechlessness: number
  }
  createdBy?: string
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [userId] = useState(() => {
    const stored = localStorage.getItem('bottle_user_id')
    if (stored) return stored
    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('bottle_user_id', newId)
    return newId
  })
  const [caughtBottles, setCaughtBottles] = useState<Bottle[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(`caught_bottles_${userId}`)
    if (stored) {
      setCaughtBottles(JSON.parse(stored))
    }
  }, [userId])

  useEffect(() => {
    localStorage.setItem(`caught_bottles_${userId}`, JSON.stringify(caughtBottles))
  }, [caughtBottles, userId])

  const addCaughtBottle = useCallback((bottle: Bottle) => {
    setCaughtBottles(prev => {
      if (prev.find(b => b.id === bottle.id)) return prev
      return [bottle, ...prev]
    })
  }, [])

  const removeCaughtBottle = useCallback((bottleId: string) => {
    setCaughtBottles(prev => prev.filter(b => b.id !== bottleId))
  }, [])

  const updateBottleFeedback = useCallback((bottleId: string, emoji: 'encourage' | 'speechlessness') => {
    setCaughtBottles(prev => prev.map(b => {
      if (b.id === bottleId) {
        return {
          ...b,
          feedbackEmoji: {
            ...b.feedbackEmoji,
            [emoji]: b.feedbackEmoji[emoji] + 1
          }
        }
      }
      return b
    }))
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {currentPage === 'home' && (
        <PageHome
          userId={userId}
          onCaughtBottle={addCaughtBottle}
          onUpdateFeedback={updateBottleFeedback}
          onGoToPersonal={() => setCurrentPage('personal')}
        />
      )}
      {currentPage === 'personal' && (
        <PagePersonal
          userId={userId}
          caughtBottles={caughtBottles}
          onRemoveBottle={removeCaughtBottle}
          onGoBack={() => setCurrentPage('home')}
        />
      )}
    </div>
  )
}

export default App
