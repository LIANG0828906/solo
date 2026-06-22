import { motion } from 'framer-motion';
import type { Snack } from '../types';
import { SNACKS } from '../data';

interface SnackRackProps {
  onSnackSelect: (snack: Snack) => void;
  selectedSnacks: Snack[];
}

const ease = [0.25, 0.46, 0.45, 0.94];

export default function SnackRack({ onSnackSelect, selectedSnacks }: SnackRackProps) {
  const handleSnackClick = (snack: Snack) => {
    onSnackSelect(snack);
  };

  const isSelected = (id: string) => selectedSnacks.some(s => s.id === id);

  return (
    <div className="snack-rack">
      <h2 className="rack-title">点 心 柜</h2>
      <div className="snack-list">
        {SNACKS.map((snack, index) => (
          <motion.div
            key={snack.id}
            className={`snack-item ${isSelected(snack.id) ? 'selected' : ''}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, ease }}
            onClick={() => handleSnackClick(snack)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="snack-plate">
              <div className="cracked-glaze" />
              <div className="snack-content">
                {snack.id === 'guihua' && (
                  <>
                    <div className="cake-piece" style={{ background: 'linear-gradient(180deg, #fff9e6 0%, #fff3cc 100%)' }} />
                    <div className="cake-piece" style={{ background: 'linear-gradient(180deg, #fff3cc 0%, #ffe699 100%)', left: '55%' }} />
                    <div className="osmanthus" style={{ left: '30%', top: '35%' }} />
                    <div className="osmanthus" style={{ left: '65%', top: '45%' }} />
                  </>
                )}
                {snack.id === 'xingren' && (
                  <>
                    <div className="cookie-piece" style={{ background: 'linear-gradient(180deg, #f5deb3 0%, #deb887 100%)' }} />
                    <div className="cookie-piece" style={{ background: 'linear-gradient(180deg, #deb887 0%, #d2b48c 100%)', left: '55%', top: '40%' }} />
                    <div className="almond-chip" style={{ left: '25%', top: '30%' }} />
                    <div className="almond-chip" style={{ left: '60%', top: '50%' }} />
                  </>
                )}
                {snack.id === 'meizi' && (
                  <>
                    <div className="plum" style={{ background: 'radial-gradient(circle at 30% 30%, #cd853f, #8b4513)', left: '25%', top: '35%' }} />
                    <div className="plum" style={{ background: 'radial-gradient(circle at 30% 30%, #daa520, #b8860b)', left: '55%', top: '30%' }} />
                    <div className="plum" style={{ background: 'radial-gradient(circle at 30% 30%, #cd853f, #8b4513)', left: '40%', top: '55%' }} />
                  </>
                )}
                {snack.id === 'longxu' && (
                  <>
                    <div className="candy-floss" style={{ background: 'linear-gradient(45deg, #fffaf0 25%, #fff8dc 50%, #fffaf0 75%)', left: '20%', top: '30%' }} />
                    <div className="candy-floss" style={{ background: 'linear-gradient(45deg, #fff8dc 25%, #fffaf0 50%, #fff8dc 75%)', left: '50%', top: '35%' }} />
                    <div className="candy-floss" style={{ background: 'linear-gradient(45deg, #fffaf0 25%, #fff8dc 50%, #fffaf0 75%)', left: '35%', top: '55%' }} />
                  </>
                )}
              </div>
            </div>
            <div className="snack-info">
              <div className="snack-name">{snack.name}</div>
              <div className="snack-desc">{snack.description}</div>
            </div>
            {isSelected(snack.id) && <div className="snack-check">✓</div>}
          </motion.div>
        ))}
      </div>

      <style>{`
        .snack-rack {
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

        .snack-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          padding: 5px;
        }

        .snack-list::-webkit-scrollbar {
          width: 6px;
        }

        .snack-list::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }

        .snack-list::-webkit-scrollbar-thumb {
          background: rgba(250, 240, 230, 0.3);
          border-radius: 3px;
        }

        .snack-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border: 2px solid transparent;
        }

        .snack-item:hover {
          background: rgba(0,0,0,0.3);
        }

        .snack-item.selected {
          border-color: #689f38;
          background: rgba(104, 159, 56, 0.2);
        }

        .snack-plate {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(145deg, #e8e4d9 0%, #d4cfc0 50%, #c5c0b0 100%);
          flex-shrink: 0;
          position: relative;
          box-shadow: inset -3px -3px 8px rgba(0,0,0,0.2), inset 3px 3px 8px rgba(255,255,255,0.5), 0 3px 8px rgba(0,0,0,0.3);
          overflow: hidden;
        }

        .cracked-glaze {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(45deg, transparent 48%, rgba(139, 119, 101, 0.3) 49%, rgba(139, 119, 101, 0.3) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(139, 119, 101, 0.3) 49%, rgba(139, 119, 101, 0.3) 51%, transparent 52%),
            linear-gradient(90deg, transparent 48%, rgba(139, 119, 101, 0.2) 49%, rgba(139, 119, 101, 0.2) 51%, transparent 52%);
          background-size: 15px 15px, 15px 15px, 20px 20px;
          opacity: 0.6;
        }

        .snack-content {
          position: absolute;
          inset: 8px;
        }

        .cake-piece {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 3px;
          left: 20%;
          top: 30%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .osmanthus {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #ffd700;
          border-radius: 50%;
          box-shadow: 0 0 3px #ffd700;
        }

        .cookie-piece {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          left: 20%;
          top: 30%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .almond-chip {
          position: absolute;
          width: 5px;
          height: 8px;
          background: #f5deb3;
          border-radius: 2px;
          transform: rotate(15deg);
        }

        .plum {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .candy-floss {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 3px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .snack-info {
          flex: 1;
          min-width: 0;
        }

        .snack-name {
          color: #faf0e6;
          font-size: 18px;
          margin-bottom: 3px;
        }

        .snack-desc {
          color: rgba(250, 240, 230, 0.7);
          font-size: 12px;
          line-height: 1.4;
        }

        .snack-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #689f38;
          color: #faf0e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .snack-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }
          .snack-item {
            flex-direction: column;
            text-align: center;
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
