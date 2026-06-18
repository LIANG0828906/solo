import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { getInitials } from '@/utils/storage'

interface FanBoardProps {
  artistId: string
}

const containerStyle: React.CSSProperties = {
  marginTop: '32px',
  padding: '24px',
  backgroundColor: '#1E1E1E',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#EAEAEA',
}

const refreshInfoStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888',
}

const fansListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const fanItemStyle = (fadeIn: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: '#252525',
  borderRadius: '8px',
  opacity: fadeIn ? 1 : 0,
  transition: 'opacity 0.3s ease',
})

const rankStyle = (index: number): React.CSSProperties => {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#888', '#888']
  return {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: colors[index] || '#888',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
  }
}

const avatarStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  flexShrink: 0,
  position: 'relative',
}

const gmailBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-2px',
  right: '-2px',
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  backgroundColor: '#DB4437',
  color: '#fff',
  fontSize: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
}

const fanInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const fanNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: '#EAEAEA',
  marginBottom: '2px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const likeCountStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#FF6B6B',
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#666',
  padding: '32px',
  fontSize: '14px',
}

export function FanBoard({ artistId }: FanBoardProps) {
  const { getTopFans } = useStore()
  const [fans, setFans] = useState(getTopFans(artistId, 5))
  const [fadeKey, setFadeKey] = useState(0)

  useEffect(() => {
    const refreshFans = () => {
      setFans(getTopFans(artistId, 5))
      setFadeKey((prev) => prev + 1)
    }

    refreshFans()
    const interval = setInterval(refreshFans, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [artistId, getTopFans])

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>🏆 粉丝榜</h3>
        <span style={refreshInfoStyle}>每10分钟自动刷新</span>
      </div>

      <div style={fansListStyle} key={fadeKey}>
        {fans.length === 0 ? (
          <p style={emptyStyle}>暂无粉丝点赞数据</p>
        ) : (
          fans.map((fan, index) => (
            <FanItem key={`${fan.name}-${fadeKey}`} fan={fan} index={index} />
          ))
        )}
      </div>
    </div>
  )
}

function FanItem({ fan, index }: { fan: { name: string; count: number }; index: number }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), index * 50)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div style={fanItemStyle(show)}>
      <div style={rankStyle(index)}>{index + 1}</div>
      <div style={avatarStyle}>
        {getInitials(fan.name)}
        <span style={gmailBadgeStyle}>G</span>
      </div>
      <div style={fanInfoStyle}>
        <p style={fanNameStyle}>{fan.name}</p>
        <p style={likeCountStyle}>❤ {fan.count} 次点赞</p>
      </div>
    </div>
  )
}
