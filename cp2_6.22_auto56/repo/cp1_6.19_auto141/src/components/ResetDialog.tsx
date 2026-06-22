import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';
import { useStore } from '../store/useStore';

const ResetDialog = memo(function ResetDialog() {
  const { showResetDialog, hideReset, resetAll } = useStore();

  const handleReset = () => {
    resetAll();
  };

  return (
    <AnimatePresence>
      {showResetDialog && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 95,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={hideReset}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 320,
                background: '#34495E',
                borderRadius: 16,
                padding: 28,
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#ECF0F1',
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                重新布展
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: '#B2BEC3',
                  textAlign: 'center',
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                确定要清空所有拆解记录和灵感关系网吗？
                <br />
                此操作无法撤销。
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={hideReset}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    background: '#636E72',
                    border: 'none',
                    color: '#ECF0F1',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: '#C0392B' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    background: '#D63031',
                    border: 'none',
                    color: '#FFFFFF',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  确定重置
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default ResetDialog;
