import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { calculateTrajectory, getLandingPoint, checkHit } from '../utils/ballistics'
import type { TrajectoryPoint } from '../types/army'

const FIELD_WIDTH = 1000
const FIELD_HEIGHT = 450
const TREBUCHET_X = 150
const TREBUCHET_Y = 350

export default function BattleField() {
  const {
    counterweight,
    launchAngle,
    wind,
    isFiring,
    isProjectileFlying,
    setProjectileFlying,
    targets,
    registerHit,
    addHitFeedback,
    hitFeedbacks,
    removeHitFeedback,
    showComboEffect,
    difficulty,
    currentTargetId,
    consecutiveHits,
    score
  } = useGameStore()

  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([])
  const [projectilePos, setProjectilePos] = useState<{ x: number; y: number } | null>(null)
  const [impactPosition, setImpactPosition] = useState<{ x: number; y: number; type: string } | null>(null)
  const animationRef = useRef<number | null>(null)
  const frameIndexRef = useRef(0)

  const previewTrajectory = useMemo(() => {
    if (isProjectileFlying || isFiring) return []
    return calculateTrajectory(counterweight, launchAngle, wind, TREBUCHET_X, TREBUCHET_Y - 80)
  }, [counterweight, launchAngle, wind, isProjectileFlying, isFiring])

  useEffect(() => {
    if (!isFiring) return

    const newTrajectory = calculateTrajectory(counterweight, launchAngle, wind, TREBUCHET_X, TREBUCHET_Y - 80)
    setTrajectory(newTrajectory)
    setProjectileFlying(true)
    frameIndexRef.current = 0

    const animate = () => {
      if (frameIndexRef.current < newTrajectory.length) {
        const point = newTrajectory[frameIndexRef.current]
        setProjectilePos({ x: point.x, y: point.y })
        frameIndexRef.current += 2
        animationRef.current = requestAnimationFrame(animate)
      } else {
        const landing = getLandingPoint(newTrajectory)
        setProjectilePos(landing)

        let hitTargetId: string | null = null
        let hitType = 'miss'

        for (const target of targets) {
          if (target.destroyed) continue
          if (checkHit(landing.x, landing.y, target.x, target.y, target.width, target.height)) {
            hitTargetId = target.id
            hitType = target.type
            break
          }
        }

        setImpactPosition({ x: landing.x, y: landing.y, type: hitType })

        if (hitTargetId) {
          registerHit(hitTargetId)
          addHitFeedback({ targetId: hitTargetId, x: landing.x, y: landing.y, type: hitType })
        } else {
          addHitFeedback({ targetId: 'miss', x: landing.x, y: landing.y, type: 'miss' })
        }

        setTimeout(() => {
          setProjectileFlying(false)
          setProjectilePos(null)
          setImpactPosition(null)
          setTrajectory([])
          useGameStore.getState().stopFiring()
        }, 1500)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isFiring])

  useEffect(() => {
    hitFeedbacks.forEach((feedback) => {
      setTimeout(() => removeHitFeedback(feedback.id), 2000)
    })
  }, [hitFeedbacks])

  const wallThickness = difficulty === 'earth_wall' ? 80 : difficulty === 'sheep_horse_wall' ? 120 : 80
  const hasUrnCity = difficulty === 'urn_city'

  const currentTarget = targets.find((t) => t.id === currentTargetId)

  return (
    <div className="relative" style={{ width: FIELD_WIDTH, height: FIELD_HEIGHT, background: '#87CEEB' }}>
      {showComboEffect && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-50"
          initial={{ boxShadow: 'inset 0 0 0 0 rgba(255, 215, 0, 0)' }}
          animate={{ boxShadow: 'inset 0 0 60px 20px rgba(255, 215, 0, 0.8)' }}
          transition={{ repeat: 3, duration: 0.3, yoyo: true }}
        />
      )}

      <div className="absolute top-4 left-4 z-40 bg-black/60 text-white px-4 py-2 rounded-lg">
        <div className="text-lg font-bold">分数: {score}</div>
        <div className="text-sm">连击: {consecutiveHits}</div>
        <div className="text-sm">
          难度: {difficulty === 'earth_wall' ? '土墙' : difficulty === 'sheep_horse_wall' ? '羊马墙' : '瓮城'}
        </div>
        <div className="text-sm">
          风向: {wind.direction === 'right' ? '→' : '←'} {wind.speed}级
        </div>
        {currentTarget && !currentTarget.destroyed && (
          <div className="text-yellow-400 text-sm mt-1">目标: {currentTarget.name}</div>
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '100px', background: '#4a7a4a' }}
      />

      <div
        className="absolute"
        style={{
          left: '500px',
          bottom: '100px',
          width: `${wallThickness}px`,
          height: '150px',
          background: '#b8a070',
          borderLeft: '4px solid #5d3a1a',
          borderRight: '4px solid #5d3a1a',
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              #b8a070 0px,
              #b8a070 15px,
              #9a8560 15px,
              #9a8560 17px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 25px,
              #5d3a1a 25px,
              #5d3a1a 28px
            )
          `
        }}
      >
        <div className="absolute top-0 left-0 right-0 flex overflow-hidden" style={{ height: '30px' }}>
          {Array.from({ length: Math.ceil(wallThickness / 20) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '15px',
                background: '#5d3a1a',
                marginRight: '10px',
                marginTop: '0px'
              }}
            />
          ))}
        </div>
      </div>

      {hasUrnCity && (
        <div
          className="absolute"
          style={{
            left: '620px',
            bottom: '100px',
            width: '150px',
            height: '120px',
            background: '#b8a070',
            border: '4px solid #5d3a1a',
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                #b8a070 0px,
                #b8a070 15px,
                #9a8560 15px,
                #9a8560 17px
              )
            `
          }}
        />
      )}

      <AnimatePresence>
        {!targets.find((t) => t.id === 'tower')?.destroyed && (
          <motion.div
            className="absolute"
            style={{
              left: '780px',
              bottom: '100px',
              width: '60px',
              height: '200px',
              background: '#6b4e3a',
              transformOrigin: 'bottom center'
            }}
            initial={{ opacity: 1, rotate: 0 }}
            animate={
              hitFeedbacks.some((f) => f.targetId === 'tower')
                ? { rotate: 8, opacity: 0, y: 50 }
                : { rotate: 0, opacity: 1 }
            }
            transition={{ duration: 1.5 }}
          >
            {[0, 1, 2].map((floor) => (
              <div
                key={floor}
                className="absolute left-1/2 transform -translate-x-1/2 flex justify-around px-2"
                style={{
                  top: `${30 + floor * 55}px`,
                  width: '100%'
                }}
              >
                <div style={{ width: '8px', height: '12px', background: '#1a1a1a' }} />
                <div style={{ width: '8px', height: '12px', background: '#1a1a1a' }} />
              </div>
            ))}
            <div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2"
              style={{
                width: '80px',
                height: '0',
                borderLeft: '40px solid transparent',
                borderRight: '40px solid transparent',
                borderBottom: '30px solid #4a3728'
              }}
            >
              <div
                className="absolute left-1/2 bottom-1"
                style={{
                  width: '4px',
                  height: '25px',
                  background: '#4a3728',
                  transform: 'translateX(-50%)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '0',
                    left: '4px',
                    width: '20px',
                    height: '15px',
                    background: '#cc0000',
                    clipPath: 'polygon(0 0, 100% 50%, 0 100%)'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!targets.find((t) => t.id === 'gate')?.destroyed && (
        <div
          className="absolute"
          style={{
            left: '650px',
            bottom: '100px',
            width: '50px',
            height: '100px',
            background: '#8B0000',
            borderTopLeftRadius: '25px',
            borderTopRightRadius: '25px',
            border: '3px solid #5d0000'
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: '6px',
                height: '6px',
                background: '#8b4513',
                left: `${10 + (i % 3) * 15}px`,
                top: `${20 + Math.floor(i / 3) * 20}px`
              }}
            />
          ))}
          {hitFeedbacks.some((f) => f.targetId === 'gate') && (
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 0.8], opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                background: 'linear-gradient(180deg, #8B0000 0%, #4a0000 100%)',
                borderTopLeftRadius: '25px',
                borderTopRightRadius: '25px'
              }}
            />
          )}
        </div>
      )}

      {!targets.find((t) => t.id === 'grain')?.destroyed && (
        <div
          className="absolute"
          style={{
            left: '900px',
            bottom: '100px',
            width: '50px',
            height: '40px',
            background: '#d4a574'
          }}
        >
          <div
            className="absolute inset-1 border-2"
            style={{ borderColor: '#8b4513' }}
          />
          {hitFeedbacks.some((f) => f.targetId === 'grain') && (
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              initial={{ height: 0, opacity: 1 }}
              animate={{ height: '100%', opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5 }}
              style={{
                background: 'linear-gradient(0deg, #ff4500 0%, #ffa500 50%, #ffff00 100%)'
              }}
            />
          )}
        </div>
      )}

      {!targets.find((t) => t.id === 'wall')?.destroyed && (
        <div
          className="absolute"
          style={{
            left: '700px',
            bottom: '235px',
            width: '30px',
            height: '15px',
            background: '#5d3a1a',
            border: '2px solid #3d2a10'
          }}
        >
          {hitFeedbacks.some((f) => f.targetId === 'wall') && (
            <div className="absolute inset-0 overflow-visible">
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ x: 15, y: 7, scale: 1, opacity: 1 }}
                  animate={{
                    x: 15 + (Math.random() - 0.5) * 80,
                    y: 7 + (Math.random() - 0.5) * 80,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                  style={{
                    width: '6px',
                    height: '6px',
                    background: '#b8a070'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className="absolute"
        style={{
          left: `${TREBUCHET_X - 100}px`,
          bottom: '70px'
        }}
      >
        <div
          className="relative"
          style={{
            width: '200px',
            height: '30px',
            background: '#5d3a1a',
            borderRadius: '4px'
          }}
        >
          {[0, 1].map((side) => (
            <div
              key={side}
              className="absolute bottom-0 flex justify-between"
              style={{
                left: side === 0 ? '5px' : '5px',
                right: side === 1 ? '5px' : '5px',
                bottom: '-15px',
                width: '190px'
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#6b4e3a',
                  border: '3px solid #4a3728'
                }}
              />
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#6b4e3a',
                  border: '3px solid #4a3728'
                }}
              />
            </div>
          ))}

          <div
            className="absolute"
            style={{
              left: '60px',
              top: '-10px',
              width: '12px',
              height: '40px',
              background: '#4a3728',
              borderRadius: '3px'
            }}
          />

          <motion.div
            className="absolute"
            style={{
              left: '60px',
              top: '-10px',
              width: '8px',
              height: '160px',
              background: '#8b4513',
              borderRadius: '3px',
              transformOrigin: '4px 20px',
              transform: `rotate(${launchAngle - 90}deg)`
            }}
            animate={isFiring ? { rotate: [launchAngle - 90, 45, launchAngle - 90] } : {}}
            transition={isFiring ? { duration: 0.6, times: [0, 0.5, 1] } : {}}
          >
            <div
              className="absolute"
              style={{
                top: '-8px',
                left: '-4px',
                width: '16px',
                height: '8px',
                background: '#808080',
                borderRadius: '8px 8px 0 0'
              }}
            />

            <div
              className="absolute"
              style={{
                bottom: '-10px',
                left: '-16px',
                width: '40px',
                height: '30px',
                background: '#444',
                borderRadius: '3px',
                backgroundImage: 'repeating-linear-gradient(0deg, #444 0px, #444 6px, #555 6px, #555 8px)'
              }}
            />
          </motion.div>
        </div>
      </div>

      {previewTrajectory.length > 1 && (
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={FIELD_WIDTH}
          height={FIELD_HEIGHT}
        >
          <path
            d={`M ${previewTrajectory.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      )}

      {trajectory.length > 1 && (
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={FIELD_WIDTH}
          height={FIELD_HEIGHT}
        >
          <path
            d={`M ${trajectory.slice(0, frameIndexRef.current).map((p) => `${p.x} ${p.y}`).join(' L ')}`}
            fill="none"
            stroke="#333"
            strokeWidth="3"
          />
        </svg>
      )}

      {projectilePos && (
        <motion.div
          className="absolute rounded-full z-30"
          style={{
            width: '20px',
            height: '20px',
            background: '#666',
            border: '2px solid #444',
            left: `${projectilePos.x - 10}px`,
            top: `${projectilePos.y - 10}px`,
            boxShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
          animate={isProjectileFlying ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {impactPosition && impactPosition.type === 'miss' && (
        <motion.div
          className="absolute"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: '#8B4513',
            left: `${impactPosition.x - 15}px`,
            top: `${impactPosition.y - 15}px`
          }}
        />
      )}

      <AnimatePresence>
        {hitFeedbacks.map((feedback) => (
          <motion.div
            key={feedback.id}
            className="absolute z-40 font-bold text-xl pointer-events-none"
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              left: `${feedback.x}px`,
              top: `${feedback.y}px`,
              color: feedback.type === 'miss' ? '#ff6666' : '#00ff00',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {feedback.type === 'miss' ? '未命中!' : '+100分!'}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
