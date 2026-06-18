import React, { useState, useMemo } from 'react'
import { useChallengeStore } from '../../../store/challengeStore'
import CalendarView from '../../visualization/components/CalendarView'
import RingProgress from '../../visualization/components/RingProgress'

const MemberDetail: React.FC = () => {
  const challenge = useChallengeStore(s => s.currentChallenge)
  const selectedMemberId = useChallengeStore(s => s.selectedMemberId)
  const setCurrentPage = useChallengeStore(s => s.setCurrentPage)
  const addCheckIn = useChallengeStore(s => s.addCheckIn)
  const getMemberStats = useChallengeStore(s => s.getMemberStats)
  const getCheckInsByMember = useChallengeStore(s => s.getCheckInsByMember)
  const getCheckInByDate = useChallengeStore(s => s.getCheckInByDate)

  const [showModal, setShowModal] = useState(false)
  const [modalDate, setModalDate] = useState('')
  const [description, setDescription] = useState('')
  const [imageBase64, setImageBase64] = useState('')
  const [completionAmount, setCompletionAmount] = useState(100)
  const [errorMsg, setErrorMsg] = useState('')

  const member = useMemo(() => {
    if (!challenge || !selectedMemberId) return null
    return challenge.members.find(m => m.id === selectedMemberId) || null
  }, [challenge, selectedMemberId])

  const checkIns = useMemo(() => {
    if (!selectedMemberId) return []
    return getCheckInsByMember(selectedMemberId)
  }, [selectedMemberId, getCheckInsByMember])

  const stats = useMemo(() => {
    if (!selectedMemberId) return { totalCheckIns: 0, completionRate: 0 }
    return getMemberStats(selectedMemberId)
  }, [selectedMemberId, getMemberStats])

  const { minDate, maxDate } = useMemo(() => {
    if (!challenge) return { minDate: '', maxDate: '' }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(challenge.startDate)
    endDate.setDate(endDate.getDate() + challenge.durationDays - 1)
    const max = today < endDate ? today : endDate
    return {
      minDate: challenge.startDate,
      maxDate: max.toISOString().split('T')[0],
    }
  }, [challenge])

  const handleMakeUp = (date: string) => {
    setModalDate(date)
    setDescription('')
    setImageBase64('')
    setCompletionAmount(100)
    setErrorMsg('')
    setShowModal(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const validateDate = (dateStr: string): string => {
    if (!challenge || !selectedMemberId) return ''
    if (!dateStr) return '请选择日期'

    const selected = new Date(dateStr)
    selected.setHours(0, 0, 0, 0)

    const start = new Date(challenge.startDate)
    start.setHours(0, 0, 0, 0)
    if (selected < start) {
      return '不能选择挑战开始之前的日期'
    }

    const end = new Date(challenge.startDate)
    end.setDate(end.getDate() + challenge.durationDays - 1)
    end.setHours(0, 0, 0, 0)
    if (selected > end) {
      return '不能选择挑战结束之后的日期'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selected > today) {
      return '不能选择未来的日期'
    }

    const existing = getCheckInByDate(selectedMemberId, dateStr)
    if (existing) {
      return '该日期已有打卡记录，可以覆盖'
    }

    return ''
  }

  const handleDateChange = (dateStr: string) => {
    setModalDate(dateStr)
    setErrorMsg(validateDate(dateStr))
  }

  const handleSubmit = () => {
    if (!selectedMemberId || !modalDate) return

    const err = validateDate(modalDate)
    if (err && !err.includes('覆盖')) {
      setErrorMsg(err)
      return
    }

    addCheckIn(selectedMemberId, modalDate, description, imageBase64, completionAmount)
    setShowModal(false)
  }

  const handleBack = () => {
    setCurrentPage('detail')
  }

  if (!member || !challenge) {
    return (
      <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>
        成员不存在
        <button
          onClick={handleBack}
          style={{
            display: 'block',
            margin: '20px auto',
            background: '#3B82F6',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: '8px',
          }}
        >
          返回
        </button>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
      <button
        onClick={handleBack}
        style={{
          background: 'transparent',
          color: '#94A3B8',
          fontSize: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ← 返回挑战详情
      </button>

      <div
        style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: member.avatar,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          {member.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
            {member.name}
          </h1>
          <p style={{ fontSize: '14px', color: '#94A3B8' }}>{member.email}</p>
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>打卡次数 </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                {stats.totalCheckIns}
              </span>
            </div>
          </div>
        </div>

        <RingProgress percentage={stats.completionRate} size={100} strokeWidth={10} />
      </div>

      <div
        style={{
          background: '#1E293B',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <CalendarView
          memberId={member.id}
          memberName={member.name}
          memberAvatar={member.avatar}
          checkIns={checkIns}
          startDate={challenge.startDate}
          durationDays={challenge.durationDays}
          onMakeUp={handleMakeUp}
        />
      </div>

      {showModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
            onClick={() => setShowModal(false)}
          />
          <div
            className="fade-in"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#fff',
              borderRadius: '24px',
              padding: '32px',
              zIndex: 1000,
              width: '90%',
              maxWidth: '480px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1E293B',
                marginBottom: '20px',
              }}
            >
              补卡
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#334155',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              >
                日期
              </label>
              <input
                type="date"
                value={modalDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => handleDateChange(e.target.value)}
                style={{
                  width: '100%',
                  background: '#F1F5F9',
                  color: '#1E293B',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  border: errorMsg ? '1px solid #EF4444' : 'none',
                }}
              />
              {errorMsg && (
                <div
                  style={{
                    fontSize: '12px',
                    color: errorMsg.includes('覆盖') ? '#F59E0B' : '#EF4444',
                    marginTop: '6px',
                  }}
                >
                  {errorMsg}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                可选范围：{minDate} 至 {maxDate}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#334155',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              >
                完成度 (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={completionAmount}
                onChange={(e) => setCompletionAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#22C55E',
                }}
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                {completionAmount}%
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#334155',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              >
                打卡描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="记录一下今天的锻炼感受..."
                rows={3}
                style={{
                  width: '100%',
                  background: '#F1F5F9',
                  color: '#1E293B',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '14px',
                  border: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#334155',
                  fontWeight: '500',
                  marginBottom: '8px',
                  fontSize: '14px',
                }}
              >
                上传图片
              </label>
              <label
                style={{
                  display: 'block',
                  background: '#F1F5F9',
                  border: '2px dashed #CBD5E1',
                  borderRadius: '10px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontSize: '14px',
                }}
              >
                {imageBase64 ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={imageBase64}
                      alt="预览"
                      style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px' }}
                    />
                    <div style={{ fontSize: '12px', color: '#22C55E', marginTop: '8px' }}>
                      已选择图片，点击更换
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
                    点击上传图片证明
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  background: '#F1F5F9',
                  color: '#475569',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '500',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                确认补卡
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MemberDetail
