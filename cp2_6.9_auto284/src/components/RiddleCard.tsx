import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Riddle } from '../utils/riddleData';
import { riddleLibrary } from '../utils/riddleData';

interface RiddleCardProps {
  riddle: Riddle | null;
  mode: 'display' | 'editor' | 'guess';
  onSubmit?: (riddle: Riddle) => void;
  onClose?: () => void;
  onGuessSubmit?: (answer: string) => void;
}

export default function RiddleCard({ riddle, mode, onSubmit, onClose, onGuessSubmit }: RiddleCardProps) {
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [selectedTab, setSelectedTab] = useState<'library' | 'custom'>('library');

  if (mode === 'display' && riddle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: 120,
          height: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 120,
            height: 6,
            backgroundColor: '#b8860b',
            borderRadius: 3,
            position: 'absolute',
            top: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
        <div
          style={{
            width: 120,
            height: 40,
            backgroundColor: '#f5f0e8',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: '#2d3436',
              textAlign: 'center',
              lineHeight: 1.2,
              fontFamily: "'Ma Shan Zheng', cursive",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {riddle.question}
          </span>
        </div>
        <div
          style={{
            width: 120,
            height: 6,
            backgroundColor: '#b8860b',
            borderRadius: 3,
            position: 'absolute',
            bottom: 0,
            boxShadow: '0 -2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </motion.div>
    );
  }

  if (mode === 'editor') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              backgroundColor: '#2d3436',
              borderRadius: 12,
              padding: 24,
              minWidth: 400,
              maxWidth: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                color: '#f5f0e8',
                fontSize: 24,
                marginBottom: 16,
                textAlign: 'center',
                fontFamily: "'Ma Shan Zheng', cursive",
              }}
            >
              灯谜编辑
            </h2>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setSelectedTab('library')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: selectedTab === 'library' ? '#d4a373' : '#4a4a4a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: "'Ma Shan Zheng', cursive",
                  fontSize: 16,
                  transition: 'all 0.2s',
                }}
              >
                题库选择
              </button>
              <button
                onClick={() => setSelectedTab('custom')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: selectedTab === 'custom' ? '#d4a373' : '#4a4a4a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: "'Ma Shan Zheng', cursive",
                  fontSize: 16,
                  transition: 'all 0.2s',
                }}
              >
                自撰灯谜
              </button>
            </div>

            {selectedTab === 'library' && (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  marginBottom: 16,
                  padding: 8,
                  backgroundColor: '#1a1a2e',
                  borderRadius: 8,
                }}
              >
                {riddleLibrary.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ backgroundColor: 'rgba(212, 163, 115, 0.2)', x: 4 }}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      cursor: 'pointer',
                      marginBottom: 4,
                      transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      onSubmit?.(item);
                    }}
                  >
                    <div style={{ color: '#f5f0e8', fontSize: 14, marginBottom: 4 }}>
                      {item.question}
                    </div>
                    <div style={{ color: '#d4a373', fontSize: 12 }}>
                      【{item.theme}】【{item.difficulty === 'easy' ? '简单' : item.difficulty === 'medium' ? '中等' : '困难'}】
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {selectedTab === 'custom' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: '#f5f0e8', fontSize: 14, display: 'block', marginBottom: 4 }}>
                    谜面（最多20字）
                  </label>
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value.slice(0, 20))}
                    placeholder="请输入谜面..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #d4a373',
                      backgroundColor: '#1a1a2e',
                      color: '#f5f0e8',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <div style={{ color: '#d4a373', fontSize: 12, textAlign: 'right', marginTop: 4 }}>
                    {customQuestion.length}/20
                  </div>
                </div>
                <div>
                  <label style={{ color: '#f5f0e8', fontSize: 14, display: 'block', marginBottom: 4 }}>
                    谜底
                  </label>
                  <input
                    type="text"
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    placeholder="请输入谜底..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #d4a373',
                      backgroundColor: '#1a1a2e',
                      color: '#f5f0e8',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#4a4a4a',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: "'Ma Shan Zheng', cursive",
                  fontSize: 16,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                取消
              </motion.button>
              {selectedTab === 'custom' && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (customQuestion.trim() && customAnswer.trim()) {
                      onSubmit?.({
                        id: `custom-${Date.now()}`,
                        question: customQuestion.trim(),
                        answer: customAnswer.trim(),
                        difficulty: 'medium',
                        theme: '自撰',
                      });
                    }
                  }}
                  disabled={!customQuestion.trim() || !customAnswer.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: customQuestion.trim() && customAnswer.trim() ? '#d4a373' : '#666',
                    color: '#fff',
                    cursor: customQuestion.trim() && customAnswer.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: "'Ma Shan Zheng', cursive",
                    fontSize: 16,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  挂谜
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (mode === 'guess' && riddle) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              backgroundColor: '#2d3436',
              borderRadius: 12,
              padding: 32,
              minWidth: 400,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                color: '#d4a373',
                fontSize: 28,
                marginBottom: 24,
                fontFamily: "'Ma Shan Zheng', cursive",
              }}
            >
              游人猜谜
            </h2>

            <div
              style={{
                backgroundColor: '#f5f0e8',
                borderRadius: 8,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  color: '#2d3436',
                  fontSize: 20,
                  lineHeight: 1.6,
                  fontFamily: "'Ma Shan Zheng', cursive",
                }}
              >
                {riddle.question}
              </p>
            </div>

            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="请输入谜底..."
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '2px solid #d4a373',
                backgroundColor: '#1a1a2e',
                color: '#f5f0e8',
                fontSize: 18,
                outline: 'none',
                marginBottom: 16,
                textAlign: 'center',
                fontFamily: "'Ma Shan Zheng', cursive",
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && guessInput.trim()) {
                  onGuessSubmit?.(guessInput.trim());
                  setGuessInput('');
                }
              }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (guessInput.trim()) {
                    onGuessSubmit?.(guessInput.trim());
                    setGuessInput('');
                  }
                }}
                disabled={!guessInput.trim()}
                style={{
                  padding: '12px 32px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: guessInput.trim() ? '#d4a373' : '#666',
                  color: '#fff',
                  cursor: guessInput.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: "'Ma Shan Zheng', cursive",
                  fontSize: 18,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              >
                提交谜底
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
