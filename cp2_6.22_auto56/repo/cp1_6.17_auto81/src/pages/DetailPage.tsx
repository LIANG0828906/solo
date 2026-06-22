import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { usePaletteStore } from '../store/usePaletteStore';
import { getRelativeTime, getContrastColor } from '../utils/colorUtils';
import { normalizeHex } from '../utils/colorUtils';
import './DetailPage.css';

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPaletteById, toggleVote, currentUser, getUserById } = usePaletteStore();
  const [voting, setVoting] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleIdRef = useRef(0);

  const palette = id ? getPaletteById(id) : undefined;
  const hasVoted = palette ? palette.voterIds.includes(currentUser.id) : false;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleVoteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!palette) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    setVoting(true);
    toggleVote(palette.id);
    setTimeout(() => setVoting(false), 200);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: palette?.name || '色板',
          text: `查看这个配色方案：${palette?.name}`,
          url: window.location.href,
        });
      } catch (e) {
        // 用户取消分享
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  const voterUsers = palette
    ? palette.voterIds
        .map((vid) => getUserById(vid))
        .filter((u) => u !== undefined)
    : [];

  if (!palette) {
    return (
      <div className="detail-page">
        <div className="detail-container">
          <div className="not-found">
            <p>色板不存在</p>
            <button className="back-button" onClick={() => navigate('/')}>
              <ArrowLeft size={18} />
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page page-enter">
      <div className="detail-container">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
          返回
        </button>

        <div className="palette-header">
          <div className="header-info">
            <h1 className="palette-title">{palette.name}</h1>
            <p className="palette-meta">
              由 <span className="author-name">{palette.author}</span> 提交 ·{' '}
              {getRelativeTime(palette.createdAt)}
            </p>
          </div>
          <div className="header-actions">
            <button
              className={`vote-button-large ${hasVoted ? 'voted' : ''} ${voting ? 'voting' : ''}`}
              onClick={handleVoteClick}
            >
              {ripples.map((ripple) => (
                <span
                  key={ripple.id}
                  className="ripple"
                  style={{ left: ripple.x, top: ripple.y }}
                />
              ))}
              <Heart size={20} fill={hasVoted ? '#ffffff' : 'none'} />
              <span>{palette.votes} 票</span>
            </button>
            <button className="share-button" onClick={handleShare} aria-label="分享">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <div className="large-palette">
          {palette.colors.map((color, index) => (
            <div
              key={index}
              className="large-color-block"
              style={{ backgroundColor: color }}
            >
              <span className="color-code" style={{ color: getContrastColor(color) }}>
                {normalizeHex(color)}
              </span>
            </div>
          ))}
        </div>

        <div className="voters-section">
          <h3 className="section-title">投票用户 ({palette.votes})</h3>
          {voterUsers.length === 0 ? (
            <p className="no-voters">暂无投票，来做第一个投票的人吧～</p>
          ) : (
            <div className="voters-list">
              {voterUsers.map((user, index) => (
                <div
                  key={user?.id || index}
                  className="voter-avatar-wrapper"
                  style={{ marginLeft: index > 0 ? '-8px' : '0', zIndex: voterUsers.length - index }}
                  title={user?.name || ''}
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="voter-avatar"
                  />
                  <span className="voter-tooltip">{user?.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <CommentSection paletteId={palette.id} />
      </div>
    </div>
  );
}
