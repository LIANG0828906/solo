import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import Timeline from './components/Timeline';
import PreviewPanel from './components/PreviewPanel';
import DropZone from './components/DropZone';
import { DraggableClipAsset, DraggableStickerAsset } from './components/DraggableAsset';
import { useEditorStore } from './store';
import type { VideoClip, ClipTitle, StickerType } from './types';
import {
  PRESET_CLIPS,
  STICKER_TYPES,
  STICKER_LABELS,
  getStickerSVG,
  formatTime,
  getTotalDuration,
} from './utils/mediaUtils';

const TIMELINE_DROP_ZONE = 'timeline-drop-zone';
const PREVIEW_DROP_ZONE = 'preview-drop-zone';

const App: React.FC = () => {
  const { state, dispatch, canUndo, canRedo, undo, redo } = useEditorStore();
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [activeStickerType, setActiveStickerType] = useState<StickerType | null>(null);
  const [draggedAssetType, setDraggedAssetType] = useState<'clip' | 'sticker' | null>(null);
  const [titleEditorPos, setTitleEditorPos] = useState<{ x: number; y: number } | null>(null);
  const [titleDraft, setTitleDraft] = useState<ClipTitle>({
    text: '',
    fontSize: 24,
    color: '#f5c518',
    align: 'center',
  });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  useEffect(() => {
    if (state.showTitleEditor) {
      setTimeout(() => {
        const clip = state.clips.find((c) => c.id === state.showTitleEditor);
        const centerX = window.innerWidth / 2 - 160;
        const centerY = window.innerHeight / 2 - 200;
        setTitleEditorPos({ x: centerX, y: centerY });
        if (clip && clip.title) {
          setTitleDraft({ ...clip.title });
        } else {
          setTitleDraft({ text: '', fontSize: 24, color: '#f5c518', align: 'center' });
        }
      }, 0);
    } else {
      setTitleEditorPos(null);
    }
  }, [state.showTitleEditor, state.clips]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith('clip-')) {
      setActiveAssetId(id);
      setDraggedAssetType('clip');
    } else if (id.startsWith('sticker-')) {
      const type = id.replace('sticker-', '') as StickerType;
      setActiveStickerType(type);
      setDraggedAssetType('sticker');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, delta } = event;

    if (!over) {
      setActiveAssetId(null);
      setActiveStickerType(null);
      setDraggedAssetType(null);
      return;
    }

    const overId = String(over.id);

    if (draggedAssetType === 'clip' && activeAssetId && overId === TIMELINE_DROP_ZONE) {
      const presetIndex = parseInt(activeAssetId.replace('clip-', ''), 10);
      const preset = PRESET_CLIPS[presetIndex];
      if (preset) {
        let runningTime = 0;
        state.clips.forEach((c) => {
          const effDur = c.duration - c.trimIn - c.trimOut;
          runningTime = Math.max(runningTime, c.startTime + effDur);
        });
        const newClip: VideoClip = {
          id: uuidv4(),
          name: preset.name,
          color: preset.color,
          duration: preset.duration,
          startTime: runningTime,
          trimIn: 0,
          trimOut: 0,
        };
        dispatch({ type: 'ADD_CLIP', payload: newClip });
      }
    } else if (draggedAssetType === 'sticker' && activeStickerType && overId === PREVIEW_DROP_ZONE) {
      let x = 400;
      let y = 250;
      if (previewContainerRef.current) {
        const rect = previewContainerRef.current.getBoundingClientRect();
        x = Math.max(30, Math.min(770, delta.x + rect.width / 2 - 40));
        y = Math.max(30, Math.min(470, delta.y + rect.height / 2 - 40));
      }
      const totalDur = getTotalDuration(state.clips);
      const startTime = state.currentTime;
      const remaining = Math.max(0, totalDur - startTime);
      const duration = remaining > 0 ? Math.min(3, Math.max(2, remaining)) : 3;
      dispatch({
        type: 'ADD_STICKER',
        payload: {
          id: uuidv4(),
          type: activeStickerType,
          startTime,
          duration,
          x,
          y,
          scale: 1,
          rotation: 0,
        },
      });
    }

    setActiveAssetId(null);
    setActiveStickerType(null);
    setDraggedAssetType(null);
  };

  const handleSaveTitle = () => {
    if (state.showTitleEditor) {
      dispatch({
        type: 'UPDATE_CLIP_TITLE',
        payload: {
          clipId: state.showTitleEditor,
          title: titleDraft.text.trim() ? { ...titleDraft } : undefined,
        },
      });
      dispatch({ type: 'SET_TITLE_EDITOR', payload: null });
    }
  };

  const handleDeleteTitle = () => {
    if (state.showTitleEditor) {
      dispatch({
        type: 'UPDATE_CLIP_TITLE',
        payload: { clipId: state.showTitleEditor, title: undefined },
      });
      dispatch({ type: 'SET_TITLE_EDITOR', payload: null });
    }
  };

  const handleDeleteSelectedClip = useCallback(() => {
    if (state.selectedClipId) {
      dispatch({ type: 'REMOVE_CLIP', payload: state.selectedClipId });
    }
  }, [state.selectedClipId, dispatch]);

  const handleDeleteSelectedSticker = useCallback(() => {
    if (state.selectedStickerId) {
      dispatch({ type: 'REMOVE_STICKER', payload: state.selectedStickerId });
    }
  }, [state.selectedStickerId, dispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        if (state.selectedClipId) {
          e.preventDefault();
          handleDeleteSelectedClip();
        } else if (state.selectedStickerId) {
          e.preventDefault();
          handleDeleteSelectedSticker();
        }
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SELECT_CLIP', payload: null });
        dispatch({ type: 'SELECT_STICKER', payload: null });
        dispatch({ type: 'SET_TITLE_EDITOR', payload: null });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedClipId, state.selectedStickerId, handleDeleteSelectedClip, handleDeleteSelectedSticker, dispatch]);

  const activePresetClip = activeAssetId
    ? PRESET_CLIPS[parseInt(activeAssetId.replace('clip-', ''), 10)]
    : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="app-container">
        <div className="top-bar">
          <span className="app-title">🎬 短视频编辑工作台</span>
          <div className="history-controls">
            <button
              className="history-btn"
              onClick={undo}
              disabled={!canUndo}
              title="撤销 (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              className="history-btn"
              onClick={redo}
              disabled={!canRedo}
              title="重做 (Ctrl+Shift+Z)"
            >
              ↷
            </button>
          </div>
        </div>

        <div className="main-content">
          <aside className="asset-panel">
            <div className="panel-section">
              <div className="panel-title">视频片段</div>
              {PRESET_CLIPS.map((clip, index) => (
                <DraggableClipAsset
                  key={`clip-${index}`}
                  id={`clip-${index}`}
                  name={clip.name}
                  duration={clip.duration}
                />
              ))}
            </div>

            <div className="panel-section">
              <div className="panel-title">贴纸库</div>
              <div className="sticker-grid">
                {STICKER_TYPES.map((type) => (
                  <DraggableStickerAsset
                    key={`sticker-${type}`}
                    id={`sticker-${type}`}
                    type={type}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10, lineHeight: 1.5 }}>
                拖拽贴纸到预览区<br />
                滚轮缩放 · 拖拽旋转手柄
              </p>
            </div>

            {(state.selectedClipId || state.selectedStickerId) && (
              <div className="panel-section">
                <div className="panel-title">操作</div>
                {state.selectedClipId && (
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', marginBottom: 8 }}
                    onClick={() => dispatch({ type: 'SET_TITLE_EDITOR', payload: state.selectedClipId })}
                  >
                    ✏️ 编辑标题
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  style={{ width: '100%' }}
                  onClick={state.selectedClipId ? handleDeleteSelectedClip : handleDeleteSelectedSticker}
                >
                  🗑️ 删除{state.selectedClipId ? '片段' : '贴纸'}
                </button>
              </div>
            )}
          </aside>

          <section className="preview-area">
            <DropZone id={PREVIEW_DROP_ZONE}>
              <div ref={previewContainerRef}>
                <PreviewPanel
                  clips={state.clips}
                  stickers={state.stickers}
                  currentTime={state.currentTime}
                  selectedStickerId={state.selectedStickerId}
                  dispatch={dispatch}
                />
              </div>
            </DropZone>

            <DropZone id={TIMELINE_DROP_ZONE}>
              <Timeline
                clips={state.clips}
                stickers={state.stickers}
                currentTime={state.currentTime}
                selectedClipId={state.selectedClipId}
                selectedStickerId={state.selectedStickerId}
                dispatch={dispatch}
              />
            </DropZone>
          </section>
        </div>

        {state.showTitleEditor && titleEditorPos && (
          <div
            className="title-editor-popup"
            style={{ left: titleEditorPos.x, top: titleEditorPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>编辑文字标题</h3>
            <div className="form-row">
              <label>标题文字</label>
              <input
                type="text"
                value={titleDraft.text}
                onChange={(e) => setTitleDraft({ ...titleDraft, text: e.target.value })}
                placeholder="输入标题内容..."
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-row" style={{ flex: 1 }}>
                <label>字体大小</label>
                <input
                  type="number"
                  min={12}
                  max={72}
                  value={titleDraft.fontSize}
                  onChange={(e) =>
                    setTitleDraft({ ...titleDraft, fontSize: parseInt(e.target.value) || 24 })
                  }
                />
              </div>
              <div className="form-row">
                <label>颜色</label>
                <input
                  type="color"
                  value={titleDraft.color}
                  onChange={(e) => setTitleDraft({ ...titleDraft, color: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <label>对齐方式</label>
              <div className="align-buttons">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    className={`align-btn ${titleDraft.align === align ? 'active' : ''}`}
                    onClick={() => setTitleDraft({ ...titleDraft, align })}
                  >
                    {align === 'left' ? '左' : align === 'center' ? '中' : '右'}
                  </button>
                ))}
              </div>
            </div>
            <div className="popup-actions">
              <button type="button" className="btn btn-danger" onClick={handleDeleteTitle}>
                清除
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => dispatch({ type: 'SET_TITLE_EDITOR', payload: null })}
              >
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveTitle}>
                保存
              </button>
            </div>
          </div>
        )}

        <DragOverlay>
          {activePresetClip && draggedAssetType === 'clip' ? (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'linear-gradient(90deg, #e94560, #0f3460)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                minWidth: 160,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>
                {activePresetClip.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                {formatTime(activePresetClip.duration)}
              </div>
            </div>
          ) : activeStickerType && draggedAssetType === 'sticker' ? (
            <div
              dangerouslySetInnerHTML={{ __html: getStickerSVG(activeStickerType) }}
              style={{ width: 50, height: 50 }}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default App;
