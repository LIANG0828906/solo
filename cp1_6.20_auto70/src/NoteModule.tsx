import React, { useState, useEffect, useCallback, useRef, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
  Book, Note, MindMapNode, NoteTag, AppContext, STATUS_LABELS, STATUS_COLORS, NOTE_TAGS,
} from './types';
import {
  getBooks, updateBook, getNotesByBookId, addNote, updateNote, deleteNote,
  getMindMapNodesByBookId, addMindMapNode, updateMindMapNode, deleteMindMapNode,
} from './dataService';

const e = React.createElement;

const TAG_COLORS: Record<NoteTag, { bg: string; text: string }> = {
  '核心观点': { bg: '#E3F2FD', text: '#1565C0' },
  '金句摘录': { bg: '#FFF3E0', text: '#E65100' },
  '个人感悟': { bg: '#F3E5F5', text: '#7B1FA2' },
};

function collectDescendantIds(nodes: MindMapNode[], parentId: string): string[] {
  const ids: string[] = [parentId];
  nodes.filter(n => n.parentId === parentId).forEach(n => {
    ids.push(...collectDescendantIds(nodes, n.id));
  });
  return ids;
}

function countWords(text: string): number {
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const english = (text.replace(/[\u4e00-\u9fff]/g, '').match(/\b\w+\b/g) || []).length;
  return chinese + english;
}

