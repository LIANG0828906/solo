import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Highlight,
  Comment,
  User,
  HighlightRange,
  HighlightColor,
  HIGHLIGHT_COLOR_LIST,
  HIGHLIGHT_COLORS,
} from '../types';
import { useAppStore } from '../store';
import { highlightEngine } from '../highlightEngine';
import { Send, X } from 'lucide-react';

interface PendingSelection {
  range: HighlightRange;
  position: { x: number; y: number };
}

interface ActiveCommentPopup {
  highlightId: string;
  position: { x: number; y: number };
  visible: boolean;
}

function parseMarkdown(md: string): string {
  let html = md
    .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType = 'ul';

  for (const line of lines) {
    if (/^[-*] (.*)$/.test(line)) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(line.replace(/^[-*] (.*)$/, '<li>$1</li>'));
    } else if (/^\d+\. (.*)$/.test(line)) {
      if (!inList) {
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push(line.replace(/^\d+\. (.*)$/, '<li>$1</li>'));
    } else {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }
      if (line.trim() === '') {
        result.push('<p></p>');
      } else if (!/^<(h[1-6]|\/)/.test(line)) {
        result.push(`<p>${line}</p>`);
      } else {
        result.push(line);
      }
    }
  }
  if (inList) result.push(`</${listType}>`);

  return result.join('\n');
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const Editor: React.FC = () => {
  const documentContent = useAppStore((s) => s.documentContent);
  const highlights = useAppStore((s) => s.highlights);
  const comments = useAppStore((s) => s.comments);
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const addHighlight = useAppStore((s) => s.addHighlight);
  const addComment = useAppStore((s) => s.addComment);
  const activeHighlightId = useAppStore((s) => s.activeHighlightId);
  const setActiveHighlightId = useAppStore((s) => s.setActiveHighlightId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  const [activeCommentPopup, setActiveCommentPopup] = useState<ActiveCommentPopup | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const renderKey = useRef(0);
  const isSelecting = useRef(false);

  const allUsers = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) map.set(u.id, u);
    if (!map.has(currentUser.id)) map.set(currentUser.id, currentUser);
    return map;
  }, [users, currentUser]);

  const sortedHighlights = useMemo(() => {
    return [...highlights].sort((a, b) => a.range.startOffset - b.range.startOffset);
  }, [highlights]);

  const commentsByHighlight = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!map.has(c.highlightId)) map.set(c.highlightId, []);
      map.get(c.highlightId)!.push(c);
    }
    return map;
  }, [comments]);

  const getHighlightClass = (hl: Highlight): string => {
    const isRemote = hl.userId !== currentUser.id;
    return [
      'highlight-span',
      `hl-${hl.color}`,
      isRemote ? 'highlight-remote' : '',
      isRemote ? `border-${hl.color}` : '',
      activeHighlightId === hl.id ? 'active' : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const renderHighlightContent = useCallback(
    (hl: Highlight, text: string): React.ReactNode => {
      const user = allUsers.get(hl.userId);
      const isRemote = hl.userId !== currentUser.id;
      const hlComments = commentsByHighlight.get(hl.id) ?? [];

      return (
        <>
          {text}
          {isRemote && user && <span className="user-tooltip">{user.nickname}</span>}
          {hlComments.length > 0 && (
            <span className="comments-list">
              {hlComments.map((cmt) => {
                const cmtUser = allUsers.get(cmt.userId);
                return (
                  <div className="comment-bubble comment-popup-enter" key={cmt.id}>
                    <div className="comment-bubble-header">
                      <span
                        className="comment-avatar"
                        style={{ background: cmtUser?.color ?? '#999' }}
                      >
                        {cmtUser?.nickname?.charAt(0) ?? '?'}
                      </span>
                      <span className="comment-author">{cmtUser?.nickname ?? '未知用户'}</span>
                      <span className="comment-time">{formatTime(cmt.timestamp)}</span>
                    </div>
                    <div className="comment-text">{cmt.content}</div>
                  </div>
                );
              })}
            </span>
          )}
        </>
      );
    },
    [allUsers, commentsByHighlight, currentUser.id]
  );

  const handleHighlightClick = useCallback(
    (highlightId: string, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      let y;
      if (spaceBelow < 180 && rect.top > 180) {
        y = rect.top + window.scrollY - 10;
      } else {
        y = rect.bottom + window.scrollY + 8;
      }
      const x = rect.left + window.scrollX + rect.width / 2;
      setActiveHighlightId(highlightId);
      setActiveCommentPopup({ highlightId, position: { x, y }, visible: true });
      setCommentText('');
      setPendingSelection(null);
    },
    [setActiveHighlightId]
  );

  const renderTextWithHighlights = useCallback(
    (text: string, baseOffset: number, keyPrefix: string): React.ReactNode[] => {
      if (!text) return [];
      const nodes: React.ReactNode[] = [];
      let cursor = 0;
      const textEnd = baseOffset + text.length;

      const relevantHighlights = sortedHighlights.filter(
        (hl) => hl.range.endOffset > baseOffset && hl.range.startOffset < textEnd
      );

      for (const hl of relevantHighlights) {
        const hlStart = Math.max(hl.range.startOffset, baseOffset);
        const hlEnd = Math.min(hl.range.endOffset, textEnd);
        const localStart = hlStart - baseOffset;
        const localEnd = hlEnd - baseOffset;

        if (cursor < localStart) {
          nodes.push(
            <React.Fragment key={`${keyPrefix}-t-${cursor}`}>
              {text.substring(cursor, localStart)}
            </React.Fragment>
          );
        }

        const highlightedText = text.substring(localStart, localEnd);
        if (highlightedText) {
          nodes.push(
            <span
              key={`${keyPrefix}-hl-${hl.id}-${localStart}`}
              className={getHighlightClass(hl)}
              onClick={(e) => {
                e.stopPropagation();
                handleHighlightClick(hl.id, e.currentTarget);
              }}
            >
              {renderHighlightContent(hl, highlightedText)}
            </span>
          );
        }
        cursor = localEnd;
      }

      if (cursor < text.length) {
        nodes.push(
          <React.Fragment key={`${keyPrefix}-t-${cursor}`}>{text.substring(cursor)}</React.Fragment>
        );
      }

      return nodes;
    },
    [sortedHighlights, renderHighlightContent, handleHighlightClick, activeHighlightId, currentUser.id]
  );

  interface RenderContext {
    offset: number;
    keyCounter: number;
  }

  const renderDomNode = useCallback(
    (node: Node, ctx: RenderContext): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? '';
        const baseOffset = ctx.offset;
        ctx.offset += text.length;
        ctx.keyCounter++;
        return renderTextWithHighlights(text, baseOffset, `n${ctx.keyCounter}`);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        const children: React.ReactNode[] = [];
        el.childNodes.forEach((child) => {
          children.push(renderDomNode(child, ctx));
        });

        const key = `el-${ctx.keyCounter++}`;
        const props: React.HTMLAttributes<HTMLElement> = {};

        switch (tagName) {
          case 'h1':
            return <h1 key={key} {...props}>{children}</h1>;
          case 'h2':
            return <h2 key={key} {...props}>{children}</h2>;
          case 'h3':
            return <h3 key={key} {...props}>{children}</h3>;
          case 'h4':
            return <h4 key={key} {...props}>{children}</h4>;
          case 'h5':
            return <h5 key={key} {...props}>{children}</h5>;
          case 'h6':
            return <h6 key={key} {...props}>{children}</h6>;
          case 'p':
            return <p key={key} {...props}>{children}</p>;
          case 'strong':
            return <strong key={key} {...props}>{children}</strong>;
          case 'em':
            return <em key={key} {...props}>{children}</em>;
          case 'ul':
            return <ul key={key} {...props}>{children}</ul>;
          case 'ol':
            return <ol key={key} {...props}>{children}</ol>;
          case 'li':
            return <li key={key} {...props}>{children}</li>;
          default:
            return <React.Fragment key={key}>{children}</React.Fragment>;
        }
      }

      return null;
    },
    [renderTextWithHighlights]
  );

  const renderedContent = useMemo(() => {
    renderKey.current++;
    const html = parseMarkdown(documentContent);
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const ctx: RenderContext = { offset: 0, keyCounter: renderKey.current * 1000 };
    const result: React.ReactNode[] = [];
    temp.childNodes.forEach((child) => {
      result.push(renderDomNode(child, ctx));
    });
    return result;
  }, [documentContent, renderDomNode]);

  const handleWindowMouseUp = useCallback(() => {
    if (!isSelecting.current) return;
    isSelecting.current = false;

    requestAnimationFrame(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPendingSelection(null);
        return;
      }

      if (!containerRef.current) return;

      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        setPendingSelection(null);
        return;
      }

      const highlightRange = highlightEngine.handleTextSelection(selection);
      if (!highlightRange) {
        setPendingSelection(null);
        return;
      }

      const pos = highlightEngine.getSelectionPosition(selection);
      if (!pos) {
        setPendingSelection(null);
        return;
      }

      setPendingSelection({ range: highlightRange, position: pos });
    });
  }, []);

  const handleWindowMouseDown = useCallback(() => {
    isSelecting.current = true;
  }, []);

  const handleColorSelect = useCallback(
    (color: HighlightColor) => {
      if (!pendingSelection) return;
      addHighlight(pendingSelection.range, color);
      highlightEngine.clearSelection();
      setPendingSelection(null);
    },
    [pendingSelection, addHighlight]
  );

  const submitComment = useCallback(() => {
    if (!activeCommentPopup || !commentText.trim()) return;
    addComment(activeCommentPopup.highlightId, commentText.trim());
    setCommentText('');
    setActiveCommentPopup((prev) => (prev ? { ...prev, visible: false } : null));
    setTimeout(() => {
      setActiveCommentPopup(null);
      setActiveHighlightId(null);
    }, 200);
  }, [activeCommentPopup, commentText, addComment, setActiveHighlightId]);

  const cancelComment = useCallback(() => {
    setActiveCommentPopup((prev) => (prev ? { ...prev, visible: false } : null));
    setCommentText('');
    setTimeout(() => {
      setActiveCommentPopup(null);
      setActiveHighlightId(null);
    }, 200);
  }, [setActiveHighlightId]);

  const handleDocumentClick = useCallback(() => {
    setPendingSelection(null);
    if (activeCommentPopup?.visible) {
      cancelComment();
    }
  }, [activeCommentPopup, cancelComment]);

  useEffect(() => {
    if (containerRef.current) {
      highlightEngine.setContainer(containerRef.current);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', handleWindowMouseDown);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleWindowMouseDown);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [handleWindowMouseDown, handleWindowMouseUp]);

  useEffect(() => {
    if (activeCommentPopup?.visible && commentInputRef.current) {
      setTimeout(() => commentInputRef.current?.focus(), 50);
    }
  }, [activeCommentPopup]);

  const colorPickerStyle = pendingSelection
    ? ({
        left: Math.max(16, Math.min(window.innerWidth - 200, pendingSelection.position.x - 100)),
        top: Math.max(72, pendingSelection.position.y - 50),
      } as React.CSSProperties)
    : undefined;

  const commentPopupStyle = activeCommentPopup
    ? ({
        left: Math.max(16, Math.min(window.innerWidth - 336, activeCommentPopup.position.x - 160)),
        top: activeCommentPopup.position.y,
        opacity: activeCommentPopup.visible ? 1 : 0,
        transform: activeCommentPopup.visible ? 'translateY(0)' : 'translateY(8px)',
      } as React.CSSProperties)
    : undefined;

  return (
    <div className="editor-wrapper" onClick={handleDocumentClick}>
      <div className="document-card">
        <div
          ref={containerRef}
          className="document-content"
          onClick={(e) => e.stopPropagation()}
        >
          {renderedContent}
        </div>
      </div>

      {pendingSelection && (
        <div
          className="color-picker"
          style={colorPickerStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {HIGHLIGHT_COLOR_LIST.map((c) => (
            <div
              key={c}
              className={`color-swatch swatch-${c}`}
              style={{ background: HIGHLIGHT_COLORS[c] }}
              onClick={() => handleColorSelect(c)}
              title={c}
            />
          ))}
        </div>
      )}

      {activeCommentPopup && (
        <div
          className="comment-popup"
          style={commentPopupStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            ref={commentInputRef}
            className="comment-input"
            placeholder="输入批注内容，按 Enter 发送..."
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitComment();
              }
              if (e.key === 'Escape') {
                cancelComment();
              }
            }}
          />
          <div className="comment-actions">
            <button className="btn-cancel" onClick={cancelComment}>
              <X size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              取消
            </button>
            <button className="btn-send" onClick={submitComment} disabled={!commentText.trim()}>
              <Send size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
