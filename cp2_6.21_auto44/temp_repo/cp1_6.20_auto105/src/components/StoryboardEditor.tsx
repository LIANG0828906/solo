import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import type { CardAnimation, Storyboard, StoryboardCard } from '../types';
import { api } from '../api/client';
import { TimelinePanel } from './TimelinePanel';
import { useLazyLoad } from '../hooks/useLazyLoad';

interface Props {
  id: string;
  onNavigate: (route: { name: 'viewer' | 'list'; id?: string }) => void;
  notify: (msg: string) => void;
}

const ANIM_OPTIONS: { value: CardAnimation; label: string }[] = [
  { value: 'none', label: '无动画' },
  { value: 'slideLeft', label: '从左向右滑入' },
  { value: 'slideUp', label: '从下向上滑动' },
  { value: 'zoomFade', label: '缩放淡入' },
];

const LazyCardImg: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => {
  const { ref, visible } = useLazyLoad<HTMLDivElement>();
  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      {visible && src ? (
        <img src={src} alt={alt || ''} loading="lazy" />
      ) : null}
    </div>
  );
};

export const StoryboardEditor: React.FC<Props> = ({ id, onNavigate, notify }) => {
  const [sb, setSb] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [removing, setRemoving] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetIdx = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getStoryboard(id);
        setSb(data);
      } catch (err) {
        notify('加载失败：' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, notify]);

  const save = useCallback(
    async (patch: Partial<Storyboard>) => {
      if (!sb) return;
      setSaving(true);
      try {
        const merged = { ...sb, ...patch };
        const updated = await api.updateStoryboard(sb.id, merged);
        setSb(updated);
      } catch (err) {
        notify('保存失败：' + (err as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [sb, notify]
  );

  const reorder = (list: StoryboardCard[], from: number, to: number) => {
    const result = [...list];
    const [moved] = result.splice(from, 1);
    result.splice(to, 0, moved);
    return result;
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !sb) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const newCards = reorder(sb.cards, from, to);
    setSb({ ...sb, cards: newCards });
    if (selectedIdx === from) setSelectedIdx(to);
    else if (from < selectedIdx && to >= selectedIdx) setSelectedIdx(selectedIdx - 1);
    else if (from > selectedIdx && to <= selectedIdx) setSelectedIdx(selectedIdx + 1);
    void save({ cards: newCards });
  };

  const updateCardAt = (idx: number, patch: Partial<StoryboardCard>) => {
    if (!sb) return;
    const cards = sb.cards.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    setSb({ ...sb, cards });
  };

  const updateCardAtAndSave = (idx: number, patch: Partial<StoryboardCard>) => {
    updateCardAt(idx, patch);
    if (sb) void save({ cards: sb.cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)) });
  };

  const removeCard = (idx: number) => {
    if (!sb) return;
    const target = sb.cards[idx];
    setRemoving(target.id);
    setTimeout(() => {
      const cards = sb.cards.map((c, i) =>
        i === idx ? { ...c, imageUrl: '', title: '', description: '', animation: 'none' as const } : c
      );
      setSb({ ...sb, cards });
      setRemoving(null);
      void save({ cards });
    }, 340);
  };

  const triggerUpload = (idx: number) => {
    uploadTargetIdx.current = idx;
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || uploadTargetIdx.current == null || !sb) return;
    const idx = uploadTargetIdx.current;
    try {
      const url = await api.uploadImage(sb.id, f);
      updateCardAtAndSave(idx, { imageUrl: url });
      notify('上传成功');
    } catch (err) {
      notify('上传失败：' + (err as Error).message);
    }
  };

  const handleDropOnSlot = async (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f || !sb) return;
    if (!f.type.startsWith('image/')) {
      notify('请拖入图片文件');
      return;
    }
    try {
      const url = await api.uploadImage(sb.id, f);
      updateCardAtAndSave(idx, { imageUrl: url });
      notify('上传成功');
    } catch (err) {
      notify('上传失败：' + (err as Error).message);
    }
  };

  const debounceSaveTitle = useRef<number | null>(null);
  const updateTitle = (t: string) => {
    if (!sb) return;
    setSb({ ...sb, title: t });
    if (debounceSaveTitle.current) window.clearTimeout(debounceSaveTitle.current);
    debounceSaveTitle.current = window.setTimeout(() => {
      void save({ title: t });
    }, 400);
  };

  const debounceSaveMusic = useRef<number | null>(null);
  const updateMusic = (m: string) => {
    if (!sb) return;
    setSb({ ...sb, musicUrl: m });
    if (debounceSaveMusic.current) window.clearTimeout(debounceSaveMusic.current);
    debounceSaveMusic.current = window.setTimeout(() => {
      void save({ musicUrl: m });
    }, 400);
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;
  if (!sb) return <div className="loading-wrap">故事板不存在</div>;

  const selected = sb.cards[selectedIdx];

  return (
    <div className="editor-page">
      <div className="editor-main">
        <div className="editor-header">
          <button className="btn btn-ghost" onClick={() => onNavigate({ name: 'list' })}>
            ← 返回列表
          </button>
          <input
            className="editor-title"
            value={sb.title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="故事板标题"
          />
          <div className="editor-actions">
            <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--text-dim)' }}>
              {saving ? '保存中…' : ''}
            </span>
            <button className="btn btn-primary" onClick={() => onNavigate({ name: 'viewer', id: sb.id })}>
              ▶ 预览
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="cards-grid" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="cards-grid"
                style={{
                  background: snapshot.isDraggingOver ? 'rgba(233,69,96,0.03)' : 'transparent',
                }}
              >
                {sb.cards.map((card, idx) => (
                  <Draggable key={card.id} draggableId={card.id} index={idx}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`card-wrapper ${removing === card.id ? 'removing' : ''} ${
                          dragSnapshot.isDragging ? 'dnd-dragging' : ''
                        }`}
                        style={{
                          ...dragProvided.draggableProps.style,
                          borderRadius: 12,
                        }}
                      >
                        {card.imageUrl || card.title || card.description ? (
                          <div
                            className={`edit-card ${idx === selectedIdx ? 'selected' : ''}`}
                            onClick={() => setSelectedIdx(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDropOnSlot(e, idx)}
                          >
                            <span className="card-idx">{idx + 1}</span>
                            <button
                              className="card-del"
                              title="清空内容"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCard(idx);
                              }}
                            >
                              ✕
                            </button>
                            <div className="card-img" onClick={() => triggerUpload(idx)}>
                              {card.imageUrl ? (
                                <LazyCardImg src={card.imageUrl} />
                              ) : (
                                <span className="card-upload-hint">点击上传图片</span>
                              )}
                            </div>
                            <div className="card-foot">
                              <div className="t">{card.title || `卡片 ${idx + 1}`}</div>
                              <div className="d">
                                {ANIM_OPTIONS.find((o) => o.value === card.animation)?.label || '无动画'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="slot"
                            onClick={() => {
                              setSelectedIdx(idx);
                              triggerUpload(idx);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).classList.add('drop-hover');
                            }}
                            onDragLeave={(e) =>
                              (e.currentTarget as HTMLElement).classList.remove('drop-hover')
                            }
                            onDrop={(e) => handleDropOnSlot(e, idx)}
                          >
                            <div style={{ fontSize: 22, opacity: 0.6 }}>+</div>
                            <div>卡片 {idx + 1} · 点击或拖入图片</div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="card-edit-pane">
          <h4>编辑卡片 · {selectedIdx + 1}/12</h4>
          <div className="form-group">
            <label>图片</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label className="file-btn">
                📁 选择图片
                <input
                  type="file"
                  accept="image/*"
                  onChange={() => {
                    uploadTargetIdx.current = selectedIdx;
                  }}
                  onClick={(e) => {
                    uploadTargetIdx.current = selectedIdx;
                    const inp = e.currentTarget;
                    inp.onchange = handleFile as unknown as (e: Event) => void;
                  }}
                />
              </label>
              {selected.imageUrl && (
                <button
                  className="btn btn-ghost"
                  onClick={() => updateCardAtAndSave(selectedIdx, { imageUrl: '' })}
                >
                  移除图片
                </button>
              )}
              {selected.imageUrl && (
                <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                  {selected.imageUrl}
                </span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>标题</label>
            <input
              placeholder="给这张作品起个名字"
              value={selected.title}
              onChange={(e) => updateCardAt(selectedIdx, { title: e.target.value })}
              onBlur={(e) => updateCardAtAndSave(selectedIdx, { title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>详细描述（支持换行）</label>
            <textarea
              placeholder="描述创作灵感、画面元素、故事背景……"
              value={selected.description}
              onChange={(e) => updateCardAt(selectedIdx, { description: e.target.value })}
              onBlur={(e) => updateCardAtAndSave(selectedIdx, { description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>切换动画</label>
            <select
              value={selected.animation}
              onChange={(e) =>
                updateCardAtAndSave(selectedIdx, {
                  animation: e.target.value as CardAnimation,
                })
              }
            >
              {ANIM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <TimelinePanel
        cards={sb.cards}
        selectedIdx={selectedIdx}
        onSelect={(i) => {
          setSelectedIdx(i);
          setPanelOpen(false);
        }}
        open={panelOpen}
      />

      <button
        className="mobile-panel-toggle"
        onClick={() => setPanelOpen((o) => !o)}
        title="时间线"
      >
        ☰
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div className="editor-toolbar">
        <button
          className="btn"
          onClick={() => {
            const emptyIdx = sb.cards.findIndex((c) => !c.imageUrl && !c.title && !c.description);
            if (emptyIdx >= 0) {
              setSelectedIdx(emptyIdx);
              triggerUpload(emptyIdx);
            } else {
              notify('最多支持 12 张卡片，请先清空不需要的卡片');
            }
          }}
        >
          + 添加卡片
        </button>
        <div className="toolbar-music">
          <span style={{ fontSize: 13, color: 'var(--text-dim)', flexShrink: 0 }}>🎵 音乐URL</span>
          <input
            placeholder="https://.../music.mp3 (可选)"
            value={sb.musicUrl}
            onChange={(e) => updateMusic(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          已填充 {sb.cards.filter((c) => c.imageUrl || c.title).length}/12
        </span>
      </div>
    </div>
  );
};
