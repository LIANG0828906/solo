import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LightingMode,
  DisplayMode,
  Artifact,
} from './types';
import { LIGHTING_PRESETS, CATEGORY_NAMES } from './data/artifacts';
import {
  Sun,
  Lightbulb,
  Moon,
  Play,
  Pause,
  Eye,
  Navigation2,
  GitCompareArrows,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Layers,
  Home,
  Sparkles,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Hand,
} from 'lucide-react';

interface UIDrawerProps {
  isMobile: boolean;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  menuExpanded: boolean;
  setMenuExpanded: (expanded: boolean) => void;
  lightingMode: LightingMode;
  setLightingMode: (mode: LightingMode) => void;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  isRoamingPaused: boolean;
  setIsRoamingPaused: (paused: boolean) => void;
  isCompareMode: boolean;
  selectedForCompare: string[];
  compareArtifacts: Artifact[];
  weatheringSlider: number;
  setWeatheringSlider: (value: number) => void;
  onStartCompare: () => void;
  onExitCompare: () => void;
  onExecuteCompare: () => void;
  onResetView: () => void;
  hasSelectedArtifact: boolean;
}

const getLightingIcon = (iconName: string, size = 18) => {
  const props = { size, strokeWidth: 1.8 };
  switch (iconName) {
    case 'Sun': return <Sun {...props} />;
    case 'Spotlight': return <Lightbulb {...props} />;
    case 'Moon': return <Moon {...props} />;
    default: return <Sparkles {...props} />;
  }
};

const WeatheringLabels = [
  { value: 0, label: '全新', desc: '完好无损' },
  { value: 0.25, label: '轻微', desc: '年代痕迹' },
  { value: 0.5, label: '中度', desc: '自然氧化' },
  { value: 0.75, label: '显著', desc: '斑驳腐蚀' },
  { value: 1, label: '严重', desc: '极度风化' },
];

