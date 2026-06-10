import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStationStore } from '../store/useStationStore'
import { Caravan } from '../types'

type TabType = 'caravan' | 'horse' | 'beacon'

const DispatchPanel: React.FC = () => {
  const {
    showDispatchPanel,
    setShowDispatchPanel,
    activeDocumentCaravanId,
    setActiveDocumentCaravanId,
    caravans,
    horses,
    travelers,
    selectedHorseId,
    selectedTravelerId,
    setSelectedHorseId,
    setSelectedTravelerId,
    markCargoError,
    unmarkCargoError,
    verifyCaravan,
    updateCaravan,
    updateHorse,
    setBeaconState,
    addLog,
    incrementHorseChangeCount
  } = useStationStore()

  const [activeTab, setActiveTab] = useState<TabType>('caravan')
  const [beaconReason, setBeaconReason] = useState('')
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail === 'beacon') {
        setActiveTab('beacon')
      }
    }
    window.addEventListener('switchTab', handleSwitchTab)
    return () => window.removeEventListener('switchTab', handleSwitchTab)
  }, [])

  useEffect(() => {
    if (activeDocumentCaravanId && showDispatchPanel) {
      setActiveTab('caravan')
    }
  }, [activeDocumentCaravanId, showDispatchPanel])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const activeCaravan = caravans.find(c => c.id === activeDocumentCaravanId)
  const messengers = travelers.filter(t => t.type === 'messenger')

  const handleCargoCheck = (caravanId: string, cargoName: string, checked: boolean) => {
    if (checked) {
      markCargoError(caravanId, cargoName)
    } else {
      unmarkCargoError(caravanId, cargoName)
    }
  }

  const handleVerify = (caravan: Caravan) => {
    const result = verifyCaravan(caravan.id)
    if (result.success) {
      setVerificationResult({ success: true, message: '文牒核验无误，已签押放行！' })
      updateCaravan(caravan.id, { status: 'leaving', markedErrors: [] })
      setActiveDocumentCaravanId(null)
      setTimeout(() => {
        setVerificationResult(null)
      }, 2000)
    } else {
      setVerificationResult({ success: false, message: `核验错误！${result.missedErrors.length}项货物不符未检出或误判。` })
    }
  }

  const handleClose = () => {
    setShowDispatchPanel(false)
    setVerificationResult(null)
    setBeaconReason('')
  }

  const handleAssignHorse = async () => {
    if (!selectedHorseId || !selectedTravelerId) {
      setToast({ type: 'error', message: '请先选择马匹和信使！' })
      return
    }

    const horse = horses.find(h => h.id === selectedHorseId)
    const traveler = travelers.find(t => t.id === selectedTravelerId)

    if (!horse || !traveler) {
      setToast({ type: 'error', message: '选择的马匹或信使不存在！' })
      return
    }

    if (horse.status !== 'idle') {
      setToast({ type: 'error', message: '该马匹已被征用！' })
      return
    }

    try {
      const now = Date.now()
      const direction = Math.random() > 0.5 ? 'left' : 'right'

      const res = await fetch(`/api/horses/${selectedHorseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_use', matchTime: now })
      })

      if (!res.ok) throw new Error('API call failed')

      updateHorse(selectedHorseId, {
        status: 'in_use',
        matchTime: now,
        messenger: traveler.name,
        direction,
        exitTime: now + 60000
      })

      incrementHorseChangeCount()
      addLog({
        type: 'horse',
        message: `${horse.name}已被征用，载${traveler.name}${direction === 'left' ? '入京' : '出塞'}。`,
        level: 'info'
      })

      setToast({ type: 'success', message: `${horse.name}已分配给${traveler.name}！` })
      setSelectedHorseId(null)
      setSelectedTravelerId(null)
    } catch (e) {
      setToast({ type: 'error', message: '分配马匹失败，请重试！' })
    }
  }

  const handleBeaconAlert = (level: 1 | 2 | 3) => {
    if (!beaconReason.trim()) {
      setToast({ type: 'error', message: '请输入报警原因！' })
      return
    }

    const levelNames: Record<number, string> = {
      1: '一炷烟/安全',
      2: '二炷烟/警惕',
      3: '三炷烟/紧急'
    }

    setBeaconState({ level, startTime: Date.now(), reason: beaconReason })
    addLog({
      type: 'beacon',
      message: `烽燧施放${levelNames[level]}！原因：${beaconReason}`,
      level: level === 1 ? 'info' : level === 2 ? 'warn' : 'error'
    })

    setToast({ type: level === 1 ? 'success' : level === 2 ? 'info' : 'error', message: `已施放${levelNames[level]}！` })
    setBeaconReason('')

    if (level === 3) {
      setTimeout(() => {
        useStationStore.getState().addLog({
          type: 'warning',
          message: '三炷烽烟已起！全体驿卒进入战备状态，紧闭驿门！',
          level: 'error'
        })
      }, 500)
    }
  }

  const renderCaravanTab = () => {
    const waitingCaravans = caravans.filter(c => c.status === 'waiting')
    const activeCaravanToShow = activeCaravan || waitingCaravans[0]

    if (!activeCaravanToShow) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--smoke-gray)' }}>
          <p style={{ fontSize: '1.2rem' }}>目前暂无驼队等待核验</p>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>驼队抵达时会自动弹出文牒核验窗口</p>
        </div>
      )
    }

    const caravan = activeCaravanToShow

    return (
      <div className="document-modal">
        <div className="document-header">
          <h3>通关文牒</h3>
          <div className="seal">凉州都督府</div>
        </div>

        <div className="document-info">
          <div className="info-item">
            <span className="label">驼队主人</span>
            <span className="value">{caravan.ownerName}</span>
          </div>
          <div className="info-item">
            <span className="label">出发地</span>
            <span className="value">{caravan.origin}</span>
          </div>
          <div className="info-item">
            <span className="label">骆驼数量</span>
            <span className="value">{caravan.cargoCount} 匹</span>
          </div>
          <div className="info-item">
            <span className="label">随行人员</span>
            <span className="value">{caravan.passengerCount} 人</span>
          </div>
          <div className="info-item">
            <span className="label">携带马匹</span>
            <span className="value">{caravan.horseCount} 匹</span>
          </div>
          <div className="info-item">
            <span className="label">货物种类</span>
            <span className="value">{caravan.cargo.length} 种</span>
          </div>
        </div>

        <h4 style={{ color: 'var(--wood-plaque)', marginBottom: '10px', fontSize: '1.1rem' }}>
          货物清单（请核对申报数量与实际数量，勾选不符项）
        </h4>

        <table className="cargo-table">
          <thead>
            <tr>
              <th className="checkbox-cell">有误</th>
              <th>货物名称</th>
              <th>文牒记载</th>
              <th>实际清点</th>
            </tr>
          </thead>
          <tbody>
            {caravan.cargo.map((item, index) => {
              const isMarked = caravan.markedErrors.includes(item.name)
              const hasMismatch = item.declared !== item.actual
              return (
                <tr key={index} className={isMarked ? 'error-highlight' : ''}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      className="cargo-checkbox"
                      checked={isMarked}
                      onChange={(e) => handleCargoCheck(caravan.id, item.name, e.target.checked)}
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td>{item.declared}</td>
                  <td style={{ color: hasMismatch ? 'var(--saddle-red)' : 'inherit', fontWeight: hasMismatch ? 600 : 400 }}>
                    {item.actual}
                    {hasMismatch && <span style={{ marginLeft: '5px', fontSize: '0.8rem' }}>(不符)</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {verificationResult && (
          <div className={`verification-result ${verificationResult.success ? 'success' : 'error'}`}>
            {verificationResult.message}
          </div>
        )}

        <div className="action-buttons">
          <button
            className="action-btn secondary"
            onClick={() => {
              setActiveDocumentCaravanId(null)
              updateCaravan(caravan.id, { status: 'waiting' })
            }}
          >
            稍后核验
          </button>
          <button
            className="action-btn primary"
            onClick={() => handleVerify(caravan)}
          >
            签押放行
          </button>
        </div>
      </div>
    )
  }

  const renderHorseTab = () => (
    <div>
      <h3 style={{ color: 'var(--wood-plaque)', marginBottom: '15px', fontSize: '1.2rem' }}>
        选择驿马
      </h3>
      <div className="horses-grid">
        {horses.map(horse => (
          <div
            key={horse.id}
            className={`horse-card ${horse.status === 'in_use' ? 'in-use' : ''} ${selectedHorseId === horse.id ? 'selected' : ''}`}
            onClick={() => horse.status === 'idle' && setSelectedHorseId(horse.id)}
          >
            <div className="horse-name">{horse.name}</div>
            <span className={`horse-status ${horse.status}`}>
              {horse.status === 'idle' ? '空闲' : `使用中 - ${horse.messenger}`}
            </span>
          </div>
        ))}
      </div>

      <h3 style={{ color: 'var(--wood-plaque)', margin: '25px 0 15px', fontSize: '1.2rem' }}>
        选择信使
      </h3>
      {messengers.length === 0 ? (
        <p style={{ color: 'var(--smoke-gray)', textAlign: 'center', padding: '20px' }}>
          暂无信使入住，请等待新的旅人抵达
        </p>
      ) : (
        <div className="travelers-list">
          {messengers.map(traveler => (
            <div
              key={traveler.id}
              className={`traveler-item ${selectedTravelerId === traveler.id ? 'selected' : ''}`}
              onClick={() => setSelectedTravelerId(traveler.id)}
            >
              <span className="traveler-name">{traveler.name}</span>
              <span className="traveler-type">信使</span>
            </div>
          ))}
        </div>
      )}

      <div className="action-buttons">
        <button
          className="action-btn primary"
          onClick={handleAssignHorse}
          disabled={!selectedHorseId || !selectedTravelerId}
          style={{ opacity: (!selectedHorseId || !selectedTravelerId) ? 0.5 : 1 }}
        >
          征用马匹
        </button>
      </div>
    </div>
  )

  const renderBeaconTab = () => (
    <div className="beacon-controls">
      <h3 style={{ color: 'var(--wood-plaque)', marginBottom: '10px', fontSize: '1.2rem' }}>
        烽燧报警
      </h3>
      <p style={{ color: 'var(--smoke-gray)', marginBottom: '20px', fontSize: '0.9rem' }}>
        依法施放信号：白天用烟，夜晚用火。一炷烟示安全，二炷烟示警惕，三炷烟示紧急。
      </p>

      <input
        type="text"
        className="reason-input"
        placeholder="请输入报警原因（如：发现盗匪踪迹、遇大队马贼等）"
        value={beaconReason}
        onChange={(e) => setBeaconReason(e.target.value)}
      />

      <div className="beacon-buttons">
        <button className="beacon-btn level-1" onClick={() => handleBeaconAlert(1)}>
          <span className="level-title">一炷烟</span>
          <span className="level-desc">平安无事</span>
        </button>
        <button className="beacon-btn level-2" onClick={() => handleBeaconAlert(2)}>
          <span className="level-title">二炷烟</span>
          <span className="level-desc">发现可疑</span>
        </button>
        <button className="beacon-btn level-3" onClick={() => handleBeaconAlert(3)}>
          <span className="level-title">三炷烟</span>
          <span className="level-desc">紧急状态</span>
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(46, 94, 130, 0.1)',
        borderRadius: '8px',
        borderLeft: '4px solid var(--azurite)'
      }}>
        <p style={{ color: 'var(--azurite)', fontSize: '0.9rem', fontWeight: 600 }}>
          📜 唐《烽式》规定：
        </p>
        <p style={{ color: 'var(--wood-plaque)', fontSize: '0.85rem', marginTop: '8px' }}>
          凡烽候所置，大率相去三十里。其放烽有一炬、二炬、三炬、四炬者，随贼多少而为差焉。
        </p>
      </div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`toast ${toast.type}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDispatchPanel && (
          <motion.div
            className="dispatch-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className="dispatch-panel"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="panel-header">
                <h2>驿丞署</h2>
                <button className="close-btn" onClick={handleClose}>×</button>
              </div>

              <div className="panel-content">
                <div className="panel-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'caravan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('caravan')}
                  >
                    文牒核验
                    {caravans.filter(c => c.status === 'waiting').length > 0 && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        background: 'var(--saddle-red)',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '0.8rem'
                      }}>
                        {caravans.filter(c => c.status === 'waiting').length}
                      </span>
                    )}
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'horse' ? 'active' : ''}`}
                    onClick={() => setActiveTab('horse')}
                  >
                    马厩管理
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'beacon' ? 'active' : ''}`}
                    onClick={() => setActiveTab('beacon')}
                  >
                    烽燧报警
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'caravan' && renderCaravanTab()}
                    {activeTab === 'horse' && renderHorseTab()}
                    {activeTab === 'beacon' && renderBeaconTab()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default DispatchPanel
