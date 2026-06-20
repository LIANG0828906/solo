import { motion } from 'framer-motion';

interface FrequencyDisplayProps {
  frequency: number;
  signalStrength: number;
}

export function FrequencyDisplay({ frequency, signalStrength }: FrequencyDisplayProps) {
  const pointerRotation = (signalStrength / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-full rounded-md overflow-hidden"
        style={{
          backgroundColor: '#0D1F0D',
          padding: '12px 16px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,0,0.1)',
        }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          }}
        />

        <motion.div
          className="text-center font-mono font-bold tracking-wider relative z-10"
          style={{ color: '#C0FFC0', fontSize: '24px', textShadow: '0 0 10px rgba(192,255,192,0.5)' }}
          animate={{ opacity: [1, 0.95, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {frequency.toFixed(1)} <span style={{ fontSize: '16px' }}>MHz</span>
        </motion.div>

        <div className="mt-3 relative h-6">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-700 rounded">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div
                key={mark}
                className="absolute bottom-0 w-px h-2 bg-gray-600"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>

          <div className="absolute left-0 bottom-1 text-xs text-gray-500">0</div>
          <div className="absolute right-0 bottom-1 text-xs text-gray-500">100</div>

          <div className="absolute left-1/2 bottom-2 w-0 h-0 transform -translate-x-1/2">
            <motion.div
              className="absolute w-0 h-0 origin-bottom"
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: '16px solid #FF4444',
                bottom: 0,
                filter: 'drop-shadow(0 0 4px rgba(255,68,68,0.6))',
              }}
              animate={{ rotate: pointerRotation }}
              transition={{ type: 'spring', stiffness: 100, damping: 15, duration: 0.3 }}
            />
            <div
              className="absolute w-3 h-3 rounded-full bg-gray-800 border-2 border-gray-600"
              style={{ left: '50%', transform: 'translateX(-50%)', bottom: '-6px' }}
            />
          </div>
        </div>

        <div className="text-center mt-1 text-xs" style={{ color: 'rgba(192,255,192,0.6)' }}>
          SIGNAL
        </div>
      </div>
    </div>
  );
}
