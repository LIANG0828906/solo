import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoteCollector from './NoteCollector';
import GraphPanel from './GraphPanel';
import { Highlight, Note, Link } from './types';
import {
  openDB,
  saveArticle,
  getArticle,
  saveHighlight,
  deleteHighlight,
  getHighlights,
  saveNote,
  deleteNote,
  getNotes,
  saveLink,
  deleteLink,
  getLinks,
} from './db';

const ARTICLE_ID = 'default-article';
const DEFAULT_ARTICLE = `# React Hooks 深度解析

React Hooks 是 React 16.8 引入的新特性，它让你在不编写 class 的情况下使用 state 以及其他的 React 特性。

## useState 的工作原理

useState 是最基础的 Hook，它返回一个状态值和一个更新该状态的函数。当我们调用更新函数时，React 会重新渲染组件并传入新的状态值。

\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

值得注意的是，useState 在多次渲染之间会保持状态的一致性。React 通过链表结构来存储每个组件的 Hooks 状态，这也是为什么 Hooks 只能在函数顶层调用，不能在条件语句或循环中使用。

## useEffect 的执行时机

useEffect 用于处理副作用，它接收两个参数：一个副作用函数和一个依赖数组。依赖数组决定了副作用何时重新执行。

> 如果你熟悉 React class 的生命周期函数，你可以把 useEffect Hook 看做 componentDidMount、componentDidUpdate 和 componentWillUnmount 这三个函数的组合。

当依赖数组为空时，副作用只会在组件挂载和卸载时执行。如果省略依赖数组，则每次渲染都会执行。

## useCallback 和 useMemo 的区别

这两个 Hook 都用于性能优化，但用途不同：

- useCallback 返回一个 memoized 的回调函数
- useMemo 返回一个 memoized 的计算值

useCallback(fn, deps) 相当于 useMemo(() => fn, deps)。

## 自定义 Hook

自定义 Hook 是一个函数，其名称以 "use" 开头，函数内部可以调用其他的 Hook。通过自定义 Hook，我们可以将组件逻辑提取到可重用的函数中。

\`\`\`jsx
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}
\`\`\`

掌握 Hooks 的使用方式对于编写简洁、可维护的 React 代码至关重要。
`;

