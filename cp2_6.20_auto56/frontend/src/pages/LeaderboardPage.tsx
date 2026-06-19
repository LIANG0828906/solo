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

  const getCrown = (rank: number) => {
    if (rank === 1) return { icon: '👑', color: '#ffd700', label: '金' }
    if (rank === 2) return { icon: '👑', color: '#c0c0c0', label: '银' }
    if (rank === 3) return { icon: '👑', color: '#cd7f32', label: '铜' }
    return null
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
            const crown = getCrown(entry.rank)
            const isMe = user && entry.userId === user.id
            return (
              <div
                key={entry.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isMe ? 'rgba(255,154,90,0.1)' : entry.rank <= 3 ? 'linear-gradient(90deg, rgba(255,215,0,0.05), transparent)' : 'transparent',
                  border: isMe ? '1px solid var(--accent-orange)' : 'none',
                  animation: `fade-drop 0.3s ease-out ${entry.rank * 0.05}s both`,
                }}
              >
                <div style={{
                  width: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {crown ? (
                    <span
                      style={{
                        fontSize: 22,
                        filter: `drop-shadow(0 0 4px ${crown.color})`,
                        animation: entry.rank <= 3 ? 'crown-pulse 1.5s ease-in-out infinite' : undefined,
                        animationDelay: `${entry.rank * 0.2}s`,
                      }}
                    >{crown.icon}</span>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      #{entry.rank}
                    </span>
                  )}
                </div>

                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-pink), var(--accent-orange))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {entry.avatar}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {entry.userName}
                    </span>
                    {isMe && (
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 6,
                        background: 'var(--accent-orange)',
                        color: 'white',
                        fontWeight: 600,
                      }}>我</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    宠物：{entry.petName}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-orange)' }}>
                    {entry.totalHappiness}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>快乐度</div>
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
