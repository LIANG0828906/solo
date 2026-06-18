import React, { useMemo } from 'react'
import { useChallengeStore } from '../../../store/challengeStore'
import Heatmap from '../../visualization/components/Heatmap'
import RingProgress from '../../visualization/components/RingProgress'

interface MemberRanking {
  id: string
  name: string
  email: string
  avatar: string
  checkInCount: number
  completionRate: number
  rank: number
}

const ChallengeDetail: React.FC = () => {
  const challenge = useChallengeStore(s => s.currentChallenge)
  const getDaysPassed = useChallengeStore(s => s.getDaysPassed)
  const getOverallCompletionRate = useChallengeStore(s => s.getOverallCompletionRate)
  const getMemberStats = useChallengeStore(s => s.getMemberStats)
  const setSelectedMember = useChallengeStore(s => s.setSelectedMember)

  const daysPassed = getDaysPassed()
  const overallRate = getOverallCompletionRate()

  const rankings = useMemo((): MemberRanking[] => {
    if (!challenge) return []

    const stats = challenge.members.map(member => {
      const s = getMemberStats(member.id)
      return {
        ...member,
        checkInCount: s.totalCheckIns,
        completionRate: s.completionRate,
        rank: 0,
      }
    })

    stats.sort((a, b) => {
      if (b.completionRate !== a.completionRate) {
        return b.completionRate - a.completionRate
      }
      return b.checkInCount - a.checkInCount
    })

    stats.forEach((m, i) => {
      m.rank = i + 1
    })

    return stats
  }, [challenge, getMemberStats])

  const totalCheckIns = useMemo(() => {
    if (!challenge) return 0
    return challenge.checkIns.filter(c => c.completionAmount > 0).length
  }, [challenge])

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: '#F59E0B', color: '#fff' }
      case 2:
        return { bg: '#9CA3AF', color: '#fff' }
      case 3:
        return { bg: '#B45309', color: '#fff' }
      default:
        return { bg: '#E2E8F0', color: '#64748B' }
    }
  }

  if (!challenge) {
    return <div style={{ padding: '40px', color: '#fff' }}>暂无挑战</div>
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '12px',
            }}
          >
            {challenge.name}
          </h1>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
                进行天数
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                {daysPassed}
                <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '400' }}>
                  {' '}/ {challenge.durationDays} 天
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
                总打卡次数
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                {totalCheckIns}
                <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '400' }}>
                  {' '}次
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
                参与成员
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                {challenge.members.length}
                <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '400' }}>
                  {' '}人
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <RingProgress percentage={overallRate} size={140} strokeWidth={12} />
        </div>
      </div>

      <div
        style={{
          background: '#1E293B',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '20px',
          }}
        >
          🔥 打卡热力图
        </h2>
        <Heatmap
          members={challenge.members}
          checkIns={challenge.checkIns}
          startDate={challenge.startDate}
          durationDays={challenge.durationDays}
          onMemberClick={(memberId) => setSelectedMember(memberId)}
        />
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1E293B',
            marginBottom: '16px',
          }}
        >
          🏆 成员排名
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {rankings.map((member) => {
            const rankStyle = getRankStyle(member.rank)
            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'transparent',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F8FAFC'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: rankStyle.bg,
                    color: rankStyle.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  {member.rank}
                </div>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: member.avatar,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#1E293B',
                    }}
                  >
                    {member.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    完成 {member.completionRate}% · {member.checkInCount} 次打卡
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: member.rank <= 3 ? rankStyle.bg : '#94A3B8',
                  }}
                >
                  #{member.rank}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ChallengeDetail
