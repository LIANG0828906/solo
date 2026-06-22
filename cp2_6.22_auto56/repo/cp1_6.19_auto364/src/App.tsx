import { useState } from 'react'
import NavBar from '@/components/NavBar'
import CardBrowser from '@/components/CardBrowser'
import ReviewSession from '@/components/ReviewSession'
import StatsChart from '@/components/StatsChart'
import { useDeckStore } from '@/stores/deckStore'

export type Page = 'browser' | 'review' | 'stats'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('browser')
  const selectedDeckId = useDeckStore((s) => s.selectedDeckId)
  const selectDeck = useDeckStore((s) => s.selectDeck)

  const handleNavigate = (page: Page) => {
    if (page !== 'review') {
      selectDeck(null)
    }
    setCurrentPage(page)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f23',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <NavBar currentPage={currentPage} onNavigate={handleNavigate} />
      <main
        style={{
          flex: 1,
          padding: '32px 24px',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto'
        }}
      >
        {currentPage === 'browser' && (
          <CardBrowser
            onStartReview={(deckId) => {
              selectDeck(deckId)
              setCurrentPage('review')
            }}
          />
        )}
        {currentPage === 'review' && selectedDeckId && (
          <ReviewSession
            onBack={() => {
              selectDeck(null)
              setCurrentPage('browser')
            }}
          />
        )}
        {currentPage === 'stats' && <StatsChart />}
      </main>
    </div>
  )
}
