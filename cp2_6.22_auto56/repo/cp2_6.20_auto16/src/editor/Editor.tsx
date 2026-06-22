import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Save, UserPlus, Plus, MessageCircle, Send, X } from 'lucide-react';
import clsx from 'clsx';
import type { PoemLine, Annotation, TonalResult, Collaborator } from '../types';
import { useStore } from '../store';
import { poemApi, annotationApi, collaboratorApi } from '../utils/api';
import { playSaveSound, playInviteSound, playDropSound, playClickSound, playErrorSound } from '../utils/audio';
import { checkTonalPattern } from './RhymeChecker';
import { useWebSocket } from '../hooks/useWebSocket';

interface AnnotationBubbleProps {
  annotation: Annotation;
  onReply: (annotationId: string, content: string) => void;
  isMobile: boolean;
  onClick: () => void;
}

const AnnotationBubble: React.FC<AnnotationBubbleProps> = ({ annotation, onReply, isMobile, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const currentUser = useStore((s) => s.currentUser);

  const handleReplySubmit = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onReply(annotation.id, trimmed);
    setReplyText('');
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleReplySubmit();
    }
  };

  const handleBubbleClick = () => {
    onClick();
    setExpanded((prev) => !prev);
  };

  if (isMobile && expanded) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-annot-50 p-4 shadow-2xl animate-bubble-expand">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bark-200 text-xs font-bold text-bark-600">
              {annotation.authorName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-ink-500">{annotation.authorName}</span>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="rounded-full p-1 text-ink-200 hover:bg-rice-300 hover:text-ink-500"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mb-2 text-sm text-ink-500">{annotation.content}</p>
        {annotation.highlightedText && (
          <p className="mb-2 text-xs italic text-bark-300">「{annotation.highlightedText}」</p>
        )}
        {annotation.replies.length > 0 && (
          <div className="mb-3 max-h-32 space-y-2 overflow-y-auto">
            {annotation.replies.map((reply) => (
              <div key={reply.id} className="rounded-lg bg-white/60 px-3 py-2">
                <span className="text-xs font-medium text-bark-400">{reply.authorName}</span>
                <p className="mt-0.5 text-xs text-ink-400">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleReplyKeyDown}
            placeholder="回复批注..."
            className="flex-1 rounded-lg border border-rice-300 bg-white/80 px-3 py-2 text-sm text-ink-500 outline-none placeholder:text-ink-100 focus:border-bark-300"
          />
          <button
            onClick={handleReplySubmit}
            disabled={!replyText.trim()}
            className="rounded-lg bg-bark-400 p-2 text-white disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={handleBubbleClick}
        className="annotation-bubble flex items-center gap-1 rounded-full px-2 py-1 text-xs text-bark-500 transition-colors hover:bg-annot-200"
      >
        <MessageCircle size={12} />
        <span>{annotation.authorName}</span>
      </button>
    );
  }

  return (
    <div className="annotation-bubble animate-bubble-expand absolute right-0 top-0 z-40 w-64 rounded-xl p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bark-200 text-[10px] font-bold text-bark-600">
            {annotation.authorName.charAt(0)}
          </div>
          <span className="text-xs font-medium text-ink-500">{annotation.authorName}</span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="rounded-full p-0.5 text-ink-200 hover:text-ink-500"
        >
          <X size={12} />
        </button>
      </div>
      <p className="mb-1.5 text-xs leading-relaxed text-ink-500">{annotation.content}</p>
      {annotation.highlightedText && (
        <p className="mb-1.5 text-[10px] italic text-bark-300">「{annotation.highlightedText}」</p>
      )}
      {annotation.replies.length > 0 && (
        <div className="mb-2 max-h-24 space-y-1.5 overflow-y-auto">
          {annotation.replies.map((reply) => (
            <div key={reply.id} className="rounded-md bg-white/50 px-2 py-1.5">
              <span className="text-[10px] font-medium text-bark-400">{reply.authorName}</span>
              <p className="mt-0.5 text-[10px] text-ink-400">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleReplyKeyDown}
          placeholder="回复..."
          className="flex-1 rounded-md border border-rice-300 bg-white/70 px-2 py-1 text-[10px] text-ink-500 outline-none placeholder:text-ink-100 focus:border-bark-300"
        />
        <button
          onClick={handleReplySubmit}
          disabled={!replyText.trim()}
          className="rounded-md bg-bark-400 p-1 text-white disabled:opacity-40"
        >
          <Send size={10} />
        </button>
      </div>
    </div>
  );
};

const RHYME_MARKS = ['押韵', '不押'];

const Editor: React.FC = () => {
  const currentPoem = useStore((s) => s.currentPoem);
  const tonalResults = useStore((s) => s.tonalResults);
  const annotations = useStore((s) => s.annotations);
  const collaborators = useStore((s) => s.collaborators);
  const currentUser = useStore((s) => s.currentUser);
  const updatePoemLine = useStore((s) => s.updatePoemLine);
  const addPoemLine = useStore((s) => s.addPoemLine);
  const setTonalResults = useStore((s) => s.setTonalResults);
  const setCurrentPoem = useStore((s) => s.setCurrentPoem);
  const addAnnotationReply = useStore((s) => s.addAnnotationReply);
  const setCollaborators = useStore((s) => s.setCollaborators);
  const setAnnotations = useStore((s) => s.setAnnotations);
  const addAnnotation = useStore((s) => s.addAnnotation);

  const { send } = useWebSocket(currentPoem?.id ?? null);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showAnnotationInput, setShowAnnotationInput] = useState(false);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const [annotationBtnPosition, setAnnotationBtnPosition] = useState<{ top: number; left: number } | null>(null);

  const [isDraggingOverEditor, setIsDraggingOverEditor] = useState(false);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tonalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevErrorStateRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleWindowDragEnd = () => {
      setIsDraggingOverEditor(false);
      setInsertPosition(null);
    };
    window.addEventListener('dragend', handleWindowDragEnd);
    return () => window.removeEventListener('dragend', handleWindowDragEnd);
  }, []);

  useEffect(() => {
    if (!currentPoem?.id) return;
    const poemId = currentPoem.id;

    const loadData = async () => {
      try {
        const [annotRes, collabRes] = await Promise.allSettled([
          annotationApi.list(poemId),
          collaboratorApi.list(poemId),
        ]);

        if (annotRes.status === 'fulfilled') {
          const annData = annotRes.value.data;
          if (Array.isArray(annData)) {
            setAnnotations(annData);
          }
        }

        if (collabRes.status === 'fulfilled') {
          const collabData = collabRes.value.data;
          if (Array.isArray(collabData)) {
            setCollaborators(collabData);
          }
        }
      } catch {
      }
    };

    loadData();
  }, [currentPoem?.id, setAnnotations, setCollaborators]);

  const runTonalCheck = useCallback(
    (lines: PoemLine[]) => {
      if (tonalTimerRef.current) clearTimeout(tonalTimerRef.current);
      tonalTimerRef.current = setTimeout(() => {
        try {
          const results = checkTonalPattern(lines);
          setTonalResults(results);

          const hasNewErrors = results.some((r) => r.errors.length > 0);
          if (hasNewErrors) {
            const currentErrorIds = new Set(results.filter((r) => r.errors.length > 0).map((r) => r.lineId));
            let newErrorFound = false;
            currentErrorIds.forEach((id) => {
              if (!prevErrorStateRef.current.has(id)) {
                newErrorFound = true;
              }
            });
            if (newErrorFound) {
              playErrorSound();
            }
            prevErrorStateRef.current = currentErrorIds;
          } else {
            prevErrorStateRef.current.clear();
          }
        } catch {
          setTonalResults([]);
        }
      }, 300);
    },
    [setTonalResults],
  );

  useEffect(() => {
    if (currentPoem && currentPoem.lines.length > 0) {
      runTonalCheck(currentPoem.lines);
    } else {
      setTonalResults([]);
    }
    return () => {
      if (tonalTimerRef.current) clearTimeout(tonalTimerRef.current);
    };
  }, [currentPoem?.lines, runTonalCheck, setTonalResults]);

  const getTonalResult = useCallback(
    (lineId: string): TonalResult | undefined => tonalResults.find((r) => r.lineId === lineId),
    [tonalResults],
  );

  const getLineAnnotations = useCallback(
    (lineId: string): Annotation[] => annotations.filter((a) => a.lineId === lineId),
    [annotations],
  );

  const handleTextSelection = useCallback(
    (lineId: string, e: React.MouseEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      const start = target.selectionStart ?? 0;
      const end = target.selectionEnd ?? 0;

      if (start !== end && target.value) {
        const rect = target.getBoundingClientRect();
        const editorRect = editorRef.current?.getBoundingClientRect();
        setSelectedLineId(lineId);
        setSelectionStart(start);
        setSelectionEnd(end);
        setAnnotationBtnPosition({
          top: rect.top - (editorRect?.top ?? 0) - 32,
          left: rect.left - (editorRect?.left ?? 0) + (rect.width / 2) - 30,
        });
      }
    },
    [],
  );

  const handleAddAnnotationClick = () => {
    playClickSound();
    setShowAnnotationInput(true);
    setAnnotationBtnPosition(null);
  };

  const handleAnnotationSubmit = useCallback(async () => {
    if (!currentPoem || !selectedLineId || !newAnnotationText.trim()) return;
    const trimmedText = newAnnotationText.trim();
    const line = currentPoem.lines.find((l) => l.id === selectedLineId);
    if (!line) return;

    const highlightedText = line.text.slice(selectionStart, selectionEnd);

    try {
      const res = await annotationApi.create(currentPoem.id, {
        lineId: selectedLineId,
        authorId: currentUser.id,
        startOffset: selectionStart,
        endOffset: selectionEnd,
        highlightedText,
        content: trimmedText,
      });

      const annotation = res.data as Annotation;
      addAnnotation(annotation);
      send({ type: 'annotation_add', poemId: currentPoem.id, payload: annotation });
      playClickSound();
    } catch {
    } finally {
      setShowAnnotationInput(false);
      setNewAnnotationText('');
      setSelectedLineId(null);
    }
  }, [currentPoem, selectedLineId, selectionStart, selectionEnd, newAnnotationText, currentUser.id, addAnnotation, send]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!currentPoem) return;
      setCurrentPoem({ ...currentPoem, title: e.target.value });
    },
    [currentPoem, setCurrentPoem],
  );

  const handleLineTextChange = useCallback(
    (lineId: string, text: string) => {
      updatePoemLine(lineId, { text, charCount: text.length });
    },
    [updatePoemLine],
  );

  const handleRhymeMarkChange = useCallback(
    (lineId: string, rhymeMark: string) => {
      playClickSound();
      updatePoemLine(lineId, { rhymeMark });
    },
    [updatePoemLine],
  );

  const handleAddLine = useCallback(() => {
    playClickSound();
    if (!currentPoem) return;
    const order = currentPoem.lines.length;
    addPoemLine({
      id: uuidv4(),
      text: '',
      rhymeMark: '不押',
      charCount: 0,
      order,
    });
  }, [currentPoem, addPoemLine]);

  const handleSave = useCallback(async () => {
    if (!currentPoem) return;
    setSaving(true);
    try {
      await poemApi.update(currentPoem.id, {
        title: currentPoem.title,
        lines: currentPoem.lines.map(({ id, text, rhymeMark, charCount, order }) => ({
          id,
          text,
          rhymeMark,
          charCount,
          order,
        })),
      });
      send({ type: 'line_update', poemId: currentPoem.id, payload: { lines: currentPoem.lines } });
      playSaveSound();
    } catch {
    } finally {
      setSaving(false);
    }
  }, [currentPoem, send]);

  const handleInvite = useCallback(async () => {
    if (!currentPoem || !inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await collaboratorApi.invite(currentPoem.id, { email: inviteEmail.trim() });
      playInviteSound();
      const newCollab = res.data as Collaborator;
      setCollaborators([...collaborators, newCollab]);
      setInviteEmail('');
      setInviteModalOpen(false);
    } catch {
      setInviteError('邀请失败，请检查邮箱地址');
    } finally {
      setInviteLoading(false);
    }
  }, [currentPoem, inviteEmail, collaborators, setCollaborators]);

  const handleAnnotationReply = useCallback(
    async (annotationId: string, content: string) => {
      if (!currentPoem) return;
      try {
        const res = await annotationApi.reply(currentPoem.id, annotationId, {
          authorId: currentUser.id,
          content,
        });
        const reply = res.data;
        addAnnotationReply(annotationId, reply);
      } catch {
      }
    },
    [currentPoem, currentUser.id, addAnnotationReply],
  );

  const handleAnnotationBubbleClick = () => {
    playClickSound();
  };

  const handleOpenInviteModal = () => {
    playClickSound();
    setInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    playClickSound();
    setInviteModalOpen(false);
    setInviteError('');
    setInviteEmail('');
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverEditor(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.target === e.currentTarget) {
      setIsDraggingOverEditor(false);
      setInsertPosition(null);
    }
  }, []);

  const computeInsertPosition = useCallback((clientY: number, lines: PoemLine[]) => {
    if (lines.length === 0) {
      return 0;
    }

    let pos = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineEl = lineRefs.current[lines[i].id];
      if (lineEl) {
        const rect = lineEl.getBoundingClientRect();
        const lineMiddleY = rect.top + rect.height / 2;
        if (clientY < lineMiddleY) {
          return i;
        }
        pos = i + 1;
      }
    }
    return pos;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (currentPoem) {
        const pos = computeInsertPosition(e.clientY, currentPoem.lines);
        setInsertPosition(pos);
      }
    },
    [currentPoem, computeInsertPosition],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOverEditor(false);
      const cardData = e.dataTransfer.getData('application/inspiration-card');
      if (!cardData || !currentPoem) return;
      try {
        const card = JSON.parse(cardData);
        if (!card.content) return;
        const insertIdx = insertPosition != null ? insertPosition : currentPoem.lines.length;
        const newLine: PoemLine = {
          id: uuidv4(),
          text: card.content,
          rhymeMark: '不押',
          charCount: card.content.length,
          order: insertIdx,
        };
        const updatedLines = [...currentPoem.lines];
        updatedLines.splice(insertIdx, 0, newLine);
        const reOrderedLines = updatedLines.map((ln, idx) => ({ ...ln, order: idx }));
        setCurrentPoem({ ...currentPoem, lines: reOrderedLines });
        send({
          type: 'card_drag',
          poemId: currentPoem.id,
          payload: {
            cardId: card.id,
            cardContent: card.content,
            userId: currentUser.id,
          },
        });
        playDropSound();
      } catch {
      } finally {
        setInsertPosition(null);
      }
    },
    [currentPoem, insertPosition, setCurrentPoem, send, currentUser.id],
  );

  const handleEditorClick = () => {
    setAnnotationBtnPosition(null);
  };

  if (!currentPoem) {
    return (
      <div className="flex h-full items-center justify-center text-ink-200">
        <p className="text-lg">请选择一首诗开始编辑</p>
      </div>
    );
  }

  const getSelectedLineText = () => {
    if (!selectedLineId) return '';
    const line = currentPoem.lines.find((l) => l.id === selectedLineId);
    return line ? line.text.slice(selectionStart, selectionEnd) : '';
  };

  const buildHighlightedSegments = (line: PoemLine) => {
    const lineAnns = getLineAnnotations(line.id).sort((a, b) => a.startOffset - b.startOffset);
    const segments: Array<{ text: string; highlighted: boolean }> = [];
    let cursor = 0;

    for (const ann of lineAnns) {
      if (ann.startOffset > cursor) {
        segments.push({ text: line.text.slice(cursor, ann.startOffset), highlighted: false });
      }
      segments.push({ text: line.text.slice(ann.startOffset, ann.endOffset), highlighted: true });
      cursor = ann.endOffset;
    }

    if (cursor < line.text.length) {
      segments.push({ text: line.text.slice(cursor), highlighted: false });
    }

    if (segments.length === 0 && line.text) {
      segments.push({ text: line.text, highlighted: false });
    }

    return segments;
  };

  return (
    <div className={clsx('flex h-full flex-col', isMobile && 'w-full')}>
      <div className="flex items-center justify-between border-b border-rice-300 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          {collaborators.length > 0 && (
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  title={c.userName}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-rice-100 bg-bark-200 text-[10px] font-bold text-bark-600"
                >
                  {c.userName.charAt(0)}
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-rice-100 bg-rice-300 text-[10px] text-ink-300">
                  +{collaborators.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInviteModal}
            className="flex items-center gap-1.5 rounded-lg border border-rice-300 bg-rice-50 px-3 py-1.5 text-sm text-bark-400 transition-colors hover:bg-rice-200"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">邀请协作</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-bark-500 px-4 py-1.5 text-sm text-white transition-colors hover:bg-bark-600 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        className={clsx(
          'scroll-paper relative flex-1 overflow-y-auto px-4 py-6 md:px-12 md:py-8 transition-all duration-200 ease-out',
          isMobile && 'px-3 py-4',
          isDraggingOverEditor && 'ring-2 ring-jade-300 ring-offset-2 ring-offset-rice-100',
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleEditorClick}
      >
        {annotationBtnPosition && (
          <div
            className="absolute z-30"
            style={{ top: annotationBtnPosition.top, left: annotationBtnPosition.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleAddAnnotationClick}
              className="rounded-md bg-bark-500 px-2.5 py-1 text-[11px] text-white shadow-lg transition-colors hover:bg-bark-600"
            >
              添加批注
            </button>
          </div>
        )}

        <div className={clsx('mx-auto', isMobile ? 'max-w-full' : 'max-w-3xl')}>
          <input
            value={currentPoem.title}
            onChange={handleTitleChange}
            placeholder="诗题"
            className="mb-8 w-full border-none bg-transparent text-center font-serif text-2xl font-bold text-ink-500 outline-none placeholder:text-ink-100 md:text-3xl"
          />

          <div className="space-y-2">
            {isDraggingOverEditor && insertPosition === 0 && (
              <div className="relative transition-all duration-200 ease-out">
                <div className="absolute left-0 top-1/2 z-20 h-2 w-2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-blue-500" />
                <div
                  className="h-[3px] w-full transition-all duration-200 ease-out"
                  style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)' }}
                />
              </div>
            )}

            {currentPoem.lines.map((line, index) => {
              const tonalResult = getTonalResult(line.id);
              const hasTonalError = tonalResult != null && tonalResult.errors.length > 0;
              const lineAnnotations = getLineAnnotations(line.id);
              const hasAnnotations = lineAnnotations.length > 0;
              const segments = buildHighlightedSegments(line);
              const showInsertAfter = isDraggingOverEditor && insertPosition === index + 1;

              return (
                <React.Fragment key={line.id}>
                  <div
                    ref={(el) => {
                      lineRefs.current[line.id] = el;
                    }}
                    className={clsx(
                      'line-hover-float group relative flex items-center gap-2 rounded-lg px-3 py-2 md:px-4 md:py-2.5',
                      hasTonalError ? 'bg-red-50/40' : hasAnnotations ? 'bg-annot-50/30' : 'bg-transparent',
                    )}
                  >
                    <span className="w-6 shrink-0 text-right text-xs text-ink-100 select-none">
                      {index + 1}
                    </span>

                    <div className="relative flex-1">
                      <div className="relative">
                        {hasAnnotations && (
                          <div className="pointer-events-none absolute inset-0 flex items-center font-serif text-lg text-transparent md:text-xl" aria-hidden>
                            {segments.map((seg, i) => (
                              <span
                                key={i}
                                className={clsx(
                                  seg.highlighted && 'bg-annot-100 rounded px-0.5',
                                )}
                              >
                                {seg.text || '\u200b'}
                              </span>
                            ))}
                          </div>
                        )}
                        <input
                          value={line.text}
                          onChange={(e) => handleLineTextChange(line.id, e.target.value)}
                          onMouseUp={(e) => handleTextSelection(line.id, e)}
                          placeholder="输入诗句..."
                          className={clsx(
                            'relative z-10 w-full border-none bg-transparent font-serif text-lg text-ink-500 outline-none placeholder:text-ink-100 md:text-xl',
                            hasTonalError && 'rhyme-error',
                          )}
                        />
                      </div>
                      {hasTonalError && tonalResult && (
                        <div className="mt-0.5 space-y-0.5">
                          {tonalResult.errors.map((err, ei) => (
                            <p key={ei} className="text-[10px] text-red-500">
                              第{err.position + 1}字「{err.char}」应为{err.expected}，实为{err.actual}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="shrink-0 text-[10px] text-ink-100 tabular-nums">
                      {line.charCount}
                    </span>

                    <select
                      value={line.rhymeMark}
                      onChange={(e) => handleRhymeMarkChange(line.id, e.target.value)}
                      className={clsx(
                        'shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] outline-none',
                        line.rhymeMark === '押韵'
                          ? 'border-bark-200 bg-bark-50 text-bark-500'
                          : 'border-rice-300 bg-rice-50 text-ink-200',
                      )}
                    >
                      {RHYME_MARKS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    {lineAnnotations.length > 0 && (
                      <div className={clsx('relative shrink-0', isMobile ? 'static' : '')}>
                        <AnnotationBubble
                          annotation={lineAnnotations[0]}
                          onReply={handleAnnotationReply}
                          isMobile={isMobile}
                          onClick={handleAnnotationBubbleClick}
                        />
                      </div>
                    )}
                  </div>

                  {showInsertAfter && (
                    <div className="relative transition-all duration-200 ease-out">
                      <div className="absolute left-0 top-1/2 z-20 h-2 w-2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-blue-500" />
                      <div
                        className="h-[3px] w-full transition-all duration-200 ease-out"
                        style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)' }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {isDraggingOverEditor && currentPoem.lines.length > 0 && insertPosition === currentPoem.lines.length && (
              <div className="relative transition-all duration-200 ease-out">
                <div className="absolute left-0 top-1/2 z-20 h-2 w-2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-blue-500" />
                <div
                  className="h-[3px] w-full transition-all duration-200 ease-out"
                  style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)' }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleAddLine}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-rice-400 py-2.5 text-sm text-ink-200 transition-colors hover:border-bark-300 hover:text-bark-400"
          >
            <Plus size={14} />
            <span>添加诗句</span>
          </button>
        </div>
      </div>

      {showAnnotationInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setShowAnnotationInput(false); setSelectedLineId(null); }}>
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-annot-50 p-6 shadow-xl animate-bubble-expand"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-500">添加批注</h3>
              <button
                onClick={() => { setShowAnnotationInput(false); setSelectedLineId(null); setNewAnnotationText(''); }}
                className="rounded-full p-1 text-ink-200 hover:text-ink-500"
              >
                <X size={16} />
              </button>
            </div>
            {getSelectedLineText() && (
              <div className="mb-3 rounded-lg bg-rice-100 p-3">
                <p className="mb-1 text-[10px] text-bark-400">选中文字：</p>
                <p className="text-sm italic text-ink-400">「{getSelectedLineText()}」</p>
              </div>
            )}
            <textarea
              value={newAnnotationText}
              onChange={(e) => setNewAnnotationText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnnotationSubmit();
              }}
              placeholder="输入批注内容..."
              rows={4}
              className="mb-3 w-full resize-none rounded-lg border border-rice-300 bg-white/80 px-4 py-2.5 text-sm text-ink-500 outline-none placeholder:text-ink-100 focus:border-bark-300"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAnnotationInput(false); setSelectedLineId(null); setNewAnnotationText(''); }}
                className="flex-1 rounded-lg border border-rice-300 bg-rice-50 py-2.5 text-sm text-ink-300 transition-colors hover:bg-rice-100"
              >
                取消
              </button>
              <button
                onClick={handleAnnotationSubmit}
                disabled={!newAnnotationText.trim()}
                className="flex-1 rounded-lg bg-bark-500 py-2.5 text-sm text-white transition-colors hover:bg-bark-600 disabled:opacity-50"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-annot-50 p-6 shadow-xl animate-bubble-expand">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-500">邀请协作</h3>
              <button
                onClick={handleCloseInviteModal}
                className="rounded-full p-1 text-ink-200 hover:text-ink-500"
              >
                <X size={16} />
              </button>
            </div>
            <input
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInvite();
              }}
              placeholder="输入协作者邮箱"
              type="email"
              className="mb-2 w-full rounded-lg border border-rice-300 bg-white/80 px-4 py-2.5 text-sm text-ink-500 outline-none placeholder:text-ink-100 focus:border-bark-300"
            />
            {inviteError && <p className="mb-2 text-xs text-red-500">{inviteError}</p>}
            <button
              onClick={handleInvite}
              disabled={inviteLoading || !inviteEmail.trim()}
              className="w-full rounded-lg bg-bark-500 py-2.5 text-sm text-white transition-colors hover:bg-bark-600 disabled:opacity-50"
            >
              {inviteLoading ? '发送中...' : '发送邀请'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
