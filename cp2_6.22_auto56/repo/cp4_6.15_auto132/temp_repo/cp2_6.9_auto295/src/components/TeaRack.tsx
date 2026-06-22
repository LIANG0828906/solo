import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tea } from '../types';
import { TEAS } from '../data';

interface TeaRackProps {
  onTeaSelect: (tea: Tea) => void;
  selectedTea: Tea | null;
}

const ease = [0.25, 0.46, 0.45, 0.94];

export default function TeaRack({ onTeaSelect, selectedTea }: TeaRackProps) {
  const [selectedJar, setSelectedJar] = useState<Tea | null>(null);

  const handleJarClick = (tea: Tea) => {
    if (selectedTea?.id === tea.id) return;
    setSelectedJar(tea);
  };

  const handleConfirm = () => {
    if (selectedJar) {
      onTeaSelect(selectedJar);
      setSelectedJar(null);
    }
  };

  return (
    <div className="tea-rack">
      <h2 className="rack-title">茶 叶 架</h2>
      <div className="shelves">
        {TEAS.map((tea, index) => (
          <motion.div
            key={tea.id}
            className={`tea-jar-wrapper ${selectedTea?.id === tea.id ? 'selected' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease }}
          >
            <motion.div
              className="tea-jar"
              style={{
                background: `radial-gradient(ellipse at 30% 20%, ${tea.color}ee 0%, ${tea.color}dd 40%, ${tea.color}aa 70%, ${tea.color}88 100%)`,
                boxShadow: `inset -8px -8px 20px rgba(0,0,0,0.3), inset 8px 8px 20px rgba(255,255,255,0.1), 0 8px 20px rgba(0,0,0,0.4)`
              }}
              whileHover={{ scale: 1.08, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleJarClick(tea)}
              transition={{ duration: 0.25, ease }}
            >
              <div className="jar-lid" style={{ background: `linear-gradient(180deg, ${tea.color}ff, ${tea.color}cc)` }} />
              <div className="jar-body">
                <div className="jar-label">{tea.name}</div>
              </div>
              <div className="jar-gloss" />
            </motion.div>
            <div className="jar-name">{tea.name}</div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedJar && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedJar(null)}
          >
            <motion.div
              className="tea-modal"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-jar-preview"
                style={{
                  background: `radial-gradient(ellipse at 30% 20%, ${selectedJar.color}ee 0%, ${selectedJar.color}dd 40%, ${selectedJar.color}aa 70%, ${selectedJar.color}88 100%)`,
                }}
              >
                <div className="jar-lid-large" style={{ background: `linear-gradient(180deg, ${selectedJar.color}ff, ${selectedJar.color}cc)` }} />
                <div className="jar-gloss-large" />
              </div>
              <h3 className="modal-title">{selectedJar.name}</h3>
              <div className="modal-info">
                <div className="info-row">
                  <span className="info-label">产 地</span>
                  <span className="info-value">{selectedJar.origin}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">年 份</span>
                  <span className="info-value">{selectedJar.year}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">香 气</span>
                  <span className="info-value">{selectedJar.aroma}</span>
                </div>
                <div className="info-row description">
                  <span className="info-label">品 鉴</span>
                  <span className="info-value">{selectedJar.description}</span>
                </div>
              </div>
              <div className="modal-buttons">
                <button className="btn btn-cancel" onClick={() => setSelectedJar(null)}>
                  再看看
                </button>
                <button className="btn btn-confirm" onClick={handleConfirm}>
                  就选它了
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .tea-rack {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #8b6914 0%, #6d4c41 50%, #5d4037 100%);
          border-radius: 12px;
          padding: 15px;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.4), 0 4px 15px rgba(0,0,0,0.3);
          border: 3px solid #4e342e;
        }

        .rack-title {
          text-align: center;
          color: #faf0e6;
          font-size: 28px;
          margin-bottom: 15px;
          letter-spacing: 8px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
          border-bottom: 2px solid rgba(250, 240, 230, 0.2);
          padding-bottom: 10px;
        }

        .shelves {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          overflow-y: auto;
          padding: 5px;
          align-content: start;
        }

        .shelves::-webkit-scrollbar {
          width: 6px;
        }

        .shelves::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }

        .shelves::-webkit-scrollbar-thumb {
          background: rgba(250, 240, 230, 0.3);
          border-radius: 3px;
        }

        .tea-jar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .tea-jar-wrapper.selected .tea-jar {
          box-shadow: 0 0 20px #689f38, 0 0 40px rgba(104, 159, 56, 0.5);
        }

        .tea-jar {
          width: 70px;
          height: 90px;
          border-radius: 12px 12px 8px 8px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .jar-lid {
          width: 85%;
          height: 14px;
          border-radius: 6px 6px 2px 2px;
          margin-top: -7px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .jar-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .jar-label {
          color: #faf0e6;
          font-size: 18px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          background: rgba(0,0,0,0.2);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .jar-gloss {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 8px;
          height: 50px;
          background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
          border-radius: 4px;
          transform: rotate(-5deg);
        }

        .jar-name {
          color: #faf0e6;
          font-size: 14px;
          opacity: 0.9;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .tea-modal {
          background: linear-gradient(180deg, #f5f0e0 0%, #e8e0d0 100%);
          border-radius: 16px;
          padding: 30px;
          width: 90%;
          max-width: 380px;
          border: 3px solid #6d4c41;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .modal-jar-preview {
          width: 100px;
          height: 130px;
          margin: 0 auto 20px;
          border-radius: 15px 15px 10px 10px;
          position: relative;
          box-shadow: inset -8px -8px 20px rgba(0,0,0,0.3), inset 8px 8px 20px rgba(255,255,255,0.1), 0 10px 25px rgba(0,0,0,0.3);
        }

        .jar-lid-large {
          width: 85%;
          height: 20px;
          border-radius: 8px 8px 3px 3px;
          margin: -10px auto 0;
          box-shadow: 0 3px 6px rgba(0,0,0,0.3);
        }

        .jar-gloss-large {
          position: absolute;
          top: 18px;
          left: 18px;
          width: 12px;
          height: 70px;
          background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
          border-radius: 6px;
          transform: rotate(-5deg);
        }

        .modal-title {
          text-align: center;
          color: #5d4037;
          font-size: 32px;
          margin-bottom: 20px;
          letter-spacing: 4px;
        }

        .modal-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 25px;
        }

        .info-row {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }

        .info-row.description {
          flex-direction: column;
          gap: 5px;
        }

        .info-label {
          color: #8b6914;
          font-size: 16px;
          min-width: 50px;
          letter-spacing: 2px;
        }

        .info-value {
          color: #5d4037;
          font-size: 16px;
          flex: 1;
          line-height: 1.6;
        }

        .modal-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .btn {
          padding: 10px 25px;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          font-family: 'Ma Shan Zheng', cursive;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .btn-cancel {
          background: #d7ccc8;
          color: #5d4037;
        }

        .btn-cancel:hover {
          background: #bcaaa4;
          transform: scale(1.05);
        }

        .btn-confirm {
          background: linear-gradient(180deg, #689f38 0%, #558b2f 100%);
          color: #faf0e6;
        }

        .btn-confirm:hover {
          background: linear-gradient(180deg, #7cb342 0%, #689f38 100%);
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .shelves {
            grid-template-columns: repeat(3, 1fr);
          }
          .tea-jar {
            width: 60px;
            height: 75px;
          }
          .rack-title {
            font-size: 22px;
            letter-spacing: 6px;
          }
        }
      `}</style>
    </div>
  );
}
