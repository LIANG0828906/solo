import React, { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { IssueDetail, User, Comment } from '../api'
import { voteOption, addComment } from '../api'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface IssueDetailProps {
  issue: IssueDetail
  currentUser: User
  onUpdate: () => void
}

const AVATAR_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'
]

const getAvatarColor = (userId: string): string => {
  const index = parseInt(userId, 10) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] || AVATAR_COLORS[0]
}

const getInitial = (name: string): string => {
  return name.charAt(0)
}

const IssueDetailComponent: React.FC<IssueDetailProps> = ({ issue, currentUser, onUpdate }) => {
  const [commentText, setCommentText] = useState('')
  const [votingOption, setVotingOption] = useState<string | null>(null)
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  const hasVoted = issue.options.some(opt => opt.votes.includes(currentUser.id))
  const userVotedOption = issue.options.find(opt => opt.votes.includes(currentUser.id))?.id || null

  const handleVote = async (optionId: string) => {
    if (hasVoted || issue.status === 'ended') return
    setVotingOption(optionId)
    try {
      await voteOption(issue.id, optionId, currentUser.id)
      onUpdate()
    } catch {
      alert('投票失败')
    } finally {
      setVotingOption(null)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try {
      await addComment(issue.id, currentUser.id, commentText.trim())
      setCommentText('')
      onUpdate()
    } catch {
      alert('评论失败')
    }
  }

  const deadlineDisplay = issue.status === 'ended'
    ? '已截止'
    : `截止时间：${dayjs(issue.deadline).format('YYYY-MM-DD HH:mm')}`

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>{issue.title}</h1>
            <span style={{
              ...styles.statusBadge,
              ...(issue.status === 'ongoing' ? styles.statusOngoing : styles.statusEnded)
            }}>
              {issue.status === 'ongoing' ? '进行中' : '已结束'}
            </span>
          </div>
          <p style={styles.timestamp}>{dayjs(issue.createdAt).fromNow()}</p>
          <p style={styles.description}>{issue.description}</p>
          <p style={{ ...styles.timestamp, marginTop: '8px' }}>{deadlineDisplay}</p>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>投票选项</h3>
          <div style={styles.optionsGrid}>
            {issue.options.map(option => {
              const percentage = issue.totalVotes > 0 ? (option.votes.length / issue.totalVotes) * 100 : 0
              const isSelected = userVotedOption === option.id
              const isHovered = hoveredOption === option.id
              const isWinning = issue.status === 'ended' && issue.winningOptionId === option.id

              return (
                <div
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  onMouseEnter={() => setHoveredOption(option.id)}
                  onMouseLeave={() => setHoveredOption(null)}
                  style={{
                    ...styles.optionCard,
                    ...(isSelected ? styles.optionCardSelected : {}),
                    ...(isHovered && !hasVoted && issue.status === 'ongoing' ? styles.optionCardHover : {}),
                    ...(isWinning ? styles.optionCardWinning : {}),
                    cursor: (hasVoted || issue.status === 'ended') ? 'default' : 'pointer',
                  }}
                >
                  {isWinning && (
                    <span style={styles.crownIcon}>👑</span>
                  )}
                  <div style={styles.optionHeader}>
                    <span style={styles.optionEmoji}>{option.emoji}</span>
                    <span style={styles.optionName}>{option.name}</span>
                    <span style={styles.voteCount}>{option.votes.length} 票</span>
                  </div>
                  <div style={styles.progressBarBg}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${percentage}%`,
                        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      }}
                    />
                  </div>
                  <div style={styles.percentageText}>{percentage.toFixed(1)}%</div>
                </div>
              )
            })}
          </div>
          <p style={styles.voteHint}>
            {issue.status === 'ended'
              ? '投票已结束'
              : hasVoted
                ? '您已完成投票'
                : '每人限投一票，投票后不可修改'}
          </p>
        </div>

        {issue.status === 'ended' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>投票记录</h3>
            <div style={styles.voteRecords}>
              {issue.voteRecords.map((record, idx) => (
                <div key={idx} style={styles.voteRecordItem}>
                  <div style={{
                    ...styles.avatarSmall,
                    background: getAvatarColor(record.user.id),
                  }}>
                    {getInitial(record.user.name)}
                  </div>
                  <span style={styles.recordName}>{record.user.name}</span>
                  <span style={styles.recordArrow}>→</span>
                  <span style={styles.recordOption}>{record.optionName}</span>
                </div>
              ))}
              {issue.voteRecords.length === 0 && (
                <div style={styles.emptyRecords}>暂无投票记录</div>
              )}
            </div>
          </div>
        )}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>讨论区 ({issue.comments.length})</h3>
          <div style={styles.commentInput}>
            <div style={{
              ...styles.avatarSmall,
              background: getAvatarColor(currentUser.id),
            }}>
              {getInitial(currentUser.name)}
            </div>
            <textarea
              style={styles.textarea}
              placeholder="发表你的看法..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              rows={3}
            />
            <button
              style={{
                ...styles.commentBtn,
                ...(commentText.trim() ? {} : styles.commentBtnDisabled)
              }}
              onClick={handleAddComment}
              disabled={!commentText.trim()}
            >
              发送
            </button>
          </div>
          <div style={styles.commentsList}>
            {issue.comments.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            {issue.comments.length === 0 && (
              <div style={styles.emptyComments}>还没有评论，来发表第一条吧！</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  const user = comment.user
  if (!user) return null

  return (
    <div style={commentStyles.container}>
      <div style={{
        ...commentStyles.avatar,
        background: getAvatarColor(user.id),
      }}>
        {getInitial(user.name)}
      </div>
      <div style={commentStyles.content}>
        <div style={commentStyles.header}>
          <span style={commentStyles.name}>{user.name}</span>
          <span style={commentStyles.time}>{dayjs(comment.createdAt).fromNow()}</span>
        </div>
        <p style={commentStyles.text}>{comment.content}</p>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    padding: '24px 32px',
    overflowY: 'auto',
  },
  header: {
    marginBottom: '32px',
    paddingBottom: '20px',
    borderBottom: '1px solid #E5E7EB',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1F2937',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
  },
  statusOngoing: {
    background: '#ECFDF5',
    color: '#059669',
  },
  statusEnded: {
    background: '#F3F4F6',
    color: '#6B7280',
  },
  timestamp: {
    fontSize: '13px',
    color: '#9CA3AF',
    marginBottom: '12px',
  },
  description: {
    fontSize: '15px',
    color: '#4B5563',
    lineHeight: 1.7,
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: '16px',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '12px',
  },
  optionCard: {
    position: 'relative',
    padding: '20px',
    border: '2px solid #D1D5DB',
    borderRadius: '12px',
    background: '#FFFFFF',
    transition: 'all 0.2s ease',
  },
  optionCardHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
  },
  optionCardSelected: {
    borderColor: '#6366F1',
    background: '#F5F3FF',
  },
  optionCardWinning: {
    borderColor: '#F59E0B',
    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    boxShadow: '0 2px 12px rgba(245, 158, 11, 0.2)',
  },
  crownIcon: {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    fontSize: '24px',
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  optionEmoji: {
    fontSize: '28px',
  },
  optionName: {
    flex: 1,
    fontSize: '15px',
    fontWeight: 600,
    color: '#1F2937',
  },
  voteCount: {
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: 500,
  },
  progressBarBg: {
    height: '8px',
    background: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
    borderRadius: '4px',
    transformOrigin: 'left',
  },
  percentageText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6366F1',
    textAlign: 'right',
  },
  voteHint: {
    fontSize: '12px',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  voteRecords: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '12px 16px',
  },
  voteRecordItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  recordName: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: 500,
  },
  recordArrow: {
    color: '#9CA3AF',
    fontSize: '12px',
  },
  recordOption: {
    fontSize: '14px',
    color: '#6366F1',
    fontWeight: 500,
  },
  emptyRecords: {
    padding: '20px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '13px',
  },
  avatarSmall: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 600,
    flexShrink: 0,
  },
  commentInput: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    alignItems: 'flex-start',
  },
  textarea: {
    flex: 1,
    padding: '12px 14px',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'none',
    outline: 'none',
    background: '#FFFFFF',
    transition: 'border-color 0.2s ease',
    lineHeight: 1.5,
  },
  commentBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  commentBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyComments: {
    padding: '30px',
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '14px',
    background: '#FFFFFF',
    border: '1px dashed #E5E7EB',
    borderRadius: '12px',
  },
}

const commentStyles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    gap: '12px',
    animation: 'fadeIn 0.3s ease',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 600,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '12px 16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  name: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1F2937',
  },
  time: {
    fontSize: '12px',
    color: '#9CA3AF',
  },
  text: {
    fontSize: '14px',
    color: '#4B5563',
    lineHeight: 1.6,
  },
}

export default IssueDetailComponent
