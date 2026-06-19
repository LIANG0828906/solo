import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useFlowerStore, WorkbenchFlower } from '../store';
import { packagingStyles } from '../utils/canvasPreview';

interface DraggingState {
  id: string;
  offsetX: number;
  offsetY: number;
}

const Workbench: React.FC = () => {
  const {
    selectedFlowers,
    packagingStyle,
    packagingFeeRatio,
    removeFlower,
    updateFlowerPosition,
    setPackagingStyle,
    setPackagingFeeRatio,
    calculateTotal,
    calculatePackagingFee,
    getFlowerCount,
    getFlowerTypeCount,
  } = useFlowerStore();

  const workbenchRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const style = packagingStyles.find((s) => s.id === packagingStyle) || packagingStyles[0];

  const getWorkbenchStyle = () => {
    const baseStyle: React.CSSProperties = {
      width: '700px',
      height: '500px',
      borderRadius: '16px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'background 0.3s ease-out',
    };

    if (packagingStyle === 'kraft') {
      return {
        ...baseStyle,
        background: `
          linear-gradient(135deg, rgba(196, 154, 108, 0.15) 0%, rgba(141, 110, 99, 0.1) 100%),
          #FFF8E1
        `,
        border: '3px solid #C49A6C',
      };
    } else if (packagingStyle === 'glass') {
      return {
        ...baseStyle,
        background: `
          linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(200, 220, 255, 0.3) 100%),
          #FFF8E1
        `,
        border: '3px solid #90CAF9',
        boxShadow: '0 8px 32px rgba(144, 202, 249, 0.3)',
      };
    } else {
      return {
        ...baseStyle,
        background: `
          linear-gradient(135deg, rgba(255, 128, 171, 0.2) 0%, rgba(255, 64, 129, 0.15) 100%),
          #FFF8E1
        `,
        border: '3px solid #FF80AB',
        boxShadow: '0 8px 32px rgba(255, 128, 171, 0.3)',
      };
    }
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, flower: WorkbenchFlower) => {
      e.preventDefault();
      const rect = workbenchRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDragging({
        id: flower.id,
        offsetX: x - flower.position.x,
        offsetY: y - flower.position.y,
      });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !workbenchRef.current) return;

      const rect = workbenchRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left - dragging.offsetX;
      let y = e.clientY - rect.top - dragging.offsetY;

      x = Math.max(20, Math.min(680, x));
      y = Math.max(20, Math.min(480, y));

      updateFlowerPosition(dragging.id, x, y);
    },
    [dragging, updateFlowerPosition]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, flower: WorkbenchFlower) => {
      const touch = e.touches[0];
      const rect = workbenchRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      setDragging({
        id: flower.id,
        offsetX: x - flower.position.x,
        offsetY: y - flower.position.y,
      });
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragging || !workbenchRef.current) return;
      e.preventDefault();

      const touch = e.touches[0];
      const rect = workbenchRef.current.getBoundingClientRect();
      let x = touch.clientX - rect.left - dragging.offsetX;
      let y = touch.clientY - rect.top - dragging.offsetY;

      x = Math.max(20, Math.min(680, x));
      y = Math.max(20, Math.min(480, y));

      updateFlowerPosition(dragging.id, x, y);
    },
    [dragging, updateFlowerPosition]
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleRemove = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      removeFlower(id);
      setRemovingId(null);
    }, 200);
  };

  const total = calculateTotal();
  const packagingFee = calculatePackagingFee();
  const grandTotal = total + packagingFee;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div
          ref={workbenchRef}
          style={getWorkbenchStyle()}
          className="workbench"
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.06)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {selectedFlowers.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: '#999',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💐</div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>
                点击左侧花材添加到工作台
              </div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>
                拖拽花材图标调整位置
              </div>
            </div>
          )}

          {selectedFlowers.map((flower) => (
            <div
              key={flower.id}
              className={`flower-icon ${removingId === flower.id ? 'removing' : ''} ${dragging?.id === flower.id ? 'dragging' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, flower)}
              onTouchStart={(e) => handleTouchStart(e, flower)}
              style={{
                position: 'absolute',
                left: flower.position.x - 20 - flower.quantity,
                top: flower.position.y - 20 - flower.quantity,
                width: 40 + flower.quantity * 2,
                height: 40 + flower.quantity * 2,
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${lightenColor(flower.color, 20)}, ${flower.color})`,
                cursor: dragging?.id === flower.id ? 'grabbing' : 'grab',
                zIndex: dragging?.id === flower.id ? 10 : 1,
                transition: dragging?.id === flower.id ? 'none' : 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                boxShadow: `0 4px 12px ${flower.color}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              {flower.quantity > 1 && (
                <span
                  style={{
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  ×{flower.quantity}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(flower.id);
                }}
                className="remove-btn"
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#FF5252',
                  color: '#fff',
                  border: '2px solid #fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  padding: 0,
                  opacity: 0,
                  transform: 'scale(0.8)',
                  transition: 'all 0.2s ease-out',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div
          style={{
            width: '220px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#666',
                marginBottom: '8px',
              }}
            >
              当前搭配
            </h3>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#333',
              }}
            >
              ¥{grandTotal.toFixed(2)}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid #EEE',
            }}
          >
            <span style={{ fontSize: '13px', color: '#888' }}>花材种类</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
              {getFlowerTypeCount()} 种
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '13px', color: '#888' }}>花材总数</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
              {getFlowerCount()} 枝
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '13px', color: '#888' }}>花材总价</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
              ¥{total.toFixed(2)}
            </span>
          </div>

          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #EEE',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#888' }}>包装费比例</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#81C784' }}>
                {(packagingFeeRatio * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={packagingFeeRatio * 100}
              onChange={(e) => setPackagingFeeRatio(Number(e.target.value) / 100)}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#E0E0E0',
                outline: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                fontSize: '11px',
                color: '#AAA',
              }}
            >
              <span>5%</span>
              <span>25%</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '2px dashed #EEE',
            }}
          >
            <span style={{ fontSize: '13px', color: '#888' }}>包装费用</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#FF80AB' }}>
              ¥{packagingFee.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#333',
            marginBottom: '16px',
          }}
        >
          选择包装风格
        </h3>
        <div style={{ display: 'flex', gap: '16px' }}>
          {packagingStyles.map((s) => (
            <button
              key={s.id}
              onClick={() => setPackagingStyle(s.id)}
              className="packaging-btn"
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '12px',
                border: packagingStyle === s.id ? '3px solid #81C784' : '2px solid #E0E0E0',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: s.bgColor,
                  border: `3px solid ${s.borderColor}`,
                  boxShadow: s.id === 'ribbon' ? '0 4px 15px rgba(255, 128, 171, 0.4)' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: packagingStyle === s.id ? 700 : 500,
                  color: packagingStyle === s.id ? '#4CAF50' : '#333',
                }}
              >
                {s.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .flower-icon:hover .remove-btn {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        
        .flower-icon:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
        }
        
        .flower-icon.dragging {
          transform: scale(1.1);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25) !important;
        }
        
        .flower-icon.removing {
          animation: scaleOut 0.2s ease-out forwards;
        }
        
        .remove-btn:hover {
          background-color: #FF1744 !important;
          transform: scale(1.1) !important;
        }
        
        .packaging-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .packaging-btn:active {
          transform: scale(0.97);
        }
        
        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.5);
          }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #81C784;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(129, 199, 132, 0.4);
          transition: all 0.15s ease-out;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #66BB6A;
          transform: scale(1.1);
        }
        
        input[type="range"]::-webkit-slider-thumb:active {
          background: #4CAF50;
          transform: scale(0.95);
        }
        
        @media (max-width: 1000px) {
          .workbench {
            width: 100% !important;
            max-width: 700px;
          }
        }
      `}</style>
    </div>
  );
};

function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export default Workbench;
