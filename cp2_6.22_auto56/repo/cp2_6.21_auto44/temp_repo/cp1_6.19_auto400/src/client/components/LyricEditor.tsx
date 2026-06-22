import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LyricBlock } from '../types';
import { useSongStore } from '../store/useSongStore';

interface LyricEditorProps {
  lyricBlocks: LyricBlock[];
  onMeasureClick: (measureIndex: number) => void;
  currentMeasure: number;
  rowHeight: number;
}

export const LyricEditor: React.FC<LyricEditorProps> = ({
  lyricBlocks,
  onMeasureClick,
  currentMeasure,
  rowHeight
}) => {
  const { updateLyric, sendCursorPosition, currentSong } = useSongStore();
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [boldMode, setBoldMode] = useState(false);
  const [italicMode, setItalicMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleContentChange = useCallback((blockId: string, content: string) => {
    updateLyric(blockId, content, { bold: boldMode, italic: italicMode });
  }, [updateLyric, boldMode, italicMode]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, block: LyricBlock) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        setBoldMode(prev => !prev);
      } else if (e.key === 'i') {
        e.preventDefault();
        setItalicMode(prev => !prev);
      } else if (e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useSongStore.getState().redo();
        } else {
          useSongStore.getState().undo();
        }
      }
    }
  }, []);

  const handleFocus = useCallback((block: LyricBlock, position: number) => {
    setActiveBlock(block.id);
    onMeasureClick(block.measureIndex);
    sendCursorPosition(block.measureIndex, position, 'lyric');
  }, [onMeasureClick, sendCursorPosition]);

  const renderContent = (block: LyricBlock) => {
    const style: React.CSSProperties = {
      fontWeight: block.formatting.bold ? 'bold' : 'normal',
      fontStyle: block.formatting.italic ? 'italic' : 'normal'
    };

    return block.content || (
      <span style={{ color: 'var(--text-secondary)', ...style }}>
        在此输入歌词...
      </span>
    );
  };

  useEffect(() => {
    const sortedBlocks = [...lyricBlocks].sort((a, b) => a.measureIndex - b.measureIndex);
    const maxIndex = Math.max(...sortedBlocks.map(b => b.measureIndex), 0);
    
    for (let i = sortedBlocks.length; i <= maxIndex; i++) {
      if (!sortedBlocks.find(b => b.measureIndex === i)) {
        // 缺失的小节会在chord添加时自动创建
      }
    }
  }, [lyricBlocks]);

  const displayBlocks = [...lyricBlocks]
    .sort((a, b) => a.measureIndex - b.measureIndex);

  return (
    <div
      ref={editorRef}
      className="lyric-editor"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        fontFamily: 'var(--font-mono)',
        fontSize: '14px',
        lineHeight: '1.6'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 0',
          borderBottom: '1px solid var(--border)',
          marginBottom: '16px'
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          格式：
        </span>
        <button
          className={`btn btn-ghost ${boldMode ? 'active' : ''}`}
          style={{
            padding: '6px 12px',
            fontWeight: boldMode ? 'bold' : 'normal',
            border: boldMode ? '1px solid var(--accent)' : '1px solid transparent',
            background: boldMode ? 'var(--accent-light)' : 'transparent'
          }}
          onClick={() => setBoldMode(prev => !prev)}
          title="Ctrl+B"
        >
          B
        </button>
        <button
          className={`btn btn-ghost ${italicMode ? 'active' : ''}`}
          style={{
            padding: '6px 12px',
            fontStyle: italicMode ? 'italic' : 'normal',
            border: italicMode ? '1px solid var(--accent)' : '1px solid transparent',
            background: italicMode ? 'var(--accent-light)' : 'transparent'
          }}
          onClick={() => setItalicMode(prev => !prev)}
          title="Ctrl+I"
        >
          I
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Ctrl+Z 撤销 | Ctrl+Shift+Z 重做
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {displayBlocks.map((block, index) => (
          <div
            key={block.id}
            style={{
              minHeight: `${rowHeight}px`,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              borderRadius: 'var(--radius-sm)',
              background: currentMeasure === block.measureIndex
                ? 'var(--bg-highlight)'
                : 'transparent',
              transition: 'background var(--transition-fast)',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)'
            }}
            onClick={() => handleFocus(block, 0)}
          >
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                minWidth: '30px',
                paddingTop: '2px',
                userSelect: 'none'
              }}
            >
              {block.measureIndex + 1}.
            </div>
            <div
              style={{
                flex: 1,
                outline: 'none',
                minHeight: '24px',
                fontWeight: block.formatting.bold ? 'bold' : 'normal',
                fontStyle: block.formatting.italic ? 'italic' : 'normal'
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => handleContentChange(block.id, e.currentTarget.textContent || '')}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onFocus={() => handleFocus(block, 0)}
              onClick={(e) => e.stopPropagation()}
            >
              {renderContent(block)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LyricEditor;
