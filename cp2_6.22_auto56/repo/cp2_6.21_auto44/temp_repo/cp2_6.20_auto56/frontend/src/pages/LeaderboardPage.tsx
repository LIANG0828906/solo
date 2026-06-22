import { useEffect } from 'react'
import useUserStore from '../modules/user/UserStore'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const mockHappinessData = [
  { day: '周一', value: 65 },
  { day: '周二', value: 72 },
  { day: '周三', value: 68 },
  { day: '周四', value: 80 },
  { day: '周五', value: 85 },
  { day: '周六', value: 90 },
  { day: '周日', value: 88 },
]

const mockLeaderboard = [
  { userId: '1', userName: '小太阳', avatar: '🌞', petName: '毛毛', totalHappiness: 95, rank: 1 },
  { userId: '2', userName: '月亮姐姐', avatar: '🌙', petName: '豆豆', totalHappiness: 92, rank: 2 },
  { userId: '3', userName: '星星控', avatar: '⭐', petName: '球球', totalHappiness: 89, rank: 3 },
  { userId: '4', userName: '糖果屋', avatar: '🍬', petName: '咪咪', totalHappiness: 85, rank: 4 },
  { userId: '5', userName: '云朵朵', avatar: '☁️', petName: '汪汪', totalHappiness: 82, rank: 5 },
  { userId: '6', userName: '彩虹糖', avatar: '🌈', petName: '小龙', totalHappiness: 78, rank: 6 },
  { userId: '7', userName: '小花园', avatar: '🌷', petName: '花花', totalHappiness: 75, rank: 7 },
  { userId: '8', userName: '蜜蜂侠', avatar: '🐝', petName: '糖糖', totalHappiness: 72, rank: 8 },
]

function LeaderboardPage() {
  const user = useUserStore((s) => s.user)
  const leaderboard = useUserStore((s) => s.leaderboard)
  const fetchLeaderboard = useUserStore((s) => s.fetchLeaderboard)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const displayData = leaderboard.length > 0 ? leaderboard : mockLeaderboard

  const getCrownInfo = (rank: number) => {
    if (rank === 1) return { icon: '👑', className: 'crown-gold', size: 28, label: '金' }
    if (rank === 2) return { icon: '👑', className: 'crown-silver', size: 24, label: '银' }
    if (rank === 3) return { icon: '👑', className: 'crown-bronze', size: 22, label: '铜' }
    return null
  }

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'linear-gradient(90deg, rgba(255,215,0,0.18), rgba(255,215,0,0.02))'
    if (rank === 2) return 'linear-gradient(90deg, rgba(192,192,192,0.15), rgba(192,192,192,0.02))'
    if (rank === 3) return 'linear-gradient(90deg, rgba(205,127,50,0.15), rgba(205,127,50,0.02))'
    return 'transparent'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'linear-gradient(135deg, #fff8e1, #ffecb3)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        boxShadow: 'var(--shadow-soft)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🏆 宠物排行榜</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          按宠物快乐度总分排名
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        boxShadow: 'var(--shadow-soft), var(--shadow-inner)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📈 我的宠物快乐度趋势</h3>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockHappinessData}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ff9a5a"
                strokeWidth={3}
                dot={{ fill: '#ff9a5a', r: 4 }}
                activeDot={{ r: 6, fill: '#ff7e5f' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 8px',
        boxShadow: 'var(--shadow-soft), var(--shadow-inner)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 8px 12px' }}>🎖️ 全服排名</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displayData.map((entry) => {
            const crown = getCrownInfo(entry.rank)
            const isMe = user && entry.userId === user.id
            return (
              <div
                key={entry.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: entry.rank <= 3 ? 14 : 'var(--radius-md)',
                  background: isMe
                    ? 'rgba(255,154,90,0.12)'
                    : getRankBg(entry.rank),
                  border: isMe ? '1.5px solid var(--accent-orange)' : entry.rank <= 3 ? '1px solid rgba(255,215,0,0.2)' : 'none',
                  animation: `fade-drop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${entry.rank * 0.06}s both`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {entry.rank <= 3 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 60,
                    height: 60,
                    background: entry.rank === 1
                      ? 'radial-gradient(circle at top right, rgba(255,215,0,0.25), transparent 70%)'
                      : entry.rank === 2
                        ? 'radial-gradient(circle at top right, rgba(192,192,192,0.2), transparent 70%)'
                        : 'radial-gradient(circle at top right, rgba(205,127,50,0.2), transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                )}

                <div style={{
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {crown ? (
                    <span
                      className={crown.className}
                      style={{
                        fontSize: crown.size,
                        display: 'inline-block',
                      }}
                    >{crown.icon}</span>
                  ) : (
                    <span style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      background: 'rgba(120,120,120,0.1)',
                      padding: '4px 10px',
                      borderRadius: 8,
                    }}>
                      #{entry.rank}
                    </span>
                  )}
                </div>

                <div style={{
                  width: entry.rank <= 3 ? 48 : 40,
                  height: entry.rank <= 3 ? 48 : 40,
                  borderRadius: '50%',
                  background: entry.rank <= 3
                    ? `linear-gradient(135deg, ${entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : '#cd7f32'}, #ff9a5a)`
                    : 'linear-gradient(135deg, var(--accent-pink), var(--accent-orange))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: entry.rank <= 3 ? 24 : 20,
                  flexShrink: 0,
                  boxShadow: entry.rank <= 3 ? `0 0 12px ${entry.rank === 1 ? 'rgba(255,215,0,0.4)' : entry.rank === 2 ? 'rgba(192,192,192,0.4)' : 'rgba(205,127,50,0.4)'}` : 'none',
                }}>
                  {entry.avatar}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: entry.rank <= 3 ? 16 : 14,
                      fontWeight: entry.rank <= 3 ? 800 : 700,
                      color: entry.rank <= 3 ? (entry.rank === 1 ? '#b8860b' : entry.rank === 2 ? '#666' : '#8b5a2b') : 'var(--text-primary)',
                    }}>
                      {entry.userName}
                    </span>
                    {isMe && (
                      <span style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 8,
                        background: 'var(--accent-orange)',
                        color: 'white',
                        fontWeight: 700,
                      }}>我</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    宠物：{entry.petName}
                  </span>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: entry.rank <= 3 ? 20 : 17,
                    fontWeight: 900,
                    color: entry.rank <= 3 ? (entry.rank === 1 ? '#ffa500' : entry.rank === 2 ? '#ff7e5f' : '#e67e22') : 'var(--accent-orange)',
                    textShadow: entry.rank <= 3 ? '0 1px 2px rgba(255,150,50,0.3)' : 'none',
                  }}>
                    {entry.totalHappiness}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500 }}>快乐度</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
