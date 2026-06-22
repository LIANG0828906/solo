import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import type { Tea, Snack, TastingRecord } from '../types';

interface TastingPanelProps {
  isOpen: boolean;
  selectedTea: Tea | null;
  selectedSnacks: Snack[];
  onClose: () => void;
}

const ease = [0.25, 0.46, 0.45, 0.94];

const defaultRecord: TastingRecord = {
  aroma: '',
  taste: '',
  mouthfeel: '',
  rating: 0
};

export default function TastingPanel({ isOpen, selectedTea, selectedSnacks, onClose }: TastingPanelProps) {
  const [record, setRecord] = useState<TastingRecord>(defaultRecord);
  const [showNote, setShowNote] = useState(false);
  const [masterName, setMasterName] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const noteRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof TastingRecord, value: string | number) => {
    setRecord(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingClick = (rating: number) => {
    setRecord(prev => ({ ...prev, rating }));
  };

  const generateNote = () => {
    if (!selectedTea) return;
    setShowNote(true);
  };

  const downloadNote = useCallback(async () => {
    if (!noteRef.current) return;
    try {
      const canvas = await html2canvas(noteRef.current, {
        backgroundColor: '#f5f0e0',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `${selectedTea?.name || '茶'}_茶笺.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
  }, [selectedTea]);

  const resetPanel = () => {
    setRecord(defaultRecord);
    setShowNote(false);
    setMasterName('');
    onClose();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  const displayRating = hoverRating || record.rating;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="tasting-panel-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetPanel}
        >
          <motion.div
            className="tasting-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header">
              <button className="stamp-btn" onClick={generateNote} disabled={!record.rating}>
                <span className="stamp-icon">印</span>
                <span className="stamp-text">生成茶笺</span>
              </button>
              <h2 className="panel-title">品 茶 笔 记</h2>
              <button className="close-btn" onClick={resetPanel}>×</button>
            </div>

            <div className="panel-content">
              <div className="current-selection">
                <div className="selection-item">
                  <span className="selection-label">茶品</span>
                  <span className="selection-value">{selectedTea?.name || '未选'}</span>
                </div>
                <div className="selection-item">
                  <span className="selection-label">茶点</span>
                  <span className="selection-value">
                    {selectedSnacks.length > 0 ? selectedSnacks.map(s => s.name).join('、') : '未选'}
                  </span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">香气</label>
                <textarea
                  className="tea-textarea"
                  value={record.aroma}
                  onChange={(e) => handleInputChange('aroma', e.target.value)}
                  placeholder="如：兰香幽远，豆香馥郁..."
                  rows={2}
                />
              </div>

              <div className="input-group">
                <label className="input-label">滋味</label>
                <textarea
                  className="tea-textarea"
                  value={record.taste}
                  onChange={(e) => handleInputChange('taste', e.target.value)}
                  placeholder="如：鲜爽回甘，醇厚饱满..."
                  rows={2}
                />
              </div>

              <div className="input-group">
                <label className="input-label">口感</label>
                <textarea
                  className="tea-textarea"
                  value={record.mouthfeel}
                  onChange={(e) => handleInputChange('mouthfeel', e.target.value)}
                  placeholder="如：滑润细腻，层次感丰富..."
                  rows={2}
                />
              </div>

              <div className="input-group">
                <label className="input-label">综合评价</label>
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      className={`star-btn ${displayRating >= star ? 'active' : ''}`}
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ y: 0 }}
                      animate={displayRating >= star ? {
                        y: [0, -15, 0, -5, 0],
                        transition: { duration: 0.6, ease, delay: star * 0.08 }
                      } : {}}
                    >
                      ★
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">茶博士</label>
                <input
                  className="tea-input"
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  placeholder="请署上尊号..."
                />
              </div>

              {record.rating > 0 && (
                <motion.button
                  className="generate-btn"
                  onClick={generateNote}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease }}
                >
                  印 制 茶 笺
                </motion.button>
              )}
            </div>

            <AnimatePresence>
              {showNote && (
                <motion.div
                  className="tea-note-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    className="tea-note-container"
                    initial={{ scale: 0.8, rotateY: 90 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.6, ease }}
                  >
                    <div className="tea-note" ref={noteRef}>
                      <div className="note-header">
                        <div className="note-seal">茶</div>
                      </div>
                      <div className="note-content-vertical">
                        <div className="vertical-text tea-name">{selectedTea?.name}</div>
                        <div className="vertical-text tea-snack">
                          {selectedSnacks.length > 0 ? `配${selectedSnacks.map(s => s.name).join('、')}` : '清饮'}
                        </div>
                        <div className="vertical-text tea-date">{formatDate(new Date())}</div>
                        <div className="vertical-text tea-rating">
                          {'★'.repeat(record.rating)}{'☆'.repeat(5 - record.rating)}
                        </div>
                        {record.aroma && (
                          <div className="vertical-text tea-comment">香：{record.aroma}</div>
                        )}
                        {record.taste && (
                          <div className="vertical-text tea-comment">味：{record.taste}</div>
                        )}
                        {record.mouthfeel && (
                          <div className="vertical-text tea-comment">感：{record.mouthfeel}</div>
                        )}
                        <div className="vertical-text tea-master">{masterName || '佚名茶博士'} 记</div>
                      </div>
                      <div className="note-mountain" />
                    </div>
                    <div className="note-actions">
                      <button className="note-btn" onClick={() => setShowNote(false)}>
                        再润色
                      </button>
                      <button className="note-btn primary" onClick={downloadNote}>
                        下载茶笺
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      <style>{`
        .tasting-panel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 200;
          display: flex;
          justify-content: flex-end;
        }

        .tasting-panel {
          width: 420px;
          max-width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #f5f0e0 0%, #ebe5d5 100%);
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: -10px 0 40px rgba(0,0,0,0.4);
        }

        .tasting-panel::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 15px;
          background: 
            repeating-linear-gradient(
              180deg,
              transparent 0px,
              transparent 8px,
              rgba(139, 119, 101, 0.15) 8px,
              rgba(139, 119, 101, 0.15) 12px
            );
          border-right: 1px solid rgba(139, 119, 101, 0.2);
        }

        .tasting-panel::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          background: 
            repeating-linear-gradient(
              180deg,
              transparent 0px,
              transparent 10px,
              rgba(139, 119, 101, 0.1) 10px,
              rgba(139, 119, 101, 0.1) 14px
            );
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px 25px 20px 35px;
          border-bottom: 2px solid rgba(139, 119, 101, 0.3);
          position: relative;
        }

        .panel-header::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 30px;
          right: 20px;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(139, 119, 101, 0.5) 20%, rgba(139, 119, 101, 0.5) 80%, transparent 100%);
        }

        .stamp-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 8px 12px;
          background: linear-gradient(180deg, #c62828 0%, #b71c1c 100%);
          border: none;
          border-radius: 6px;
          color: #faf0e6;
          cursor: pointer;
          font-family: 'Ma Shan Zheng', cursive;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          opacity: 0.6;
        }

        .stamp-btn:not(:disabled) {
          opacity: 1;
        }

        .stamp-btn:not(:disabled):hover {
          transform: scale(1.05) rotate(-5deg);
          box-shadow: 0 4px 15px rgba(198, 40, 40, 0.4);
        }

        .stamp-btn:disabled {
          cursor: not-allowed;
        }

        .stamp-icon {
          font-size: 22px;
          line-height: 1;
        }

        .stamp-text {
          font-size: 12px;
        }

        .panel-title {
          flex: 1;
          text-align: center;
          color: #5d4037;
          font-size: 26px;
          letter-spacing: 6px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          color: #8b7355;
          font-size: 32px;
          cursor: pointer;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .close-btn:hover {
          color: #c62828;
          transform: rotate(90deg);
        }

        .panel-content {
          flex: 1;
          padding: 25px 30px;
          overflow-y: auto;
        }

        .panel-content::-webkit-scrollbar {
          width: 8px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: rgba(139, 119, 101, 0.1);
          border-radius: 4px;
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: rgba(139, 119, 101, 0.3);
          border-radius: 4px;
        }

        .current-selection {
          background: rgba(139, 119, 101, 0.1);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
          border-left: 3px solid #689f38;
        }

        .selection-item {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 5px 0;
        }

        .selection-label {
          color: #8b6914;
          font-size: 16px;
          letter-spacing: 2px;
          min-width: 45px;
        }

        .selection-value {
          color: #5d4037;
          font-size: 18px;
        }

        .input-group {
          margin-bottom: 18px;
        }

        .input-label {
          display: block;
          color: #8b6914;
          font-size: 18px;
          letter-spacing: 3px;
          margin-bottom: 8px;
        }

        .tea-textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid rgba(139, 119, 101, 0.3);
          border-radius: 8px;
          background: rgba(255,255,255,0.5);
          color: #5d4037;
          font-family: 'Ma Shan Zheng', cursive;
          font-size: 16px;
          resize: vertical;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          outline: none;
        }

        .tea-textarea:focus {
          border-color: #689f38;
          background: rgba(255,255,255,0.8);
          box-shadow: 0 0 0 3px rgba(104, 159, 56, 0.2);
        }

        .tea-textarea::placeholder {
          color: rgba(93, 64, 55, 0.4);
        }

        .tea-input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid rgba(139, 119, 101, 0.3);
          border-radius: 8px;
          background: rgba(255,255,255,0.5);
          color: #5d4037;
          font-family: 'Ma Shan Zheng', cursive;
          font-size: 16px;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          outline: none;
        }

        .tea-input:focus {
          border-color: #689f38;
          background: rgba(255,255,255,0.8);
          box-shadow: 0 0 0 3px rgba(104, 159, 56, 0.2);
        }

        .tea-input::placeholder {
          color: rgba(93, 64, 55, 0.4);
        }

        .rating-stars {
          display: flex;
          gap: 10px;
          padding: 10px 0;
        }

        .star-btn {
          background: transparent;
          border: none;
          font-size: 36px;
          color: rgba(139, 119, 101, 0.3);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          font-family: serif;
          line-height: 1;
        }

        .star-btn.active {
          color: #ffc107;
          text-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
        }

        .star-btn:hover {
          transform: scale(1.2);
        }

        .generate-btn {
          width: 100%;
          padding: 15px;
          margin-top: 20px;
          background: linear-gradient(180deg, #c62828 0%, #b71c1c 100%);
          color: #faf0e6;
          border: none;
          border-radius: 10px;
          font-family: 'Ma Shan Zheng', cursive;
          font-size: 22px;
          letter-spacing: 8px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(198, 40, 40, 0.3);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .generate-btn:hover {
          background: linear-gradient(180deg, #d32f2f 0%, #c62828 100%);
          box-shadow: 0 6px 20px rgba(198, 40, 40, 0.4);
        }

        .tea-note-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          perspective: 1000px;
        }

        .tea-note-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .tea-note {
          width: 320px;
          height: 500px;
          background: linear-gradient(180deg, #f5f0e0 0%, #ebe5d5 50%, #e0d8c8 100%);
          padding: 30px 25px;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 0 30px rgba(139, 119, 101, 0.1);
          overflow: hidden;
        }

        .tea-note::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 20% 30%, rgba(139, 119, 101, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(139, 119, 101, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .note-header {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .note-seal {
          width: 60px;
          height: 60px;
          background: linear-gradient(180deg, #c62828 0%, #b71c1c 100%);
          border-radius: 8px;
          color: #faf0e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          box-shadow: 0 4px 10px rgba(198, 40, 40, 0.3);
        }

        .note-content-vertical {
          display: flex;
          flex-direction: row-reverse;
          gap: 12px;
          justify-content: center;
          height: 320px;
          padding-right: 20px;
        }

        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: upright;
          color: #5d4037;
          line-height: 2;
        }

        .tea-name {
          font-size: 26px;
          color: #689f38;
          letter-spacing: 4px;
        }

        .tea-snack {
          font-size: 14px;
          color: #8b6914;
        }

        .tea-date {
          font-size: 14px;
          color: #8b7355;
        }

        .tea-rating {
          font-size: 18px;
          color: #ffc107;
          letter-spacing: 2px;
        }

        .tea-comment {
          font-size: 14px;
          max-height: 180px;
          overflow: hidden;
        }

        .tea-master {
          font-size: 14px;
          color: #8b4513;
          margin-top: auto;
        }

        .note-mountain {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: 
            linear-gradient(135deg, transparent 40%, rgba(93, 64, 55, 0.15) 40%, rgba(93, 64, 55, 0.15) 60%, transparent 60%),
            linear-gradient(45deg, transparent 30%, rgba(93, 64, 55, 0.1) 30%, rgba(93, 64, 55, 0.1) 50%, transparent 50%),
            linear-gradient(180deg, transparent 0%, rgba(104, 159, 56, 0.08) 100%);
          opacity: 0.6;
        }

        .note-mountain::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 10%;
          width: 0;
          height: 0;
          border-left: 60px solid transparent;
          border-right: 60px solid transparent;
          border-bottom: 50px solid rgba(93, 64, 55, 0.15);
        }

        .note-mountain::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 5%;
          width: 0;
          height: 0;
          border-left: 80px solid transparent;
          border-right: 80px solid transparent;
          border-bottom: 60px solid rgba(93, 64, 55, 0.1);
        }

        .note-actions {
          display: flex;
          gap: 15px;
        }

        .note-btn {
          padding: 12px 30px;
          background: rgba(250, 240, 230, 0.9);
          color: #5d4037;
          border: 2px solid #8b7355;
          border-radius: 8px;
          font-family: 'Ma Shan Zheng', cursive;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .note-btn:hover {
          background: #faf0e6;
          transform: scale(1.05);
        }

        .note-btn.primary {
          background: linear-gradient(180deg, #689f38 0%, #558b2f 100%);
          color: #faf0e6;
          border-color: #8bc34a;
        }

        .note-btn.primary:hover {
          background: linear-gradient(180deg, #7cb342 0%, #689f38 100%);
        }

        @media (max-width: 768px) {
          .tasting-panel {
            width: 100%;
          }
          .tea-note {
            width: 280px;
            height: 450px;
          }
          .note-content-vertical {
            gap: 8px;
          }
          .tea-name {
            font-size: 22px;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