const UIDrawer: React.FC<UIDrawerProps> = ({
  isMobile,
  panelOpen,
  setPanelOpen,
  menuExpanded,
  setMenuExpanded,
  lightingMode,
  setLightingMode,
  displayMode,
  setDisplayMode,
  isRoamingPaused,
  setIsRoamingPaused,
  isCompareMode,
  selectedForCompare,
  compareArtifacts,
  weatheringSlider,
  setWeatheringSlider,
  onStartCompare,
  onExitCompare,
  onExecuteCompare,
  onResetView,
  hasSelectedArtifact,
}) => {
  const [mobileDrawOpen, setMobileDrawOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const currentTranslate = useRef(0);
  const drawerHeight = typeof window !== 'undefined' ? window.innerHeight * 0.62 : 400;
  const collapsedBottom = drawerHeight * 0.72;

  const closeDrawer = useCallback(() => {
    setMobileDrawOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    setMobileDrawOpen(true);
  }, []);

  const toggleDrawer = useCallback(() => {
    setMobileDrawOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!drawerRef.current) return;
      touchStartY.current = e.touches[0].clientY;
      currentTranslate.current = mobileDrawOpen ? 0 : collapsedBottom;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null || !drawerRef.current) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY.current;
      
      if (mobileDrawOpen && deltaY > 30) {
        closeDrawer();
      } else if (!mobileDrawOpen && deltaY < -30) {
        openDrawer();
      }
    };

    const handleTouchEnd = () => {
      touchStartY.current = null;
    };

    const drawer = drawerRef.current;
    if (drawer) {
      drawer.addEventListener('touchstart', handleTouchStart, { passive: true });
      drawer.addEventListener('touchmove', handleTouchMove, { passive: true });
      drawer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (drawer) {
        drawer.removeEventListener('touchstart', handleTouchStart);
        drawer.removeEventListener('touchmove', handleTouchMove);
        drawer.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [mobileDrawOpen, closeDrawer, openDrawer, collapsedBottom]);

  const inCompareSelection = !isCompareMode && selectedForCompare.length > 0;

  const getPanelStyle = (): React.CSSProperties => {
    if (isMobile) {
      return {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: drawerHeight,
        transform: `translateY(${mobileDrawOpen ? 0 : collapsedBottom}px)`,
        borderTop: '1px solid rgba(212, 175, 55, 0.35)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        transition: 'transform 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        zIndex: 100,
        WebkitBackdropFilter: 'blur(28px)',
        backdropFilter: 'blur(28px)',
      };
    }
    return {
      position: 'fixed',
      top: 0,
      right: panelOpen ? 0 : -320,
      bottom: 0,
      width: 300,
      borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
      transition: 'right 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
      zIndex: 100,
    };
  };

  return (
    <>
      {/* 左侧悬浮菜单按钮组 */}
      <div
        style={{
          position: 'fixed',
          left: isMobile ? 12 : 20,
          top: isMobile ? 70 : '50%',
          transform: isMobile ? 'none' : 'translateY(-50%)',
          zIndex: 90,
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          gap: 8,
        }}
      >
        {/* 菜单折叠/展开按钮 */}
        <button
          onClick={() => setMenuExpanded(!menuExpanded)}
          aria-label="展开菜单"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(26, 26, 46, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            color: '#d4af37',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.8)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(212,175,55,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.35)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
          }}
        >
          <Layers size={18} strokeWidth={1.8} />
        </button>

        {menuExpanded && (
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              gap: 8,
              padding: isMobile ? '0 0 0 0' : '8px 0',
              background: isMobile ? 'transparent' : 'rgba(26, 26, 46, 0.75)',
              backdropFilter: isMobile ? 'none' : 'blur(20px)',
              WebkitBackdropFilter: isMobile ? 'none' : 'blur(20px)',
              borderRadius: 20,
              border: isMobile ? 'none' : '1px solid rgba(212, 175, 55, 0.2)',
              animation: isMobile ? undefined : 'expandMenu 400ms cubic-bezier(0.645, 0.045, 0.355, 1)',
              overflow: 'hidden',
            }}
          >
            <MenuButton
              icon={<Home size={17} strokeWidth={1.8} />}
              label="返回展厅"
              isMobile={isMobile}
              onClick={onResetView}
              active={!hasSelectedArtifact && !isCompareMode}
            />
            <MenuButton
              icon={<BookOpen size={17} strokeWidth={1.8} />}
              label="查看详情"
              isMobile={isMobile}
              onClick={() => {}}
              active={hasSelectedArtifact}
              disabled={!hasSelectedArtifact}
            />
            <MenuButton
              icon={<GitCompareArrows size={17} strokeWidth={1.8} />}
              label={isCompareMode ? '退出对比' : '年代对比'}
              isMobile={isMobile}
              onClick={() => {
                if (isCompareMode) {
                  onExitCompare();
                } else {
                  onStartCompare();
                }
              }}
              active={isCompareMode || inCompareSelection}
            />
          </div>
        )}
      </div>

      {/* 移动端面板拖拽指示器和切换按钮 */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: mobileDrawOpen ? `calc(${drawerHeight}px - 8px)` : 20,
            zIndex: 102,
            transition: 'all 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {mobileDrawOpen && (
            <button
              onClick={closeDrawer}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(26,26,46,0.85)',
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#d4af37',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(12px)',
              }}
              aria-label="收起面板"
            >
              <ChevronDown size={18} strokeWidth={2} />
            </button>
          )}
          {!mobileDrawOpen && (
            <button
              onClick={openDrawer}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d4af37, #b8962e)',
                border: 'none',
                color: '#1a1a2e',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 24px rgba(212,175,55,0.45)',
                transition: 'transform 300ms',
              }}
              aria-label="展开控制面板"
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <ChevronUp size={20} strokeWidth={2.2} />
              <Hand size={10} strokeWidth={2} style={{ marginTop: -2 }} />
            </button>
          )}
        </div>
      )}

      {/* 移动端拖拽手柄区域 */}
      {isMobile && (
        <div
          ref={drawerRef}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: mobileDrawOpen ? drawerHeight : 80,
            zIndex: 99,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 40,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingTop: 8,
              pointerEvents: 'auto',
              cursor: 'grab',
            }}
            onClick={toggleDrawer}
          >
            <div
              style={{
                width: 48,
                height: 5,
                borderRadius: 3,
                background: 'rgba(212,175,55,0.5)',
                boxShadow: '0 0 10px rgba(212,175,55,0.3)',
              }}
            />
          </div>
        </div>
      )}

      {/* 桌面端面板切换按钮 */}
      {!isMobile && (
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          aria-label={panelOpen ? '收起面板' : '展开面板'}
          style={{
            position: 'fixed',
            right: panelOpen ? 302 : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 26,
            height: 68,
            background: 'rgba(26, 26, 46, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRight: panelOpen ? 'none' : '1px solid rgba(212, 175, 55, 0.3)',
            borderLeft: panelOpen ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
            borderRadius: panelOpen ? '10px 0 0 10px' : '10px 0 0 10px',
            color: '#d4af37',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99,
            transition: 'all 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.7)';
            e.currentTarget.style.color = '#f0d78c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)';
            e.currentTarget.style.color = '#d4af37';
          }}
        >
          {panelOpen ? <ChevronRight size={16} strokeWidth={2.2} /> : <ChevronLeft size={16} strokeWidth={2.2} />}
        </button>
      )}

      {/* 主面板 */}
      <div
        style={{
          ...getPanelStyle(),
          background: isMobile
            ? 'rgba(22, 22, 40, 0.96)'
            : 'rgba(26, 26, 46, 0.93)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          padding: isMobile ? '24px 20px 28px' : '80px 20px 24px',
          overflowY: 'auto',
          overflowX: 'hidden',
          touchAction: isMobile ? 'none' : 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, marginTop: -8 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', margin: 0, letterSpacing: 0.5 }}>
                控制面板
              </h3>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                调整展示效果与浏览模式
              </p>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="关闭"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 对比选择模式提示 */}
        {inCompareSelection && (
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.45)',
              borderRadius: 14,
              padding: '16px 16px',
              marginBottom: isMobile ? 16 : 20,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#d4af37', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitCompareArrows size={14} />
                  对比模式 · 选择中
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  请在展厅中点击2件文物进行对比
                </div>
              </div>
              <button
                onClick={onExitCompare}
                aria-label="取消"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(231,76,60,0.2)';
                  e.currentTarget.style.color = '#e74c3c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[0, 1].map((idx) => {
                const art = compareArtifacts[idx];
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      minHeight: 58,
                      borderRadius: 10,
                      background: art
                        ? 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))'
                        : 'rgba(255,255,255,0.04)',
                      border: `1px ${art ? 'solid' : 'dashed'} ${art ? 'rgba(212,175,55,0.65)' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 10px',
                      textAlign: 'center',
                      transition: 'all 300ms',
                    }}
                  >
                    {art ? (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#d4af37', lineHeight: 1.3 }}>
                          {art.name}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                          {art.era}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>文物 {idx + 1}</div>
                        <div style={{ fontSize: 8, color: 'rgba(212,175,55,0.4)' }}>点击选择</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={onExecuteCompare}
              disabled={compareArtifacts.length !== 2}
              style={{
                width: '100%',
                padding: '11px 18px',
                borderRadius: 12,
                background: compareArtifacts.length === 2
                  ? 'linear-gradient(135deg, #d4af37, #c8a030)'
                  : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: compareArtifacts.length === 2 ? '#1a1a2e' : 'rgba(255,255,255,0.3)',
                fontSize: 12,
                fontWeight: 700,
                cursor: compareArtifacts.length === 2 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                transition: 'all 300ms',
              }}
              onMouseEnter={(e) => {
                if (compareArtifacts.length === 2) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,175,55,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <GitCompareArrows size={15} />
              开始对比
            </button>
          </div>
        )}

        {/* 对比模式控制面板 */}
        {isCompareMode && compareArtifacts.length === 2 && (
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.38)',
              borderRadius: 16,
              padding: '18px 16px',
              marginBottom: isMobile ? 16 : 22,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#d4af37', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>🎞</span>
                年代演变对比
              </div>
              <button
                onClick={onExitCompare}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(231,76,60,0.15)';
                  e.currentTarget.style.color = '#e74c3c';
                  e.currentTarget.style.borderColor = 'rgba(231,76,60,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }}
              >
                <X size={12} /> 退出
              </button>
            </div>

            {/* 时间轴 */}
            <div
              style={{
                position: 'relative',
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 12,
                padding: '16px 14px 18px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: compareArtifacts[0].year < compareArtifacts[1].year ? '#d4af37' : 'rgba(255,255,255,0.6)' }}>
                    {compareArtifacts[0].year < compareArtifacts[1].year ? compareArtifacts[0].name : compareArtifacts[1].name}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                    {compareArtifacts[0].year < compareArtifacts[1].year ? compareArtifacts[0].era : compareArtifacts[1].era}
                  </div>
                </div>
                <div style={{ width: 1, background: 'linear-gradient(180deg, rgba(212,175,55,0), rgba(212,175,55,0.5), rgba(212,175,55,0))', margin: '0 10px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: compareArtifacts[0].year >= compareArtifacts[1].year ? '#d4af37' : 'rgba(255,255,255,0.6)' }}>
                    {compareArtifacts[0].year >= compareArtifacts[1].year ? compareArtifacts[0].name : compareArtifacts[1].name}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                    {compareArtifacts[0].year >= compareArtifacts[1].year ? compareArtifacts[0].era : compareArtifacts[1].era}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                {['◀ 更早', '更晚 ▶'].map((text, i) => (
                  <span key={i} style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* 风化程度滑块 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 13 }}>✨</span>
                  风化程度模拟
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#d4af37',
                    padding: '3px 12px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.08))',
                    border: '1px solid rgba(212,175,55,0.25)',
                  }}
                >
                  {WeatheringLabels.find(l => Math.abs(l.value - weatheringSlider) < 0.13)?.label || `${(weatheringSlider * 100).toFixed(0)}%`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={weatheringSlider}
                onChange={(e) => setWeatheringSlider(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: 7,
                  borderRadius: 4,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${weatheringSlider * 100}%, rgba(255,255,255,0.1) ${weatheringSlider * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {WeatheringLabels.map(l => (
                  <span
                    key={l.value}
                    style={{
                      fontSize: 9,
                      color: Math.abs(l.value - weatheringSlider) < 0.13 ? '#d4af37' : 'rgba(255,255,255,0.32)',
                      transition: 'color 200ms',
                      fontWeight: Math.abs(l.value - weatheringSlider) < 0.13 ? 600 : 400,
                    }}
                  >
                    {l.label}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.25)' }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                  🔬 {WeatheringLabels.find(l => Math.abs(l.value - weatheringSlider) < 0.13)?.desc || '滑动滑块观察材质变化'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 光照预设 */}
        <Section title="💡 光照预设" subtitle="选择展厅氛围" isMobile={isMobile}>
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'row' : 'column' }}>
            {LIGHTING_PRESETS.map(preset => {
              const active = lightingMode === preset.mode;
              return (
                <button
                  key={preset.mode}
                  onClick={() => setLightingMode(preset.mode)}
                  style={{
                    flex: isMobile ? 1 : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: isMobile ? '12px 14px' : '14px 16px',
                    borderRadius: 14,
                    background: active
                      ? 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.08))'
                      : 'rgba(255,255,255,0.045)',
                    border: `1px solid ${active ? 'rgba(212, 175, 55, 0.75)' : 'rgba(255,255,255,0.09)'}`,
                    cursor: 'pointer',
                    transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
                    color: active ? '#d4af37' : 'rgba(255,255,255,0.78)',
                    boxShadow: active ? '0 0 24px rgba(212,175,55,0.18)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.45)';
                      e.currentTarget.style.transform = 'translateY(-1.5px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = active
                      ? 'rgba(212, 175, 55, 0.75)'
                      : 'rgba(255,255,255,0.09)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: active
                        ? 'linear-gradient(135deg, #d4af37, #c8a030)'
                        : 'rgba(255,255,255,0.07)',
                      color: active ? '#1a1a2e' : 'inherit',
                      transition: 'all 300ms',
                    }}
                  >
                    {getLightingIcon(preset.icon)}
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, letterSpacing: 0.3 }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                      {preset.mode === 'daylight' ? '温暖自然光照' : preset.mode === 'museum' ? '专业射灯聚焦' : '静谧冷调氛围'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 展示模式 */}
        <Section title="🎬 展示模式" subtitle="切换浏览方式" isMobile={isMobile}>
          <div
            style={{
              background: 'rgba(255,255,255,0.045)',
              borderRadius: 16,
              padding: 6,
              display: 'flex',
              position: 'relative',
              marginBottom: 14,
            }}
          >
            {[
              { mode: DisplayMode.SINGLE, label: '单人查看', icon: <Eye size={15} /> },
              { mode: DisplayMode.ROAMING, label: '漫游模式', icon: <Navigation2 size={15} /> },
            ].map((item, idx) => {
              const active = displayMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => setDisplayMode(item.mode)}
                  style={{
                    flex: 1,
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: active ? 'linear-gradient(135deg, #d4af37, #c8a030)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: active ? '#1a1a2e' : 'rgba(255,255,255,0.62)',
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    transition: 'all 400ms cubic-bezier(0.645, 0.045, 0.355, 1)',
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          {displayMode === DisplayMode.ROAMING && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(93, 173, 226, 0.12), rgba(93, 173, 226, 0.04))',
                border: '1px solid rgba(93, 173, 226, 0.35)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>
                  椭圆路径自动环绕
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  360° 沉浸式欣赏展厅全貌
                </div>
              </div>
              <button
                onClick={() => setIsRoamingPaused(!isRoamingPaused)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isRoamingPaused
                    ? 'linear-gradient(135deg, #5dade2, #3498db)'
                    : 'rgba(255,255,255,0.12)',
                  border: `1px solid ${isRoamingPaused ? 'transparent' : 'rgba(255,255,255,0.18)'}`,
                  color: isRoamingPaused ? '#fff' : 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 300ms',
                  boxShadow: isRoamingPaused ? '0 4px 16px rgba(93,173,226,0.35)' : 'none',
                }}
                aria-label={isRoamingPaused ? '继续漫游' : '暂停漫游'}
              >
                {isRoamingPaused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}
              </button>
            </div>
          )}
        </Section>

        {/* 操作快捷按钮 */}
        <Section title="⚡ 快捷操作" subtitle="常用功能入口" isMobile={isMobile}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 8 }}>
            <QuickActionButton
              icon={<RotateCcw size={16} />}
              label="重置视角"
              onClick={onResetView}
            />
            <QuickActionButton
              icon={<GitCompareArrows size={16} />}
              label={isCompareMode ? '退出对比' : '文物对比'}
              onClick={() => isCompareMode ? onExitCompare() : onStartCompare()}
              active={isCompareMode || inCompareSelection}
            />
            <QuickActionButton
              icon={<Sparkles size={16} />}
              label="全部标注"
              onClick={() => {}}
              disabled
            />
            <QuickActionButton
              icon={<Layers size={16} />}
              label="LOD预览"
              onClick={() => {}}
              disabled
            />
          </div>
        </Section>

        {/* 文物类别图例 */}
        <Section title="🏺 藏品图例" subtitle="展厅收藏分类" isMobile={isMobile}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {Object.entries(CATEGORY_NAMES).map(([key, name]) => {
              const counts = { bronze: 4, pottery: 3, jade: 3 };
              const colors = {
                bronze: '#8b7355',
                pottery: '#c4723a',
                jade: '#3e9270',
              };
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.035)',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: colors[key as keyof typeof colors],
                      boxShadow: `0 0 12px ${colors[key as keyof typeof colors]}66`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', flex: 1 }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 11, color: '#d4af37', fontWeight: 700 }}>
                    {counts[key as keyof typeof counts]}件
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        <div style={{ height: isMobile ? 40 : 20 }} />
      </div>

      <style>{`
        @keyframes expandMenu {
          from { opacity: 0; transform: scale(0.92) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f5d982, #d4af37);
          cursor: pointer;
          border: 2px solid #1a1a2e;
          box-shadow: 0 2px 12px rgba(212,175,55,0.55);
          transition: transform 200ms;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f5d982, #d4af37);
          cursor: pointer;
          border: 2px solid #1a1a2e;
          box-shadow: 0 2px 12px rgba(212,175,55,0.55);
        }
        @media (max-width: 767px) {
          input[type="range"] {
            height: 10px !important;
          }
          input[type="range"]::-webkit-slider-thumb {
            width: 26px !important;
            height: 26px !important;
          }
        }
      `}</style>
    </>
  );
};

const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isMobile?: boolean;
}> = ({ title, subtitle, children, isMobile }) => (
  <div style={{ marginBottom: isMobile ? 18 : 22 }}>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#d4af37', letterSpacing: 0.4, display: 'flex', alignItems: 'center', gap: 6 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>
          {subtitle}
        </div>
      )}
    </div>
    {children}
  </div>
);

const MenuButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  isMobile?: boolean;
}> = ({ icon, label, onClick, active, disabled, isMobile }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => !disabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={disabled}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: disabled
            ? 'rgba(255,255,255,0.03)'
            : active
            ? 'linear-gradient(135deg, #d4af37, #c8a030)'
            : hovered
            ? 'rgba(212,175,55,0.2)'
            : 'rgba(26,26,46,0.85)',
          backdropFilter: isMobile ? 'none' : 'blur(12px)',
          WebkitBackdropFilter: isMobile ? 'none' : 'blur(12px)',
          border: `1px solid ${disabled
            ? 'rgba(255,255,255,0.05)'
            : active
            ? 'transparent'
            : hovered
            ? 'rgba(212,175,55,0.65)'
            : 'rgba(212,175,55,0.2)'}`,
          color: disabled
            ? 'rgba(255,255,255,0.2)'
            : active
            ? '#1a1a2e'
            : hovered
            ? '#d4af37'
            : 'rgba(255,255,255,0.7)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          boxShadow: active ? '0 4px 18px rgba(212,175,55,0.4)' : 'none',
        }}
      >
        {icon}
      </button>
      {hovered && !isMobile && (
        <div
          style={{
            position: 'absolute',
            left: 56,
            top: '50%',
            transform: 'translateY(-50%)',
            whiteSpace: 'nowrap',
            padding: '7px 14px',
            borderRadius: 10,
            background: 'rgba(26,26,46,0.97)',
            border: '1px solid rgba(212,175,55,0.5)',
            fontSize: 11,
            color: '#fff',
            fontWeight: 500,
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
            animation: 'expandMenu 200ms ease-out',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onClick, active, disabled }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        padding: '14px 10px',
        borderRadius: 12,
        background: disabled
          ? 'rgba(255,255,255,0.025)'
          : active
          ? 'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(212,175,55,0.08))'
          : hovered
          ? 'rgba(255,255,255,0.09)'
          : 'rgba(255,255,255,0.05)',
        border: `1px solid ${disabled
          ? 'rgba(255,255,255,0.05)'
          : active
          ? 'rgba(212,175,55,0.65)'
          : 'rgba(255,255,255,0.09)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        color: disabled
          ? 'rgba(255,255,255,0.2)'
          : active
          ? '#d4af37'
          : 'rgba(255,255,255,0.72)',
        transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        transform: hovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.2 }}>{label}</span>
    </button>
  );
};

export default UIDrawer;
