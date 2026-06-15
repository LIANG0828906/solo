import React, { useState } from 'react';
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

  const inCompareSelection = !isCompareMode && selectedForCompare.length > 0;

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: mobileDrawOpen ? 0 : -(window.innerHeight * 0.55),
        height: '58vh',
        borderTop: '1px solid rgba(212, 175, 55, 0.3)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        transition: 'bottom 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        zIndex: 100,
      }
    : {
        position: 'fixed',
        top: 0,
        right: panelOpen ? 0 : -320,
        bottom: 0,
        width: 300,
        borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
        transition: 'right 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        zIndex: 100,
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
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(26, 26, 46, 0.85)',
            backdropFilter: 'blur(16px)',
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

      {/* 移动端面板切换按钮 */}
      {isMobile && (
        <button
          onClick={() => setMobileDrawOpen(!mobileDrawOpen)}
          style={{
            position: 'fixed',
            right: 16,
            bottom: mobileDrawOpen ? 'calc(58vh - 8px)' : 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4af37, #b8962e)',
            border: 'none',
            color: '#1a1a2e',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(212,175,55,0.4)',
            zIndex: 101,
            transition: 'all 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
        >
          {mobileDrawOpen ? (
            <ChevronRight size={20} strokeWidth={2.2} style={{ transform: 'rotate(-90deg)' }} />
          ) : (
            <ChevronLeft size={20} strokeWidth={2.2} style={{ transform: 'rotate(-90deg)' }} />
          )}
        </button>
      )}

      {/* 桌面端面板切换按钮 */}
      {!isMobile && (
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          style={{
            position: 'fixed',
            right: panelOpen ? 302 : 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 24,
            height: 64,
            background: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRight: panelOpen ? 'none' : '1px solid rgba(212, 175, 55, 0.3)',
            borderLeft: panelOpen ? '1px solid rgba(212, 175, 55, 0.3)' : 'none',
            borderRadius: panelOpen ? '8px 0 0 8px' : '8px 0 0 8px',
            color: '#d4af37',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99,
            transition: 'all 600ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
        >
          {panelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {/* 主面板 */}
      <div
        style={{
          ...panelStyle,
          background: 'rgba(26, 26, 46, 0.92)',
          backdropFilter: 'blur(24px)',
          padding: isMobile ? '16px 20px 28px' : '80px 20px 24px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(212, 175, 55, 0.4)' }} />
          </div>
        )}

        {/* 对比选择模式提示 */}
        {inCompareSelection && (
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: 12,
              padding: '14px 14px',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: '#d4af37', fontWeight: 600, marginBottom: 4 }}>
                  📊 对比模式 · 选择中
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  请在展厅中点击2件文物进行对比
                </div>
              </div>
              <button
                onClick={onExitCompare}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[0, 1].map((idx) => {
                const art = compareArtifacts[idx];
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: 52,
                      borderRadius: 8,
                      background: art ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px dashed ${art ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 8px',
                      textAlign: 'center',
                    }}
                  >
                    {art ? (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#d4af37' }}>
                          {art.name}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
                          {art.era}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        文物 {idx + 1}
                      </span>
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
                padding: '10px 16px',
                borderRadius: 10,
                background: compareArtifacts.length === 2
                  ? 'linear-gradient(135deg, #d4af37, #c8a030)'
                  : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: compareArtifacts.length === 2 ? '#1a1a2e' : 'rgba(255,255,255,0.3)',
                fontSize: 12,
                fontWeight: 600,
                cursor: compareArtifacts.length === 2 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <GitCompareArrows size={14} />
              开始对比
            </button>
          </div>
        )}

        {/* 对比模式控制面板 */}
        {isCompareMode && compareArtifacts.length === 2 && (
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: 14,
              padding: '16px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#d4af37' }}>
                🎞 年代演变对比
              </div>
              <button
                onClick={onExitCompare}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <X size={12} /> 退出
              </button>
            </div>

            {/* 时间轴 */}
            <div
              style={{
                position: 'relative',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                padding: '14px 12px 16px',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: compareArtifacts[0].year < compareArtifacts[1].year ? '#d4af37' : 'rgba(255,255,255,0.6)' }}>
                    {compareArtifacts[0].year < compareArtifacts[1].year ? compareArtifacts[0].name : compareArtifacts[1].name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                    {compareArtifacts[0].year < compareArtifacts[1].year ? compareArtifacts[0].era : compareArtifacts[1].era}
                  </div>
                </div>
                <div style={{ width: 1, background: 'rgba(212,175,55,0.3)', margin: '0 8px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: compareArtifacts[0].year >= compareArtifacts[1].year ? '#d4af37' : 'rgba(255,255,255,0.6)' }}>
                    {compareArtifacts[0].year >= compareArtifacts[1].year ? compareArtifacts[0].name : compareArtifacts[1].name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                    {compareArtifacts[0].year >= compareArtifacts[1].year ? compareArtifacts[0].era : compareArtifacts[1].era}
                  </div>
                </div>
              </div>
            </div>

            {/* 风化程度滑块 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>风化程度模拟</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#d4af37',
                    padding: '2px 10px',
                    borderRadius: 10,
                    background: 'rgba(212, 175, 55, 0.15)',
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
                  height: 6,
                  borderRadius: 3,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${weatheringSlider * 100}%, rgba(255,255,255,0.12) ${weatheringSlider * 100}%, rgba(255,255,255,0.12) 100%)`,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {WeatheringLabels.map(l => (
                  <span
                    key={l.value}
                    style={{
                      fontSize: 9,
                      color: Math.abs(l.value - weatheringSlider) < 0.13 ? '#d4af37' : 'rgba(255,255,255,0.3)',
                      transition: 'color 200ms',
                    }}
                  >
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 光照预设 */}
        <Section title="💡 光照预设" subtitle="选择展厅氛围">
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
                    padding: isMobile ? '10px 12px' : '12px 14px',
                    borderRadius: 12,
                    background: active
                      ? 'linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.08))'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? 'rgba(212, 175, 55, 0.7)' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
                    color: active ? '#d4af37' : 'rgba(255,255,255,0.75)',
                    boxShadow: active ? '0 0 20px rgba(212,175,55,0.12)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = active
                      ? 'rgba(212, 175, 55, 0.7)'
                      : 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: active
                        ? 'linear-gradient(135deg, #d4af37, #c8a030)'
                        : 'rgba(255,255,255,0.06)',
                      color: active ? '#1a1a2e' : 'inherit',
                      transition: 'all 300ms',
                    }}
                  >
                    {getLightingIcon(preset.icon)}
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 500 }}>
                      {preset.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                      {preset.mode === 'daylight' ? '温暖自然' : preset.mode === 'museum' ? '聚焦展品' : '静谧典雅'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 展示模式 */}
        <Section title="🎬 展示模式" subtitle="切换浏览方式">
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 14,
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
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: active ? 'linear-gradient(135deg, #d4af37, #c8a030)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: active ? '#1a1a2e' : 'rgba(255,255,255,0.6)',
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
                background: 'rgba(93, 173, 226, 0.08)',
                border: '1px solid rgba(93, 173, 226, 0.3)',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                  椭圆路径自动环绕
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  360° 欣赏展厅全貌
                </div>
              </div>
              <button
                onClick={() => setIsRoamingPaused(!isRoamingPaused)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: isRoamingPaused
                    ? 'linear-gradient(135deg, #5dade2, #3498db)'
                    : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${isRoamingPaused ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
                  color: isRoamingPaused ? '#fff' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 300ms',
                }}
              >
                {isRoamingPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
              </button>
            </div>
          )}
        </Section>

        {/* 操作快捷按钮 */}
        <Section title="⚡ 快捷操作" subtitle="常用功能">
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 8 }}>
            <QuickActionButton
              icon={<RotateCcw size={15} />}
              label="重置视角"
              onClick={onResetView}
            />
            <QuickActionButton
              icon={<GitCompareArrows size={15} />}
              label={isCompareMode ? '退出对比' : '文物对比'}
              onClick={() => isCompareMode ? onExitCompare() : onStartCompare()}
              active={isCompareMode || inCompareSelection}
            />
            <QuickActionButton
              icon={<Sparkles size={15} />}
              label="全部标注"
              onClick={() => {}}
              disabled
            />
            <QuickActionButton
              icon={<Layers size={15} />}
              label="LOD预览"
              onClick={() => {}}
              disabled
            />
          </div>
        </Section>

        {/* 文物类别图例 */}
        <Section title="🏺 藏品图例" subtitle="展厅收藏分类">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: colors[key as keyof typeof colors],
                      boxShadow: `0 0 8px ${colors[key as keyof typeof colors]}55`,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', flex: 1 }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 11, color: '#d4af37', fontWeight: 600 }}>
                    {counts[key as keyof typeof counts]}件
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        <div style={{ height: 20 }} />
      </div>

      <style>{`
        @keyframes expandMenu {
          from { opacity: 0; transform: scale(0.92) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f5d982, #d4af37);
          cursor: pointer;
          border: 2px solid #1a1a2e;
          box-shadow: 0 2px 10px rgba(212,175,55,0.5);
          transition: transform 200ms;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f5d982, #d4af37);
          cursor: pointer;
          border: 2px solid #1a1a2e;
          box-shadow: 0 2px 10px rgba(212,175,55,0.5);
        }
      `}</style>
    </>
  );
};

const Section: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#d4af37', letterSpacing: 0.3 }}>
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
            ? 'rgba(212,175,55,0.18)'
            : 'rgba(26,26,46,0.85)',
          backdropFilter: isMobile ? 'none' : 'blur(10px)',
          border: `1px solid ${disabled
            ? 'rgba(255,255,255,0.05)'
            : active
            ? 'transparent'
            : hovered
            ? 'rgba(212,175,55,0.6)'
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
          boxShadow: active ? '0 4px 16px rgba(212,175,55,0.35)' : 'none',
        }}
      >
        {icon}
      </button>
      {hovered && !isMobile && (
        <div
          style={{
            position: 'absolute',
            left: 54,
            top: '50%',
            transform: 'translateY(-50%)',
            whiteSpace: 'nowrap',
            padding: '6px 12px',
            borderRadius: 8,
            background: 'rgba(26,26,46,0.95)',
            border: '1px solid rgba(212,175,55,0.4)',
            fontSize: 11,
            color: '#fff',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
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
        padding: '12px 8px',
        borderRadius: 10,
        background: disabled
          ? 'rgba(255,255,255,0.02)'
          : active
          ? 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.08))'
          : hovered
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${disabled
          ? 'rgba(255,255,255,0.05)'
          : active
          ? 'rgba(212,175,55,0.6)'
          : 'rgba(255,255,255,0.08)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        color: disabled
          ? 'rgba(255,255,255,0.2)'
          : active
          ? '#d4af37'
          : 'rgba(255,255,255,0.7)',
        transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
        transform: hovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
    </button>
  );
};

export default UIDrawer;
