import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../gameLogic';
import { Volume2 } from 'lucide-react';

interface BroadcastProps {
  message: string | null;
}

export default function Broadcast({ message }: BroadcastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div
            className="px-12 py-6 rounded-2xl shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${COLORS.copper}dd, ${COLORS.copperHover}dd)`,
              border: '4px solid #d4a76a',
              boxShadow: '0 0 40px rgba(212, 167, 106, 0.6), 0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Volume2 size={40} color="#fff" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white font-bold text-4xl"
                style={{
                  fontFamily: 'serif',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.6)',
                  letterSpacing: '4px',
                }}
              >
                {message}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
