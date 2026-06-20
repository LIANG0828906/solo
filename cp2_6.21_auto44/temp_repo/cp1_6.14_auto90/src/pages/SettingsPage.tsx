import { useState } from 'react'
import { Timer, Coffee, Moon, Target } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { updateSettings } from '@/lib/api'
import { clamp } from '@/lib/date'

interface FieldProps {
  label: string
  icon: React.ElementType
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}

function Field({ label, icon: Icon, value, min, max, unit, onChange }: FieldProps) {
  const [bounce, setBounce] = useState(false)
  function update(next: number) {
    const clamped = clamp(next, min, max)
    if (clamped === value) return
    setBounce(true)
    setTimeout(() => setBounce(false), 360)
    onChange(clamped)
  }
  return (
    <div className="rounded-card border border-sea-blue-100 bg-white p-5 shadow-card animate-fadeInUp">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-btn bg-sea-blue-50 text-sea-blue">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-sea-blue-900">{label}</div>
            <div className="text-[11px] text-sea-blue-500">
              可调整范围 {min} - {max} {unit}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => update(value - 1)}
          className="btn-ghost grid h-9 w-9 place-items-center p-0 text-lg"
          aria-label="减少"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => update(Number(e.target.value) || min)}
          className={`h-9 w-28 rounded-btn border border-sea-blue-100 bg-sea-blue-50/50 text-center text-sm font-semibold text-sea-blue-800 outline-none focus:border-sea-blue-400 focus:ring-2 focus:ring-sea-blue-100 ${
            bounce ? 'animate-bounceInput' : ''
          }`}
        />
        <button
          onClick={() => update(value + 1)}
          className="btn-ghost grid h-9 w-9 place-items-center p-0 text-lg"
          aria-label="增加"
        >
          +
        </button>
        <div className="ml-auto text-sm text-sea-blue-600">{unit}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => update(Number(e.target.value))}
        className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sea-blue-100 accent-sea-blue"
      />
    </div>
  )
}

export default function SettingsPage() {
  const { settings, setSettings, pushToast } = useAppStore()

  async function patch(next: Partial<typeof settings>) {
    const merged = { ...settings, ...next }
    setSettings(merged)
    try {
      await updateSettings(next)
      pushToast('设置已保存')
    } catch {
      pushToast('保存失败，请重试', 'error')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-6 animate-fadeInUp">
        <h1 className="text-xl font-semibold text-sea-blue-900">设置</h1>
        <p className="mt-0.5 text-xs text-sea-blue-500">
          自定义番茄钟参数，调整后会自动保存
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="专注时长"
          icon={Timer}
          value={settings.focusDuration}
          min={15}
          max={60}
          unit="分钟"
          onChange={(v) => patch({ focusDuration: v })}
        />
        <Field
          label="短休息时长"
          icon={Coffee}
          value={settings.shortBreakDuration}
          min={5}
          max={15}
          unit="分钟"
          onChange={(v) => patch({ shortBreakDuration: v })}
        />
        <Field
          label="长休息时长"
          icon={Moon}
          value={settings.longBreakDuration}
          min={15}
          max={30}
          unit="分钟"
          onChange={(v) => patch({ longBreakDuration: v })}
        />
        <Field
          label="每日目标番茄数"
          icon={Target}
          value={settings.dailyGoal}
          min={1}
          max={24}
          unit="个"
          onChange={(v) => patch({ dailyGoal: v })}
        />
      </div>

      <div className="mt-6 rounded-card border border-dashed border-sea-blue-200 bg-white/60 p-4 text-xs text-sea-blue-600 animate-fadeInUp">
        💡 提示：番茄钟工作法建议每 4 个专注番茄后安排一次长休息，保持专注的同时避免过度疲劳。
      </div>
    </div>
  )
}
