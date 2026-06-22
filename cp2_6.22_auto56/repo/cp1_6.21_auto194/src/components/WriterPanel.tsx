import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditor } from '../context/EditorContext';
import { FONT_STACK, ANIMATION, LAYOUT, DARK_COLORS, LIGHT_COLORS } from '../constants';

const WriterPanel: React.FC = () => {
  const { text, setText, setCursorPosition, updateStatsOnKeystroke, theme } = useEditor();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [glowActive, setGlowActive] = useState(false);
  const glowTimerRef = useRef<number | null>(null);

  const themeColors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const triggerGlow = useCallback(() => {
    setGlowActive(true);
    if (glowTimerRef.current !== null) {
      window.clearTimeout(glowTimerRef.current);
    }
    glowTimerRef.current = window.setTimeout(() => {
      setGlowActive(false);
    }, ANIMATION.glowDuration);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isContentKey =
      e.key.length === 1 ||
      e.key === 'Backspace' ||
      e.key === 'Enter' ||
      e.key === 'Delete' ||
      e.key === 'Tab';

    if (isContentKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      updateStatsOnKeystroke();
      triggerGlow();
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const updatePos = () => {
      setCursorPosition(textarea.selectionStart);
    };

    textarea.addEventListener('click', updatePos);
    textarea.addEventListener('select', updatePos);
    return () => {
      textarea.removeEventListener('click', updatePos);
      textarea.removeEventListener('select', updatePos);
    };
  }, [setCursorPosition]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (text === '' || document.activeElement !== textarea) {
      textarea.focus();
    }
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: LAYOUT.topPadding,
        paddingBottom: LAYOUT.bottomPadding,
        paddingLeft: `clamp(${LAYOUT.mobileSidePadding}px, 5vw, ${LAYOUT.sidePadding}px)`,
        paddingRight: `clamp(${LAYOUT.mobileSidePadding}px, 5vw, ${LAYOUT.sidePadding}px)`,
        zIndex: 10,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: '1100px',
          borderRadius: '16px',
          backgroundColor: themeColors.textareaBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: glowActive
            ? `0 0 20px ${themeColors.glow}, inset 0 0 30px ${themeColors.glow}`
            : `0 4px 30px rgba(0,0,0,0.2)`,
          transition: `box-shadow ${ANIMATION.glowDuration}ms ease-out`,
          overflow: 'hidden',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="夜色静谧，星海无垠。开始你的文字远航…"
          style={{
            width: '100%',
            height: '100%',
            padding: '32px 40px',
            boxSizing: 'border-box',
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            fontFamily: FONT_STACK,
            fontSize: '18px',
            lineHeight: '1.8',
            color: themeColors.text,
            caretColor: themeColors.cursor,
            scrollbarWidth: 'thin',
            scrollbarColor: `${themeColors.cursor} transparent`,
          }}
        />
        <style>{`
          textarea::-webkit-scrollbar {
            width: 6px;
          }
          textarea::-webkit-scrollbar-track {
            background: transparent;
          }
          textarea::-webkit-scrollbar-thumb {
            background: ${themeColors.cursor};
            border-radius: 3px;
            opacity: 0.3;
          }
          textarea::placeholder {
            color: ${themeColors.cursor};
            opacity: 0.5;
          }
          @keyframes caret-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default WriterPanel;
