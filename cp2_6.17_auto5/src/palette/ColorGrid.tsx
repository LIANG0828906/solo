import React, { useState, useRef, useCallback, memo } from 'react';
import { usePaletteStore } from './store';
import { useProjectStore } from '../project/store';
import { getContrastTextColor } from '../utils/colorUtils';
import { Color } from '../utils/types';

interface ColorCardProps {
  color: Color;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isReadonly: boolean;
  onLockClick: () => void;
}

const ColorCard: React.FC<ColorCardProps> = memo(({
  color,
  onClick,
  onDragStart,
  isReadonly,
  onLockClick
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const textColor = getContrastTextColor(color.hex);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLockClick();
  };

  const roleLabels: Record<string, string> = {
    primary: '主色调',
    secondary: '辅色调',
    accent: '强调色'
  };

  return (
    <div
      draggable={!isReadonly}
      onDragStart={onDragStart}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      style={{
        backgroundColor: color.hex,
        color: textColor,
        borderRadius: '8px',
        padding: '20px 16px',
        cursor: isReadonly ? 'default' : 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isPressed ? 'scale(0.95)' : 'translateY(0)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        userSelect: 'none'
      }}
      className="color-card"
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.5px'
        }}
      >
        {color.hex}
      </div>
      {color.percentage !== undefined && (
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {color.percentage}%
        </div>
      )}
      {color.role && (
        <div
          style={{
            fontSize: '11px',
            opacity: 0.7,
            marginTop: 'auto'
          }}
        >
          {roleLabels[color.role]}
        </div>
      )}
      {isReadonly && (
        <div
          onClick={handleLockClick}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔒
        </div>
      )}
    </div>
  );
});

ColorCard.displayName = 'ColorCard';

const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div
    style={{
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: visible
        ? 'translateX(-50%) translateY(0)'
        : 'translateX(-50%) translateY(20px)',
      opacity: visible ? 1 : 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      zIndex: 1000,
      pointerEvents: 'none',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}
  >
    {message}
  </div>
);

const ColorGrid: React.FC = () => {
  const { colors, addColor, addColorsFromImage, isExtracting } = usePaletteStore();
  const isReadonly = useProjectStore(state => state.isReadonly());
  const [hexInput, setHexInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  }, []);

  const handleCopyColor = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      showToast('已复制到剪贴板');
    }).catch(() => {
      showToast('已复制到剪贴板');
    });
  }, [showToast]);

  const handleLockClick = useCallback(() => {
    showToast('需要编辑权限');
  }, [showToast]);

  const handleAddColor = useCallback(() => {
    if (!hexInput.trim()) return;
    const result = addColor(hexInput.trim());
    if (result) {
      setHexInput('');
      showToast('颜色已添加');
    } else {
      showToast('无效的色值或已存在');
    }
  }, [hexInput, addColor, showToast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddColor();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newColors = await addColorsFromImage(file);
    if (newColors.length > 0) {
      showToast(`提取了 ${newColors.length} 种颜色`);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (e: React.DragEvent, color: Color) => {
    e.dataTransfer.setData('colorId', color.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {!isReadonly && (
          <>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                flex: 1,
                minWidth: '200px'
              }}
            >
              <input
                type="text"
                value={hexInput}
                onChange={e => setHexInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入十六进制色值 #E94560"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a4a',
                  backgroundColor: '#16213E',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
              <button
                onClick={handleAddColor}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#E94560',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                添加
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px dashed #2a2a4a',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isExtracting ? '提取中...' : '📷 从图片提取'}
            </label>
          </>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          flex: 1,
          overflowY: 'auto',
          padding: '4px'
        }}
        className="color-grid"
      >
        {colors.map(color => (
          <ColorCard
            key={color.id}
            color={color}
            onClick={() => handleCopyColor(color.hex)}
            onDragStart={e => handleDragStart(e, color)}
            isReadonly={isReadonly}
            onLockClick={handleLockClick}
          />
        ))}
        {colors.length === 0 && !isExtracting && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666',
              fontSize: '14px'
            }}
          >
            暂无颜色，上传图片或输入色值开始提取
          </div>
        )}
        {isExtracting && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '60px 20px',
              color: '#888',
              fontSize: '14px'
            }}
          >
            正在分析图片颜色...
          </div>
        )}
      </div>

      <Toast message={toastMessage} visible={toastVisible} />

      <style>{`
        @media (min-width: 768px) {
          .color-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        
        .color-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
        }
        
        .color-grid::-webkit-scrollbar {
          width: 6px;
        }
        .color-grid::-webkit-scrollbar-track {
          background: transparent;
        }
        .color-grid::-webkit-scrollbar-thumb {
          background: #2a2a4a;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default ColorGrid;
