import { useState, useEffect } from 'react'
import TravelList from './components/TravelList'
import PlanDetail from './components/PlanDetail'
import type { TravelPlan, LibrarySpot } from './types'
import { spotLibrary } from './data/seed'

function App() {
  const [travels, setTravels] = useState<TravelPlan[]>([])
  const [selectedTravelId, setSelectedTravelId] = useState<string | null>(null)
  const [librarySpots, setLibrarySpots] = useState<LibrarySpot[]>(spotLibrary)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTravels()
  }, [])

  const fetchTravels = async () => {
    try {
      const res = await fetch('/api/travels')
      const data = await res.json()
      setTravels(data)
    } catch (error) {
      console.error('获取旅行列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTravel = async (travelData: {
    city: string
    startDate: string
    days: number
    budget: number
  }) => {
    try {
      const res = await fetch('/api/travels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(travelData),
      })
      const newTravel = await res.json()
      setTravels([newTravel, ...travels])
      return newTravel
    } catch (error) {
      console.error('创建旅行计划失败:', error)
      throw error
    }
  }

  const handleDeleteTravel = async (id: string) => {
    try {
      await fetch(`/api/travels/${id}`, { method: 'DELETE' })
      setTravels(travels.filter((t) => t.id !== id))
    } catch (error) {
      console.error('删除旅行计划失败:', error)
    }
  }

  const handleUpdateTravel = (updatedTravel: TravelPlan) => {
    setTravels(travels.map((t) => (t.id === updatedTravel.id ? updatedTravel : t)))
  }

  const selectedTravel = travels.find((t) => t.id === selectedTravelId)

  if (loading) {
    return (
      <div className="app">
        <div className="app-header">
          <div className="logo">
            <span className="logo-icon">🧳</span>
            <h1>旅行规划助手</h1>
          </div>
        </div>
        <div className="container">
          <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="logo" onClick={() => setSelectedTravelId(null)}>
          <span className="logo-icon">🧳</span>
          <h1>旅行规划助手</h1>
        </div>
        {selectedTravel && (
          <button className="back-btn" onClick={() => setSelectedTravelId(null)}>
            ← 返回列表
          </button>
        )}
      </div>

      {!selectedTravel ? (
        <div className="container">
          <TravelList
            travels={travels}
            onAddTravel={handleAddTravel}
            onDeleteTravel={handleDeleteTravel}
            onSelectTravel={(id) => setSelectedTravelId(id)}
          />
        </div>
      ) : (
        <PlanDetail
          travel={selectedTravel}
          librarySpots={librarySpots}
          onUpdateTravel={handleUpdateTravel}
        />
      )}
    </div>
  )
}

export default App
