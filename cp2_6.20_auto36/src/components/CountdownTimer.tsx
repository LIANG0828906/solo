import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CountdownTimerProps {
  endTime: Date
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const CountdownTimer = ({ endTime }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isUrgent, setIsUrgent] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setIsUrgent(false)
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
      setIsUrgent(difference < 60 * 60 * 1000 && difference > 0)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  const padZero = (num: number) => String(num).padStart(2, '0')

  const NumberFlip = ({ value, isUrgent }: { value: string; isUrgent: boolean }) => (
    <motion.div
      key={value}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={isUrgent ? 'urgent-blink' : ''}
      style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: isUrgent ? '#e74c3c' : '#c9a96e',
        minWidth: '44px',
        textAlign: 'center',
        fontFamily: 'monospace',
      }}
    >
      {value}
    </motion.div>
  )

  const TimeUnit = ({ value, label, isUrgent }: { value: number; label: string; isUrgent: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <motion.div
        animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
        transition={isUrgent ? { duration: 0.5, repeat: Infinity, repeatType: 'reverse' } : {}}
        style={{
          backgroundColor: isUrgent ? 'rgba(231, 76, 60, 0.1)' : 'rgba(201, 169, 110, 0.1)',
          borderRadius: '12px',
          padding: '12px 16px',
          minWidth: '70px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">
          <NumberFlip value={padZero(value)} isUrgent={isUrgent} />
        </AnimatePresence>
      </motion.div>
      <span
        style={{
          fontSize: '12px',
          color: '#888',
          marginTop: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {label}
      </span>
    </div>
  )

  const Separator = ({ isUrgent }: { isUrgent: boolean }) => (
    <motion.div
      animate={isUrgent ? { opacity: [1, 0.3, 1] } : {}}
      transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}
      style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: isUrgent ? '#e74c3c' : '#c9a96e',
        paddingBottom: '20px',
      }}
    >
      :
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '24px 32px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
        display: 'inline-block',
      }}
    >
      {isUrgent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#e74c3c',
            fontWeight: '600',
          }}
        >
          ⚡ 即将结束，抓紧出价！
        </motion.div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <TimeUnit value={timeLeft.days} label="天" isUrgent={isUrgent} />
        <Separator isUrgent={isUrgent} />
        <TimeUnit value={timeLeft.hours} label="时" isUrgent={isUrgent} />
        <Separator isUrgent={isUrgent} />
        <TimeUnit value={timeLeft.minutes} label="分" isUrgent={isUrgent} />
        <Separator isUrgent={isUrgent} />
        <TimeUnit value={timeLeft.seconds} label="秒" isUrgent={isUrgent} />
      </div>
    </motion.div>
  )
}

export default CountdownTimer
