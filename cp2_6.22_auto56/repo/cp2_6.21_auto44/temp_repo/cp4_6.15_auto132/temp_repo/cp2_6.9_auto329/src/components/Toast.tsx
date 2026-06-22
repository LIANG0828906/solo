import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';

export default function Toast() {
  const { state } = useStore();

  return (
    <AnimatePresence>
      {state.showToast && (
        <div className="toast-container">
          <motion.div
            className="toast"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {state.toastMessage}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
