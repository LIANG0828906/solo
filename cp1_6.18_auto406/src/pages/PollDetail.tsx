import { useParams, useNavigate } from 'react-router-dom'
import { usePollStore } from '../store/usePollStore'
import { getHeatColor } from '../utils/mapHeatmap'

function PollDetail() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const {
    currentPollId,
    pollTitle,
    pollDescription,
    options,
    isEnded,
    hasVoted,
    updateOptionVotes,
    endPoll,
    setHasVoted,
  } = usePollStore()

  if (!currentPollId || currentPollId !== code) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>投票不存在</p>
        <button onClick={() => navigate('/create')} style={styles.backBtn}>
          返回创建
        </button>
      </div>
    )
  }

  const maxVotes = Math.max(...options.map((o) => o.votes), 1)
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0)

  const handleVote = (optionId: string) => {
    if (hasVoted || isEnded) return
    const option = options.find((o) => o.id === optionId)
    if (!option) return
    updateOptionVotes(optionId, option.votes + 1)
    setHasVoted(true)
  }

  const handleEndPoll = () => {
    endPoll()
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/create')} style={styles.backBtn}>
          ← 返回
        </button>
        <div style={styles.codeBadge}>#{code}</div>
      </div>
      <h2 style={styles.title}>{pollTitle}</h2>
      {pollDescription && <p style={styles.description}>{pollDescription}</p>}
      <div style={styles.statusRow}>
        <span style={{ ...styles.status, color: isEnded ? '#EF4444' : '#10B981' }}>
          {isEnded ? '已结束' : '进行中'}
        </span>
        <span style={styles.voteCount}>共 {totalVotes} 票</span>
      </div>
      <div style={styles.optionsList}>
        {options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
          const heatColor = getHeatColor(option.votes, maxVotes)
          return (
            <div
              key={option.id}
              onClick={() => handleVote(option.id)}
              style={{
                ...styles.optionCard,
                cursor: hasVoted || isEnded ? 'default' : 'pointer',
                opacity: hasVoted || isEnded ? 1 : 0.9,
              }}
            >
              <div style={styles.optionInfo}>
                <span style={styles.optionName}>{option.name}</span>
                <span style={styles.optionVotes}>{option.votes} 票 ({percentage.toFixed(1)}%)</span>
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${percentage}%`,
                    background: heatColor,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {!isEnded && (
        <button onClick={handleEndPoll} style={styles.endBtn}>
          结束投票
        </button>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  backBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #2E2E4A',
    background: '#1E1E2E',
    color: '#E0E0E0',
    fontSize: '14px',
    cursor: 'pointer',
  },
  codeBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    background: '#7C3AED',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '600',
  },
  title: {
    color: '#E0E0E0',
    fontSize: '28px',
    marginBottom: '8px',
  },
  description: {
    color: '#9CA3AF',
    marginBottom: '16px',
    lineHeight: '1.6',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  status: {
    fontSize: '14px',
    fontWeight: '600',
  },
  voteCount: {
    color: '#9CA3AF',
    fontSize: '14px',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  optionCard: {
    padding: '16px',
    borderRadius: '12px',
    background: '#1E1E2E',
    border: '1px solid #2E2E4A',
    transition: 'border-color 0.2s',
  },
  optionInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  optionName: {
    color: '#E0E0E0',
    fontSize: '15px',
    fontWeight: '500',
  },
  optionVotes: {
    color: '#9CA3AF',
    fontSize: '14px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: '#0F0F1A',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  endBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#EF4444',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#EF4444',
    marginBottom: '16px',
  },
}

export default PollDetail
