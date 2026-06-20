import { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Input, Form, Button } from 'antd';
import { ArrowLeft, Plus, Play, Pause, Quote, Trash2, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import type { Note, Highlight } from '@/types';

const NOTE_COLORS = ['#6a994e', '#bc4749', '#e76f51', '#f4a261', '#2a9d8f'];

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) { result.push('</ul>'); inList = false; }
      continue;
    }
    if (/^### /.test(trimmed)) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h3>${trimmed.slice(4)}</h3>`);
    } else if (/^## /.test(trimmed)) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h2>${trimmed.slice(3)}</h2>`);
    } else if (/^# /.test(trimmed)) {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push(`<h1>${trimmed.slice(2)}</h1>`);
    } else if (/^- /.test(trimmed)) {
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(`<li>${trimmed.slice(2)}</li>`);
    } else {
      if (inList) { result.push('</ul>'); inList = false; }
      const processed = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      result.push(`<p>${processed}</p>`);
    }
  }
  if (inList) result.push('</ul>');
  return result.join('');
}

export default function BookDetail() {
  const navigate = useNavigate();
  const bookId = window.location.hash.split('/').pop() || '';

  const {
    books, chapters, notes, highlights,
    currentChapterId, setCurrentChapter,
    addChapter, addNote, deleteNote,
    addHighlight, deleteHighlight,
    updateProgress,
    startTimer, pauseTimer, tickTimer,
    timerRunning, timerSeconds, timerBookId, timerChapterId,
  } = useStore();

  const book = books.find(b => b.id === bookId);
  const bookChapters = useMemo(
    () => chapters.filter(c => c.bookId === bookId).sort((a, b) => a.order - b.order),
    [chapters, bookId]
  );
  const chapterNotes = useMemo(
    () => notes.filter(n => n.chapterId === currentChapterId),
    [notes, currentChapterId]
  );
  const chapterHighlights = useMemo(
    () => highlights.filter(h => h.chapterId === currentChapterId),
    [highlights, currentChapterId]
  );

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [chapterInputVisible, setChapterInputVisible] = useState(false);
  const [chapterName, setChapterName] = useState('');
  const [isTablet, setIsTablet] = useState(() => window.innerWidth <= 768);
  const [pageInputVisible, setPageInputVisible] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    const onResize = () => setIsTablet(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!currentChapterId && bookChapters.length > 0) {
      setCurrentChapter(bookChapters[0].id);
    }
  }, [currentChapterId, bookChapters, setCurrentChapter]);

  const isTimerForThisChapter = timerBookId === bookId && timerChapterId === currentChapterId;
  const displaySeconds = isTimerForThisChapter ? timerSeconds : 0;
  const isRunning = timerRunning && isTimerForThisChapter;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tickTimer]);

  const handleStartTimer = useCallback(() => {
    if (currentChapterId) startTimer(bookId, currentChapterId);
  }, [bookId, currentChapterId, startTimer]);

  const handlePauseTimer = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  const handleAddChapter = useCallback(() => {
    if (!chapterName.trim()) return;
    addChapter({ id: uuidv4(), bookId, name: chapterName.trim(), order: bookChapters.length });
    setChapterName('');
    setChapterInputVisible(false);
  }, [chapterName, addChapter, bookId, bookChapters.length]);

  const handleAddNote = useCallback(() => {
    if (!noteContent.trim() || !currentChapterId) return;
    addNote({ id: uuidv4(), chapterId: currentChapterId, content: noteContent.trim(), createdAt: new Date().toISOString() });
    setNoteContent('');
    setNoteModalOpen(false);
  }, [noteContent, currentChapterId, addNote]);

  const handleAddHighlight = useCallback(() => {
    const values = form.getFieldsValue();
    if (!values.text?.trim() || !currentChapterId) return;
    addHighlight({
      id: uuidv4(),
      chapterId: currentChapterId,
      text: values.text.trim(),
      pageLocation: values.pageLocation?.trim() || '',
      createdAt: new Date().toISOString(),
    });
    form.resetFields();
    setHighlightModalOpen(false);
  }, [currentChapterId, addHighlight, form]);

  const handleChapterClick = useCallback((chapterId: string) => {
    if (isRunning) pauseTimer();
    setCurrentChapter(chapterId);
  }, [isRunning, pauseTimer, setCurrentChapter]);

  const handlePageSubmit = useCallback(() => {
    const page = parseInt(pageInputValue, 10);
    if (!isNaN(page) && page >= 0 && page <= (book?.totalPages ?? 0)) {
      updateProgress(bookId, page);
    }
    setPageInputVisible(false);
    setPageInputValue('');
  }, [pageInputValue, bookId, book?.totalPages, updateProgress]);

  if (!book) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#999' }}>
        未找到书籍
      </div>
    );
  }

  const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;

  const chapterList = isTablet ? (
    <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #e5e5e5', background: '#fff', flexShrink: 0 }}>
      {bookChapters.map(ch => (
        <button
          key={ch.id}
          onClick={() => handleChapterClick(ch.id)}
          style={{
            padding: '10px 16px',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontSize: 14,
            background: currentChapterId === ch.id ? '#6a994e' : 'transparent',
            color: currentChapterId === ch.id ? '#fff' : '#333',
            transition: 'background 0.2s',
          }}
        >
          {ch.name}
        </button>
      ))}
      {chapterInputVisible ? (
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', gap: 4 }}>
          <input
            value={chapterName}
            onChange={e => setChapterName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setChapterInputVisible(false); }}
            placeholder="章节名"
            autoFocus
            style={{ padding: '2px 6px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 13, width: 80, outline: 'none' }}
          />
          <button onClick={handleAddChapter} style={{ padding: '2px 8px', background: '#6a994e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>✓</button>
        </div>
      ) : (
        <button
          onClick={() => setChapterInputVisible(true)}
          style={{ padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#6a994e', fontSize: 14 }}
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  ) : (
    <div style={{ width: 280, borderRight: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', background: '#fff', flexShrink: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {bookChapters.map((ch, idx) => (
          <div key={ch.id}>
            <button
              onClick={() => handleChapterClick(ch.id)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                background: currentChapterId === ch.id ? '#6a994e' : 'transparent',
                color: currentChapterId === ch.id ? '#fff' : '#333',
                transition: 'background 0.2s',
              }}
            >
              {ch.name}
            </button>
            {idx < bookChapters.length - 1 && <div style={{ height: 1, background: '#f0f0f0' }} />}
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #e5e5e5' }}>
        {chapterInputVisible ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={chapterName}
              onChange={e => setChapterName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddChapter(); if (e.key === 'Escape') setChapterInputVisible(false); }}
              placeholder="章节名称"
              autoFocus
              style={{ flex: 1, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 14, outline: 'none' }}
            />
            <button onClick={handleAddChapter} style={{ padding: '4px 12px', background: '#6a994e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>确定</button>
          </div>
        ) : (
          <button
            onClick={() => setChapterInputVisible(true)}
            style={{
              width: '100%', padding: '8px', background: 'transparent', border: '1px dashed #6a994e',
              borderRadius: 4, color: '#6a994e', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <Plus size={16} /> 添加章节
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fafaf8' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e5e5', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, border: 'none', borderRadius: 8,
              background: '#f5f5f5', cursor: 'pointer', color: '#333',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</h1>
            <div style={{ color: '#666', fontSize: 14, marginTop: 2 }}>{book.author}{book.publisher ? ` · ${book.publisher}` : ''}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#999" />
            <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, letterSpacing: 1 }}>{formatTimer(displaySeconds)}</span>
            <button
              onClick={isRunning ? handlePauseTimer : handleStartTimer}
              disabled={!currentChapterId}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, border: 'none', borderRadius: '50%',
                background: isRunning ? '#bc4749' : '#6a994e', cursor: currentChapterId ? 'pointer' : 'not-allowed',
                color: '#fff', opacity: currentChapterId ? 1 : 0.5,
              }}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #6a994e, #a7c957)', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
          {pageInputVisible ? (
            <input
              value={pageInputValue}
              onChange={e => setPageInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handlePageSubmit(); if (e.key === 'Escape') setPageInputVisible(false); }}
              onBlur={handlePageSubmit}
              placeholder={String(book.currentPage)}
              autoFocus
              style={{ width: 50, padding: '2px 6px', border: '1px solid #6a994e', borderRadius: 4, fontSize: 12, textAlign: 'center', outline: 'none' }}
            />
          ) : (
            <span
              onClick={() => { setPageInputValue(String(book.currentPage)); setPageInputVisible(true); }}
              style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              {book.currentPage} / {book.totalPages}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: isTablet ? 'column' : 'row', overflow: 'hidden' }}>
        {chapterList}

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {!currentChapterId ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999', fontSize: 16 }}>
              请选择或添加章节
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <Button icon={<Plus size={14} />} onClick={() => setNoteModalOpen(true)}>添加笔记</Button>
                <Button icon={<Plus size={14} />} onClick={() => setHighlightModalOpen(true)}>添加高亮</Button>
              </div>

              {chapterNotes.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#333' }}>笔记</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {chapterNotes.map((note, idx) => (
                      <div key={note.id} style={{ display: 'flex', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ width: 4, background: NOTE_COLORS[idx % NOTE_COLORS.length], flexShrink: 0 }} />
                        <div style={{ flex: 1, padding: '12px 16px', minWidth: 0 }}>
                          <div
                            style={{ fontSize: 14, lineHeight: 1.6, wordBreak: 'break-word' }}
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <span style={{ fontSize: 12, color: '#999' }}>{dayjs(note.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                            <button
                              onClick={() => deleteNote(note.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: '#bbb', cursor: 'pointer', fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
                              onMouseEnter={e => e.currentTarget.style.color = '#bc4749'}
                              onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
                            >
                              <Trash2 size={14} /> 删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chapterHighlights.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#333' }}>高亮</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {chapterHighlights.map(hl => (
                      <div key={hl.id} style={{ display: 'flex', background: '#fff', borderRadius: 8, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <Quote size={20} color="#d4c9b0" style={{ flexShrink: 0, marginRight: 12, marginTop: 2 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#444', fontStyle: 'italic', wordBreak: 'break-word' }}>{hl.text}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {hl.pageLocation && (
                                <span style={{ fontSize: 11, background: '#f0ece4', color: '#8b7e6a', padding: '2px 8px', borderRadius: 10 }}>{hl.pageLocation}</span>
                              )}
                              <span style={{ fontSize: 12, color: '#999' }}>{dayjs(hl.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                            </div>
                            <button
                              onClick={() => deleteHighlight(hl.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: '#bbb', cursor: 'pointer', fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
                              onMouseEnter={e => e.currentTarget.style.color = '#bc4749'}
                              onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
                            >
                              <Trash2 size={14} /> 删除
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chapterNotes.length === 0 && chapterHighlights.length === 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: '#ccc', fontSize: 15 }}>
                  暂无笔记和高亮
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        title="添加笔记"
        open={noteModalOpen}
        onOk={handleAddNote}
        onCancel={() => { setNoteModalOpen(false); setNoteContent(''); }}
        okText="添加"
        cancelText="取消"
        okButtonProps={{ disabled: !noteContent.trim() }}
      >
        <Input.TextArea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          rows={6}
          placeholder="输入笔记内容..."
          style={{ marginBottom: 8 }}
        />
        <div style={{ fontSize: 12, color: '#999' }}>支持 Markdown：**粗体**、# 标题、- 列表</div>
      </Modal>

      <Modal
        title="添加高亮"
        open={highlightModalOpen}
        onOk={handleAddHighlight}
        onCancel={() => { setHighlightModalOpen(false); form.resetFields(); }}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="text" label="高亮内容" rules={[{ required: true, message: '请输入高亮内容' }]}>
            <Input.TextArea rows={4} placeholder="输入高亮文本..." />
          </Form.Item>
          <Form.Item name="pageLocation" label="页码位置">
            <Input placeholder="例如：p.45" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
