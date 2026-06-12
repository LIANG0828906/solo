import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

export default function LoadingScreen() {
  const loadingProgress = useAppStore((state) => state.loadingProgress)

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-museum-cream bg-paper-texture"
    >
      <div className="relative w-64 h-64 mb-8">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 180 L20 90 L40 90 L40 70 L60 70 L60 50 L100 30 L140 50 L140 70 L160 70 L160 90 L180 90 L180 180 Z"
            stroke="#5D4037"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 2s ease-out forwards',
            }}
          />
          <path
            d="M100 30 L100 50"
            stroke="#5D4037"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 2s ease-out 0.3s forwards',
            }}
          />
          <circle
            cx="100"
            cy="55"
            r="3"
            fill="#5D4037"
            style={{
              opacity: 0,
              animation: 'fadeIn 0.3s ease-out 2.3s forwards',
            }}
          />
          <path
            d="M50 90 L50 180"
            stroke="#5D4037"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 2s ease-out 0.5s forwards',
            }}
          />
          <path
            d="M80 90 L80 180"
            stroke="#5D4037"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 2s ease-out 0.7s forwards',
            }}
          />
          <path
            d="M120 90 L120 180"
            stroke="#5D4037"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 2s ease-out 0.9s forwards',
            }}
          />
          <path
            d="M150 90 L150 180"
            stroke="#5D4037"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 2s ease-out 1.1s forwards',
            }}
          />
          <path
            d="M35 110 L65 110"
            stroke="#5D4037"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 1.5s ease-out 1.3s forwards',
            }}
          />
          <path
            d="M35 130 L65 130"
            stroke="#5D4037"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 1.5s ease-out 1.5s forwards',
            }}
          />
          <path
            d="M135 110 L165 110"
            stroke="#5D4037"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 1.5s ease-out 1.4s forwards',
            }}
          />
          <path
            d="M135 130 L165 130"
            stroke="#5D4037"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 1.5s ease-out 1.6s forwards',
            }}
          />
          <rect
            x="85"
            y="140"
            width="30"
            height="40"
            stroke="#5D4037"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            style={{
              animation: 'draw 1.5s ease-out 1.8s forwards',
            }}
          />
          <circle
            cx="110"
            cy="160"
            r="2"
            fill="#5D4037"
            style={{
              opacity: 0,
              animation: 'fadeIn 0.3s ease-out 3.3s forwards',
            }}
          />
        </svg>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="font-display text-4xl text-museum-brown-dark mb-8 tracking-wider"
      >
        虚拟博物馆
      </motion.h1>

      <div className="w-80 h-3 bg-museum-cream-light rounded-full overflow-hidden border border-museum-brown/20">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${loadingProgress}%` }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(90deg, #FFD700 0%, #DAA520 50%, #FFD700 100%)',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="mt-4 font-body text-museum-brown-light text-lg"
      >
        {loadingProgress}%
      </motion.p>
    </motion.div>
  )
}
