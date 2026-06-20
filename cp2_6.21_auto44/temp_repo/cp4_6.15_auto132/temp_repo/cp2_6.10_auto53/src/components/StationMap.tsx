import React, { useEffect, useRef, useState } from 'react'
import { useStationStore, generateCaravan, generateTraveler } from '../store/useStationStore'
import { Caravan, Horse as HorseType } from '../types'

const Camel: React.FC<{ index: number }> = ({ index }) => {
  return (
    <div className="camel" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="camel-head" />
      <div className="camel-hump" />
      <div className="camel-hump" />
      <div className="camel-body" />
      <div className="camel-leg" />
      <div className="camel-leg" />
      <div className="camel-leg" />
      <div className="camel-leg" />
      <div className="camel-bell" />
    </div>
  )
}

const HorseSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 50 50" className={`horse-svg ${className}`}>
    <defs>
      <linearGradient id="horseBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B4513" />
        <stop offset="50%" stopColor="#A0522D" />
        <stop offset="100%" stopColor="#654321" />
      </linearGradient>
      <linearGradient id="horseMane" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#2F1810" />
        <stop offset="100%" stopColor="#4A2511" />
      </linearGradient>
    </defs>
    <path
      d="M10 35 Q8 30 12 25 Q15 20 20 18 Q25 16 30 15 Q35 14 40 16 Q45 18 46 22 Q47 26 45 30 Q43 34 38 36 Q35 37 30 37 Q25 37 20 36 Q15 35 10 35 Z"
      fill="url(#horseBody)"
      stroke="#3d2817"
      strokeWidth="1.5"
    />
    <path
      d="M40 16 Q42 12 44 10 Q46 8 47 6 Q48 4 47 2 Q46 0 44 1 Q42 2 40 5 Q38 8 38 12 Q39 14 40 16 Z"
      fill="url(#horseBody)"
      stroke="#3d2817"
      strokeWidth="1"
    />
    <path
      d="M30 15 Q28 13 26 12 Q24 11 22 11 Q20 11 18 12 Q17 13 18 15 Q19 17 22 17 Q25 17 28 16 Q30 16 30 15 Z"
      fill="url(#horseMane)"
    />
    <path
      d="M12 35 L10 45 M18 36 L16 46 M32 37 L30 46 M38 36 L36 45"
      stroke="#654321"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M25 18 Q23 22 25 28 Q27 32 32 32 Q36 32 38 28"
      fill="none"
      stroke="#cc3333"
      strokeWidth="3"
    />
    <circle cx="45" cy="5" r="1" fill="#000" />
    <path
      d="M46 8 Q47 9 48 8.5"
      fill="none"
      stroke="#000"
      strokeWidth="0.5"
    />
  </svg>
)

const HorseSilhouette: React.FC<{ direction: 'left' | 'right'; messenger: string }> = ({ direction, messenger }) => (
  <div className="horse-silhouette" style={{ transform: direction === 'left' ? 'scaleX(-1)' : 'none' }}>
    <HorseSvg className="horse-body-svg" />
    <div style={{
      position: 'absolute',
      top: '5px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '10px',
      color: '#cc3333',
      fontWeight: 'bold',
      whiteSpace: 'nowrap'
    }}>
      {direction === 'left' ? '←' : '→'} {messenger}
    </div>
  </div>
)

