import React, { useState, useEffect, useRef } from 'react';
import {
  getMessages,
  sendMessage,
  uploadPhotos,
  markMessageRead,
  Message,
} from '../api';

const CURRENT_FOSTER_ID = 'f1';
const MY_ROLE: 'owner' | 'foster' = 'foster';

interface UploadProgress {
  name: string;
  percent: number;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `${hh}:${mm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

const ImageViewer: React.FC<{ src: string; onClose: () => void }> = ({ src, onClose }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.max(0.5, Math.min(4, s + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.current) return;
    setOffset({
      x: dragState.current.ox + (e.clientX - dragState.current.startX),
      y: dragState.current.oy + (e.clientY - dragState.current.startY),
    });
  };

  const handleMouseUp = () => {
    dragState.current = null;
  };

  return (
    <div
      className="image-viewer"
      onClick={onClose}
      onWheel={handleWheel}
    >
      <button className="image-viewer-close" onClick={onClose} aria-label="关闭">
        ✕
      </button>
      <img
        ref={imgRef}
        src={src}
        alt="预览"
        className="image-viewer-img"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={reset}
        draggable={false}
      />
    </div>
  );
};

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessages(CURRENT_FOSTER_ID);
      setMessages(data);
      data.forEach((m) => {
        if (!m.read && m.senderRole !== MY_ROLE) {
          markMessageRead(m.id).catch(() => {});
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;
    try {
      setSending(true);
      const res = await sendMessage({
        fosterId: CURRENT_FOSTER_ID,
        senderRole: MY_ROLE,
        content: text,
      });
      if (res.success) {
        setMessages((m) => [...m, res.message]);
        setInputText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const initial: UploadProgress[] = list.map((f) => ({ name: f.name, percent: 0 }));
    setUploadProgress(initial);

    try {
      const res = await uploadPhotos(list, (name, percent) => {
        setUploadProgress((prev) =>
          prev.map((p) => (p.name === name ? { ...p, percent } : p))
        );
      });
      if (res.success && res.photos.length > 0) {
        const msgRes = await sendMessage({
          fosterId: CURRENT_FOSTER_ID,
          senderRole: MY_ROLE,
          content: `已上传 ${res.photos.length} 张照片`,
          photos: res.photos,
        });
        if (msgRes.success) {
          setMessages((m) => [...m, msgRes.message]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setUploadProgress([]), 1500);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">💬 宠物状态消息</h1>

      <div className="messages-layout">
        <div className="upload-area">
          <button
            type="button"
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📷 批量上传照片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="upload-progress-list">
            {uploadProgress.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                点击按钮选择多张照片上传，支持 JPG / PNG
              </div>
            ) : (
              uploadProgress.map((p) => (
                <div key={p.name} className="upload-progress-item">
                  <span className="upload-progress-name">{p.name}</span>
                  <div className="upload-progress-bar">
                    <div
                      className="upload-progress-fill"
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                  <span className="upload-progress-percent">{p.percent}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <div>正在加载消息...</div>
          </div>
        )}

        {!loading && (
          <div className="timeline" ref={timelineRef}>
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">💌</div>
                <div className="empty-state-text">还没有消息，开始和寄养家庭沟通吧～</div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`timeline-msg ${m.senderRole === MY_ROLE ? 'foster' : 'owner'}`}
              >
                <div className="msg-bubble">
                  {m.photos && m.photos.length > 0 && (
                    <div className="msg-photos">
                      {m.photos.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          alt={`照片 ${i + 1}`}
                          className="msg-photo"
                          onClick={() => setViewerSrc(p)}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23eee"/><text x="50%" y="55%" font-size="10" fill="%23999" text-anchor="middle">图片</text></svg>';
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {m.content && <div className="msg-content">{m.content}</div>}
                  <div className="msg-meta">
                    <span>{formatTime(m.timestamp)}</span>
                    {m.senderRole === MY_ROLE && (
                      <span title={m.read ? '已读' : '未读'}>
                        {m.read ? '✓✓' : <span className="msg-unread-dot" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="msg-composer">
          <input
            className="msg-composer-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="发送宠物状态更新..."
          />
          <button
            className="msg-composer-send"
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? <span className="spinner" /> : '发送'}
          </button>
        </div>
      </div>

      {viewerSrc && (
        <ImageViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      )}
    </div>
  );
};

export default Messages;
