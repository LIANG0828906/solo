import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store';
import { BUBBLE_STYLES, STICKER_LIST, TextBubble, PlacedSticker } from '../types';
import { createMeme } from '../api';

let idCounter = 0;
function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

function DraggableItem({
  children,
  x,
  y,
  id,
  onMove,
  selected,
  onSelect,
}: {
  children: React.ReactNode;
  x: number;
  y: number;
  id: string;
  onMove: (id: string, x: number, y: number) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = true;
    onSelect(id);
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    offset.current = { x: e.clientX - x, y: e.clientY - y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const canvasRect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - offset.current.x, canvasRect.width - 40));
    const newY = Math.max(0, Math.min(e.clientY - offset.current.y, canvasRect.height - 40));
    onMove(id, newX, newY);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        cursor: 'grab',
        transition: dragging.current ? 'none' : 'left 0.2s, top 0.2s',
        outline: selected ? '2px dashed #54a0ff' : 'none',
        borderRadius: 4,
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  );
}

function BubbleRenderer({ bubble }: { bubble: TextBubble }) {
  const style = BUBBLE_STYLES.find((s) => s.id === bubble.styleId) || BUBBLE_STYLES[0];
  return (
    <div
      style={{
        background: style.backgroundColor,
        border: `${style.borderWidth}px solid ${style.borderColor}`,
        borderRadius: style.shape === 'rounded' ? style.borderRadius : style.shape === 'cloud' ? style.borderRadius : 4,
        padding: '6px 12px',
        fontSize: bubble.fontSize,
        color: bubble.color,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        transform: `rotate(${bubble.rotation}deg)`,
        transformOrigin: 'center',
        transition: 'transform 0.2s',
        position: 'relative',
      }}
    >
      {style.shape === 'lightning' && (
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: 12,
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `8px solid ${style.borderColor}`,
          }}
        />
      )}
      {style.shape === 'rounded' && (
        <div
          style={{
            position: 'absolute',
            bottom: -7,
            left: 16,
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `7px solid ${style.borderColor}`,
          }}
        />
      )}
      {bubble.text}
    </div>
  );
}

