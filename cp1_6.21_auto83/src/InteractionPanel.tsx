import { useState, useEffect } from 'react';
import { BaseType, BASE_COLORS, BASE_NAMES_CN, AnimationState } from './types';

interface InteractionPanelProps {
  onSearch: (baseType: BaseType | null) => void;
  onDisassemble: () => void;
  animationState: AnimationState;
  baseCounts: Record<BaseType, number>;
  isMobile: boolean;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

export default function InteractionPanel({
  onSearch,
  onDisassemble,
  animationState,
  baseCounts,
  isMobile,
  isDrawerOpen,
  onToggleDrawer
}: InteractionPanelProps) {
  const [searchValue, setSearchValue] = useState('');
  const [animatedCounts, setAnimatedCounts] = useState<Record<BaseType, number>>({
    A: 0, T: 0, G: 0, C: 0
  });
  const [bounceCard, setBounceCard] = useState<BaseType | null>(null);

  useEffect(() => {
    const bases: BaseType[] = ['A', 'T', 'G', 'C'];
    bases.forEach(base => {
      if (baseCounts[base] !== animatedCounts[base]) {
        setAnimatedCounts(prev => ({ ...prev, [base]: baseCounts[base] }));
        setBounceCard(base);
        setTimeout(() => setBounceCard(null), 400);
      }
    });
  }, [baseCounts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      onSearch(null);
      return;
    }

    const baseMap: Record<string, BaseType> = {
      'a': 'A',
      'adenine': 'A',
      't': 'T',
      'thymine': 'T',
      'g': 'G',
      'guanine': 'G',
      'c': 'C',
      'cytosine': 'C',
      '腺嘌呤': 'A',
      '胸腺嘧啶': 'T',
      '鸟嘌呤': 'G',
      '胞嘧啶': 'C'
    };

    const baseType = baseMap[trimmed];
    if (baseType) {
      onSearch(baseType);
    } else {
      onSearch(null);
    }
  };

  const isDisassembled = animationState === AnimationState.DISASSEMBLED || 
                        animationState === AnimationState.DISASSEMBLING;

  const panelContent = (
    <div className="panel-content">
      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="搜索碱基 (如 Adenine, A, 腺嘌呤)"
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>

      <div className="counts-section">
        <h3 className="section-title">碱基计数</h3>
        {(['A', 'T', 'G', 'C'] as BaseType[]).map(base => (
          <div
            key={base}
            className={`count-card ${bounceCard === base ? 'bounce' : ''}`}
            style={{ borderColor: BASE_COLORS[base] }}
          >
            <div className="count-info">
              <span className="count-letter">{base}</span>
              <span className="count-name">{BASE_NAMES_CN[base]}</span>
            </div>
            <span className="count-number">{animatedCounts[base]}</span>
          </div>
        ))}
      </div>

      <div className="disassemble-section">
        <button
          className="disassemble-btn"
          onClick={onDisassemble}
          title={isDisassembled ? '重新组合' : '拆解结构'}
        >
          <svg
            className="disassemble-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
      </div>

      <style>{`
        .panel-content {
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .search-section {
          padding: 0 20px;
        }

        .search-input {
          width: 200px;
          height: 40px;
          padding: 0 12px;
          background-color: #0B0C10;
          border: 1px solid #45A29E;
          border-radius: 8px;
          color: #C5C6C7;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
          border-color: #66FCF1;
        }

        .search-input::placeholder {
          color: #666;
        }

        .counts-section {
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-title {
          color: #C5C6C7;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .count-card {
          width: 180px;
          height: 60px;
          padding: 12px 16px;
          background-color: #0B0C10;
          border: 1px solid;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .count-card.bounce {
          animation: bounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        .count-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .count-letter {
          font-size: 18px;
          font-weight: bold;
          color: #FFFFFF;
        }

        .count-name {
          font-size: 12px;
          color: #C5C6C7;
        }

        .count-number {
          font-size: 24px;
          font-weight: bold;
          color: #FFFFFF;
        }

        .disassemble-section {
          padding: 0 20px;
          display: flex;
          justify-content: flex-end;
        }

        .disassemble-btn {
          width: 120px;
          height: 44px;
          border-radius: 22px;
          border: none;
          background: linear-gradient(135deg, #45A29E, #66FCF1);
          color: #0B0C10;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 2px 8px rgba(69, 162, 158, 0.3);
        }

        .disassemble-btn:hover {
          box-shadow: 0 4px 16px rgba(69, 162, 158, 0.5);
        }

        .disassemble-btn:hover .disassemble-icon {
          transform: rotate(180deg);
        }

        .disassemble-icon {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }
      `}</style>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          className="mobile-menu-btn"
          onClick={onToggleDrawer}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {isDrawerOpen && (
          <div className="drawer-overlay" onClick={onToggleDrawer}>
            <div className="drawer-content" onClick={e => e.stopPropagation()}>
              {panelContent}
            </div>
          </div>
        )}

        <style>{`
          .mobile-menu-btn {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 100;
            width: 44px;
            height: 44px;
            border-radius: 8px;
            background: #1F2833;
            border: 1px solid #45A29E;
            color: #66FCF1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .mobile-menu-btn svg {
            width: 24px;
            height: 24px;
          }

          .drawer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 200;
            animation: fadeIn 0.3s ease;
          }

          .drawer-content {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background: #1F2833;
            border-bottom: 2px solid #45A29E;
            border-radius: 0 0 12px 12px;
            animation: slideDown 0.3s ease;
            max-height: 80vh;
            overflow-y: auto;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="right-panel">
      {panelContent}
      <style>{`
        .right-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 240px;
          height: 100%;
          background-color: #1F2833;
          border-left: 2px solid #45A29E;
          z-index: 50;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
