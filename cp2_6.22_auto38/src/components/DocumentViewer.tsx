import { useEffect, useMemo, useRef, useState } from 'react';
import type { Annotation, User } from '../utils/annotationStore';
import { store } from '../utils/annotationStore';
import { AnnotationBubble } from './AnnotationBubble';

interface DocumentViewerProps {
  annotations: Annotation[];
  users: User[];
  highlightLine: number | null;
  highlightAnnotationId: string | null;
}

interface ParsedLine {
  index: number;
  content: string;
  heading?: '1' | '2' | '3';
  isEmpty: boolean;
}

interface SelectionState {
  line: number;
  text: string;
  top: number;
  left: number;
}

interface Section {
  line: number;
  title: string;
}

export function extractSections(doc: string): Section[] {
  const lines = doc.split('\n');
  const sections: Section[] = [];
  lines.forEach((line, idx) => {
    if (line.startsWith('## ')) {
      sections.push({ line: idx + 1, title: line.replace(/^##+\s*/, '').trim() });
    }
  });
  return sections;
}

const getHeadingLevel = (line: string): '1' | '2' | '3' | undefined => {
  if (line.startsWith('### ')) return '3';
  if (line.startsWith('## ')) return '2';
  if (line.startsWith('# ')) return '1';
  return undefined;
};

const stripHeadingMarkers = (line: string): string => {
  return line.replace(/^#+\s*/, '');
};

const LINE_HEIGHT_DEFAULT = 28;

export function DocumentViewer({ annotations, users, highlightLine, highlightAnnotationId }: DocumentViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [popoverText, setPopoverText] = useState('');
  const [bubbleVersion, setBubbleVersion] = useState(0);
  const bubbleHeightsRef = useRef<Map<string, number>>(new Map());

  const docContent = store.getDocument();

  const lines: ParsedLine[] = useMemo(() => {
    return docContent.split('\n').map((raw, idx) => {
      const content = raw;
      const heading = getHeadingLevel(content);
      return {
        index: idx + 1,
        content,
        heading,
        isEmpty: content.trim().length === 0,
      };
    });
  }, [docContent]);

  useEffect(() => {
    if (highlightLine == null) return;
    requestAnimationFrame(() => {
      const el = lineRefs.current.get(highlightLine);
      if (el && scrollRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('highlight-flash');
        void el.offsetWidth;
        el.classList.add('highlight-flash');
        const t = setTimeout(() => el.classList.remove('highlight-flash'), 2600);
        return () => clearTimeout(t);
      }
    });
  }, [highlightLine, highlightAnnotationId]);

  const handleMouseUp = () => {
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const text = sel.toString().trim();
      if (!text || text.length < 1) {
        setSelection(null);
        return;
      }
      let container = range.startContainer as HTMLElement | null;
      while (container && container.nodeType !== 1) {
        container = container.parentElement;
      }
      let lineEl = container?.closest('[data-line]') as HTMLElement | null;
      if (!lineEl) {
        const endC = range.endContainer as HTMLElement | null;
        let ec = endC;
        while (ec && ec.nodeType !== 1) ec = ec.parentElement;
        lineEl = ec?.closest('[data-line]') as HTMLElement | null;
      }
      if (!lineEl) {
        setSelection(null);
        return;
      }
      const line = parseInt(lineEl.getAttribute('data-line') || '0', 10);
      if (!line) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const scrollRect = scrollRef.current?.getBoundingClientRect();
      if (!scrollRect) return;
      const top = rect.bottom - scrollRect.top + (scrollRef.current?.scrollTop ?? 0) + 8;
      const left = Math.min(Math.max(rect.left - scrollRect.left + 20, 40), scrollRect.width - 380);
      setSelection({ line, text, top, left });
      setPopoverText('');
    });
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!selection) return;
      const target = e.target as HTMLElement;
      if (target.closest('.create-popover')) return;
      setSelection(null);
    };
    window.document.addEventListener('mousedown', onDocClick);
    return () => window.document.removeEventListener('mousedown', onDocClick);
  }, [selection]);

  const handleSubmitAnnotation = () => {
    if (!selection || !popoverText.trim()) return;
    store.addAnnotation(selection.line, selection.text, popoverText.trim());
    setSelection(null);
    setPopoverText('');
    window.getSelection()?.removeAllRanges();
  };

  const handleCancelAnnotation = () => {
    setSelection(null);
    setPopoverText('');
    window.getSelection()?.removeAllRanges();
  };

  const lineAnnotationMap = useMemo(() => {
    const map = new Map<number, Annotation[]>();
    annotations.forEach(a => {
      if (!map.has(a.documentLine)) map.set(a.documentLine, []);
      map.get(a.documentLine)!.push(a);
    });
    return map;
  }, [annotations]);

  const computeLineOffsetTop = (lineIndex: number): number => {
    let offset = 40;
    for (let i = 0; i < lineIndex - 1; i++) {
      const ln = lines[i];
      offset += getLineHeightPx(ln);
    }
    return offset;
  };

  const getLineHeightPx = (ln: ParsedLine): number => {
    if (ln.heading === '1') return 56;
    if (ln.heading === '2') return 54;
    if (ln.heading === '3') return 42;
    if (ln.isEmpty) return LINE_HEIGHT_DEFAULT;
    return LINE_HEIGHT_DEFAULT;
  };

  useEffect(() => {
    const refreshBubbleLayout = () => setBubbleVersion(v => v + 1);
    const unsub = store.on('annotation:updated', () => {
      setTimeout(refreshBubbleLayout, 20);
    });
    const t = setTimeout(refreshBubbleLayout, 60);
    window.addEventListener('resize', refreshBubbleLayout);
    return () => {
      unsub();
      clearTimeout(t);
      window.removeEventListener('resize', refreshBubbleLayout);
    };
  }, []);

  const remoteCursors = users.filter(u => u.id !== store.getCurrentUser().id);

  const bubbleAnchors: { line: number; items: Annotation[]; top: number }[] = [];
  lineAnnotationMap.forEach((items, line) => {
    bubbleAnchors.push({ line, items, top: computeLineOffsetTop(line) });
  });
  bubbleAnchors.sort((a, b) => a.line - b.line);

  const layoutInfo: Map<string, { top: number; lineTop: number }> = new Map();
  let cursor = 0;
  while (cursor < bubbleAnchors.length) {
    const group: typeof bubbleAnchors = [];
    group.push(bubbleAnchors[cursor]);
    cursor++;
    while (cursor < bubbleAnchors.length) {
      const next = bubbleAnchors[cursor];
      const lastOfGroup = group[group.length - 1];
      const lastBaseTop = lastOfGroup.top;
      let lastGroupHeight = 0;
      lastOfGroup.items.forEach(a => {
        lastGroupHeight += bubbleHeightsRef.current.get(a.id) ?? 120;
        lastGroupHeight += 10;
      });
      if (next.top < lastBaseTop + lastGroupHeight) {
        group.push(next);
        cursor++;
      } else {
        break;
      }
    }
    let runningTop = group[0].top;
    group.forEach(anchor => {
      let itemTop = runningTop;
      anchor.items.forEach(a => {
        const h = bubbleHeightsRef.current.get(a.id) ?? 120;
        layoutInfo.set(a.id, { top: itemTop, lineTop: anchor.top });
        itemTop += h + 10;
      });
      runningTop = Math.max(runningTop, itemTop);
    });
  }

  return (
    <div className="doc-scroll" ref={scrollRef} onMouseUp={handleMouseUp}>
      <div className="doc-container" ref={containerRef} style={{ position: 'relative' }}>
        <div className="cursors-layer">
          {remoteCursors.map(u => {
            const top = computeLineOffsetTop(u.cursorLine);
            return (
              <div
                key={u.id}
                className="remote-cursor"
                style={{ top: `${top}px` }}
              >
                <div className="cursor-line" style={{ background: u.avatarColor }} />
                <div className="cursor-label" style={{ background: u.avatarColor }}>
                  {u.name}
                </div>
              </div>
            );
          })}
        </div>

        {lines.map(ln => {
          const anns = lineAnnotationMap.get(ln.index) ?? [];
          const hasResolved = anns.some(a => a.isResolved);
          const hasOpen = anns.some(a => !a.isResolved);
          return (
            <div
              key={ln.index}
              ref={el => {
                if (el) lineRefs.current.set(ln.index, el);
              }}
              className="doc-line"
              data-line={ln.index}
              data-heading={ln.heading ?? undefined}
              data-empty={ln.isEmpty ? 'true' : undefined}
            >
              <span className="line-number">{ln.index}</span>
              {anns.length > 0 && (
                <>
                  {hasOpen && <span className="annotation-bar" />}
                  {!hasOpen && hasResolved && <span className="annotation-bar resolved" />}
                </>
              )}
              {ln.heading
                ? stripHeadingMarkers(ln.content)
                : ln.content || '\u00A0'}
            </div>
          );
        })}

        <div className="bubbles-layer" data-v={bubbleVersion}>
          {annotations.map(a => {
            const info = layoutInfo.get(a.id);
            if (!info) return null;
            return (
              <div
                key={a.id}
                className="bubble-anchor"
                style={{
                  top: `${info.top}px`,
                }}
                ref={el => {
                  if (el) {
                    const h = el.getBoundingClientRect().height;
                    if (h > 0 && bubbleHeightsRef.current.get(a.id) !== h) {
                      bubbleHeightsRef.current.set(a.id, h);
                      setBubbleVersion(v => v + 1);
                    }
                  }
                }}
              >
                <AnnotationBubble
                  annotation={a}
                  users={users}
                  onHeightChange={() => {
                    setBubbleVersion(v => v + 1);
                  }}
                />
              </div>
            );
          })}
        </div>

        {selection && (
          <div
            className="create-popover"
            style={{ top: `${selection.top}px`, left: `${selection.left}px` }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="selected-snippet" title={selection.text}>
              行 {selection.line} · 「{selection.text}」
            </div>
            <textarea
              autoFocus
              placeholder="为选中的内容添加批注…"
              value={popoverText}
              onChange={e => setPopoverText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitAnnotation();
                if (e.key === 'Escape') handleCancelAnnotation();
              }}
            />
            <div className="popover-actions">
              <button className="btn btn-ghost" onClick={handleCancelAnnotation}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmitAnnotation} disabled={!popoverText.trim()}>
                提交批注
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
