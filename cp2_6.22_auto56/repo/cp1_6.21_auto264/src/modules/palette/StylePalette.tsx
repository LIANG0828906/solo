import React, { useMemo } from 'react';
import { Bold, Italic, Underline, Trash2, RotateCcw, Palette } from 'lucide-react';
import { useStyleStore } from '../../store/useStyleStore';
import ColorPicker from './ColorPicker';
import type { KeywordStyle } from '../../types';

const StyledKeywordTag: React.FC<{
  style: KeywordStyle;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}> = ({ style, isActive, onClick, onRemove }) => {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border ${
        isActive
          ? 'bg-accent/10 border-accent'
          : 'bg-app-bg/50 border-transparent hover:bg-app-bg hover:border-border-primary'
      }`}
    >
      <span
        className="code-font text-sm truncate flex-1"
        style={{
          color: style.color,
          fontWeight: style.bold ? 700 : 400,
          fontStyle: style.italic ? 'italic' : 'normal',
          textDecoration: style.underline ? 'underline' : 'none',
        }}
      >
        {style.text.replace(/\n/g, '\\n')}
      </span>
      <div
        className="w-4 h-4 rounded flex-shrink-0 border border-border-secondary"
        style={{ backgroundColor: style.color }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-text-secondary hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const StylePalette: React.FC = () => {
  const {
    selectedRange,
    code,
    styles,
    currentColor,
    getSelectedStyle,
    updateCurrentSelectionStyle,
    removeStyle,
    clearStyles,
    resetToDefault,
    setSelectedRange,
  } = useStyleStore();

  const selectedStyle = useMemo(() => getSelectedStyle(), [getSelectedStyle, selectedRange]);

  const selectedText = useMemo(() => {
    if (!selectedRange) return '';
    return code.slice(selectedRange.start, selectedRange.end);
  }, [code, selectedRange]);

  const previewStyle = useMemo(() => {
    if (selectedStyle) {
      return {
        color: selectedStyle.color,
        fontWeight: selectedStyle.bold ? 700 : 500,
        fontStyle: selectedStyle.italic ? 'italic' : 'normal',
        textDecoration: selectedStyle.underline ? 'underline' : 'none',
      };
    }
    return {
      color: currentColor,
      fontWeight: 500,
      fontStyle: 'normal' as const,
      textDecoration: 'none' as const,
    };
  }, [selectedStyle, currentColor]);

  const toggleStyle = (key: 'bold' | 'italic' | 'underline') => {
    if (!selectedRange) return;
    const current = selectedStyle?.[key] ?? false;
    updateCurrentSelectionStyle({ [key]: !current });
  };

  const sortedStyles = useMemo(() => {
    return [...styles].sort((a, b) => a.start - b.start);
  }, [styles]);

  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-panel-bg"
      style={{ borderLeft: '1px solid #334155' }}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="bg-app-bg rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">关键字预览</h3>
          </div>

          <div
            className="rounded-xl p-4 min-h-[72px] flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid #334155',
            }}
          >
            {selectedRange && selectedText ? (
              <span className="code-font text-lg break-all text-center" style={previewStyle}>
                {selectedText || '选择关键字'}
              </span>
            ) : (
              <span className="code-font text-sm text-text-secondary text-center">
                {styles.length > 0
                  ? `已配置 ${styles.length} 个关键字样式`
                  : '在左侧代码编辑器中拖拽选择关键字'}
              </span>
            )}
          </div>

          {selectedRange && (
            <div className="mt-4">
              <p className="text-xs text-text-secondary mb-2 font-medium">字体修饰</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStyle('bold')}
                  className={`toolbar-button flex-1 h-10 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium border transition-all ${
                    previewStyle.fontWeight === 700
                      ? 'bg-accent text-white border-accent'
                      : 'bg-app-bg text-text-primary border-border-primary hover:border-border-secondary'
                  }`}
                >
                  <Bold size={16} />
                  <span className="font-bold">B</span>
                </button>
                <button
                  onClick={() => toggleStyle('italic')}
                  className={`toolbar-button flex-1 h-10 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium border transition-all ${
                    previewStyle.fontStyle === 'italic'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-app-bg text-text-primary border-border-primary hover:border-border-secondary'
                  }`}
                >
                  <Italic size={16} />
                  <span className="italic">I</span>
                </button>
                <button
                  onClick={() => toggleStyle('underline')}
                  className={`toolbar-button flex-1 h-10 rounded-lg flex items-center justify-center gap-1.5 text-sm font-medium border transition-all ${
                    previewStyle.textDecoration === 'underline'
                      ? 'bg-accent text-white border-accent'
                      : 'bg-app-bg text-text-primary border-border-primary hover:border-border-secondary'
                  }`}
                >
                  <Underline size={16} />
                  <span className="underline">U</span>
                </button>
              </div>
              {selectedStyle && (
                <button
                  onClick={() => {
                    removeStyle(selectedStyle.start, selectedStyle.end);
                  }}
                  className="mt-2 w-full py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} />
                  移除此关键字的样式
                </button>
              )}
            </div>
          )}
        </div>

        <ColorPicker />

        {sortedStyles.length > 0 && (
          <div className="bg-app-bg rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full bg-accent"
                  style={{ boxShadow: `0 0 8px ${currentColor}` }}
                />
                已配置样式 ({sortedStyles.length})
              </h3>
              <button
                onClick={clearStyles}
                className="text-xs text-text-secondary hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
              >
                全部清除
              </button>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {sortedStyles.map((s) => (
                <StyledKeywordTag
                  key={`${s.start}-${s.end}`}
                  style={s}
                  isActive={
                    selectedRange?.start === s.start && selectedRange?.end === s.end
                  }
                  onClick={() => {
                    setSelectedRange({ start: s.start, end: s.end });
                  }}
                  onRemove={() => removeStyle(s.start, s.end)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border-primary bg-panel-bg/80 backdrop-blur">
        <button
          onClick={resetToDefault}
          className="w-full py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-lg border border-border-secondary hover:border-border-primary transition-all flex items-center justify-center gap-2 group"
        >
          <RotateCcw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
          重置为默认示例
        </button>
      </div>
    </div>
  );
};

export default React.memo(StylePalette);
