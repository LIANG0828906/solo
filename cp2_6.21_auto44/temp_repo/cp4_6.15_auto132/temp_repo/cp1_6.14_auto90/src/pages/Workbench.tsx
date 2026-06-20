import TodoList from '@/components/TodoList'
import PomodoroTimer from '@/components/PomodoroTimer'
import HabitTracker from '@/components/HabitTracker'

export default function Workbench() {
  return (
    <div className="h-full min-h-0">
      <div className="mx-auto grid h-full max-w-7xl gap-4 px-6 py-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-h-[520px] md:min-h-0">
          <TodoList />
        </div>
        <div className="min-h-[480px] md:min-h-0">
          <PomodoroTimer />
        </div>
        <div className="min-h-[400px] md:min-h-0">
          <HabitTracker />
        </div>
      </div>
    </div>
  )
}
