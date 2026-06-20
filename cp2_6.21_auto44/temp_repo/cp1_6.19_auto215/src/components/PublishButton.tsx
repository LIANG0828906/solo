import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export function PublishButton() {
  const { setShowPublishModal } = useStore();

  return (
    <motion.button
      onClick={() => setShowPublishModal(true)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: 'fixed',
        right: 40,
        bottom: 70,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: '#2ECC71',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        zIndex: 50,
        boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)',
      }}
    >
      <motion.span
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(46, 204, 113, 0.7)',
            '0 0 0 12px rgba(46, 204, 113, 0)',
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
        }}
      />
      +
    </motion.button>
  );
}
