interface AttendanceBarProps {
  present: number
  absent: number
  unmarked: number
}

export const AttendanceBar = ({ present, absent, unmarked }: AttendanceBarProps) => {
  const total = present + absent + unmarked
  if (total === 0) total = 1

  const presentPercent = (present / total) * 100
  const absentPercent = (absent / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--success)' }} />
            <span className="text-gray-600">出勤 {present}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--danger)' }} />
            <span className="text-gray-600">缺勤 {absent}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ background: 'var(--unmarked)' }} />
            <span className="text-gray-600">未打卡 {unmarked}</span>
          </span>
        </div>
      </div>
      <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--card-border)' }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${presentPercent}%`,
            background: 'linear-gradient(90deg, #4CAF50, #66BB6A)',
          }}
        />
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${absentPercent}%`,
            background: 'linear-gradient(90deg, #F44336, #EF5350)',
          }}
        />
      </div>
    </div>
  )
}
