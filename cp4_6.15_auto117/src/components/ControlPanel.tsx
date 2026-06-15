import { useState, useCallback, useMemo } from 'react';
import { useSequenceStore } from '@/store/sequenceStore';
import { BASE_COLORS, type BaseType } from '@/utils/sequenceParser';

export default function ControlPanel() {
  const {
    rawSequence,
    setSequence,
    selectedBaseIndex,
    basePairs,
    applyPointMutation,
    applyInsertion,
    applyDeletion,
    isTransitioning,
  } = useSequenceStore();

  const [inputValue, setInputValue] = useState(rawSequence);
  const [insertCount, setInsertCount] = useState(1);
  const [deleteCount, setDeleteCount] = useState(1);
  const [insertBases, setInsertBases] = useState('A');
  const [showInsertPanel, setShowInsertPanel] = useState(false);
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; button: string }[]>([]);

  const isValid = useMemo(() => {
    return /^[ATGCatgc]+$/.test(inputValue) && inputValue.length >= 50 && inputValue.length <= 200;
  }, [inputValue]);

  const selectedBase = selectedBaseIndex !== null ? basePairs[selectedBaseIndex]?.base1 : null;
  const targetPosition = selectedBaseIndex !== null ? selectedBaseIndex : Math.floor(basePairs.length / 2);

  const handleSubmit = useCallback(() => {
    if (!isValid || isTransitioning) return;
    try {
      setSequence(inputValue.toUpperCase());
    } catch (e) {
      console.error('Invalid sequence', e);
    }
  }, [inputValue, isValid, isTransitioning, setSequence]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>, button: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y, button }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  const handlePointMutation = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTransitioning || selectedBaseIndex === null) return;
      createRipple(e, 'point');
      const bases: BaseType[] = ['A', 'T', 'G', 'C'];
      const currentBase = basePairs[selectedBaseIndex]?.base1 || 'A';
      const otherBases = bases.filter((b) => b !== currentBase);
      const newBase = otherBases[Math.floor(Math.random() * otherBases.length)];
      applyPointMutation(selectedBaseIndex, newBase);
    },
    [selectedBaseIndex, basePairs, applyPointMutation, isTransitioning, createRipple]
  );

  const handleInsertion = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTransitioning) return;
      createRipple(e, 'insert');
      const validBases = insertBases.toUpperCase().replace(/[^ATGC]/g, '');
      if (validBases.length === 0) return;
      const bases = validBases.split('') as BaseType[];
      applyInsertion(targetPosition, bases);
      setShowInsertPanel(false);
    },
    [insertBases, targetPosition, applyInsertion, isTransitioning, createRipple]
  );

  const handleDeletion = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isTransitioning) return;
      createRipple(e, 'delete');
      if (deleteCount <= 0) return;
      applyDeletion(targetPosition, deleteCount);
      setShowDeletePanel(false);
    },
    [deleteCount, targetPosition, applyDeletion, isTransitioning, createRipple]
  );

  const borderColor = isInputFocused
    ? 'rgba(50, 150, 255, 0.9)'
    : isValid
      ? 'rgba(100, 180, 255, 0.6)'
      : 'rgba(100, 100, 255, 0.3)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        maxWidth: 'calc(100vw - 40px)',
        background: 'rgba(20, 20, 50, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '20px 24px',
        color: '#e0e0ff',
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        border: '1px solid rgba(100, 100, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(100, 150, 255, 0.1)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00d4ff', letterSpacing: '1px' }}>
          DNA SEQUENCE CONTROL
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(224, 224, 255, 0.5)' }}>
          {rawSequence.length} bp
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '2px',
            width: isInputFocused ? '50%' : '0%',
            background: 'linear-gradient(90deg, transparent, #00d4ff)',
            transition: 'width 0.3s ease',
            zIndex: 1,
            borderRadius: '1px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            height: '2px',
            width: isInputFocused ? '50%' : '0%',
            background: 'linear-gradient(90deg, #00d4ff, transparent)',
            transition: 'width 0.3s ease',
            zIndex: 1,
            borderRadius: '1px',
          }}
        />
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder="输入碱基序列 (ATCG, 50-200 bp)"
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'rgba(10, 10, 30, 0.6)',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            color: '#e0e0ff',
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '12px',
            lineHeight: '1.6',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            boxShadow: isInputFocused ? '0 0 20px rgba(0, 150, 255, 0.2)' : 'none',
            letterSpacing: '1px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '10px',
            fontSize: '10px',
            color: isValid ? 'rgba(100, 255, 150, 0.7)' : 'rgba(255, 150, 150, 0.7)',
            background: 'rgba(10, 10, 30, 0.8)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {inputValue.length} / 200
        </div>
      </div>

      {selectedBaseIndex !== null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            padding: '8px 12px',
            background: 'rgba(0, 150, 255, 0.1)',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'rgba(224, 224, 255, 0.6)' }}>选中位置:</span>
          <span style={{ fontWeight: 'bold', color: '#00d4ff' }}>{selectedBaseIndex}</span>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: selectedBase ? BASE_COLORS[selectedBase] : '#888',
              boxShadow: selectedBase ? `0 0 10px ${BASE_COLORS[selectedBase]}` : 'none',
            }}
          />
          <span style={{ color: '#e0e0ff' }}>{selectedBase || '-'}</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'stretch',
        }}
      >
        <button
          onClick={handlePointMutation}
          disabled={isTransitioning || selectedBaseIndex === null}
          style={{
            position: 'relative',
            flex: 1,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: isTransitioning || selectedBaseIndex === null ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            opacity: isTransitioning || selectedBaseIndex === null ? 0.5 : 1,
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning && selectedBaseIndex !== null) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            createRipple(e, 'point');
            if (!isTransitioning && selectedBaseIndex !== null) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
        >
          {ripples
            .filter((r) => r.button === 'point')
            .map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: 'absolute',
                  left: ripple.x,
                  top: ripple.y,
                  width: '0px',
                  height: '0px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.4)',
                  transform: 'translate(-50%, -50%)',
                  animation: 'ripple 0.6s ease-out forwards',
                  pointerEvents: 'none',
                }}
              />
            ))}
          点突变
        </button>

        <button
          onClick={() => setShowInsertPanel(!showInsertPanel)}
          onMouseDown={(e) => createRipple(e, 'insert')}
          disabled={isTransitioning}
          style={{
            position: 'relative',
            flex: 1,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            opacity: isTransitioning ? 0.5 : 1,
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 200, 255, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
        >
          插入
        </button>

        <button
          onClick={() => setShowDeletePanel(!showDeletePanel)}
          onMouseDown={(e) => createRipple(e, 'delete')}
          disabled={isTransitioning}
          style={{
            position: 'relative',
            flex: 1,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #cc3333 100%)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            opacity: isTransitioning ? 0.5 : 1,
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 100, 100, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
        >
          删除
        </button>

        <button
          onClick={handleSubmit}
          disabled={!isValid || isTransitioning}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: isValid
              ? 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)'
              : 'rgba(100, 100, 100, 0.3)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: !isValid || isTransitioning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: !isValid || isTransitioning ? 0.5 : 1,
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => {
            if (isValid && !isTransitioning) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 255, 136, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            if (isValid && !isTransitioning) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
        >
          更新序列
        </button>
      </div>

      {showInsertPanel && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(0, 150, 200, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 200, 255, 0.3)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'rgba(224, 224, 255, 0.7)', marginBottom: '8px' }}>
            插入碱基 (ATCG) 位置: {targetPosition}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={insertBases}
              onChange={(e) => setInsertBases(e.target.value.toUpperCase().replace(/[^ATGC]/g, ''))}
              placeholder="ATCG"
              maxLength={10}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: 'rgba(10, 10, 30, 0.8)',
                border: '1px solid rgba(0, 200, 255, 0.4)',
                borderRadius: '6px',
                color: '#e0e0ff',
                fontFamily: 'inherit',
                fontSize: '12px',
                outline: 'none',
                letterSpacing: '2px',
              }}
            />
            <button
              onClick={handleInsertion}
              disabled={insertBases.length === 0}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: insertBases.length === 0 ? 'not-allowed' : 'pointer',
                opacity: insertBases.length === 0 ? 0.5 : 1,
              }}
            >
              确认
            </button>
          </div>
        </div>
      )}

      {showDeletePanel && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(200, 50, 50, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 100, 100, 0.3)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'rgba(224, 224, 255, 0.7)', marginBottom: '8px' }}>
            删除碱基数 位置: {targetPosition}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="number"
              value={deleteCount}
              onChange={(e) => setDeleteCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              min={1}
              max={10}
              style={{
                width: '80px',
                padding: '8px 10px',
                background: 'rgba(10, 10, 30, 0.8)',
                border: '1px solid rgba(255, 100, 100, 0.4)',
                borderRadius: '6px',
                color: '#e0e0ff',
                fontFamily: 'inherit',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '11px', color: 'rgba(224, 224, 255, 0.5)' }}>/ 10</span>
            <button
              onClick={handleDeletion}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #ff6b6b, #cc3333)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              确认删除
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ripple {
          to {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
