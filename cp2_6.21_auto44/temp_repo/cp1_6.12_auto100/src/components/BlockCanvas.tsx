import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { BlockConfig, BlockType } from './BlockEditor';
import type { ThemePreset } from '../theme/presets';

interface BlockCanvasProps {
  blocks: BlockConfig[];
  scrollProgress: number;
  onScrollProgressChange: (progress: number) => void;
  selectedBlockId: string | null;
  onBlockClick: (id: string) => void;
  theme: ThemePreset;
}

const BLOCK_CONTENTS: Record<BlockType, (theme: ThemePreset) => React.CSSProperties> = {
  'fullscreen-banner': (theme) => ({
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: 24,
  }),
  'three-column': () => ({
    padding: 20,
    display: 'flex',
    gap: 12,
  }),
  'card-grid': () => ({
    padding: 20,
    display: 'grid' as any,
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  }),
  'quote-block': () => ({
    padding: 28,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
  }),
  'product-carousel': () => ({
    padding: 16,
  }),
  'footer': (theme) => ({
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
  }),
};

function renderBlockContent(type: BlockType, theme: ThemePreset): React.ReactNode {
  switch (type) {
    case 'fullscreen-banner':
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, marginBottom: 8, letterSpacing: -0.5 }}>
            新品首发
          </div>
          <div style={{ fontSize: 12, color: theme.text, opacity: 0.7, marginBottom: 16, lineHeight: 1.6 }}>
            探索2024限定系列<br />品质与设计的完美融合
          </div>
          <div style={{
            display: 'inline-block',
            padding: '8px 24px',
            background: theme.accent,
            color: '#fff',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
          }}>
            立即查看
          </div>
        </div>
      );
    case 'three-column':
      return (
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '100%',
                height: 60,
                background: `${theme.accent}22`,
                borderRadius: 8,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}>📷</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.text, marginBottom: 2 }}>特色{i}</div>
              <div style={{ fontSize: 9, color: theme.text, opacity: 0.6, lineHeight: 1.4 }}>简短描述文字</div>
            </div>
          ))}
        </div>
      );
    case 'card-grid':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              background: `${theme.accent}11`,
              borderRadius: 8,
              padding: 12,
              border: `1px solid ${theme.accent}22`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: theme.text, marginBottom: 4 }}>卡片{i}</div>
              <div style={{ fontSize: 9, color: theme.text, opacity: 0.5, lineHeight: 1.4 }}>卡片内容描述</div>
            </div>
          ))}
        </div>
      );
    case 'quote-block':
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, color: theme.accent, lineHeight: 1, marginBottom: 8 }}>❝</div>
          <div style={{ fontSize: 14, fontStyle: 'italic', color: theme.text, lineHeight: 1.6, marginBottom: 8 }}>
            好的设计是尽可能少的设计
          </div>
          <div style={{ fontSize: 10, color: theme.text, opacity: 0.5 }}>— Dieter Rams</div>
        </div>
      );
    case 'product-carousel':
      return (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 10 }}>热销产品</div>
          <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                minWidth: 100,
                background: `${theme.accent}11`,
                borderRadius: 8,
                padding: 10,
                border: `1px solid ${theme.accent}22`,
                flexShrink: 0,
              }}>
                <div style={{
                  width: '100%',
                  height: 50,
                  background: `${theme.accent}22`,
                  borderRadius: 6,
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}>🏷</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: theme.text }}>产品{i}</div>
                <div style={{ fontSize: 10, color: theme.accent, fontWeight: 700 }}>¥{99 * i}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'footer':
      return (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
            {['关于', '联系', '帮助', '隐私'].map((t) => (
              <span key={t} style={{ fontSize: 10, color: theme.text, opacity: 0.6 }}>{t}</span>
            ))}
          </div>
          <div style={{ fontSize: 9, color: theme.text, opacity: 0.4 }}>© 2024 品牌名称. All rights reserved.</div>
        </div>
      );
  }
}

function getBlockMinHeight(type: BlockType): number {
  switch (type) {
    case 'fullscreen-banner': return 200;
    case 'three-column': return 140;
    case 'card-grid': return 160;
    case 'quote-block': return 120;
    case 'product-carousel': return 140;
    case 'footer': return 80;
  }
}

const DotGridBackground: React.FC = () => (
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(circle, #cbd5e1 0.8px, transparent 0.8px)',
    backgroundSize: '20px 20px',
    pointerEvents: 'none',
    zIndex: 0,
  }} />
);

