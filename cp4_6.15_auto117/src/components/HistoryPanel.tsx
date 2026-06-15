import { useState, useCallback } from 'react';
import { useSequenceStore } from '@/store/sequenceStore';
import { BASE_COLORS } from '@/utils/sequenceParser';
import type { BaseType } from '@/utils/sequenceParser';

export default function HistoryPanel() {
  const {
    mutationHistory,
    currentHistoryIndex,
    revertToHistory,
    clearHistory,
  } = useSequenceStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [clearingIndex, setClearingIndex] = useState(-1);

  const handleClear = useCallback(() => {
    if (mutationHistory.length === 0) return;
    setIsClearing(true);
    let index = mutationHistory.length - 1;
    const interval = setInterval(() => {
      setClearingIndex(index);
      index--;
      if (index < -1) {
        clearInterval(interval);
        setTimeout(() => {
          clearHistory();
          setIsClearing(false);
          setClearingIndex(-1);
        }, 300);
      }
    }, 60);
  }, [mutationHistory.length, clearHistory]);

  const getMutationSummary = (record: any): string => {
    const pos = record.position;
    switch (record.type) {
      case 'point':
        return `位置${pos}：${record.oldBase || '?'}→${record.newBase || '?'} 点突变`;
      case 'insertion':
        const bases = record.insertedBases?.join('') || '';
        return `位置${pos}：插入 ${bases.length}bp`;
      case 'deletion':
        const delCount = record.deletedBases?.length || 0;
        return `位置${pos}：删除 ${delCount}bp`;
      default:
        return `位置${pos}：未知操作`;
    }
  };

  const getBaseColor = (base?: BaseType): string => {
    if (!base) return '#666666';
    return BASE_COLORS[base] || '#666666';
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        top: '50%',
        transform: `translateY(-50%) translateX(${isExpanded ? '0' : 'calc(100% + 20px)'})`,
        width: '280px',
        maxHeight: '70vh',
        background: 'rgba(15, 15, 40, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px',
        color: '#e0e0ff',
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        border: '1px solid rgba(100, 100, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(100, 150, 255, 0.1)',
        zIndex: 100,
        transition: 'transform 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(100, 100, 255, 0.2)',
          background: 'rgba(20, 20, 60, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#00d4ff', letterSpacing: '0.5px' }}>
            突变历史
          </span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: 'rgba(0, 200, 255, 0.2)',
              borderRadius: '10px',
              color: '#00d4ff',
            }}
          >
            {mutationHistory.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleClear}
            disabled={isClearing || mutationHistory.length === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: isClearing || mutationHistory.length === 0 ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255, 100, 100, 0.7)',
              fontSize: '10px',
              cursor: isClearing || mutationHistory.length === 0 ? 'not-allowed' : 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isClearing && mutationHistory.length > 0) {
                e.currentTarget.style.color = '#ff6b6b';
                e.currentTarget.style.background = 'rgba(255, 100, 100, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isClearing || mutationHistory.length === 0
                ? 'rgba(255, 100, 100, 0.3)'
                : 'rgba(255, 100, 100, 0.7)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            清空
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(224, 224, 255, 0.5)',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '12px',
              transition: 'transform 0.3s ease',
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          >
            {isExpanded ? '▶' : '◀'}
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {mutationHistory.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 10px',
              color: 'rgba(224, 224, 255, 0.4)',
              fontSize: '12px',
            }}
          >
            暂无突变记录
          </div>
        ) : (
          mutationHistory.map((record: any, index: number) => {
            const isActive = index === currentHistoryIndex;
            const isClearingThis = isClearing && index >= clearingIndex;

            return (
              <div
                key={record.id}
                onClick={() => !isClearing && revertToHistory(index)}
                style={{
                  position: 'relative',
                  padding: '12px',
                  background: isActive
                    ? 'rgba(100, 150, 255, 0.15)'
                    : 'rgba(30, 30, 70, 0.6)',
                  borderRadius: '8px',
                  cursor: isClearing ? 'default' : 'pointer',
                  transition: 'all 0.25s ease',
                  border: `1px solid ${
                    isActive
                      ? 'rgba(100, 180, 255, 0.5)'
                      : 'rgba(100, 100, 255, 0.15)'
                  }`,
                  transform: isClearingThis
                    ? 'rotateY(90deg) translateX(50px)'
                    : 'rotateY(0) translateX(0)',
                  opacity: isClearingThis ? 0 : 1,
                  transformOrigin: 'right center',
                }}
                onMouseEnter={(e) => {
                  if (!isClearing) {
                    e.currentTarget.style.transform = 'translateX(-4px)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 16px rgba(100, 150, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(100, 180, 255, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isClearing) {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = isActive
                      ? 'rgba(100, 180, 255, 0.5)'
                      : 'rgba(100, 100, 255, 0.15)';
                  }
                }}
              >
                {index < mutationHistory.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-9px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '80%',
                      height: '1px',
                      background:
                        'linear-gradient(90deg, transparent, rgba(100, 150, 255, 0.4), transparent)',
                    }}
                  />
                )}

                <div
                  style={{
                    fontSize: '11px',
                    color: isActive ? '#00d4ff' : 'rgba(224, 224, 255, 0.85)',
                    marginBottom: '8px',
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}
                >
                  {getMutationSummary(record)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {record.type === 'point' && (
                    <>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: getBaseColor(record.oldBase),
                          boxShadow: `0 0 6px ${getBaseColor(record.oldBase)}`,
                        }}
                      />
                      <span style={{ fontSize: '10px', color: 'rgba(224, 224, 255, 0.5)' }}>
                        →
                      </span>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: getBaseColor(record.newBase),
                          boxShadow: `0 0 6px ${getBaseColor(record.newBase)}`,
                        }}
                      />
                    </>
                  )}

                  {record.type === 'insertion' && (
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {record.insertedBases?.slice(0, 5).map((base: BaseType, i: number) => (
                        <div
                          key={i}
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: getBaseColor(base),
                            boxShadow: `0 0 4px ${getBaseColor(base)}`,
                          }}
                        />
                      ))}
                      {record.insertedBases?.length > 5 && (
                        <span style={{ fontSize: '9px', color: 'rgba(224, 224, 255, 0.5)' }}>
                          +{record.insertedBases.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {record.type === 'deletion' && (
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {record.deletedBases?.slice(0, 5).map((base: BaseType, i: number) => (
                        <div
                          key={i}
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: getBaseColor(base),
                            opacity: 0.5,
                            textDecoration: 'line-through',
                          }}
                        />
                      ))}
                      {record.deletedBases?.length > 5 && (
                        <span style={{ fontSize: '9px', color: 'rgba(255, 150, 150, 0.7)' }}>
                          +{record.deletedBases.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      marginLeft: 'auto',
                      fontSize: '9px',
                      color: 'rgba(224, 224, 255, 0.35)',
                    }}
                  >
                    #{index + 1}
                  </div>
                </div>

                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      right: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#00d4ff',
                      boxShadow: '0 0 10px #00d4ff, 0 0 20px #00d4ff',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          style={{
            position: 'absolute',
            left: '-36px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '32px',
            height: '32px',
            borderRadius: '8px 0 0 8px',
            background: 'rgba(15, 15, 40, 0.9)',
            border: '1px solid rgba(100, 100, 255, 0.3)',
            borderRight: 'none',
            color: '#00d4ff',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}
        >
          ◀
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
