import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useDocumentStore, Comment } from '../store/useDocumentStore';

dayjs.extend(relativeTime);

interface Props {
  paragraphId: string;
}

function Avatar({
  text,
  color,
  url,
  size = 34,
}: {
  text: string;
  color: string;
  url?: string;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={text}
        className="avatar-img"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      className="comment-avatar"
      title={text}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -25)} 100%)`,
      }}
    >
      {text}
    </div>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const PRESET_COLORS = [
  '#8b6914',
  '#5a3e2b',
  '#2e7d32',
  '#1565c0',
  '#6a1b9a',
  '#c62828',
  '#ef6c00',
  '#00838f',
];

export default function CommentBubble({ paragraphId }: Props) {
  const { comments, addComment, currentUser, availableUsers, setCurrentUser, updateCurrentUserAvatar } =
    useDocumentStore();
  const list = comments[paragraphId] || [];
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [expanded]);

  const submitComment = () => {
    const content = input.trim();
    if (!content) return;
    const comment: Comment = {
      id: uuid(),
      userId: currentUser.id,
      userName: currentUser.name,
      avatar: currentUser.initials,
      avatarColor: currentUser.color,
      avatarUrl: currentUser.avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };
    addComment(paragraphId, comment);
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('图片不能超过 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      updateCurrentUserAvatar(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`comment-bubble ${expanded ? 'expanded' : ''}`}>
      <button
        className="bubble-toggle"
        onClick={() => setExpanded(!expanded)}
        title={list.length > 0 ? `${list.length} 条评论` : '添加评论'}
      >
        <span className="bubble-icon">💬</span>
        {list.length > 0 && <span className="bubble-count">{list.length}</span>}
      </button>

      <div className="comment-panel">
        <div className="comment-panel-header">
          <span>评论讨论</span>
          <button className="icon-btn-small" onClick={() => setExpanded(false)}>
            ✕
          </button>
        </div>

        <div className="comment-current-user" onClick={() => setShowUserMenu(!showUserMenu)}>
          <Avatar text={currentUser.initials} color={currentUser.color} url={currentUser.avatarUrl} size={28} />
          <span className="current-user-name">{currentUser.name}</span>
          <span className="user-menu-arrow">▾</span>

          {showUserMenu && (
            <div className="user-menu" onClick={(e) => e.stopPropagation()}>
              <div className="user-menu-title">切换用户</div>
              <div className="user-list">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    className={`user-option ${u.id === currentUser.id ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserMenu(false);
                    }}
                  >
                    <Avatar text={u.initials} color={u.color} url={u.avatarUrl} size={32} />
                    <span className="user-option-name">{u.name}</span>
                    {u.id === currentUser.id && <span className="user-option-check">✓</span>}
                  </button>
                ))}
              </div>

              <div className="user-menu-divider" />
              <div className="user-menu-title">自定义头像</div>

              {!showAvatarPicker ? (
                <button
                  className="user-menu-btn"
                  onClick={() => setShowAvatarPicker(true)}
                >
                  📷 上传自定义头像
                </button>
              ) : (
                <div className="avatar-picker">
                  <div className="avatar-color-list">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`avatar-color-dot ${currentUser.color === c && !currentUser.avatarUrl ? 'active' : ''}`}
                        style={{ background: c }}
                        onClick={() => {
                          const newUser = { ...currentUser, color: c, avatarUrl: undefined };
                          setCurrentUser(newUser);
                        }}
                        title="选择头像颜色"
                      />
                    ))}
                  </div>
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarUpload}
                  />
                  <button className="user-menu-btn" onClick={() => avatarFileRef.current?.click()}>
                    📤 从文件上传（≤ 2MB）
                  </button>
                  <button
                    className="user-menu-btn user-menu-btn-ghost"
                    onClick={() => {
                      if (currentUser.avatarUrl) {
                        const newUser = { ...currentUser, avatarUrl: undefined };
                        setCurrentUser(newUser);
                      }
                      setShowAvatarPicker(false);
                    }}
                  >
                    ← 返回
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="comment-list">
          {list.length === 0 && (
            <div className="comment-empty">暂无评论，添加第一条建议吧～</div>
          )}
          {list.map((c, i) => (
            <div
              key={c.id}
              className="comment-item"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Avatar text={c.avatar} color={c.avatarColor} url={c.avatarUrl} />
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-name">{c.userName}</span>
                  <span className="comment-time">{dayjs(c.createdAt).fromNow()}</span>
                </div>
                <div className="comment-content">{c.content}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="comment-input-box">
          <textarea
            ref={inputRef}
            className="comment-input"
            placeholder="输入建议或修改意见…（Enter 发送，Shift+Enter 换行）"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={2}
          />
          <button
            className="btn btn-send"
            onClick={submitComment}
            disabled={!input.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
