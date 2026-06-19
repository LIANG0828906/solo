import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Menu, Undo2, Redo2, RotateCcw } from 'lucide-react';

export function MenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const historyIndex = useGameStore((state) => state.historyIndex);
  const history = useGameStore((state) => state.history);
  const undo = useGameStore((state) => state.undo);
  const redo = useGameStore((state) => state.redo);
  const clearAll = useGameStore((state) => state.clearAll);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const totalSteps = Math.min(history.length, 20);
  const currentStep = historyIndex + 1;

  return (
    <>
      <div className="menu-area">
        <div className="step-info">
          <span>第{currentStep}/{totalSteps}步</span>
        </div>

        <button
          className={`menu-btn ${isOpen ? 'menu-btn--open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu size={22} />
        </button>

        {isOpen && (
          <div className="menu-dropdown">
            <button
              className="menu-dropdown__item"
              onClick={() => {
                undo();
                setIsOpen(false);
              }}
              disabled={!canUndo}
            >
              <Undo2 size={16} />
              <span>撤销 (Ctrl+Z)</span>
            </button>
            <button
              className="menu-dropdown__item"
              onClick={() => {
                redo();
                setIsOpen(false);
              }}
              disabled={!canRedo}
            >
              <Redo2 size={16} />
              <span>恢复 (Ctrl+Y)</span>
            </button>
            <div className="menu-dropdown__divider" />
            <button
              className="menu-dropdown__item menu-dropdown__item--danger"
              onClick={() => {
                clearAll();
                setIsOpen(false);
              }}
            >
              <RotateCcw size={16} />
              <span>全部重置</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .menu-area {
          position: fixed;
          bottom: 70px;
          right: 30px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
          z-index: 100;
        }

        .step-info {
          padding: 6px 14px;
          background: #1A1A1ACC;
          border: 1px solid #333333;
          border-radius: 16px;
          color: #cccccc;
          font-size: 12px;
          backdrop-filter: blur(10px);
        }

        .menu-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #ffffff;
          border: none;
          color: #1a1a1a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        .menu-btn:hover {
          transform: scale(1.15);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
        }

        .menu-btn--open {
          background: #3498DB;
          color: #ffffff;
        }

        .menu-dropdown {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 200px;
          background: #1A1A1AF0;
          border: 1px solid #333333;
          border-radius: 10px;
          padding: 6px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .menu-dropdown__item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #cccccc;
          cursor: pointer;
          font-size: 13px;
          text-align: left;
          transition: all 0.2s ease;
        }

        .menu-dropdown__item:hover:not(:disabled) {
          background: #2A2A2A;
          color: #ffffff;
        }

        .menu-dropdown__item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .menu-dropdown__item--danger {
          color: #E74C3C;
        }

        .menu-dropdown__item--danger:hover {
          background: #E74C3C20;
        }

        .menu-dropdown__divider {
          height: 1px;
          background: #333333;
          margin: 4px 0;
        }

        @media (max-width: 1024px) {
          .menu-area {
            bottom: 60px;
            right: 15px;
          }

          .step-info {
            font-size: 10px;
            padding: 4px 10px;
          }

          .menu-btn {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </>
  );
}
