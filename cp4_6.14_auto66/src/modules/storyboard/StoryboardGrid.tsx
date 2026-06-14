import { useRef, useState, useEffect } from 'react';
import { StoryboardPanel } from '../../types';

interface StoryboardGridProps {
  panels: StoryboardPanel[];
  isGenerating: boolean;
}

export default function StoryboardGrid({ panels, isGenerating }: StoryboardGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const updateProgress = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    if (isMobile) {
      const total = el.scrollHeight - el.clientHeight;
      setScrollProgress(total > 0 ? el.scrollTop / total : 0);
    } else {
      const total = el.scrollWidth - el.clientWidth;
      setScrollProgress(total > 0 ? el.scrollLeft / total : 0);
    }
  };

  useEffect(() => {
    updateProgress();
  }, [panels.length, isMobile]);

  const shotTypeColor = (type: string) => {
    switch (type) {
      case '远景': return { bg: '#fef3c7', text: '#92400e' };
      case '全景': return { bg: '#d1fae5', text: '#065f46' };
      case '中景': return { bg: '#dbeafe', text: '#1e40af' };
      case '近景': return { bg: '#fce7f3', text: '#9d174d' };
      case '特写': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 520,
        background: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          background: '#1e293b',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>🎞️ 漫画分镜脚本</h2>
        <span
          style={{
            fontSize: 13,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'rgba(139,92,246,0.3)',
            color: '#c4b5fd',
            fontWeight: 600,
          }}
        >
          共 {panels.length} 个分镜
        </span>
      </div>

      {panels.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            textAlign: 'center',
            padding: 40,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
          <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 6, fontSize: 15 }}>
            {isGenerating ? 'AI 正在创作分镜...' : '分镜板尚未生成'}
          </div>
          <div style={{ fontSize: 13, maxWidth: 280, lineHeight: 1.6 }}>
            在左侧协作面板输入故事段落，系统将自动分析场景、动作和对话，生成对应分镜
          </div>
          {isGenerating && (
            <div
              style={{
                marginTop: 20,
                width: 200,
                height: 4,
                background: '#e2e8f0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '50%',
                  height: '100%',
                  background: '#8b5cf6',
                  animation: 'slide-up 1.2s infinite',
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            onScroll={updateProgress}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 0,
              overflowX: isMobile ? 'hidden' : 'auto',
              overflowY: isMobile ? 'auto' : 'hidden',
              padding: '20px 16px 16px',
              alignItems: isMobile ? 'center' : 'flex-start',
            }}
          >
            {panels.map((panel, idx) => {
              const color = shotTypeColor(panel.shotType);
              const [hovered, setHovered] = useState(false);
              return (
                <div key={panel.id} style={{ position: 'relative', flexShrink: 0 }}>
                  {idx > 0 && !isMobile && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 10,
                        bottom: 10,
                        width: 1,
                        background: 'repeating-linear-gradient(to bottom, #cbd5e1 0, #cbd5e1 4px, transparent 4px, transparent 8px)',
                      }}
                    />
                  )}
                  {idx > 0 && isMobile && (
                    <div
                      style={{
                        height: 1,
                        width: 80,
                        margin: '12px auto',
                        background: 'repeating-linear-gradient(to right, #cbd5e1 0, #cbd5e1 4px, transparent 4px, transparent 8px)',
                      }}
                    />
                  )}
                  <div
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    style={{
                      width: 200,
                      height: 280,
                      background: '#ffffff',
                      borderRadius: 12,
                      border: `2px solid ${hovered ? '#8b5cf6' : '#94a3b8'}`,
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      marginLeft: idx === 0 || isMobile ? 0 : 16,
                      marginRight: isMobile ? 0 : 0,
                      transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                      transition: 'border-color 0.2s ease-in-out, transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      boxShadow: hovered
                        ? '0 10px 25px -5px rgba(139,92,246,0.25), 0 4px 10px -4px rgba(139,92,246,0.15)'
                        : '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: '#1e293b',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        #{String(panel.sceneNumber).padStart(2, '0')}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: color.bg,
                          color: color.text,
                        }}
                      >
                        {panel.shotType}
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        borderRadius: 8,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <div style={{ textAlign: 'center', padding: 8 }}>
                        <div style={{ fontSize: 40, marginBottom: 4, opacity: 0.5 }}>
                          {panel.shotType === '特写' ? '👁️' : panel.shotType === '远景' ? '🏔️' : panel.shotType === '全景' ? '🏠' : panel.shotType === '近景' ? '🗣️' : '🚶'}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                          画面预览区
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: '#475569',
                        marginBottom: 6,
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#334155' }}>画面：</span>
                      {panel.description}
                    </div>

                    {panel.dialogue && (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#7c3aed',
                          background: '#f5f3ff',
                          padding: '5px 8px',
                          borderRadius: 6,
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        💬 {panel.dialogue}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: '10px 20px 16px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                height: 4,
                background: '#e2e8f0',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${scrollProgress * 100}%`,
                  background: '#3b82f6',
                  borderRadius: 2,
                  transition: 'width 0.15s ease-out',
                }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: '#94a3b8',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              {isMobile ? '上下滚动查看更多分镜' : '← 左右滑动查看完整分镜板 →'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
