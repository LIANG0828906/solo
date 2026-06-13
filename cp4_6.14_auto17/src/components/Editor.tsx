import { useEffect, useMemo, useRef, useState } from 'react';
import type { Note } from '../types';
import { renderMarkdown, formatDate } from '../utils/markdown';

interface EditorProps {
  note: Note | null;
  notes: Note[];
  onChangeContent: (content: string) => void;
  onLinkClick: (title: string) => void;
  onTagClick: (tag: string) => void;
  splitPct: number;
}

export default function Editor({
  note, notes, onChangeContent, onLinkClick, onTagClick, splitPct,
}: EditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [localContent, setLocalContent] = useState(note?.content ?? '');
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    setLocalContent(note?.content ?? '');
  }, [note?.id]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => {
      if (localContent !== note.content) {
        onChangeContent(localContent);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [localContent, note, onChangeContent]);

  useEffect(() => {
    setLines(localContent.split('\n'));
  }, [localContent]);

  const rendered = useMemo(
    () => renderMarkdown(localContent || '', { onLinkClick, onTagClick, notes }),
    [localContent, notes, onLinkClick, onTagClick],
  );

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.querySelectorAll('a.dg-link').forEach((a) => {
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          const t = a.getAttribute('data-title');
          if (t) onLinkClick(t);
        });
      });
      previewRef.current.querySelectorAll('span.dg-tag').forEach((s) => {
        s.addEventListener('click', () => {
          const t = s.getAttribute('data-tag');
          if (t) onTagClick(t);
        });
      });
    }
  }, [rendered, onLinkClick, onTagClick]);

  const linkedFrom = useMemo(
    () => notes.filter((n) => note && n.linkedIds.includes(note.id) && n.id !== note.id),
    [notes, note?.id],
  );
  const linkedTo = useMemo(
    () => notes.filter((n) => note && note.linkedIds.includes(n.id)),
    [notes, note?.id],
  );

  if (!note) {
    return (
      <div style={wrapStyle}>
        <div style={emptyStyle}>
          <div style={{ fontSize: 64, marginBottom: 18 }}>🌿</div>
          <h2 style={{ fontSize: 20, marginBottom: 8, color: '#fff' }}>选择一篇笔记开始创作</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>
            点击左侧「＋」新建笔记<br />
            或从列表中选择已有笔记
          </p>
        </div>
      </div>
    );
  }

  const handleScroll = () => {
    if (taRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = taRef.current.scrollTop;
    }
  };

  const leftW = `${splitPct}%`;
  const rightW = `${100 - splitPct}%`;

  return (
    <div style={wrapStyle}>
      <div style={toolbarStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginRight: 12 }}>
              📝 {note.title}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
          <span>创建：{formatDate(note.createdAt)}</span>
          <span>编辑：{formatDate(note.updatedAt)}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0, borderTop: '1px solid var(--border-color)' }}>
        <div style={{ width: leftW, display: 'flex', minWidth: 0, borderRight: '1px solid var(--border-color)', position: 'relative' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', minWidth: 0, minHeight: 0 }}>
            <div
              ref={lineNumbersRef}
              style={{
                width: 44,
                paddingTop: 16,
                paddingRight: 6,
                paddingLeft: 0,
                color: 'rgba(136,146,176,0.5)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                lineHeight: 1.6,
                userSelect: 'none',
                textAlign: 'right',
                overflow: 'hidden',
                background: 'rgba(22,33,62,0.4)',
                borderRight: '1px solid var(--border-color)',
                whiteSpace: 'nowrap',
              }}
            >
              {lines.map((_, i) => (
                <div key={i} style={{ height: '1.6em', paddingRight: 4, paddingLeft: 4 }}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={taRef}
              value={localContent}
              onScroll={handleScroll}
              onChange={(e) => setLocalContent(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                width: '100%',
                padding: '16px 18px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--text-main)',
                minWidth: 0,
              }}
              placeholder="# 开始写作..."
            />
          </div>
        </div>
        <div style={{ width: rightW, minWidth: 0, overflow: 'hidden' }}>
          <div
            ref={previewRef}
            dangerouslySetInnerHTML={{ __html: rendered }}
            style={{
              padding: '16px 24px 40px',
              overflowY: 'auto',
              height: '100%',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--text-main)',
              background: 'rgba(22, 33, 62, 0.25)',
            }}
          />
        </div>
      </div>

      {(linkedFrom.length > 0 || linkedTo.length > 0) && (
        <div style={refPanelStyle}>
          <div style={{ display: 'flex', gap: 24 }}>
            {linkedFrom.length > 0 && (
              <div style={{ flex: 1 }}>
                <h4 style={refHeadingStyle}>📥 被引用列表（{linkedFrom.length}）</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {linkedFrom.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onLinkClick(n.title)}
                      style={refBtnStyle}
                    >
                      {n.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {linkedTo.length > 0 && (
              <div style={{ flex: 1 }}>
                <h4 style={refHeadingStyle}>📤 引用来源（{linkedTo.length}）</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {linkedTo.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => onLinkClick(n.title)}
                      style={{ ...refBtnStyle, background: 'rgba(233,69,96,0.12)' }}
                    >
                      → {n.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
  background: 'var(--bg-main)',
};

const emptyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
  textAlign: 'center',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '14px 22px',
  gap: 16,
  flexWrap: 'wrap',
  borderBottom: '1px solid var(--border-color)',
  background: 'rgba(22,33,62,0.5)',
};

const refPanelStyle: React.CSSProperties = {
  padding: '14px 22px',
  borderTop: '1px solid var(--border-color)',
  background: 'rgba(15,52,96,0.2)',
};

const refHeadingStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  fontWeight: 500,
  marginBottom: 8,
  letterSpacing: 0.5,
};

const refBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  background: 'rgba(74,144,217,0.15)',
  color: 'var(--text-main)',
  borderRadius: 6,
  fontSize: 12,
  animation: 'fadeIn 300ms ease-out both',
  border: '1px solid var(--border-color)',
};
