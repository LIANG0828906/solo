import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ThemePreset } from '../theme/presets';

export type BlockType = 'fullscreen-banner' | 'three-column' | 'card-grid' | 'quote-block' | 'product-carousel' | 'footer';
export type AnimationType = 'fade-in' | 'slide-left' | 'fly-up' | 'scale-in';

export interface BlockConfig {
  id: string;
  type: BlockType;
  bgColor: string;
  bgImageUrl: string;
  parallaxSpeed: number;
  initialOpacity: number;
  animationType: AnimationType;
  order: number;
}

export const BLOCK_TYPE_INFO: Record<BlockType, { label: string; icon: string; defaultBg: string }> = {
  'fullscreen-banner': { label: '全屏Banner', icon: '🖼', defaultBg: '#1a1a2e' },
  'three-column': { label: '三列图文', icon: '📋', defaultBg: '#ffffff' },
  'card-grid': { label: '卡片网格', icon: '🔲', defaultBg: '#f8fafc' },
  'quote-block': { label: '引用块', icon: '❝', defaultBg: '#f1f5f9' },
  'product-carousel': { label: '产品轮播', icon: '🎠', defaultBg: '#ffffff' },
  'footer': { label: '页脚', icon: '📎', defaultBg: '#111827' },
};

const ANIMATION_OPTIONS: { value: AnimationType; label: string }[] = [
  { value: 'fade-in', label: '淡入' },
  { value: 'slide-left', label: '从左滑入' },
  { value: 'fly-up', label: '从下方飞入' },
  { value: 'scale-in', label: '缩放出现' },
];

function createBlock(type: BlockType, order: number): BlockConfig {
  const info = BLOCK_TYPE_INFO[type];
  return {
    id: uuidv4(),
    type,
    bgColor: info.defaultBg,
    bgImageUrl: '',
    parallaxSpeed: 0,
    initialOpacity: 1,
    animationType: 'fade-in',
    order,
  };
}

