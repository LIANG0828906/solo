import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useVoteStore, Vote } from './voteSlice'

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getTotalVotes = (vote: Vote): number => {
  return vote.options.reduce((sum, opt) => sum + opt.votes, 0)
}

type SortOption = 'time-desc' | 'votes-desc' | 'time-asc'

const VoteCard: React.FC<{ vote: Vote; voted: boolean; onVote: (voteId: string, optionId: string) => void }> = React.memo(({ vote, voted, onVote }) => {
  return (
    <div className="vote-card" style={{ ...cardStyle }}>
      <h3 style={titleStyle}>{vote.title}</h3>
      <div style={optionsContainerStyle}>
        {vote.options.map(option => (
          <button
            key={option.id}
            style={{
              ...optionButtonStyle,
              cursor: voted ? 'not-allowed' : 'pointer',
              opacity: voted ? 0.6 : 1,
            }}
            disabled={voted}
            onClick={() => onVote(vote.id, option.id)}
            onMouseEnter={(e) => {
              if (!voted) {
                e.currentTarget.style.backgroundColor = '#4A4A5D'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3A3A4D'
            }}
          >
            <span>{option.text}</span>
            <span style={{ marginLeft: 'auto', color: '#B0B0B0', fontSize: '14px' }}>{option.votes}</span>
          </button>
        ))}
      </div>
      <div style={footerStyle}>
        <span>总投票数：{getTotalVotes(vote)}</span>
        <span>{formatDate(vote.createdAt)}</span>
      </div>
    </div>
  )
})

VoteCard.displayName = 'VoteCard'

const VoteList: React.FC = () => {
  const votes = useVoteStore(state => state.votes)
  const createVote = useVoteStore(state => state.createVote)
  const castVote = useVoteStore(state => state.castVote)
  const hasVoted = useVoteStore(state => state.hasVoted)

  const [title, setTitle] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('time-desc')

  const searchTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current)
      }
    }
  }, [searchTerm])

  const handleCreateVote = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const options = optionsText.split('\n').map(o => o.trim()).filter(o => o.length > 0)

    if (!trimmedTitle) {
      alert('请输入投票标题')
      return
    }
    if (options.length < 2) {
      alert('请至少输入2个选项')
      return
    }
    if (options.length > 6) {
      alert('最多只能有6个选项')
      return
    }

    createVote(trimmedTitle, options)
    setTitle('')
    setOptionsText('')
  }, [title, optionsText, createVote])

  const handleVote = useCallback((voteId: string, optionId: string) => {
    castVote(voteId, optionId)
  }, [castVote])

  const filteredAndSortedVotes = useMemo(() => {
    let result = votes

    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase()
      result = result.filter(v => v.title.toLowerCase().includes(term))
    }

    const sorted = [...result]
    switch (sortOption) {
      case 'time-desc':
        sorted.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'time-asc':
        sorted.sort((a, b) => a.createdAt - b.createdAt)
        break
      case 'votes-desc':
        sorted.sort((a, b) => getTotalVotes(b) - getTotalVotes(a))
        break
    }

    return sorted
  }, [votes, debouncedSearch, sortOption])

  return (
    <div style={containerStyle}>
      <div style={formWrapperStyle}>
        <form onSubmit={handleCreateVote} style={formStyle}>
          <div style={formRowStyle}>
            <input
              type="text"
              placeholder="投票标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="title-input"
              style={titleInputStyle}
            />
          </div>
          <div style={formRowStyle}>
            <textarea
              placeholder="投票选项（每行一个，至少2个，最多6个）"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              className="options-input"
              style={optionsInputStyle}
              rows={5}
            />
          </div>
          <div style={formRowStyle}>
            <button type="submit" className="submit-btn" style={submitButtonStyle}>
              创建投票
            </button>
          </div>
        </form>
      </div>

      <div className="search-sort-bar" style={searchSortBarStyle}>
        <input
          type="text"
          placeholder="搜索投票标题..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={searchInputStyle}
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          style={sortSelectStyle}
        >
          <option value="time-desc">按时间降序</option>
          <option value="votes-desc">按票数降序</option>
          <option value="time-asc">按时间升序</option>
        </select>
      </div>

      <div className="vote-grid" style={gridStyle}>
        {filteredAndSortedVotes.map(vote => (
          <VoteCard
            key={vote.id}
            vote={vote}
            voted={hasVoted(vote.id)}
            onVote={handleVote}
          />
        ))}
      </div>

      {filteredAndSortedVotes.length === 0 && (
        <div style={emptyStateStyle}>
          暂无投票，快去创建第一个吧！
        </div>
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
}

const formWrapperStyle: React.CSSProperties = {
  marginBottom: '8px',
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '24px',
  backgroundColor: '#1A1A2E',
  borderRadius: '12px',
}

const formRowStyle: React.CSSProperties = {
  display: 'flex',
}

const titleInputStyle: React.CSSProperties = {
  width: '400px',
  backgroundColor: '#2A2A3D',
  borderRadius: '8px',
  padding: '12px',
  color: '#E0E0E0',
  border: 'none',
  fontSize: '14px',
}

const optionsInputStyle: React.CSSProperties = {
  width: '400px',
  backgroundColor: '#2A2A3D',
  borderRadius: '8px',
  padding: '12px',
  color: '#E0E0E0',
  border: 'none',
  fontSize: '14px',
  resize: 'vertical',
  minHeight: '100px',
  lineHeight: '1.6',
}

const submitButtonStyle: React.CSSProperties = {
  backgroundColor: '#6C63FF',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '12px 32px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
}

const searchSortBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '8px',
}

const searchInputStyle: React.CSSProperties = {
  width: '300px',
  backgroundColor: '#2A2A3D',
  borderRadius: '20px',
  padding: '8px 16px',
  color: '#E0E0E0',
  border: 'none',
  fontSize: '14px',
}

const sortSelectStyle: React.CSSProperties = {
  backgroundColor: '#2A2A3D',
  borderRadius: '8px',
  padding: '8px 16px',
  color: '#E0E0E0',
  border: 'none',
  fontSize: '14px',
  cursor: 'pointer',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  columnGap: '24px',
  rowGap: '24px',
  transition: 'all 0.2s ease',
}

const cardStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#1E1E2E',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
  display: 'flex',
  flexDirection: 'column',
}

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: '#FFFFFF',
  marginBottom: '16px',
}

const optionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '16px',
}

const optionButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#3A3A4D',
  borderRadius: '8px',
  border: 'none',
  color: '#E0E0E0',
  fontSize: '14px',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.2s ease',
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: '#787878',
  marginTop: 'auto',
}

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#787878',
  fontSize: '16px',
  backgroundColor: '#1A1A2E',
  borderRadius: '12px',
}

export default VoteList