const BlockCanvas: React.FC<BlockCanvasProps> = ({
  blocks,
  scrollProgress,
  onScrollProgressChange,
  selectedBlockId,
  onBlockClick,
  theme,
}) => {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rafRef = useRef<number>(0);

  const calculateParallaxTransform = useCallback((block: BlockConfig, progress: number) => {
    const scrollPx = progress * 300;
    const translateY = scrollPx * block.parallaxSpeed;
    const opacity = block.initialOpacity * (1 - progress * 0.3);
    return { translateY, opacity: Math.max(0, Math.min(1, opacity)) };
  }, []);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!progressRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = Math.max(0, Math.min(1, x / rect.width));
        onScrollProgressChange(progress);
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging, onScrollProgressChange]);

  const totalContentHeight = blocks.reduce((sum, b) => sum + getBlockMinHeight(b.type) + 24, 0) + 40;
  const maxScroll = Math.max(0, totalContentHeight - 844);
  const virtualScrollY = scrollProgress * maxScroll;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
      height: '100%',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'relative',
        width: 390,
        height: 844,
        background: '#f1f5f9',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
        margin: '0 auto',
        flexShrink: 0,
      }}>
        <DotGridBackground />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 1,
        }}>
          <div style={{
            transform: `translateY(${-virtualScrollY}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            padding: '20px 0',
          }}>
            {blocks.map((block, index) => {
              const { translateY, opacity } = calculateParallaxTransform(block, scrollProgress);
              const isSelected = block.id === selectedBlockId;
              const isHovered = block.id === hoveredBlockId;
              const minH = getBlockMinHeight(block.type);

              return (
                <React.Fragment key={block.id}>
                  <div
                    style={{
                      margin: '0 16px',
                      padding: 16,
                      minHeight: minH,
                      backgroundColor: block.bgColor,
                      backgroundImage: block.bgImageUrl ? `url('${block.bgImageUrl}')` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 12,
                      transform: `translateY(${translateY}px)`,
                      opacity: opacity,
                      border: isSelected ? `2px solid ${theme.accent}` : '2px solid transparent',
                      transition: isDragging ? 'none' : 'border-color 0.2s',
                      position: 'relative',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                    onClick={() => onBlockClick(block.id)}
                    onMouseEnter={() => setHoveredBlockId(block.id)}
                    onMouseLeave={() => setHoveredBlockId(null)}
                  >
                    {renderBlockContent(block.type, theme)}

                    {isHovered && !isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: theme.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          zIndex: 10,
                          fontSize: 14,
                          color: '#fff',
                        }}
                        onClick={(e) => { e.stopPropagation(); onBlockClick(block.id); }}
                      >
                        ✎
                      </div>
                    )}
                  </div>

                  {index < blocks.length - 1 && (
                    <div style={{
                      margin: '0 32px',
                      borderTop: `1px dashed ${theme.accent}44`,
                      height: 24,
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {blocks.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#94a3b8',
            fontSize: 14,
            textAlign: 'center',
            zIndex: 2,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>+</div>
            从左侧添加区块
          </div>
        )}
      </div>

      <div style={{ width: 390, marginTop: 12, flexShrink: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
          gap: 8,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>
            {Math.round(scrollProgress * 100)}%
          </span>
          <div style={{
            width: 60,
            height: 3,
            background: `${theme.accent}33`,
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${scrollProgress * 100}%`,
              background: theme.accent,
              borderRadius: 2,
              transition: isDragging ? 'none' : 'width 0.1s',
            }} />
          </div>
        </div>

        <div
          ref={progressRef}
          style={{
            width: '100%',
            height: 8,
            background: `${theme.accent}22`,
            borderRadius: 4,
            position: 'relative',
            cursor: 'pointer',
          }}
          onMouseDown={handleProgressMouseDown}
          onClick={(e) => {
            if (!progressRef.current) return;
            const rect = progressRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            onScrollProgressChange(Math.max(0, Math.min(1, x / rect.width)));
          }}
        >
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${scrollProgress * 100}%`,
            background: theme.accent,
            borderRadius: 4,
            transition: isDragging ? 'none' : 'width 0.1s',
            pointerEvents: 'none',
          }} />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${scrollProgress * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: isDragging ? 24 : 20,
              height: isDragging ? 24 : 20,
              borderRadius: '50%',
              background: isDragging ? theme.accent : theme.text,
              boxShadow: isDragging ? `0 0 8px ${theme.accent}88` : '0 1px 4px rgba(0,0,0,0.2)',
              transition: isDragging ? 'none' : 'width 0.15s, height 0.15s, background 0.15s, box-shadow 0.15s',
              cursor: 'grab',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BlockCanvas;
