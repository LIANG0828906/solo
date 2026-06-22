import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

export function NotificationToast() {
  const { showNotification, notificationMessage, hideNotification } = useStore();

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          onClick={hideNotification}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 50,
            background: '#2ECC71',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 500,
            zIndex: 200,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)',
          }}
        >
          ✓ {notificationMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