export default function App() {
  const [articleText, setArticleText] = useState(DEFAULT_ARTICLE);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [flashHighlightId, setFlashHighlightId] = useState<string | null>(null);
  const [flashNodeId, setFlashNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      await openDB();
      const savedArticle = await getArticle(ARTICLE_ID);
      if (savedArticle) {
        setArticleText(savedArticle.content);
      }
      const savedHighlights = await getHighlights(ARTICLE_ID);
      setHighlights(savedHighlights.sort((a, b) => a.startOffset - b.startOffset));
      const savedNotes = await getNotes(ARTICLE_ID);
      setNotes(savedNotes);
      const savedLinks = await getLinks(ARTICLE_ID);
      setLinks(savedLinks);
      loadedRef.current = true;
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    const article = {
      id: ARTICLE_ID,
      content: articleText,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveArticle(article);
  }, [articleText]);

  const handleAddHighlight = useCallback(async (startOffset: number, endOffset: number, text: string) => {
    const existing = highlights.find(
      (h) => h.startOffset === startOffset && h.endOffset === endOffset,
    );
    if (existing) {
      const updated: Highlight = { ...existing, depth: existing.depth + 1 };
      setHighlights((prev) => prev.map((h) => (h.id === existing.id ? updated : h)));
      await saveHighlight(updated);
      return;
    }
    const overlapping = highlights.find(
      (h) => !(endOffset <= h.startOffset || startOffset >= h.endOffset),
    );
    if (overlapping) {
      const mergedStart = Math.min(overlapping.startOffset, startOffset);
      const mergedEnd = Math.max(overlapping.endOffset, endOffset);
      const mergedText = articleText.slice(mergedStart, mergedEnd);
      const updated: Highlight = {
        ...overlapping,
        startOffset: mergedStart,
        endOffset: mergedEnd,
        text: mergedText,
        depth: overlapping.depth + 1,
      };
      setHighlights((prev) =>
        prev
          .map((h) => (h.id === overlapping.id ? updated : h))
          .sort((a, b) => a.startOffset - b.startOffset),
      );
      await saveHighlight(updated);
      return;
    }
    const newHighlight: Highlight = {
      id: uuidv4(),
      articleId: ARTICLE_ID,
      startOffset,
      endOffset,
      text,
      depth: 1,
      createdAt: Date.now(),
    };
    setHighlights((prev) =>
      [...prev, newHighlight].sort((a, b) => a.startOffset - b.startOffset),
    );
    await saveHighlight(newHighlight);
  }, [highlights, articleText]);

  const handleRemoveHighlight = useCallback(async (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setNotes((prev) => prev.filter((n) => n.highlightId !== id));
    setLinks((prev) => prev.filter((l) => l.sourceId !== id && l.targetId !== id));
    await deleteHighlight(id);
    const relatedNotes = notes.filter((n) => n.highlightId === id);
    for (const note of relatedNotes) {
      await deleteNote(note.id);
    }
    const relatedLinks = links.filter((l) => l.sourceId === id || l.targetId === id);
    for (const link of relatedLinks) {
      await deleteLink(link.id);
    }
  }, [notes, links]);

  const handleAddNote = useCallback(async (highlightId: string, content: string) => {
    const newNote: Note = {
      id: uuidv4(),
      articleId: ARTICLE_ID,
      highlightId,
      content,
      createdAt: Date.now(),
    };
    setNotes((prev) => [...prev, newNote]);
    await saveNote(newNote);
  }, []);

  const handleRemoveNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setLinks((prev) => prev.filter((l) => l.sourceId !== id && l.targetId !== id));
    await deleteNote(id);
    const relatedLinks = links.filter((l) => l.sourceId === id || l.targetId === id);
    for (const link of relatedLinks) {
      await deleteLink(link.id);
    }
  }, [links]);

  const handleCreateLink = useCallback(async (
    sourceId: string,
    sourceType: 'highlight' | 'note',
    targetId: string,
    targetType: 'highlight' | 'note',
  ) => {
    if (sourceId === targetId) return;
    const exists = links.some(
      (l) => l.sourceId === sourceId && l.targetId === targetId,
    );
    if (exists) return;
    const newLink: Link = {
      id: uuidv4(),
      articleId: ARTICLE_ID,
      sourceId,
      targetId,
      sourceType,
      targetType,
      createdAt: Date.now(),
    };
    setLinks((prev) => [...prev, newLink]);
    await saveLink(newLink);
  }, [links]);

  const handleJumpToHighlight = useCallback((highlightId: string) => {
    setFlashHighlightId(highlightId);
    setFlashNodeId(highlightId);
    setTimeout(() => {
      setFlashHighlightId(null);
      setFlashNodeId(null);
    }, 1000);
  }, []);

  return (
    <div className="app-container">
      <div className="main-area">
        <NoteCollector
          articleText={articleText}
          setArticleText={setArticleText}
          highlights={highlights}
          notes={notes}
          links={links}
          onAddHighlight={handleAddHighlight}
          onRemoveHighlight={handleRemoveHighlight}
          onAddNote={handleAddNote}
          onRemoveNote={handleRemoveNote}
          onCreateLink={handleCreateLink}
          flashHighlightId={flashHighlightId}
          onJumpToHighlight={handleJumpToHighlight}
          sidebarOpen={sidebarOpen}
        />
        <GraphPanel
          highlights={highlights}
          notes={notes}
          links={links}
          onJumpToHighlight={handleJumpToHighlight}
          flashNodeId={flashNodeId}
        />
      </div>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">笔记与高亮</div>
          <div className="sidebar-subtitle">
            {highlights.length} 条高亮 · {notes.length} 条笔记 · {links.length} 个关联
          </div>
        </div>
        <div className="sidebar-list">
          {highlights.length === 0 && notes.length === 0 ? (
            <div className="empty-state">
              暂无高亮和笔记
              <br />
              在文章中选中文字开始标注吧
            </div>
          ) : (
            highlights.map((h) => (
              <div key={`hl-group-${h.id}`}>
                <SidebarHighlightCard
                  highlight={h}
                  onRemove={handleRemoveHighlight}
                  onCreateLink={handleCreateLink}
                  onJump={handleJumpToHighlight}
                  paragraphLabel={getParagraphLabel(articleText, h.startOffset)}
                />
                {notes
                  .filter((n) => n.highlightId === h.id)
                  .map((n) => (
                    <SidebarNoteCard
                      key={n.id}
                      note={n}
                      onRemove={handleRemoveNote}
                      onCreateLink={handleCreateLink}
                    />
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="切换侧边栏"
      >
        {sidebarOpen ? '×' : '☰'}
      </button>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getParagraphLabel(articleText: string, startOffset: number): string {
  const textBefore = articleText.slice(0, startOffset);
  const headingMatch = textBefore.match(/(?:^|\n)(#{1,6}\s[^\n]*)[\s\S]*$/);
  if (headingMatch && headingMatch[1]) {
    const heading = headingMatch[1].replace(/^#+\s/, '').trim();
    if (heading.length > 0) {
      return heading.length > 12 ? heading.slice(0, 12) + '…' : heading;
    }
  }
  const lines = textBefore.split('\n');
  let paraIndex = 0;
  let inEmpty = false;
  let inCodeBlock = false;
  let inBlockquote = false;
  let inList = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (line.trim() === '') {
      inBlockquote = false;
      inList = false;
      if (!inEmpty) {
        paraIndex++;
        inEmpty = true;
      }
      continue;
    }
    inEmpty = false;
    if (line.startsWith('>')) {
      if (!inBlockquote) {
        paraIndex++;
        inBlockquote = true;
      }
      continue;
    }
    if (/^\s*[-*]\s/.test(line) || /^\s*\d+\.\s/.test(line)) {
      if (!inList) {
        paraIndex++;
        inList = true;
      }
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      paraIndex++;
      continue;
    }
    inBlockquote = false;
    inList = false;
  }
  if (paraIndex === 0 && textBefore.trim().length === 0) {
    return '文章开头';
  }
  return `段落 ${paraIndex + 1}`;
}

function SidebarHighlightCard({
  highlight,
  onRemove,
  onCreateLink,
  onJump,
  paragraphLabel,
}: {
  highlight: Highlight;
  onRemove: (id: string) => void;
  onCreateLink: (
    sourceId: string,
    sourceType: 'highlight' | 'note',
    targetId: string,
    targetType: 'highlight' | 'note',
  ) => void;
  onJump: (id: string) => void;
  paragraphLabel: string;
}) {
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sourceId', highlight.id);
    e.dataTransfer.setData('sourceType', 'highlight');
    e.dataTransfer.effectAllowed = 'link';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const sourceId = e.dataTransfer.getData('sourceId');
    const sourceType = e.dataTransfer.getData('sourceType') as 'highlight' | 'note';
    if (sourceId && sourceId !== highlight.id) {
      onCreateLink(sourceId, sourceType, highlight.id, 'highlight');
    }
    setIsLinkMode(false);
  };

  return (
    <div
      className={`sidebar-card highlight-type ${isDragOver ? 'drag-over' : ''}`}
      draggable={isLinkMode}
      onDragStart={isLinkMode ? handleDragStart : undefined}
      onDragOver={isLinkMode ? handleDragOver : undefined}
      onDragLeave={isLinkMode ? handleDragLeave : undefined}
      onDrop={isLinkMode ? handleDrop : undefined}
    >
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="card-type highlight">高亮</span>
          <span className="card-paragraph">{paragraphLabel}</span>
        </div>
        <span className="card-time">{formatTime(highlight.createdAt)}</span>
      </div>
      <div
        className="card-text"
        onClick={() => onJump(highlight.id)}
        style={{ cursor: 'pointer' }}
        title="点击跳转到原文"
      >
        {highlight.text}
      </div>
      <div className="card-actions">
        <button
          className={`card-btn ${isLinkMode ? 'link-mode' : ''}`}
          onClick={() => setIsLinkMode((prev) => !prev)}
        >
          {isLinkMode ? '拖拽关联中...' : '关联到'}
        </button>
        <button className="card-btn" onClick={() => onRemove(highlight.id)}>
          删除
        </button>
      </div>
    </div>
  );
}

function SidebarNoteCard({
  note,
  onRemove,
  onCreateLink,
}: {
  note: Note;
  onRemove: (id: string) => void;
  onCreateLink: (
    sourceId: string,
    sourceType: 'highlight' | 'note',
    targetId: string,
    targetType: 'highlight' | 'note',
  ) => void;
}) {
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sourceId', note.id);
    e.dataTransfer.setData('sourceType', 'note');
    e.dataTransfer.effectAllowed = 'link';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const sourceId = e.dataTransfer.getData('sourceId');
    const sourceType = e.dataTransfer.getData('sourceType') as 'highlight' | 'note';
    if (sourceId && sourceId !== note.id) {
      onCreateLink(sourceId, sourceType, note.id, 'note');
    }
    setIsLinkMode(false);
  };

  return (
    <div
      className={`sidebar-card note-type ${isDragOver ? 'drag-over' : ''}`}
      draggable={isLinkMode}
      onDragStart={isLinkMode ? handleDragStart : undefined}
      onDragOver={isLinkMode ? handleDragOver : undefined}
      onDragLeave={isLinkMode ? handleDragLeave : undefined}
      onDrop={isLinkMode ? handleDrop : undefined}
    >
      <div className="card-header">
        <span className="card-type note">笔记</span>
        <span className="card-time">{formatTime(note.createdAt)}</span>
      </div>
      <div className="card-text">{note.content}</div>
      <div className="card-actions">
        <button
          className={`card-btn ${isLinkMode ? 'link-mode' : ''}`}
          onClick={() => setIsLinkMode((prev) => !prev)}
        >
          {isLinkMode ? '拖拽关联中...' : '关联到'}
        </button>
        <button className="card-btn" onClick={() => onRemove(note.id)}>
          删除
        </button>
      </div>
    </div>
  );
}
