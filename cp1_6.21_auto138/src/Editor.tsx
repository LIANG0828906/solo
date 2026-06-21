import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import * as Diff from 'diff';
import { useWeeklyReport, USERS, Entry, User } from './context';

const getUserById = (userId: string): User => {
  return USERS.find(u => u.id === userId) || USERS[0];
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic',
  'list', 'bullet'
];

const Editor: React.FC = () => {
  const { currentUser, entries, addEntry, fetchEntries, showError } = useWeeklyReport();
  const [content, setContent] = useState<string>('<p>在这里开始编写本周的工作内容...</p>');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isWindowSmall, setIsWindowSmall] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightedDiff, setHighlightedDiff] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const quillRef = useRef<ReactQuill | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastContentRef = useRef<string>(content);

  useEffect(() => {
    const handleResize = () => {
      setIsWindowSmall(window.innerWidth < 900);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (content !== lastContentRef.current && content.trim() !== '' && content !== '<p><br></p>') {
        handleSave();
      }
    }, 60000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [content]);

  const handleSave = useCallback(async () => {
    if (!content || content === '<p><br></p>' || content.trim() === '') return;
    setIsSaving(true);
    const result = await addEntry(content);
    if (result) {
      lastContentRef.current = content;
    }
    setIsSaving(false);
  }, [content, addEntry]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setHighlightedDiff(null);
  };

  const handleSelectionChange = (range: any) => {
    if (range && quillRef.current && editorContainerRef.current) {
      const quill = quillRef.current.getEditor();
      const bounds = quill.getBounds(range.index);
      const containerRect = editorContainerRef.current.getBoundingClientRect();
      setCursorPosition({
        x: bounds.left,
        y: bounds.top - containerRect.top
      });
    }
  };

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleRollback = async (entry: Entry) => {
    const oldContent = entry.content;
    const currentPlain = stripHtml(content);
    const oldPlain = stripHtml(oldContent);

    const diff = Diff.diffLines(currentPlain, oldPlain);
    let highlightedHtml = '';
    diff.forEach((part: any) => {
      if (part.added) {
        highlightedHtml += `<span class="diff-highlight">${part.value}</span>`;
      } else if (part.removed) {
        highlightedHtml += `<span style="text-decoration: line-through; color: #EF4444;">${part.value}</span>`;
      } else {
        highlightedHtml += part.value;
      }
    });

    setHighlightedDiff(highlightedHtml);
    setContent(oldContent);

    setTimeout(() => setHighlightedDiff(null), 3000);
  };

  const recentEntries = entries.slice(0, 20);

  return (
    <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 64px)', position: 'relative' }}>
      {isWindowSmall && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#3B82F6',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>
      )}

      <div
        ref={editorContainerRef}
        style={{
          flexGrow: 1,
          minHeight: '600px',
          backgroundColor: '#FAFAFA',
          margin: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {cursorPosition && (
          <div
            style={{
              position: 'absolute',
              left: cursorPosition.x + 24,
              top: cursorPosition.y + 60,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: currentUser.color,
              opacity: 0.7,
              pointerEvents: 'none',
              zIndex: 10,
              transition: 'all 100ms ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: 'white',
              fontWeight: 700,
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
        )}

        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={handleContentChange}
          onSelectionChange={handleSelectionChange}
          modules={modules}
          formats={formats}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        />

        {highlightedDiff && (
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '24px',
              right: '24px',
              backgroundColor: 'rgba(254, 243, 199, 0.95)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #FCD34D',
              fontSize: '14px',
              lineHeight: '1.8',
              zIndex: 5,
              maxHeight: '400px',
              overflow: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: highlightedDiff }}
          />
        )}
      </div>

      <div
        className={`sidebar-panel ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: '300px',
          backgroundColor: '#F8FAFC',
          borderLeft: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#3B82F6',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = '#2563EB';
            }}
            onMouseLeave={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = '#3B82F6';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            {isSaving ? '保存中...' : '保存周报'}
          </button>
          <p style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#64748B',
            textAlign: 'center',
          }}>
            每60秒自动保存一次
          </p>
        </div>

        <div style={{ padding: '16px 20px 8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>
            历史记录
          </h3>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            最近 {recentEntries.length} 条编辑记录
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
          {recentEntries.length === 0 ? (
            <div style={{
              padding: '40px 16px',
              textAlign: 'center',
              color: '#94A3B8',
              fontSize: '13px',
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <p>暂无历史记录</p>
              <p style={{ marginTop: '4px', fontSize: '12px' }}>保存周报后将显示在这里</p>
            </div>
          ) : (
            recentEntries.map((entry) => {
              const user = getUserById(entry.userId);
              return (
                <div
                  key={entry.id}
                  onClick={() => handleRollback(entry)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 200ms ease-in-out',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#BFDBFE';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: user.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '8px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                      {user.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 'auto' }}>
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#64748B',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {entry.summary || stripHtml(entry.content).substring(0, 30) + '...'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
