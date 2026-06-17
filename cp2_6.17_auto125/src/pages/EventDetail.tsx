import React, { useState, useEffect, useRef } from 'react'
import { useEventStore } from '../store'
import { generateQRCode } from '../utils/qrGenerator'

const EventDetail: React.FC = () => {
  const { events, currentEventId, setCurrentEvent, deleteEvent, signIn, addParticipantsBatch, getEventStats } = useEventStore()
  const event = currentEventId ? events.find(e => e.id === currentEventId) : null

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [showCopied, setShowCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [animatingDelete, setAnimatingDelete] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [newParticipants, setNewParticipants] = useState<string[]>([])
  const [signingInIds, setSigningInIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stats = event ? getEventStats(event.id) : { total: 0, signedIn: 0, percentage: 0 }
  const { total, signedIn, percentage } = stats

  useEffect(() => {
    if (event) {
      generateQRCode(event.id).then(url => setQrCodeUrl(url)).catch(console.error)
    }
  }, [event?.id])

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMsg])

  useEffect(() => {
    if (newParticipants.length > 0) {
      const timer = setTimeout(() => setNewParticipants([]), 500)
      return () => clearTimeout(timer)
    }
  }, [newParticipants])

  if (!event) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        活动不存在
      </div>
    )
  }

  const handleCopyLink = async () => {
    const link = `eventpulse://checkin/${event.id}`
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link)
        setCopyError(false)
        setShowCopied(true)
        setTimeout(() => setShowCopied(false), 2000)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = link
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        textArea.style.top = '-9999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          setCopyError(false)
          setShowCopied(true)
          setTimeout(() => setShowCopied(false), 2000)
        } catch (fallbackErr) {
          throw fallbackErr
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Copy failed:', err)
      setCopyError(true)
      setTimeout(() => setCopyError(false), 3000)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const currentEvent = event
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const lines = content.split(/\r?\n/).filter(line => line.trim())
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const participants: Array<{ name: string; email: string }> = []
      const invalidRows: number[] = []

      lines.forEach((line, idx) => {
        const parts = line.split(',').map(p => p.trim())
        if (parts.length >= 2) {
          const [name, email] = parts
          if (emailRegex.test(email)) {
            participants.push({ name, email })
          } else {
            invalidRows.push(idx + 1)
          }
        } else if (parts.length === 1 && parts[0]) {
          invalidRows.push(idx + 1)
        }
      })

      if (invalidRows.length > 0) {
        setErrorMsg(`第${invalidRows.join('、')}行邮箱格式无效`)
      }

      if (participants.length > 0) {
        const added = addParticipantsBatch(currentEvent.id, participants)
        if (added.length > 0) {
          setNewParticipants(added.map(p => p.id))
        }
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSignIn = (participantId: string) => {
    if (signingInIds.has(participantId)) return
    setSigningInIds(prev => new Set(prev).add(participantId))
    signIn(event.id, participantId)
    setTimeout(() => {
      setSigningInIds(prev => {
        const next = new Set(prev)
        next.delete(participantId)
        return next
      })
    }, 300)
  }

  const confirmDelete = () => {
    setAnimatingDelete(true)
    setTimeout(() => {
      deleteEvent(event.id)
      setAnimatingDelete(false)
      setShowDeleteConfirm(false)
      setCurrentEvent(null)
    }, 300)
  }

  const backBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6C63FF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '24px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    backgroundColor: 'transparent',
    border: 'none',
    fontFamily: 'inherit'
  }

  const pageHeaderStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '28px 32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '24px'
  }

  const eventTitleStyle: React.CSSProperties = {
    fontSize: '26px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '12px'
  }

  const eventMetaStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '12px'
  }

  const metaItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666'
  }

  const descStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.7,
    marginTop: '8px'
  }

  const importBtnStyle: React.CSSProperties = {
    height: '36px',
    padding: '0 20px',
    borderRadius: '8px',
    backgroundColor: '#6C63FF',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap'
  }

  const deleteBtnHeaderStyle: React.CSSProperties = {
    ...importBtnStyle,
    backgroundColor: '#E74C3C'
  }

  const headerBtnGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    flexShrink: 0
  }

  const twoColStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '24px'
  }

  const participantsCardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  }

  const cardHeaderStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid #F0F0F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }

  const countBadgeStyle: React.CSSProperties = {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    color: '#6C63FF',
    fontSize: '13px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '20px'
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse'
  }

  const thStyle: React.CSSProperties = {
    backgroundColor: '#EEEEF5',
    fontSize: '12px',
    fontWeight: 700,
    color: '#666',
    padding: '14px 24px',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  const tdStyle: React.CSSProperties = {
    padding: '16px 24px',
    fontSize: '14px',
    color: '#555',
    borderBottom: '1px solid #F5F5FA',
    verticalAlign: 'middle'
  }

  const signBtnStyle: React.CSSProperties = {
    width: '80px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#EEEEF5',
    color: '#999',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s'
  }

  const signedBtnStyle: React.CSSProperties = {
    ...signBtnStyle,
    backgroundColor: '#6C63FF',
    color: '#FFFFFF',
    cursor: 'default'
  }

  const statsCardStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    position: 'sticky',
    top: '32px'
  }

  const qrContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    width: '100%'
  }

  const qrImageStyle: React.CSSProperties = {
    width: '160px',
    height: '160px',
    borderRadius: '16px',
    border: '2px solid #EEEEF5',
    padding: '8px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.2s',
    objectFit: 'contain'
  }

  const copiedTextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#4CAF50',
    fontWeight: 600,
    transition: 'opacity 0.5s',
    opacity: showCopied ? 1 : 0,
    height: '18px'
  }

  const qrHintStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center'
  }

  const progressSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    paddingBottom: '8px',
    borderBottom: '1px solid #F0F0F5'
  }

  const statDetailsStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    gap: '12px'
  }

  const statBoxStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    backgroundColor: '#FAFAFE',
    borderRadius: '10px',
    textAlign: 'center'
  }

  const statBoxValueStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#333'
  }

  const statBoxLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px'
  }

  const errorAlertStyle: React.CSSProperties = {
    backgroundColor: '#FFEBEE',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#C62828',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 500
  }

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  }

  const confirmDialogStyle: React.CSSProperties = {
    width: '360px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    padding: '28px'
  }

  const confirmTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '12px'
  }

  const confirmDescStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '24px'
  }

  const confirmBtnGroupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  }

  const cancelBtnStyle: React.CSSProperties = {
    width: '120px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#EEEEF5',
    color: '#666',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }

  const confirmDeleteBtnStyle: React.CSSProperties = {
    width: '120px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#E74C3C',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }

  const emptyParticipantsStyle: React.CSSProperties = {
    padding: '60px 24px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  }

  const radius = 48
  const strokeWidth = 8
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <>
      <button
        style={backBtnStyle}
        onClick={() => setCurrentEvent(null)}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(108, 99, 255, 0.08)')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        返回活动列表
      </button>

      {errorMsg && (
        <div style={errorAlertStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {errorMsg}
        </div>
      )}

      <div style={pageHeaderStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={eventTitleStyle}>{event.name}</h1>
          <div style={eventMetaStyle}>
            <span style={metaItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {event.date}
            </span>
            <span style={metaItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {total} 位参与者
            </span>
            <span style={metaItemStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {signedIn} 位已签到
            </span>
          </div>
          {event.description && (
            <p style={descStyle}>{event.description}</p>
          )}
        </div>
        <div style={headerBtnGroupStyle}>
          <button
            style={importBtnStyle}
            onClick={() => fileInputRef.current?.click()}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5A52D5')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            导入参与者
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            style={deleteBtnHeaderStyle}
            onClick={() => setShowDeleteConfirm(true)}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#C0392B')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E74C3C')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            删除活动
          </button>
        </div>
      </div>

      <div style={twoColStyle}>
        <div style={participantsCardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>
              参与者名单
              <span style={countBadgeStyle}>{total} 人</span>
            </h2>
          </div>
          
          {total === 0 ? (
            <div style={emptyParticipantsStyle}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <div style={{ marginBottom: '8px', color: '#666', fontWeight: 500 }}>暂无参与者</div>
              <div style={{ fontSize: '13px' }}>点击「导入参与者」上传 CSV 文件，格式：姓名,邮箱</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '12px', padding: '14px 0 14px 24px' }}></th>
                    <th style={thStyle}>姓名</th>
                    <th style={thStyle}>邮箱</th>
                    <th style={{ ...thStyle, textAlign: 'right', width: '120px' }}>签到状态</th>
                  </tr>
                </thead>
                <tbody>
                  {event.participants.map((p, idx) => {
                    const isNew = newParticipants.includes(p.id)
                    return (
                      <tr
                        key={p.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFE',
                          animation: isNew ? 'slideInBottom 0.3s ease-out' : undefined
                        }}
                      >
                        <td style={{ ...tdStyle, padding: '16px 0 16px 24px', width: '12px' }}>
                          {p.signedIn && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#4CAF50',
                              animation: 'fadeIn 0.3s'
                            }} />
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(108, 99, 255, 0.1)',
                              color: '#6C63FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: 600,
                              flexShrink: 0
                            }}>
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500, color: '#333' }}>{p.name}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>{p.email}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <button
                            style={p.signedIn ? signedBtnStyle : signBtnStyle}
                            onClick={() => !p.signedIn && handleSignIn(p.id)}
                            onMouseOver={(e) => {
                              if (!p.signedIn && !signingInIds.has(p.id)) {
                                e.currentTarget.style.backgroundColor = '#6C63FF'
                                e.currentTarget.style.color = '#FFFFFF'
                              }
                            }}
                            onMouseOut={(e) => {
                              if (!p.signedIn && !signingInIds.has(p.id)) {
                                e.currentTarget.style.backgroundColor = '#EEEEF5'
                                e.currentTarget.style.color = '#999'
                              }
                            }}
                            disabled={p.signedIn && !signingInIds.has(p.id)}
                          >
                            {p.signedIn ? '已签到' : '签到'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={statsCardStyle}>
          <div style={progressSectionStyle}>
            <h2 style={{ ...cardTitleStyle, alignSelf: 'flex-start', marginBottom: '4px' }}>签到统计</h2>
            
            <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
              <svg width={radius * 2} height={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  stroke="#E8E8F0"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  stroke="#6C63FF"
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{
                    strokeDashoffset: strokeDashoffset,
                    transition: 'stroke-dashoffset 1s ease-out'
                  }}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
              </svg>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>
                  {signedIn}/{total}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  已签到/总人数
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#6C63FF'
            }}>
              {total > 0 ? Math.round(percentage) : 0}%
            </div>
          </div>

          <div style={statDetailsStyle}>
            <div style={statBoxStyle}>
              <div style={{ ...statBoxValueStyle, color: '#6C63FF' }}>{total}</div>
              <div style={statBoxLabelStyle}>总人数</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ ...statBoxValueStyle, color: '#4CAF50' }}>{signedIn}</div>
              <div style={statBoxLabelStyle}>已签到</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ ...statBoxValueStyle, color: '#FF9800' }}>{total - signedIn}</div>
              <div style={statBoxLabelStyle}>未签到</div>
            </div>
          </div>

          <div style={qrContainerStyle}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#333', alignSelf: 'flex-start' }}>签到二维码</h3>
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="签到二维码"
                style={qrImageStyle}
                onClick={handleCopyLink}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            )}
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              transition: 'opacity 0.5s',
              opacity: showCopied || copyError ? 1 : 0,
              height: '18px',
              color: copyError ? '#E74C3C' : '#4CAF50'
            }}>
              {copyError ? '✗ 复制失败，请手动复制链接' : '✓ 已复制签到链接'}
            </div>
            <div style={qrHintStyle}>点击二维码复制签到链接</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInBottom {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {showDeleteConfirm && (
        <div style={modalOverlayStyle} onClick={() => !animatingDelete && setShowDeleteConfirm(false)}>
          <div style={confirmDialogStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={confirmTitleStyle}>确认删除</h3>
            <p style={confirmDescStyle}>
              确定要删除活动「<strong style={{ color: '#E74C3C' }}>{event.name}</strong>」吗？此操作不可撤销。
            </p>
            <div style={confirmBtnGroupStyle}>
              <button
                style={cancelBtnStyle}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={animatingDelete}
                onMouseOver={(e) => !animatingDelete && (e.currentTarget.style.backgroundColor = '#DDDDE5')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#EEEEF5')}
              >
                取消
              </button>
              <button
                style={confirmDeleteBtnStyle}
                onClick={confirmDelete}
                disabled={animatingDelete}
                onMouseOver={(e) => !animatingDelete && (e.currentTarget.style.backgroundColor = '#C0392B')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E74C3C')}
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EventDetail
