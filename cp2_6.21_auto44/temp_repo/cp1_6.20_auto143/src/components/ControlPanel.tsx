import { Sunrise, Sun, Sunset, Moon, CloudSun, Cloud, Save, FolderOpen, PersonStanding, Eye } from 'lucide-react'
import { useStore } from '@/store'
import type { TimeOfDay, Weather } from '@/types'

const TIME_OPTIONS: { value: TimeOfDay; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'morning', label: '早晨 6:00', icon: <Sunrise size={16} />, color: '#ff9f43' },
  { value: 'noon', label: '中午 12:00', icon: <Sun size={16} />, color: '#f9ca24' },
  { value: 'evening', label: '傍晚 18:00', icon: <Sunset size={16} />, color: '#e17055' },
  { value: 'night', label: '夜晚 21:00', icon: <Moon size={16} />, color: '#6c5ce7' },
]

export default function ControlPanel() {
  const { timeOfDay, weather, isRoaming, setTimeOfDay, setWeather, setIsRoaming } = useStore()

  const handleSave = async () => {
    const state = useStore.getState()
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          furniture: state.furniture,
          timeOfDay: state.timeOfDay,
          weather: state.weather,
        }),
      })
    } catch {
      console.error('保存失败')
    }
  }

  const handleLoad = async () => {
    try {
      const res = await fetch('/api/load')
      const data = await res.json()
      if (data) {
        useStore.getState().loadScheme(data)
      }
    } catch {
      console.error('加载失败')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto scrollbar-thin">
      <div className="bg-white rounded-lg border border-[#e0e0e0] p-4">
        <h3 className="text-sm text-[#666] font-medium mb-3">时间选择</h3>
        <div className="grid grid-cols-2 gap-2">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeOfDay(opt.value)}
              className={`btn-press flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeOfDay === opt.value
                  ? 'bg-[#4A90D9] text-white shadow-md'
                  : 'bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
              }`}
            >
              <span style={{ color: timeOfDay === opt.value ? '#fff' : opt.color }}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e0e0e0] p-4">
        <h3 className="text-sm text-[#666] font-medium mb-3">天气切换</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setWeather('sunny')}
            className={`btn-press flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              weather === 'sunny'
                ? 'bg-[#4A90D9] text-white shadow-md'
                : 'bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
            }`}
          >
            <CloudSun size={16} />
            晴天
          </button>
          <button
            onClick={() => setWeather('overcast')}
            className={`btn-press flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              weather === 'overcast'
                ? 'bg-[#4A90D9] text-white shadow-md'
                : 'bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8]'
            }`}
          >
            <Cloud size={16} />
            阴天
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e0e0e0] p-4">
        <h3 className="text-sm text-[#666] font-medium mb-3">漫游模式</h3>
        <button
          onClick={() => setIsRoaming(!isRoaming)}
          className={`btn-press w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isRoaming
              ? 'bg-[#e17055] text-white shadow-md'
              : 'bg-[#4A90D9] text-white shadow-md hover:bg-[#357ABD]'
          }`}
        >
          {isRoaming ? <Eye size={16} /> : <PersonStanding size={16} />}
          {isRoaming ? '退出漫游' : '进入漫游'}
        </button>
        {isRoaming && (
          <p className="text-xs text-[#999] mt-2 text-center">WASD 移动 · 鼠标旋转 · Esc 退出</p>
        )}
      </div>

      <div className="bg-white rounded-lg border border-[#e0e0e0] p-4">
        <h3 className="text-sm text-[#666] font-medium mb-3">方案管理</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="btn-press flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#4A90D9] text-white hover:bg-[#357ABD] transition-colors"
          >
            <Save size={14} />
            保存
          </button>
          <button
            onClick={handleLoad}
            className="btn-press flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#f5f5f5] text-[#333] hover:bg-[#e8e8e8] transition-colors"
          >
            <FolderOpen size={14} />
            加载
          </button>
        </div>
      </div>
    </div>
  )
}
