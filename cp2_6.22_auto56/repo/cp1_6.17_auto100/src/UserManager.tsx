import { useState, useEffect } from 'react';
import { useStore } from './store';
import { AVATAR_COLORS } from './types';

const LoginModal = () => {
  const [nickname, setNickname] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setError('昵称至少需要2个字符');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(nickname.trim(), avatarColor);
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay">
      <form className="login-modal" onSubmit={handleSubmit}>
        <h2 className="login-title">欢迎来到分支叙事工坊</h2>
        <p className="login-subtitle">与志同道合的作者共同编织精彩故事</p>

        <div className="form-group">
          <label className="form-label">你的昵称</label>
          <input
            type="text"
            className="form-input"
            placeholder="请输入昵称（至少2个字符）"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              if (error) setError('');
            }}
            maxLength={16}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">选择头像颜色</label>
          <div className="avatar-color-picker">
            {AVATAR_COLORS.map((color) => (
              <div
                key={color}
                className={`avatar-color-option ${avatarColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setAvatarColor(color)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setAvatarColor(color)}
              >
                {avatarColor === color && <span className="avatar-color-check">✓</span>}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ color: '#DC3545', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? '进入中...' : '进入工坊'}
        </button>
      </form>
    </div>
  );
};

const AuthorPanel = () => {
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const storyNodes = useStore((s) => s.storyNodes);
  const isAuthorPanelOpen = useStore((s) => s.isAuthorPanelOpen);
  const toggleAuthorPanel = useStore((s) => s.toggleAuthorPanel);

  const getEditingNodeText = (nodeId: string | null) => {
    if (!nodeId) return null;
    const node = storyNodes.find((n) => n.id === nodeId);
    if (!node) return null;
    const text = node.text.trim();
    return text.length > 8 ? text.slice(0, 8) + '...' : text || '(空段落)';
  };

  const onlineUsers = users.filter((u) => u.isOnline);

  return (
    <>
      <div
        className={`author-panel ${isAuthorPanelOpen ? '' : 'collapsed'} ${
          typeof window !== 'undefined' && window.innerWidth <= 900 && isAuthorPanelOpen ? 'open' : ''
        }`}
      >
        <button className="author-panel-toggle" onClick={toggleAuthorPanel}>
          {isAuthorPanelOpen ? '›' : '‹'}
        </button>
        <div className="author-count">在线作者（共{onlineUsers.length}人）</div>
        <div className="author-list">
          {onlineUsers.map((user) => {
            const isCurrent = currentUser?.id === user.id;
            const editingText = getEditingNodeText(user.editingNodeId);
            return (
              <div key={user.id} className="author-item" title={editingText || undefined}>
                <div className="author-avatar" style={{ backgroundColor: user.avatarColor }}>
                  {user.nickname.charAt(0)}
                  {isCurrent && <span className="author-current-badge" style={{ display: 'none' }} />}
                  {user.editingNodeId && (
                    <span className="editing-indicator">📝</span>
                  )}
                </div>
                <div>
                  <span className="author-name">
                    {user.nickname}
                    {isCurrent && <span className="author-current-badge">(我)</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button className="mobile-toggle-author" onClick={toggleAuthorPanel}>
        👥
      </button>
    </>
  );
};

const UserManager = {
  LoginModal,
  AuthorPanel
};

export default UserManager;
