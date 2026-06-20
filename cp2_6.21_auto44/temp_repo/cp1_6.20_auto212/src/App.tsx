import { useEffect, useMemo, useState } from 'react'
import { Plus, Compass, User, Menu, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store'
import ActivityList from '@/components/ActivityList'
import ActivityDetail from '@/components/ActivityDetail'
import EquipmentPanel from '@/components/EquipmentPanel'
import CreateActivityModal from '@/components/CreateActivityModal'
import RegistrationModal from '@/components/RegistrationModal'
import WeatherWidget from '@/components/WeatherWidget'
import type { Activity } from '@/types'

export default function App() {
  const {
    activities,
    selectedActivityId,
    equipment,
    registrations,
    weatherForecasts,
    isCreateModalOpen,
    isRegistrationModalOpen,
    mobileTab,
    fetchActivities,
    selectActivity,
    createActivity,
    fetchEquipment,
    registerMember,
    openCreateModal,
    closeCreateModal,
    closeRegistrationModal,
    openRegistrationModal,
    setMobileTab,
  } = useAppStore()

  const [mobileListOpen, setMobileListOpen] = useState(false)

  useEffect(() => {
    fetchActivities()
    fetchEquipment()
  }, [])

  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === selectedActivityId) || null,
    [activities, selectedActivityId]
  )

  const handleCreate = (data: Omit<Activity, 'id'>) => {
    createActivity(data)
  }

  const handleRegister = (data: { memberName: string; phone: string; equipmentIds: string[] }) => {
    if (!selectedActivityId) return
    registerMember({
      activityId: selectedActivityId,
      ...data,
    })
  }

  const handleSelect = (id: string) => {
    selectActivity(id)
    setMobileListOpen(false)
  }

  return (
    <div className="h-screen flex flex-col bg-surface-bg font-sans">
      <nav className="h-14 bg-forest flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <Compass size={22} className="text-white" />
          <h1 className="text-base font-bold text-white tracking-wide">探险先锋</h1>
        </div>
        <div className="flex items-center gap-3">
          <WeatherWidget
            forecasts={weatherForecasts}
            activityDate={selectedActivity?.date}
          />
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:block w-72 lg:w-80 bg-surface-card border-r border-gray-100 shrink-0 overflow-hidden">
          <ActivityList
            activities={activities}
            selectedId={selectedActivityId}
            onSelect={selectActivity}
          />
        </aside>

        <main className="flex-1 min-w-0 flex flex-col md:flex-row overflow-hidden">
          <div className={`flex-1 min-w-0 bg-surface-bg overflow-hidden ${mobileTab === 'equipment' ? 'hidden md:block' : ''}`}>
            <div className="md:hidden border-b border-gray-100 bg-surface-card">
              <button
                onClick={() => setMobileListOpen(!mobileListOpen)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-text-primary"
              >
                <span className="flex items-center gap-2">
                  <Menu size={16} className="text-text-secondary" />
                  {selectedActivity ? selectedActivity.name : '选择活动'}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-text-secondary transition-transform ${mobileListOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {mobileListOpen && (
                <div className="max-h-64 overflow-y-auto border-t border-gray-100">
                  {activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => handleSelect(activity.id)}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between
                        ${selectedActivityId === activity.id ? 'bg-forest-50 text-forest-dark font-medium' : 'text-text-primary hover:bg-gray-50'}`}
                    >
                      <span className="truncate">{activity.name}</span>
                      <span className="text-xs text-text-secondary shrink-0 ml-2">{activity.date}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="h-full overflow-y-auto">
              <ActivityDetail
                activity={selectedActivity}
                registrations={registrations}
                equipment={equipment}
                weatherForecasts={weatherForecasts}
                onRegister={openRegistrationModal}
              />
            </div>
          </div>

          <aside className="hidden md:block w-72 lg:w-80 bg-surface-card border-l border-gray-100 shrink-0 overflow-hidden">
            <EquipmentPanel equipment={equipment} />
          </aside>

          {mobileTab === 'equipment' && (
            <div className="flex-1 md:hidden bg-surface-card overflow-hidden">
              <EquipmentPanel equipment={equipment} />
            </div>
          )}
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-gray-100 flex z-40">
        <button
          onClick={() => setMobileTab('detail')}
          className={`flex-1 py-3 text-xs font-medium text-center transition-colors
            ${mobileTab === 'detail' ? 'text-forest border-t-2 border-forest' : 'text-text-secondary'}`}
        >
          活动详情
        </button>
        <button
          onClick={() => setMobileTab('equipment')}
          className={`flex-1 py-3 text-xs font-medium text-center transition-colors
            ${mobileTab === 'equipment' ? 'text-forest border-t-2 border-forest' : 'text-text-secondary'}`}
        >
          装备清单
        </button>
      </div>

      <button
        onClick={openCreateModal}
        className="fixed right-5 bottom-20 md:bottom-6 w-12 h-12 bg-forest text-white rounded-full
          shadow-lg hover:bg-forest-light hover:shadow-xl
          active:scale-[0.96] transition-all duration-200
          flex items-center justify-center z-30"
      >
        <Plus size={24} />
      </button>

      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreate}
      />

      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={closeRegistrationModal}
        onSubmit={handleRegister}
        equipment={equipment}
      />
    </div>
  )
}
