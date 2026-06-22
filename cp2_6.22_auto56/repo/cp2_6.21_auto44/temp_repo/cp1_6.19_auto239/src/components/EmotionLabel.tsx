import { motion, AnimatePresence } from 'framer-motion';
import { useColorFlowStore } from '@/store/useColorFlowStore';

export default function EmotionLabel() {
  const emotion = useColorFlowStore((s) => s.emotion);

  return (
    <div
      style={{
        position: 'fixed',
        top: 40,
        left: 40,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
            fontSize: 36,
            color: '#FFFFFF',
            lineHeight: 1,
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            userSelect: 'none',
          }}
        >
          {emotion}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
