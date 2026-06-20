import { useState, createContext, useContext } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import type { VoteContextType, EventData } from './types'

const VoteContext = createContext<VoteContextType | undefined>(undefined)

export const useVoteContext = () => {
  const context = useContext(VoteContext)
  if (!context) {
    throw new Error('useVoteContext 必须在 VoteProvider 内使用')
  }
  return context
}

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return '首页'
  if (pathname === '/create') return '创建活动'
  if (pathname.startsWith('/vote')) return '投票页面'
  if (pathname.startsWith('/results')) return '结果页面'
  return ''
}

export default function App() {
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null)
  const [votedSlotId, setVotedSlotId] = useState<string | null>(null)
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <VoteContext.Provider value={{ currentEvent, setCurrentEvent, votedSlotId, setVotedSlotId }}>
      <div className="app-container">
        <Navbar pageTitle={pageTitle} />
        <main className="page-fade-in">
          <Outlet />
        </main>
      </div>
    </VoteContext.Provider>
  )
}