interface LeftPanelProps {
  blocks: BlockConfig[];
  onAddBlock: (type: BlockType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  theme: ThemePreset;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ blocks, onAddBlock, collapsed, onToggleCollapse, theme }) => {
  const maxReached = blocks.length >= 6;

  return (
    <div
      style={{
        width: collapsed ? 56 : 240,
        minWidth: collapsed ? 56 : 240,
        height: '100%',
        background: theme.background,
        borderRight: `1px solid ${theme.accent}22`,
        transition: 'width 0.3s ease, min-width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={() => { if (collapsed) onToggleCollapse(); }}
    >
      <div style={{
        padding: collapsed ? 12 : 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${theme.accent}22`,
        minHeight: 52,
      }}>
        {!collapsed && (
          <span style={{ color: theme.text, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
            区块类型
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          style={{
            background: 'none',
            border: 'none',
            color: theme.text,
            cursor: 'pointer',
            fontSize: 16,
            padding: 4,
            borderRadius: 4,
            lineHeight: 1,
          }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: collapsed ? 8 : 8 }}>
        {(Object.entries(BLOCK_TYPE_INFO) as [BlockType, typeof BLOCK_TYPE_INFO[BlockType]][]).map(([type, info]) => (
          <div
            key={type}
            onClick={() => { if (!maxReached) onAddBlock(type); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? 10 : '10px 12px',
              borderRadius: 8,
              cursor: maxReached ? 'not-allowed' : 'pointer',
              opacity: maxReached ? 0.4 : 1,
              marginBottom: 4,
              transition: 'background 0.2s, gap 0.3s, padding 0.3s',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: 'transparent',
            }}
            onMouseEnter={(e) => { if (!maxReached) e.currentTarget.style.background = `${theme.accent}18`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{info.icon}</span>
            {!collapsed && (
              <span style={{ color: theme.text, fontSize: 13, whiteSpace: 'nowrap' }}>{info.label}</span>
            )}
          </div>
        ))}
      </div>
      {maxReached && !collapsed && (
        <div style={{ padding: '8px 12px', color: theme.accent, fontSize: 11, textAlign: 'center' }}>
          已达最大区块数 (6)
        </div>
      )}
    </div>
  );
};

interface RightPanelProps {
  selectedBlock: BlockConfig | null;
  onUpdateBlock: (id: string, updates: Partial<BlockConfig>) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  theme: ThemePreset;
}

const RightPanel: React.FC<RightPanelProps> = ({ selectedBlock, onUpdateBlock, onRemoveBlock, onMoveBlock, theme }) => {
  if (!selectedBlock) {
    return (
      <div style={{
        width: 280,
        minWidth: 280,
        height: '100%',
        background: theme.background,
        borderLeft: `1px solid ${theme.accent}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.text,
        opacity: 0.5,
        fontSize: 13,
      }}>
        点击区块以编辑参数
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.accent}33`,
    background: `${theme.background}`,
    color: theme.text,
    fontSize: 13,
    outline: 'none',
    boxShadow: `0 1px 3px ${theme.accent}11`,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    color: theme.text,
    opacity: 0.7,
    marginBottom: 4,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  };

  return (
    <div style={{
      width: 280,
      minWidth: 280,
      height: '100%',
      background: theme.background,
      borderLeft: `1px solid ${theme.accent}22`,
      overflowY: 'auto',
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <span style={{ color: theme.text, fontWeight: 700, fontSize: 14 }}>
          {BLOCK_TYPE_INFO[selectedBlock.type].icon} {BLOCK_TYPE_INFO[selectedBlock.type].label}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onMoveBlock(selectedBlock.id, 'up')}
            style={{ background: `${theme.accent}18`, border: 'none', color: theme.text, cursor: 'pointer', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
            title="上移"
          >↑</button>
          <button
            onClick={() => onMoveBlock(selectedBlock.id, 'down')}
            style={{ background: `${theme.accent}18`, border: 'none', color: theme.text, cursor: 'pointer', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
            title="下移"
          >↓</button>
          <button
            onClick={() => onRemoveBlock(selectedBlock.id)}
            style={{ background: '#ef444433', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
            title="删除"
          >✕</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>背景颜色</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={selectedBlock.bgColor}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { bgColor: e.target.value })}
              style={{ width: 40, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2 }}
            />
            <input
              type="text"
              value={selectedBlock.bgColor}
              onChange={(e) => onUpdateBlock(selectedBlock.id, { bgColor: e.target.value })}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>背景图片URL</label>
          <input
            type="text"
            value={selectedBlock.bgImageUrl}
            onChange={(e) => onUpdateBlock(selectedBlock.id, { bgImageUrl: e.target.value })}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>视差滚动速度 ({selectedBlock.parallaxSpeed.toFixed(2)})</label>
          <input
            type="range"
            min={-0.5}
            max={0.5}
            step={0.01}
            value={selectedBlock.parallaxSpeed}
            onChange={(e) => onUpdateBlock(selectedBlock.id, { parallaxSpeed: parseFloat(e.target.value) })}
            style={{
              width: '100%',
              accentColor: theme.accent,
              height: 6,
              borderRadius: 3,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.text, opacity: 0.5, marginTop: 2 }}>
            <span>-0.5 向后</span><span>0</span><span>+0.5 向前</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>初始透明度 ({selectedBlock.initialOpacity.toFixed(2)})</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={selectedBlock.initialOpacity}
            onChange={(e) => onUpdateBlock(selectedBlock.id, { initialOpacity: parseFloat(e.target.value) })}
            style={{
              width: '100%',
              accentColor: theme.accent,
              height: 6,
              borderRadius: 3,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.text, opacity: 0.5, marginTop: 2 }}>
            <span>0</span><span>1</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>进入动画类型</label>
          <select
            value={selectedBlock.animationType}
            onChange={(e) => onUpdateBlock(selectedBlock.id, { animationType: e.target.value as AnimationType })}
            style={{
              ...inputStyle,
              appearance: 'none' as any,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='${encodeURIComponent(theme.text)}' stroke-width='1.5'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: 32,
            }}
          >
            {ANIMATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

interface BlockEditorProps {
  blocks: BlockConfig[];
  onBlocksChange: (blocks: BlockConfig[]) => void;
  selectedBlockId: string | null;
  onSelectedBlockIdChange: (id: string | null) => void;
  theme: ThemePreset;
  leftCollapsed: boolean;
  onToggleLeftCollapse: () => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onBlocksChange,
  selectedBlockId,
  onSelectedBlockIdChange,
  theme,
  leftCollapsed,
  onToggleLeftCollapse,
}) => {
  const handleAddBlock = useCallback((type: BlockType) => {
    if (blocks.length >= 6) return;
    const newBlock = createBlock(type, blocks.length);
    onBlocksChange([...blocks, newBlock]);
    onSelectedBlockIdChange(newBlock.id);
  }, [blocks, onBlocksChange, onSelectedBlockIdChange]);

  const handleUpdateBlock = useCallback((id: string, updates: Partial<BlockConfig>) => {
    onBlocksChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [blocks, onBlocksChange]);

  const handleRemoveBlock = useCallback((id: string) => {
    const filtered = blocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i }));
    onBlocksChange(filtered);
    if (selectedBlockId === id) {
      onSelectedBlockIdChange(filtered.length > 0 ? filtered[0].id : null);
    }
  }, [blocks, selectedBlockId, onBlocksChange, onSelectedBlockIdChange]);

  const handleMoveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[idx];
    newBlocks[idx] = newBlocks[swapIdx];
    newBlocks[swapIdx] = temp;
    onBlocksChange(newBlocks.map((b, i) => ({ ...b, order: i })));
  }, [blocks, onBlocksChange]);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  return {
    LeftPanel: (
      <LeftPanel
        blocks={blocks}
        onAddBlock={handleAddBlock}
        collapsed={leftCollapsed}
        onToggleCollapse={onToggleLeftCollapse}
        theme={theme}
      />
    ),
    RightPanel: (
      <RightPanel
        selectedBlock={selectedBlock}
        onUpdateBlock={handleUpdateBlock}
        onRemoveBlock={handleRemoveBlock}
        onMoveBlock={handleMoveBlock}
        theme={theme}
      />
    ),
  };
};

export default BlockEditor;
