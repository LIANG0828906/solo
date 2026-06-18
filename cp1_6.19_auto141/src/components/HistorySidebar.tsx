import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { memo } from 'react';
import { useStore } from '../store/useStore';
import type { HistoryRecord } from '../utils/types';

const HistorySidebar = memo(function HistorySidebar() {
  const { showHistory, toggleHistory, history, reconnectArtwork, isTransitioning } = useStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReconnect = (record: HistoryRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransitioning) return;
    reconnectArtwork(record);
  };

  return (
    <AnimatePresence>
      {showHistory && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleHistory}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 80,
            }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 300,
              height: '100vh',
              background: '#34495E',
              boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.3)',
              zIndex: 90,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '20px 20px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#ECF0F1',
                }}
              >
                过往拆解
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleHistory}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ECF0F1',
                }}
              >
                <X size={18} />
              </motion.button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 0',
              }}
            >
              {history.length === 0 ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                    color: '#636E72',
                  }}
                >
                  还没有拆解记录
                  <br />
                  抽取盲盒开始你的艺术之旅
                </div>
              ) : (
                history.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 20px',
                      height: 56,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: record.thumbnail,
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#ECF0F1',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {record.artworkTitle}
                      </div>
                      <div
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 11,
                          color: '#636E72',
                          marginTop: 2,
                        }}
                      >
                        {formatTime(record.timestamp)}
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleReconnect(record, e)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(108, 92, 231, 0.2)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#6C5CE7',
                        flexShrink: 0,
                      }}
                      title="重新连接到灵感网"
                    >
                      <RotateCcw size={14} />
                    </motion.button>
                  </motion.div>
                ))
              )}
            </div>

            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: '#636E72',
                textAlign: 'center',
              }}
            >
              点击 ↻ 可将作品关键词重新加入灵感网
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default HistorySidebar;
