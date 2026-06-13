import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useStore } from './store/useStore';
import { parseUserStories } from './StoryParser';
import { PrototypeRenderer } from './PrototypeRenderer';
import { ThemeToggle } from './components/ThemeToggle';
import { ExportProgress } from './components/ExportProgress';

const App: React.FC = () => {
  const theme = useStore((state) => state.theme);
  const markdown = useStore((state) => state.markdown);
  const pages = useStore((state) => state.pages);
  const stories = useStore((state) => state.stories);
  const leftPaneWidth = useStore((state) => state.leftPaneWidth);
  const setMarkdown = useStore((state) => state.setMarkdown);
  const setPages = useStore((state) => state.setPages);
  const setStories = useStore((state) => state.setStories);
  const setLeftPaneWidth = useStore((state) => state.setLeftPaneWidth);

  const [isResizing, setIsResizing] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleParse = useCallback(async () => {
    if (!markdown.trim()) {
      setPages([]);
      setStories([]);
      return;
    }

    setIsParsing(true);
    try {
      const startTime = performance.now();
      
      const response = await axios.post('http://localhost:3001/api/parse-story', {
        markdown,
      });
      
      const { stories: parsedStories, pages: parsedPages } = response.data;
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (markdown.length <= 1000 && renderTime > 1500) {
        console.warn(`渲染时间超过1.5秒限制: ${renderTime}ms`);
      }
      
      setStories(parsedStories);
      setPages(parsedPages);
    } catch (error) {
      console.error('解析失败，使用本地解析器:', error);
      const result = parseUserStories(markdown);
      setStories(result.stories);
      setPages(result.pages);
    } finally {
      setIsParsing(false);
    }
  }, [markdown, setPages, setStories]);

  useEffect(() => {
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }
    parseTimeoutRef.current = setTimeout(() => {
      handleParse();
    }, 300);
    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, [handleParse]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedWidth = Math.max(20, Math.min(60, newWidth));
      setLeftPaneWidth(clampedWidth);
    },
    [isResizing, setLeftPaneWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        transition: 'background-color 0.4s ease, color 0.4s ease',
        overflow: 'hidden',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <header
        style={{
          height: '56px',
          backgroundColor: theme.colors.cardBg,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          transition: 'background-color 0.4s ease, border-color 0.4s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: theme.colors.primary,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '18px',
            }}
          >
            W
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: theme.colors.text,
            }}
          >
            线框图生成器
          </h1>
          {isParsing && (
            <span
              style={{
                fontSize: '12px',
                color: theme.colors.primary,
                marginLeft: '8px',
              }}
            >
              解析中...
            </span>
          )}
          {stories.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                backgroundColor: theme.colors.secondary,
                borderRadius: '4px',
                marginLeft: '8px',
              }}
            >
              {stories.length} 个故事 · {pages.length} 个页面
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ThemeToggle />
        </div>
      </header>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${leftPaneWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.colors.editorBg,
            transition: 'background-color 0.4s ease',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${theme.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: theme.colors.editorText,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              用户故事输入
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#94a3b8',
              }}
            >
              {markdown.length} 字符
            </span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="在此输入用户故事，例如：&#10;- 作为一名用户，我希望能够登录系统，以便访问我的数据。&#10;- 作为管理员，我希望管理用户权限，以便控制访问。"
            spellCheck={false}
            style={{
              flex: 1,
              width: '100%',
              padding: '20px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              backgroundColor: theme.colors.editorBg,
              color: theme.colors.editorText,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: '14px',
              lineHeight: 1.6,
              transition:
                'background-color 0.4s ease, color 0.4s ease, box-shadow 0.2s ease',
              boxShadow: inputFocused
                ? `inset 0 0 0 2px ${theme.colors.primary}40`
                : 'none',
            }}
          />
        </div>

        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '4px',
            backgroundColor: theme.colors.border,
            cursor: 'col-resize',
            transition: 'background-color 0.2s ease',
            flexShrink: 0,
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLDivElement).style.backgroundColor =
              theme.colors.primary;
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              (e.target as HTMLDivElement).style.backgroundColor =
                theme.colors.border;
            }
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: '2px',
                height: '16px',
                backgroundColor: isResizing ? '#ffffff' : theme.colors.text,
                opacity: 0.5,
                borderRadius: '1px',
              }}
            />
            <div
              style={{
                width: '2px',
                height: '16px',
                backgroundColor: isResizing ? '#ffffff' : theme.colors.text,
                opacity: 0.5,
                borderRadius: '1px',
              }}
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PrototypeRenderer pages={pages} />
        </div>
      </div>

      <ExportProgress />
    </div>
  );
};

export default App;