export default function NoteModule() {
  const { selectedBookId, setSelectedBookId } = useContext(AppContext);

  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([]);

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<NoteTag[]>([]);

  const [readingMinutesInput, setReadingMinutesInput] = useState('');
  const [currentPageInput, setCurrentPageInput] = useState('');

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeText, setEditingNodeText] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    if (!selectedBookId) return;
    getBooks().then(books => {
      const b = books.find(bk => bk.id === selectedBookId);
      if (b) {
        setBook(b);
        setReadingMinutesInput(String(b.todayReadingMinutes));
        setCurrentPageInput(String(b.currentPage));
      }
    });
    getNotesByBookId(selectedBookId).then(setNotes);
    getMindMapNodesByBookId(selectedBookId).then(setMindMapNodes);
  }, [selectedBookId]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes]);

  const handleSaveReadingMinutes = useCallback(async () => {
    if (!book) return;
    const updated = { ...book, todayReadingMinutes: Number(readingMinutesInput) || 0 };
    await updateBook(updated);
    setBook(updated);
  }, [book, readingMinutesInput]);

  const handleSaveCurrentPage = useCallback(async () => {
    if (!book) return;
    const page = Math.min(Number(currentPageInput) || 0, book.totalPages);
    const updated = { ...book, currentPage: page };
    await updateBook(updated);
    setBook(updated);
  }, [book, currentPageInput]);

  const handleNewNote = useCallback(() => {
    setIsCreatingNote(true);
    setEditingNote(null);
    setNoteContent('');
    setNoteTags([]);
  }, []);

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setIsCreatingNote(false);
    setNoteContent(note.content);
    setNoteTags([...note.tags]);
  }, []);

  const handleSaveNote = useCallback(async () => {
    if (!selectedBookId) return;
    const wc = countWords(noteContent);
    if (editingNote) {
      const updated: Note = { ...editingNote, content: noteContent, tags: noteTags, wordCount: wc };
      await updateNote(updated);
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    } else {
      const newNote: Note = {
        id: uuidv4(), bookId: selectedBookId, content: noteContent,
        createdAt: new Date().toISOString(), wordCount: wc, isStarred: false, tags: noteTags,
      };
      await addNote(newNote);
      setNotes(prev => [...prev, newNote]);
    }
    setIsCreatingNote(false);
    setEditingNote(null);
    setNoteContent('');
    setNoteTags([]);
  }, [selectedBookId, editingNote, noteContent, noteTags]);

  const handleCancelNote = useCallback(() => {
    setIsCreatingNote(false);
    setEditingNote(null);
    setNoteContent('');
    setNoteTags([]);
  }, []);

  const handleToggleStar = useCallback(async (note: Note) => {
    const updated = { ...note, isStarred: !note.isStarred };
    await updateNote(updated);
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  }, []);

  const handleDeleteNote = useCallback(async (id: string) => {
    await deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleAddRootNode = useCallback(async () => {
    if (!selectedBookId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const node: MindMapNode = {
      id: uuidv4(), bookId: selectedBookId, text: '新节点',
      x: rect.width / 2 - 50, y: rect.height / 2 - 20, parentId: null,
    };
    await addMindMapNode(node);
    setMindMapNodes(prev => [...prev, node]);
  }, [selectedBookId]);

  const handleAddChildNode = useCallback(async (parentId: string) => {
    if (!selectedBookId) return;
    const parent = mindMapNodes.find(n => n.id === parentId);
    if (!parent) return;
    const node: MindMapNode = {
      id: uuidv4(), bookId: selectedBookId, text: '子节点',
      x: parent.x + 120, y: parent.y + 60, parentId,
    };
    await addMindMapNode(node);
    setMindMapNodes(prev => [...prev, node]);
    setSelectedNodeId(null);
  }, [selectedBookId, mindMapNodes]);

  const handleMouseDown = useCallback((ev: React.MouseEvent, nodeId: string) => {
    ev.preventDefault();
    ev.stopPropagation();
    const node = mindMapNodes.find(n => n.id === nodeId);
    if (!node) return;
    dragRef.current = { nodeId, startX: ev.clientX, startY: ev.clientY, origX: node.x, origY: node.y };
    setSelectedNodeId(nodeId);

    const handleMouseMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = me.clientX - dragRef.current.startX;
      const dy = me.clientY - dragRef.current.startY;
      requestAnimationFrame(() => {
        setMindMapNodes(prev => prev.map(n =>
          n.id === dragRef.current?.nodeId
            ? { ...n, x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy }
            : n
        ));
      });
    };

    const handleMouseUp = () => {
      setMindMapNodes(prev => {
        const nd = prev.find(n => n.id === dragRef.current?.nodeId);
        if (nd) updateMindMapNode(nd);
        return prev;
      });
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [mindMapNodes]);

  const handleDoubleClick = useCallback((nodeId: string) => {
    const node = mindMapNodes.find(n => n.id === nodeId);
    if (!node) return;
    setEditingNodeId(nodeId);
    setEditingNodeText(node.text);
  }, [mindMapNodes]);

  const handleSaveNodeText = useCallback(async () => {
    if (!editingNodeId) return;
    setMindMapNodes(prev => {
      const updated = prev.map(n => n.id === editingNodeId ? { ...n, text: editingNodeText } : n);
      const nd = updated.find(n => n.id === editingNodeId);
      if (nd) updateMindMapNode(nd);
      return updated;
    });
    setEditingNodeId(null);
    setEditingNodeText('');
  }, [editingNodeId, editingNodeText]);

  const handleContextMenu = useCallback((ev: React.MouseEvent, nodeId: string) => {
    ev.preventDefault();
    ev.stopPropagation();
    setContextMenu({ nodeId, x: ev.clientX, y: ev.clientY });
  }, []);

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    await deleteMindMapNode(nodeId);
    const allIds = new Set(collectDescendantIds(mindMapNodes, nodeId));
    setMindMapNodes(prev => prev.filter(n => !allIds.has(n.id)));
    setContextMenu(null);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [mindMapNodes, selectedNodeId]);

  const bezierPaths = useMemo(() => {
    const nodeMap = new Map(mindMapNodes.map(n => [n.id, n]));
    return mindMapNodes.filter(n => n.parentId && nodeMap.has(n.parentId)).map(n => {
      const parent = nodeMap.get(n.parentId!)!;
      const px = parent.x + 50, py = parent.y + 20;
      const cx = n.x + 50, cy = n.y + 20;
      const midY = (py + cy) / 2;
      return `M ${px},${py} C ${px},${midY} ${cx},${midY} ${cx},${cy}`;
    });
  }, [mindMapNodes]);

  if (!book) {
    return e('div', { style: { padding: 40, textAlign: 'center', color: '#5C3D2E' } }, '加载中...');
  }

  const completionPct = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
  const statusColor = STATUS_COLORS[book.status];

  const leftCol = e('div', { className: 'detail-col', style: { width: '25%', padding: 16, overflowY: 'auto' } },
    e('button', {
      className: 'btn-hover', onClick: () => setSelectedBookId(null),
      style: { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6B8DAE', marginBottom: 12 },
    }, '←'),
    book.coverUrl
      ? e('img', { src: book.coverUrl, style: { width: '100%', borderRadius: 8, marginBottom: 12 }, alt: book.title })
      : e('div', {
          style: {
            width: '100%', aspectRatio: '3/4', borderRadius: 8, marginBottom: 12,
            background: statusColor.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 600, fontFamily: 'Playfair Display, serif',
          },
        }, book.title.slice(0, 6)),
    e('h3', { style: { margin: '8px 0 4px', fontSize: 18, color: '#5C3D2E' } }, book.title),
    e('p', { style: { fontSize: 14, color: '#8D7B6A', margin: '2px 0' } }, '作者: ' + book.author),
    e('p', { style: { fontSize: 14, color: '#8D7B6A', margin: '2px 0' } }, '总页数: ' + book.totalPages),
    e('p', { style: { fontSize: 14, color: '#8D7B6A', margin: '2px 0' } }, '添加日期: ' + format(new Date(book.addedAt), 'yyyy-MM-dd')),
    e('p', { style: { fontSize: 13, color: statusColor.text, margin: '4px 0 12px' } }, STATUS_LABELS[book.status]),
    e('div', { style: { background: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(92,61,46,0.06)' } },
      e('h4', { style: { fontSize: 14, marginBottom: 8, color: '#5C3D2E' } }, '阅读统计'),
      e('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } },
        e('span', { style: { fontSize: 13, color: '#8D7B6A' } }, '今日阅读(分钟):'),
        e('input', {
          type: 'number', value: readingMinutesInput,
          onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setReadingMinutesInput(ev.target.value),
          style: { width: 60, padding: '2px 6px', border: '1px solid #D4C5B2', borderRadius: 4, fontSize: 13 },
        }),
        e('button', {
          className: 'btn-hover', onClick: handleSaveReadingMinutes,
          style: { padding: '2px 8px', background: '#6B8DAE', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
        }, '保存'),
      ),
      e('p', { style: { fontSize: 13, color: '#8D7B6A', margin: '2px 0' } }, '累计阅读天数: ' + book.readingDays),
      e('div', { style: { margin: '8px 0 4px' } },
        e('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8D7B6A' } },
          e('span', null, '完成进度'),
          e('span', null, completionPct + '%'),
        ),
        e('div', { className: 'progress-bar-bg', style: { marginTop: 4 } },
          e('div', { className: 'progress-bar-fill', style: { width: completionPct + '%', background: '#6B8DAE' } }),
        ),
      ),
      e('div', { style: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 } },
        e('span', { style: { fontSize: 13, color: '#8D7B6A' } }, '当前页码:'),
        e('input', {
          type: 'number', value: currentPageInput,
          onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setCurrentPageInput(ev.target.value),
          style: { width: 60, padding: '2px 6px', border: '1px solid #D4C5B2', borderRadius: 4, fontSize: 13 },
        }),
        e('button', {
          className: 'btn-hover', onClick: handleSaveCurrentPage,
          style: { padding: '2px 8px', background: '#6B8DAE', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
        }, '更新'),
      ),
    ),
  );

  const centerCol = e('div', { className: 'detail-col', style: { width: '40%', padding: 16, display: 'flex', flexDirection: 'column' } },
    e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
      e('h3', { style: { fontSize: 16, color: '#5C3D2E' } }, '思维导图'),
      e('button', {
        className: 'btn-hover', onClick: handleAddRootNode,
        style: { padding: '4px 12px', background: '#6B8DAE', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' },
      }, '+ 添加节点'),
    ),
    e('div', {
      ref: containerRef,
      style: { position: 'relative', flex: 1, minHeight: 400, background: '#fff', borderRadius: 8, border: '1px solid #EDE7DF', overflow: 'hidden' },
      onClick: () => { setSelectedNodeId(null); setContextMenu(null); },
    },
      e('svg', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' } },
        bezierPaths.map((d, i) => e('path', { key: i, d, fill: 'none', stroke: '#D4C5B2', strokeWidth: 2 })),
      ),
      mindMapNodes.map(node =>
        e('div', {
          key: node.id, className: 'mindmap-node',
          style: {
            position: 'absolute', left: node.x, top: node.y,
            background: '#fff', border: selectedNodeId === node.id ? '2px solid #6B8DAE' : '1px solid #D4C5B2',
            borderRadius: 8, padding: '8px 14px', fontSize: 14, color: '#5C3D2E',
            boxShadow: '0 1px 4px rgba(92,61,46,0.08)', minWidth: 60, textAlign: 'center',
          },
          onMouseDown: (ev: React.MouseEvent) => handleMouseDown(ev, node.id),
          onDoubleClick: () => handleDoubleClick(node.id),
          onContextMenu: (ev: React.MouseEvent) => handleContextMenu(ev, node.id),
        },
          editingNodeId === node.id
            ? e('input', {
                className: 'mindmap-node-edit', value: editingNodeText, autoFocus: true,
                onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setEditingNodeText(ev.target.value),
                onBlur: handleSaveNodeText,
                onKeyDown: (ev: React.KeyboardEvent) => { if (ev.key === 'Enter') handleSaveNodeText(); },
                style: { border: '1px solid #6B8DAE', borderRadius: 4, padding: '2px 6px', fontSize: 14, outline: 'none', width: 100 },
              })
            : node.text,
          selectedNodeId === node.id
            ? e('button', {
                className: 'btn-hover',
                onClick: (ev: React.MouseEvent) => { ev.stopPropagation(); handleAddChildNode(node.id); },
                style: { display: 'block', marginTop: 4, padding: '2px 8px', fontSize: 11, background: '#6B8DAE', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
              }, '+ 子节点')
            : null,
        )
      ),
      contextMenu
        ? e('div', {
            style: {
              position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 200,
              background: '#fff', border: '1px solid #D4C5B2', borderRadius: 6,
              boxShadow: '0 4px 12px rgba(92,61,46,0.15)', padding: '4px 0',
            },
          },
            e('div', {
              onClick: () => handleDeleteNode(contextMenu.nodeId),
              style: { padding: '6px 16px', fontSize: 13, color: '#C62828', cursor: 'pointer' },
              onMouseEnter: (ev: React.MouseEvent<HTMLDivElement>) => { ev.currentTarget.style.background = '#FFF3E0'; },
              onMouseLeave: (ev: React.MouseEvent<HTMLDivElement>) => { ev.currentTarget.style.background = 'transparent'; },
            }, '删除节点'),
          )
        : null,
    ),
  );

  const showEditor = isCreatingNote || editingNote !== null;

  const rightCol = e('div', { className: 'detail-col', style: { width: '35%', padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column' } },
    e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
      e('h3', { style: { fontSize: 16, color: '#5C3D2E' } }, '读书笔记'),
      !showEditor
        ? e('button', {
            className: 'btn-hover', onClick: handleNewNote,
            style: { padding: '4px 12px', background: '#6B8DAE', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' },
          }, '新建笔记')
        : null,
    ),
    showEditor
      ? e('div', { style: { flex: 1, display: 'flex', flexDirection: 'column' } },
          e('div', { style: { display: 'flex', gap: 8, marginBottom: 12 } },
            e('button', {
              className: 'btn-hover', onClick: handleSaveNote,
              style: { padding: '6px 16px', background: '#6B8DAE', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
            }, '保存'),
            e('button', {
              className: 'btn-hover', onClick: handleCancelNote,
              style: { padding: '6px 16px', background: '#EDE7DF', color: '#5C3D2E', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
            }, '取消'),
          ),
          e('div', { style: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' } },
            ...NOTE_TAGS.map(tag =>
              e('label', {
                key: tag,
                style: {
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer',
                  padding: '2px 8px', borderRadius: 10,
                  background: noteTags.includes(tag) ? TAG_COLORS[tag].bg : '#EDE7DF',
                  color: noteTags.includes(tag) ? TAG_COLORS[tag].text : '#8D7B6A',
                  border: noteTags.includes(tag) ? '1px solid ' + TAG_COLORS[tag].text : '1px solid transparent',
                },
              },
                e('input', {
                  type: 'checkbox', checked: noteTags.includes(tag),
                  onChange: () => setNoteTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]),
                  style: { marginRight: 4 },
                }),
                tag,
              )
            ),
          ),
          e('div', { style: { flex: 1, display: 'flex', gap: 12, minHeight: 0 } },
            e('textarea', {
              value: noteContent,
              onChange: (ev: React.ChangeEvent<HTMLTextAreaElement>) => setNoteContent(ev.target.value),
              style: {
                flex: 1, padding: 12, border: '1px solid #D4C5B2', borderRadius: 8,
                fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'Source Sans 3, monospace',
              },
              placeholder: '输入 Markdown 内容...',
            }),
            e('div', {
              className: 'markdown-preview',
              style: { flex: 1, padding: 12, border: '1px solid #EDE7DF', borderRadius: 8, background: '#FAFAFA', overflowY: 'auto', fontSize: 14 },
            }, e(ReactMarkdown, null, noteContent)),
          ),
        )
      : e('div', { style: { flex: 1, overflowY: 'auto' } },
          sortedNotes.length === 0
            ? e('p', { style: { color: '#8D7B6A', fontSize: 14, textAlign: 'center', marginTop: 40 } }, '暂无笔记，点击新建开始记录')
            : sortedNotes.map(note =>
                e('div', {
                  key: note.id, className: 'note-card',
                  style: {
                    background: '#fff', borderRadius: 8, padding: 12, marginBottom: 10,
                    boxShadow: '0 1px 4px rgba(92,61,46,0.06)', cursor: 'pointer', border: '1px solid #EDE7DF',
                  },
                  onClick: () => handleEditNote(note),
                },
                  e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } },
                    e('span', { style: { fontSize: 12, color: '#8D7B6A' } }, format(new Date(note.createdAt), 'yyyy-MM-dd HH:mm')),
                    e('span', {
                      onClick: (ev: React.MouseEvent) => { ev.stopPropagation(); handleToggleStar(note); },
                      style: { cursor: 'pointer', fontSize: 16, color: note.isStarred ? '#FFB300' : '#D4C5B2' },
                    }, note.isStarred ? '★' : '☆'),
                  ),
                  note.tags.length > 0
                    ? e('div', { style: { display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' } },
                        ...note.tags.map(tag =>
                          e('span', { key: tag, className: 'tag-badge', style: { background: TAG_COLORS[tag].bg, color: TAG_COLORS[tag].text } }, tag)
                        ),
                      )
                    : null,
                  e('p', { style: { fontSize: 13, color: '#5C3D2E', lineHeight: 1.5, marginBottom: 4 } },
                    note.content.length > 100 ? note.content.slice(0, 100) + '...' : note.content),
                  e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                    e('span', { style: { fontSize: 11, color: '#8D7B6A' } }, note.wordCount + ' 字'),
                    e('button', {
                      className: 'btn-hover',
                      onClick: (ev: React.MouseEvent) => { ev.stopPropagation(); handleDeleteNote(note.id); },
                      style: {
                        padding: '1px 6px', fontSize: 11, color: '#C62828',
                        background: 'none', border: '1px solid #FFCDD2', borderRadius: 4, cursor: 'pointer',
                      },
                    }, '删除'),
                  ),
                ),
              ),
        ),
  );

  return e('div', {
    className: 'detail-three-col',
    style: { display: 'flex', gap: 16, padding: 16, height: 'calc(100vh - 60px)', overflow: 'hidden' },
  }, leftCol, centerCol, rightCol);
}