export default function Editor() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    backgroundUrl,
    textBubbles,
    placedStickers,
    selectedItemId,
    setBackground,
    addTextBubble,
    updateTextBubble,
    removeTextBubble,
    addPlacedSticker,
    updatePlacedSticker,
    removePlacedSticker,
    selectItem,
    reset,
  } = useEditorStore();

  const [editingBubble, setEditingBubble] = useState<TextBubble | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [memeName, setMemeName] = useState('');
  const [memeTags, setMemeTags] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (selectedItemId) {
      const bubble = textBubbles.find((b) => b.id === selectedItemId);
      if (bubble) setEditingBubble({ ...bubble });
      else setEditingBubble(null);
    } else {
      setEditingBubble(null);
    }
  }, [selectedItemId, textBubbles]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('仅支持 JPG/PNG/WebP 格式');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('图片大小不能超过 3MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setBackground(url);
  }, [setBackground]);

  const handleAddBubble = useCallback(() => {
    const bubble: TextBubble = {
      id: genId('bubble'),
      text: '文字',
      styleId: BUBBLE_STYLES[0].id,
      x: 60 + Math.random() * 100,
      y: 40 + Math.random() * 80,
      fontSize: 20,
      color: '#333333',
      rotation: 0,
    };
    addTextBubble(bubble);
  }, [addTextBubble]);

  const handleAddSticker = useCallback((emoji: string) => {
    const sticker: PlacedSticker = {
      id: genId('sticker'),
      stickerEmoji: emoji,
      x: 80 + Math.random() * 100,
      y: 60 + Math.random() * 80,
      scale: 1,
    };
    addPlacedSticker(sticker);
  }, [addPlacedSticker]);

  const handleBubbleMove = useCallback((id: string, x: number, y: number) => {
    updateTextBubble(id, { x, y });
  }, [updateTextBubble]);

  const handleStickerMove = useCallback((id: string, x: number, y: number) => {
    updatePlacedSticker(id, { x, y });
  }, [updatePlacedSticker]);

  const handleBubbleEdit = useCallback((field: string, value: string | number) => {
    if (!editingBubble) return;
    const updated = { ...editingBubble, [field]: value };
    setEditingBubble(updated);
    updateTextBubble(editingBubble.id, { [field]: value });
  }, [editingBubble, updateTextBubble]);

  const handleCanvasClick = useCallback(() => {
    selectItem(null);
  }, [selectItem]);

  const handleDelete = useCallback(() => {
    if (!selectedItemId) return;
    const isBubble = textBubbles.some((b) => b.id === selectedItemId);
    if (isBubble) removeTextBubble(selectedItemId);
    else removePlacedSticker(selectedItemId);
  }, [selectedItemId, textBubbles, removeTextBubble, removePlacedSticker]);

  const exportImage = useCallback(async (): Promise<Blob | null> => {
    const canvas = exportCanvasRef.current;
    if (!canvas || !canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (backgroundUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = backgroundUrl;
      });
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    }

    for (const bubble of textBubbles) {
      const style = BUBBLE_STYLES.find((s) => s.id === bubble.styleId) || BUBBLE_STYLES[0];
      ctx.save();
      ctx.translate(bubble.x + 40, bubble.y + 16);
      ctx.rotate((bubble.rotation * Math.PI) / 180);

      const metrics = ctx.measureText(bubble.text);
      const tw = metrics.width + 24;
      const th = bubble.fontSize + 12;

      ctx.fillStyle = style.backgroundColor;
      ctx.strokeStyle = style.borderColor;
      ctx.lineWidth = style.borderWidth;
      if (style.shape === 'rounded' || style.shape === 'cloud') {
        ctx.beginPath();
        ctx.roundRect(-tw / 2, -th / 2, tw, th, style.borderRadius);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(-tw / 2, -th / 2, tw, th);
        ctx.strokeRect(-tw / 2, -th / 2, tw, th);
      }

      ctx.fillStyle = bubble.color;
      ctx.font = `600 ${bubble.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bubble.text, 0, 0);
      ctx.restore();
    }

    for (const sticker of placedStickers) {
      ctx.save();
      const size = 40 * sticker.scale;
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sticker.stickerEmoji, sticker.x + size / 2, sticker.y + size / 2);
      ctx.restore();
    }

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }, [backgroundUrl, textBubbles, placedStickers]);

  const handlePublish = useCallback(async () => {
    if (!memeName.trim()) {
      alert('请输入表情包名称');
      return;
    }
    setPublishing(true);
    try {
      const blob = await exportImage();
      if (!blob) {
        alert('导出图片失败');
        setPublishing(false);
        return;
      }
      const file = new File([blob], 'meme.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('name', memeName.trim());
      formData.append('tags', memeTags.trim());
      formData.append('image', file);

      await createMeme(formData);
      reset();
      navigate('/');
    } catch (err) {
      alert('发布失败，请重试');
    }
    setPublishing(false);
  }, [memeName, memeTags, exportImage, reset, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
          handleDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, handleDelete]);

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 56px)',
      flexDirection: 'row',
    }}>
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          flex: '0 0 70%',
          background: '#f0ede6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 600,
            aspectRatio: '1/1',
            background: backgroundUrl ? `url(${backgroundUrl}) center/cover` : '#e0eaf5',
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          }}
        >
          {!backgroundUrl && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              gap: 8,
            }}>
              <span style={{ fontSize: 48 }}>🖼️</span>
              <span style={{ fontSize: 14 }}>点击右侧"上传底图"添加图片</span>
            </div>
          )}
          {textBubbles.map((b) => (
            <DraggableItem
              key={b.id}
              id={b.id}
              x={b.x}
              y={b.y}
              onMove={handleBubbleMove}
              selected={selectedItemId === b.id}
              onSelect={selectItem}
            >
              <BubbleRenderer bubble={b} />
            </DraggableItem>
          ))}
          {placedStickers.map((s) => (
            <DraggableItem
              key={s.id}
              id={s.id}
              x={s.x}
              y={s.y}
              onMove={handleStickerMove}
              selected={selectedItemId === s.id}
              onSelect={selectItem}
            >
              <div style={{
                fontSize: 40 * s.scale,
                transition: 'font-size 0.2s',
                lineHeight: 1,
              }}>
                {s.stickerEmoji}
              </div>
            </DraggableItem>
          ))}
        </div>
        <canvas ref={exportCanvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{
        flex: '0 0 30%',
        background: '#fff',
        borderLeft: '1px solid #eee',
        overflowY: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <section>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>📷 上传底图</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '10px 0',
              background: '#54a0ff',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            上传底图 (JPG/PNG/WebP, 最大3MB)
          </button>
        </section>

        <section>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>💬 文字气泡</h3>
          <button
            onClick={handleAddBubble}
            style={{
              width: '100%',
              padding: '10px 0',
              background: '#ff9f43',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            + 添加文字气泡
          </button>
          {editingBubble && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 12, color: '#666' }}>
                文字内容
                <input
                  type="text"
                  value={editingBubble.text}
                  onChange={(e) => handleBubbleEdit('text', e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 4,
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
              </label>
              <label style={{ fontSize: 12, color: '#666' }}>
                气泡样式
                <select
                  value={editingBubble.styleId}
                  onChange={(e) => handleBubbleEdit('styleId', e.target.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: 4,
                    padding: '6px 10px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  {BUBBLE_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 12, color: '#666' }}>
                字号 ({editingBubble.fontSize}px)
                <input
                  type="range"
                  min={12}
                  max={48}
                  value={editingBubble.fontSize}
                  onChange={(e) => handleBubbleEdit('fontSize', Number(e.target.value))}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 12, color: '#666' }}>
                颜色
                <input
                  type="color"
                  value={editingBubble.color}
                  onChange={(e) => handleBubbleEdit('color', e.target.value)}
                  style={{ display: 'block', marginTop: 4, width: 40, height: 30, border: 'none', cursor: 'pointer' }}
                />
              </label>
              <label style={{ fontSize: 12, color: '#666' }}>
                旋转角度 ({editingBubble.rotation}°)
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={editingBubble.rotation}
                  onChange={(e) => handleBubbleEdit('rotation', Number(e.target.value))}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              <button
                onClick={handleDelete}
                style={{
                  padding: '6px 0',
                  background: '#ff4757',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                🗑️ 删除此气泡
              </button>
            </div>
          )}
        </section>

        <section>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🎭 贴纸</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {STICKER_LIST.map((s) => (
              <button
                key={s.id}
                onClick={() => handleAddSticker(s.emoji)}
                title={s.name}
                style={{
                  fontSize: 24,
                  background: '#f5f5f5',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  padding: 8,
                  cursor: 'pointer',
                  transition: 'background 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fff3cd';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {s.emoji}
              </button>
            ))}
          </div>
          {selectedItemId && placedStickers.some((s) => s.id === selectedItemId) && (() => {
            const sticker = placedStickers.find((s) => s.id === selectedItemId);
            if (!sticker) return null;
            return (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 12, color: '#666' }}>
                  缩放 ({sticker.scale.toFixed(1)}x)
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={sticker.scale}
                    onChange={(e) => updatePlacedSticker(sticker.id, { scale: Number(e.target.value) })}
                    style={{ display: 'block', width: '100%', marginTop: 4 }}
                  />
                </label>
                <button
                  onClick={() => removePlacedSticker(sticker.id)}
                  style={{
                    padding: '6px 0',
                    background: '#ff4757',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  🗑️ 删除此贴纸
                </button>
              </div>
            );
          })()}
        </section>

        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowPublishModal(true)}
            style={{
              flex: 1,
              padding: '12px 0',
              background: '#ff9f43',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            🚀 发布
          </button>
          <button
            onClick={reset}
            style={{
              flex: '0 0 auto',
              padding: '12px 16px',
              background: '#eee',
              color: '#666',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            重置
          </button>
        </div>
      </div>

      {showPublishModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={() => setShowPublishModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 28,
              width: 400,
              maxWidth: '90vw',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>发布表情包</h2>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 16 }}>
              名称（最多20字）
              <input
                type="text"
                maxLength={20}
                value={memeName}
                onChange={(e) => setMemeName(e.target.value)}
                placeholder="给表情包起个名字"
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#4a90d9')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
              />
            </label>
            <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 24 }}>
              标签（最多5个，空格分隔）
              <input
                type="text"
                value={memeTags}
                onChange={(e) => setMemeTags(e.target.value)}
                placeholder="搞笑 可爱 猫咪"
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 6,
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#4a90d9')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
              />
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPublishModal(false)}
                style={{
                  padding: '8px 20px',
                  background: '#eee',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                style={{
                  padding: '8px 20px',
                  background: '#ff9f43',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  opacity: publishing ? 0.7 : 1,
                }}
              >
                {publishing ? '发布中...' : '确认发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[data-editor-layout] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}
