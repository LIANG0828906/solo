import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useApp } from '@context/AppContext'
import type { Todo } from '@types'

const COLORS = {
  pinkLight: '#FADADD',
  pinkDark: '#E8A8B8',
  gold: '#F7E7CE',
  goldDark: '#D4AF37',
  grayWarm: '#D4C9C0',
  grayText: '#6B5B55',
  grayMuted: '#9B8B85',
  white: '#FFFFFF',
}

const activityDotColors = ['#E8A8B8', '#F7E7CE', '#D4AF37', '#D4C9C0', '#C9A87C', '#B8A090']

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffDay > 0) return `${diffDay}天前`
  if (diffHour > 0) return `${diffHour}小时前`
  if (diffMin > 0) return `${diffMin}分钟前`
  return '刚刚'
}

function padZero(n: number): string {
  return n.toString().padStart(2, '0')
}

interface FlipDigitProps {
  digit: string
  isFlipping: boolean
}

const FlipDigit: React.FC<FlipDigitProps> = ({ digit, isFlipping }) => {
  return (
    <div
      style={{
        width: 48,
        height: 64,
        borderRadius: 10,
        position: 'relative',
        perspective: 400,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          background: `linear-gradient(180deg, ${COLORS.pinkLight} 0%, ${COLORS.pinkLight} 49%, rgba(0,0,0,0.06) 49%, rgba(0,0,0,0.06) 51%, ${COLORS.gold} 51%, ${COLORS.gold} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(232, 168, 184, 0.25), inset 0 1px 0 rgba(255,255,255,0.5)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: COLORS.grayText,
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          {digit}
        </span>
      </div>

      {isFlipping && (
        <>
          <div
            className="flip-top"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              borderRadius: '10px 10px 0 0',
              background: `linear-gradient(180deg, ${COLORS.pinkLight} 0%, ${COLORS.pinkLight} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transformOrigin: 'bottom center',
              backfaceVisibility: 'hidden',
              boxShadow: '0 2px 6px rgba(232, 168, 184, 0.2)',
              zIndex: 3,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: COLORS.grayText,
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                transform: 'translateY(50%)',
              }}
            >
              {digit}
            </span>
          </div>
          <div
            className="flip-bottom"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              borderRadius: '0 0 10px 10px',
              background: `linear-gradient(180deg, ${COLORS.gold} 0%, ${COLORS.gold} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transformOrigin: 'top center',
              transform: 'rotateX(90deg)',
              backfaceVisibility: 'hidden',
              boxShadow: '0 4px 8px rgba(232, 168, 184, 0.15)',
              zIndex: 2,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: COLORS.grayText,
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 1px 0 rgba(255,255,255,0.6)',
                transform: 'translateY(-50%)',
              }}
            >
              {digit}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

interface CountdownProps {
  weddingDate: string
}

const Countdown: React.FC<CountdownProps> = ({ weddingDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(weddingDate))
  const [flippingDigits, setFlippingDigits] = useState<Record<string, boolean>>({})
  const prevDigitsRef = useRef<Record<string, string>>({})

  function calculateTimeLeft(dateStr: string) {
    const target = new Date(dateStr).getTime()
    const now = Date.now()
    const diff = Math.max(0, target - now)

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const next = calculateTimeLeft(weddingDate)
      setTimeLeft(next)

      const nextDigits: Record<string, string> = {}
      const units = [
        { key: 'days', value: next.days, digits: 3 },
        { key: 'hours', value: next.hours, digits: 2 },
        { key: 'minutes', value: next.minutes, digits: 2 },
        { key: 'seconds', value: next.seconds, digits: 2 },
      ]
      units.forEach(u => {
        padZero(u.value).padStart(u.digits, '0').split('').forEach((d, i) => {
          nextDigits[`${u.key}-${i}`] = d
        })
      })

      const changed: Record<string, boolean> = {}
      Object.entries(nextDigits).forEach(([key, val]) => {
        if (prevDigitsRef.current[key] !== undefined && prevDigitsRef.current[key] !== val) {
          changed[key] = true
        }
      })

      if (Object.keys(changed).length > 0) {
        setFlippingDigits(changed)
        setTimeout(() => setFlippingDigits({}), 600)
      }

      prevDigitsRef.current = nextDigits
    }, 1000)

    const next = calculateTimeLeft(weddingDate)
    const initDigits: Record<string, string> = {}
    const units = [
      { key: 'days', value: next.days, digits: 3 },
      { key: 'hours', value: next.hours, digits: 2 },
      { key: 'minutes', value: next.minutes, digits: 2 },
      { key: 'seconds', value: next.seconds, digits: 2 },
    ]
    units.forEach(u => {
      padZero(u.value).padStart(u.digits, '0').split('').forEach((d, i) => {
        initDigits[`${u.key}-${i}`] = d
      })
    })
    prevDigitsRef.current = initDigits

    return () => clearInterval(timer)
  }, [weddingDate])

  const units = [
    { key: 'days', label: '天', value: timeLeft.days, digits: 3 },
    { key: 'hours', label: '时', value: timeLeft.hours, digits: 2 },
    { key: 'minutes', label: '分', value: timeLeft.minutes, digits: 2 },
    { key: 'seconds', label: '秒', value: timeLeft.seconds, digits: 2 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {units.map((unit) => {
          const digits = padZero(unit.value).padStart(unit.digits, '0').split('')
          return (
            <div key={unit.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {digits.map((d, idx) => (
                  <FlipDigit
                    key={`${unit.key}-${idx}`}
                    digit={d}
                    isFlipping={!!flippingDigits[`${unit.key}-${idx}`]}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, color: COLORS.grayMuted, fontWeight: 500, letterSpacing: 2 }}>
                {unit.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface CustomCheckboxProps {
  checked: boolean
  onChange: () => void
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange }) => {
  return (
    <button
      onClick={onChange}
      style={{
        width: 24,
        height: 24,
        borderRadius: 8,
        border: `2px solid ${checked ? COLORS.pinkDark : COLORS.grayWarm}`,
        background: checked
          ? `linear-gradient(135deg, ${COLORS.pinkLight}, ${COLORS.gold})`
          : COLORS.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{
          overflow: 'visible',
        }}
      >
        <path
          d="M2.5 7.5L5.5 10.5L11.5 3.5"
          stroke={COLORS.pinkDark}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className={checked ? 'checkmark-animate' : ''}
          style={{
            strokeDasharray: 20,
            strokeDashoffset: checked ? 0 : 20,
            transition: checked ? 'stroke-dashoffset 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s' : 'stroke-dashoffset 0.2s ease',
            transformOrigin: '7px 7px',
          }}
        />
      </svg>
    </button>
  )
}

interface TodoItemProps {
  todo: Todo
  onToggle: () => void
  index: number
}

const TodoItemComp: React.FC<TodoItemProps> = ({ todo, onToggle, index }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 10,
        background: todo.completed ? 'rgba(212, 201, 192, 0.12)' : COLORS.white,
        border: `1px solid ${todo.completed ? 'rgba(212, 201, 192, 0.3)' : 'rgba(232, 168, 184, 0.15)'}`,
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: todo.completed ? 0.65 : 1,
        animation: `floatUp 0.4s ease ${index * 0.04}s both`,
      }}
    >
      <CustomCheckbox checked={todo.completed} onChange={onToggle} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: todo.completed ? COLORS.grayMuted : COLORS.grayText,
            textDecoration: todo.completed ? 'line-through' : 'none',
            marginBottom: 2,
            wordBreak: 'break-word',
          }}
        >
          {todo.title}
        </p>
        {todo.assigneeName && (
          <p style={{ fontSize: 11, color: COLORS.grayMuted }}>负责人：{todo.assigneeName}</p>
        )}
      </div>
      {todo.completed && todo.completedAt && (
        <span style={{ fontSize: 10, color: COLORS.grayWarm, flexShrink: 0 }}>
          {formatTimeAgo(todo.completedAt)}
        </span>
      )}
    </div>
  )
}

const SkeletonCard: React.FC = () => (
  <div
    className="skeleton"
    style={{
      borderRadius: 12,
      padding: 24,
      minHeight: 200,
      background: `linear-gradient(90deg, rgba(250, 218, 221, 0.4) 25%, rgba(250, 218, 221, 0.7) 50%, rgba(250, 218, 221, 0.4) 75%)`,
      backgroundSize: '200px 100%',
      animation: 'skeleton 1.5s ease-in-out infinite',
    }}
  />
)

const EmptyState: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
    }}
  >
    <span
      style={{
        fontSize: 48,
        animation: 'bounce 2s ease-in-out infinite',
        marginBottom: 12,
      }}
    >
      {icon}
    </span>
    <h3 style={{ fontSize: 16, color: COLORS.grayText, marginBottom: 6, fontWeight: 600 }}>{title}</h3>
    <p style={{ fontSize: 13, color: COLORS.grayMuted }}>{desc}</p>
  </div>
)

const StatCard: React.FC<{
  icon: string
  label: string
  value: string | number
  subValue?: string
  gradient: string
  delay?: number
}> = ({ icon, label, value, subValue, gradient, delay = 0 }) => (
  <div
    style={{
      borderRadius: 12,
      padding: 18,
      background: COLORS.white,
      boxShadow: '0 4px 16px rgba(232, 168, 184, 0.15)',
      border: '1px solid rgba(232, 168, 184, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: `floatUp 0.5s ease ${delay}s both`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 8px 28px rgba(232, 168, 184, 0.25)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(232, 168, 184, 0.15)'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 13, color: COLORS.grayMuted, fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: COLORS.grayText,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      {subValue && <span style={{ fontSize: 12, color: COLORS.grayMuted }}>{subValue}</span>}
    </div>
  </div>
)

const AddTodoInput: React.FC<{ onAdd: (title: string) => void }> = ({ onAdd }) => {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="添加新的待办事项..."
        style={{
          flex: 1,
          padding: '10px 14px',
          border: `2px solid ${COLORS.grayWarm}`,
          borderRadius: 10,
          fontSize: 13,
          outline: 'none',
          color: COLORS.grayText,
          background: COLORS.white,
          transition: 'all 0.3s ease',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = COLORS.pinkDark
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 168, 184, 0.2)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = COLORS.grayWarm
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      <button
        onClick={handleSubmit}
        style={{
          padding: '10px 18px',
          border: 'none',
          borderRadius: 10,
          background: `linear-gradient(135deg, ${COLORS.pinkLight}, ${COLORS.pinkDark})`,
          color: COLORS.white,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(232, 168, 184, 0.35)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        添加
      </button>
    </div>
  )
}

export default function Home() {
  const { loading, wedding, todos, activities, guests, addTodo, toggleTodo } = useApp()

  const sortedTodos = useMemo(() => {
    const incomplete = todos.filter((t) => !t.completed)
    const complete = todos.filter((t) => t.completed)
    return [...incomplete, ...complete]
  }, [todos])

  const stats = useMemo(() => {
    const totalGuests = guests.reduce((sum, g) => sum + 1 + g.companions, 0)
    const confirmedGuests = guests.filter((g) => g.rsvp === 'confirmed').reduce((sum, g) => sum + 1 + g.companions, 0)
    const pendingGuests = guests.filter((g) => g.rsvp === 'pending').reduce((sum, g) => sum + 1 + g.companions, 0)
    const totalTodos = todos.length
    const completedTodos = todos.filter((t) => t.completed).length
    const todoRate = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100)

    return { totalGuests, confirmedGuests, pendingGuests, totalTodos, completedTodos, todoRate }
  }, [guests, todos])

  if (loading) {
    return (
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={containerStyle}>
          <div style={leftColStyle}>
            <SkeletonCard />
            <div style={statsGridStyle}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
          <div style={rightColStyle}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        <style>{skeletonKeyframes}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={greetingStyle}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.grayText, marginBottom: 4 }}>
            欢迎回来，{wedding?.brideName || '新人'} 💐
          </h2>
          <p style={{ fontSize: 13, color: COLORS.grayMuted }}>
            {wedding ? `${wedding.groomName} & ${wedding.brideName} · ${wedding.venue}` : '开始筹备你们的完美婚礼'}
          </p>
        </div>
      </div>

      <div style={containerStyle}>
        <div style={leftColStyle}>
          <div
            style={{
              ...cardStyle,
              animation: 'floatUp 0.5s ease 0s both',
              background: `linear-gradient(160deg, ${COLORS.pinkLight} 0%, ${COLORS.gold} 100%)`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -40,
                left: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: COLORS.grayMuted, letterSpacing: 3, marginBottom: 6 }}>
                  距离婚礼还有
                </p>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLORS.grayText,
                  }}
                >
                  {wedding
                    ? new Date(wedding.weddingDate).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })
                    : '即将到来'}
                </h3>
              </div>
              {wedding ? (
                <Countdown weddingDate={wedding.weddingDate} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <span style={{ fontSize: 40 }}>💍</span>
                  <p style={{ marginTop: 10, fontSize: 13, color: COLORS.grayMuted }}>请先设置婚礼日期</p>
                </div>
              )}
            </div>
          </div>

          <div style={statsGridStyle}>
            <StatCard
              icon="👥"
              label="宾客总数"
              value={stats.totalGuests}
              subValue="人"
              gradient={`linear-gradient(135deg, ${COLORS.pinkLight}, ${COLORS.pinkDark})`}
              delay={0.05}
            />
            <StatCard
              icon="✅"
              label="已确认"
              value={stats.confirmedGuests}
              subValue={`/ ${stats.totalGuests}人`}
              gradient={`linear-gradient(135deg, ${COLORS.gold}, #E8C99B)`}
              delay={0.1}
            />
            <StatCard
              icon="📋"
              label="待办进度"
              value={`${stats.todoRate}%`}
              subValue={`${stats.completedTodos}/${stats.totalTodos}`}
              gradient={`linear-gradient(135deg, #F5E6D3, ${COLORS.gold})`}
              delay={0.15}
            />
            <StatCard
              icon="⏳"
              label="待回复"
              value={stats.pendingGuests}
              subValue="人"
              gradient={`linear-gradient(135deg, #F8E8E8, ${COLORS.pinkLight})`}
              delay={0.2}
            />
          </div>

          {stats.totalTodos > 0 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: COLORS.grayMuted, fontWeight: 500 }}>整体进度</span>
                <span style={{ fontSize: 12, color: COLORS.pinkDark, fontWeight: 600 }}>{stats.todoRate}%</span>
              </div>
              <div
                style={{
                  height: 8,
                  background: `${COLORS.pinkLight}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${stats.todoRate}%`,
                    background: `linear-gradient(90deg, ${COLORS.pinkDark}, ${COLORS.goldDark})`,
                    borderRadius: 4,
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={rightColStyle}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.grayText }}>待办清单</h3>
                <p style={{ fontSize: 12, color: COLORS.grayMuted, marginTop: 2 }}>
                  {todos.filter((t) => !t.completed).length} 项待完成
                </p>
              </div>
              <span style={{ fontSize: 24 }}>📝</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <AddTodoInput onAdd={addTodo} />
            </div>

            {sortedTodos.length === 0 ? (
              <EmptyState icon="✨" title="暂无待办" desc="添加第一条待办开始筹备吧" />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 380,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {sortedTodos.map((todo, idx) => (
                  <TodoItemComp
                    key={todo.id}
                    todo={todo}
                    onToggle={() => toggleTodo(todo.id)}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.grayText }}>最新动态</h3>
                <p style={{ fontSize: 12, color: COLORS.grayMuted, marginTop: 2 }}>团队筹备记录</p>
              </div>
              <span style={{ fontSize: 24 }}>📢</span>
            </div>

            {activities.length === 0 ? (
              <EmptyState icon="🌟" title="暂无动态" desc="开始操作后将在这里记录" />
            ) : (
              <div
                style={{
                  position: 'relative',
                  maxHeight: 340,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 11,
                    top: 8,
                    bottom: 8,
                    width: 2,
                    background: `linear-gradient(180deg, ${COLORS.pinkLight}, ${COLORS.gold}, transparent)`,
                    borderRadius: 1,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {activities.slice(0, 15).map((act, idx) => {
                    const dotColor = activityDotColors[idx % activityDotColors.length]
                    return (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          gap: 14,
                          padding: '10px 0 10px 4px',
                          animation: `floatUp 0.4s ease ${idx * 0.03}s both`,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: dotColor,
                            border: `3px solid ${COLORS.white}`,
                            boxShadow: `0 2px 8px ${dotColor}40`,
                            flexShrink: 0,
                            zIndex: 1,
                            marginTop: 2,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: COLORS.grayText,
                              }}
                            >
                              {act.userName}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 20,
                                background: `${dotColor}30`,
                                color: COLORS.grayMuted,
                                fontWeight: 500,
                              }}
                            >
                              {act.action}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: COLORS.grayWarm,
                                marginLeft: 'auto',
                                flexShrink: 0,
                              }}
                            >
                              {formatTimeAgo(act.timestamp)}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: COLORS.grayMuted, lineHeight: 1.5 }}>{act.detail}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flipTop {
          0% { transform: rotateX(0); }
          100% { transform: rotateX(-90deg); }
        }
        @keyframes flipBottom {
          0% { transform: rotateX(90deg); }
          50% { transform: rotateX(0); }
          70% { transform: rotateX(-8deg); }
          85% { transform: rotateX(4deg); }
          100% { transform: rotateX(0); }
        }
        .flip-top {
          animation: flipTop 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .flip-bottom {
          animation: flipBottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s forwards;
        }
        @keyframes checkmarkElastic {
          0% { stroke-dashoffset: 20; transform: scale(0.8); }
          50% { stroke-dashoffset: 0; transform: scale(1.2); }
          70% { transform: scale(0.95); }
          85% { transform: scale(1.05); }
          100% { stroke-dashoffset: 0; transform: scale(1); }
        }
        .checkmark-animate {
          animation: checkmarkElastic 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes skeleton {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        @media (max-width: 960px) {
          .dashboard-container {
            flex-direction: column !important;
          }
          .dashboard-left, .dashboard-right {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}

const greetingStyle: React.CSSProperties = {
  marginBottom: 24,
  animation: 'floatUp 0.5s ease both',
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  className: 'dashboard-container',
}

const leftColStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  minWidth: 0,
  className: 'dashboard-left',
}

const rightColStyle: React.CSSProperties = {
  flex: 1.15,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  minWidth: 0,
  className: 'dashboard-right',
}

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 14,
}

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: 24,
  background: COLORS.white,
  boxShadow: '0 4px 16px rgba(232, 168, 184, 0.15)',
  border: '1px solid rgba(232, 168, 184, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}

const skeletonKeyframes = `
  @keyframes skeleton {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
  @keyframes floatUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
`