const StationMap: React.FC = () => {
  const {
    caravans,
    travelers,
    horses,
    beaconState,
    updateCaravan,
    addCaravan,
    setActiveDocumentCaravanId,
    addLog,
    incrementCaravanCount,
    addHourlyStat,
    addTraveler,
    updateHorse,
    setHorses
  } = useStationStore()

  const mapRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const caravanTimersRef = useRef<Map<string, number>>(new Map())
  const [exitingHorses, setExitingHorses] = useState<Array<{ horse: HorseType; position: number }>>([])

  useEffect(() => {
    const fetchHorses = async () => {
      try {
        const res = await fetch('/api/horses')
        const data = await res.json()
        setHorses(data)
      } catch (e) {
        console.error('Failed to fetch horses:', e)
      }
    }
    fetchHorses()
  }, [setHorses])

  useEffect(() => {
    const scheduleNextCaravan = () => {
      const delay = (Math.random() * 30 + 30) * 1000
      const timer = window.setTimeout(() => {
        const newCaravan = generateCaravan()
        addCaravan(newCaravan)
        incrementCaravanCount()
        addHourlyStat(new Date().getHours())
        addLog({
          type: 'caravan',
          message: `来自${newCaravan.origin}的${newCaravan.ownerName}驼队正在接近驿站，共${newCaravan.cargoCount}匹骆驼。`,
          level: 'info'
        })

        const existingRoomNumbers = useStationStore.getState().travelers.map((t: { roomNumber: number | null }) => t.roomNumber)
        for (let i = 0; i < Math.min(newCaravan.passengerCount, 3); i++) {
          setTimeout(() => {
            const currentRoomNumbers = useStationStore.getState().travelers.map((t: { roomNumber: number | null }) => t.roomNumber)
            const traveler = generateTraveler(currentRoomNumbers)
            addTraveler(traveler)
            addLog({
              type: 'traveler',
              message: `${traveler.name}（${getTravelerTypeName(traveler.type)}）已入住客舍。`,
              level: 'info'
            })
          }, i * 1000)
        }

        scheduleNextCaravan()
      }, delay)
      return timer
    }

    const timer = scheduleNextCaravan()
    return () => clearTimeout(timer)
  }, [addCaravan, incrementCaravanCount, addHourlyStat, addLog, addTraveler])

  const getTravelerTypeName = (type: string) => {
    const names: Record<string, string> = {
      scholar: '文人',
      soldier: '军士',
      messenger: '信使',
      merchant: '商人'
    }
    return names[type] || type
  }

  useEffect(() => {
    const checkHorseReturns = () => {
      const now = Date.now()
      horses.forEach(horse => {
        if (horse.status === 'in_use' && horse.matchTime && now - horse.matchTime > 60000) {
          const direction = horse.direction || (Math.random() > 0.5 ? 'left' : 'right')
          setExitingHorses(prev => [...prev, { horse, position: direction === 'left' ? 85 : 15 }])

          const exitTimer = setTimeout(() => {
            updateHorse(horse.id, { status: 'idle', matchTime: null, messenger: undefined, direction: undefined })
            setExitingHorses(prev => prev.filter(eh => eh.horse.id !== horse.id))
            addLog({
              type: 'horse',
              message: `${horse.name}已载着${horse.messenger}${direction === 'left' ? '入京' : '出塞'}，现已返回马厩。`,
              level: 'info'
            })
          }, 5000)

          return () => clearTimeout(exitTimer)
        }
      })
    }

    const interval = setInterval(checkHorseReturns, 1000)
    return () => clearInterval(interval)
  }, [horses, updateHorse, addLog])

  useEffect(() => {
    const animateExitingHorses = () => {
      setExitingHorses(prev => prev.map(eh => {
        const direction = eh.horse.direction || 'right'
        const newPosition = direction === 'left' ? eh.position - 0.5 : eh.position + 0.5
        return { ...eh, position: newPosition }
      }).filter(eh => eh.position > -10 && eh.position < 110))
    }

    const interval = setInterval(animateExitingHorses, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = timestamp - lastTimeRef.current

      if (deltaTime >= 16) {
        lastTimeRef.current = timestamp

        caravans.forEach(caravan => {
          const lastUpdate = caravanTimersRef.current.get(caravan.id) || 0
          if (timestamp - lastUpdate < 100) return
          caravanTimersRef.current.set(caravan.id, timestamp)

          if (caravan.status === 'approaching') {
            const newPosition = caravan.position + 0.3
            if (newPosition >= 35) {
              updateCaravan(caravan.id, { position: 35, status: 'waiting' })
              setActiveDocumentCaravanId(caravan.id)
              addLog({
                type: 'caravan',
                message: `${caravan.ownerName}的驼队已抵达驿站门前，请求核验文牒。`,
                level: 'info'
              })
            } else {
              updateCaravan(caravan.id, { position: newPosition })
            }
          } else if (caravan.status === 'leaving') {
            const newPosition = caravan.position + 0.4
            if (newPosition >= 120) {
              updateCaravan(caravan.id, { status: 'left', position: newPosition })
              setTimeout(() => {
                caravanTimersRef.current.delete(caravan.id)
              }, 100)
            } else {
              updateCaravan(caravan.id, { position: newPosition })
            }
          }
        })

        if (beaconState.level > 0 && beaconState.startTime) {
          if (timestamp - beaconState.startTime > 10000) {
            useStationStore.getState().setBeaconState({ level: 0, startTime: null })
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [caravans, updateCaravan, setActiveDocumentCaravanId, addLog, beaconState.level, beaconState.startTime])

  const occupiedRooms = travelers.filter(t => t.roomNumber !== null).length
  const roomLights = Array.from({ length: 8 }, (_, i) => i < Math.min(occupiedRooms, 8))

  const idleHorses = horses.filter(h => h.status === 'idle')

  const handleBeaconClick = () => {
    useStationStore.getState().setShowDispatchPanel(true)
    setTimeout(() => {
      const event = new CustomEvent('switchTab', { detail: 'beacon' })
      window.dispatchEvent(event)
    }, 100)
  }

  const renderSmoke = () => {
    if (beaconState.level === 0) return null

    const smokeElements = []
    const sparks = []

    if (beaconState.level >= 1) {
      smokeElements.push(<div key="s1" className="smoke smoke-1" style={{ height: '150px' }} />)
    }
    if (beaconState.level >= 2) {
      smokeElements.push(
        <div key="s2a" className="smoke smoke-2a" style={{ height: '160px' }} />,
        <div key="s2b" className="smoke smoke-2b" style={{ height: '160px' }} />
      )
      sparks.push(
        <div key="sp1" className="spark spark-1" />,
        <div key="sp2" className="spark spark-2" />,
        <div key="sp3" className="spark spark-3" />
      )
    }
    if (beaconState.level >= 3) {
      smokeElements.push(
        <div key="s3a" className="smoke smoke-3a" style={{ height: '180px' }} />,
        <div key="s3b" className="smoke smoke-3b" style={{ height: '200px' }} />,
        <div key="s3c" className="smoke smoke-3c" style={{ height: '180px' }} />
      )
    }

    return (
      <div className="smoke-container">
        {smokeElements}
        {beaconState.level >= 2 && sparks}
        {beaconState.level >= 3 && <div className="flame active" />}
      </div>
    )
  }

  return (
    <div className="station-map-container">
      <div className="station-map" ref={mapRef}>
        <div className="post-road" />

        {exitingHorses.map(eh => (
          <div
            key={`exit-${eh.horse.id}`}
            className="exiting-horse"
            style={{ left: `${eh.position}%` }}
          >
            <HorseSilhouette
              direction={eh.horse.direction || 'right'}
              messenger={eh.horse.messenger || ''}
            />
          </div>
        ))}

        {caravans.filter(c => c.status !== 'left').map(caravan => (
          <div
            key={caravan.id}
            className="caravan-group"
            style={{ left: `${caravan.position}%` }}
          >
            {Array.from({ length: Math.min(caravan.cargoCount, 8) }, (_, i) => (
              <Camel key={i} index={i} />
            ))}
          </div>
        ))}

        <div className="station-walls">
          <div className="wall wall-north" />
          <div className="wall wall-south" />
          <div className="wall wall-east" />
          <div className="wall wall-west" />

          <div className="watchtower watchtower-nw" />
          <div className="watchtower watchtower-ne" />
          <div className="watchtower watchtower-sw" />
          <div className="watchtower watchtower-se" />

          <div className="gate" />

          <div className="main-hall" />

          <div className="guest-houses">
            <div className="guest-house">
              <div className="windows">
                {roomLights.slice(0, 4).map((occupied, i) => (
                  <div key={i} className={`window ${occupied ? 'occupied' : ''}`} />
                ))}
              </div>
            </div>
            <div className="guest-house">
              <div className="windows">
                {roomLights.slice(4, 8).map((occupied, i) => (
                  <div key={i} className={`window ${occupied ? 'occupied' : ''}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="stables">
            <div className="stable">
              <div className="stable-slots">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="horse-slot">
                    {i < idleHorses.length && <HorseSvg />}
                  </div>
                ))}
              </div>
            </div>
            <div className="stable">
              <div className="stable-slots">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="horse-slot">
                    {i + 5 < idleHorses.length && <HorseSvg />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="beacon-tower" onClick={handleBeaconClick}>
            {renderSmoke()}
            <div className="beacon-pot" />
            <div className="beacon-platform" />
            <div className="beacon-base" />
            <div className="firewood-pile">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="firewood" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StationMap
