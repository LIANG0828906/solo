import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { ExhibitionCanvas } from './modules/exhibition/ExhibitionCanvas';
import { CommentPanel } from './modules/comment/CommentPanel';
import { AuthService } from './modules/auth/AuthService';
import { useArtworkStore } from './store/ArtworkStore';
import { useCommentStore } from './modules/comment/CommentStore';
import type { User, Artwork, Gallery, FeedItem } from './shared/types';

const useWindowSize = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
};

const Nav: React.FC<{ user: User | null; onLogout: () => void; unread: number }> = ({ user, onLogout, unread }) => {
  const location = useLocation();
  const links = [
    { to: '/', label: '🏛️ 画廊广场', exact: true },
    { to: '/explore', label: '🗺️ 观展轨迹', exact: false },
  ];
  return (
    <nav style={{ height: 60, background: 'rgba(26,26,46,0.95)', borderBottom: '1px solid rgba(255,215,0,0.12)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8, backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 24 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #FFD700, #FF6B6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎨</div>
        <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 17 }}>Virtual Gallery</span>
      </Link>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {links.map(l => {
          const active = l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to);
          return (
            <Link key={l.to} to={l.to} style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13.5, color: active ? '#FFD700' : '#C0C0C0', textDecoration: 'none', background: active ? 'rgba(255,215,0,0.08)' : 'transparent', transition: 'all 0.2s', fontWeight: active ? 600 : 400 }}>{l.label}</Link>
          );
        })}
      </div>
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/my" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.06)' }}>
            {unread > 0 && <span style={{ background: '#FF3366', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 999, fontWeight: 700 }}>{unread}</span>}
            <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: '#333', border: '1.5px solid #FFD700' }}>
              {user.avatar && <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <span style={{ color: '#E0E0E0', fontSize: 13, fontWeight: 500 }}>{user.username}</span>
          </Link>
          <button onClick={onLogout} style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,107,107,0.12)', color: '#FF6B6B', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>退出</button>
        </div>
      ) : (
        <Link to="/login" style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#1A1A2E', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>登录 / 注册</Link>
      )}
    </nav>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(26,26,46,0.8)', color: '#E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const LoginPage: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = mode === 'login' ? await AuthService.login(form.email, form.password) : await AuthService.register(form.username, form.email, form.password);
      if (res.success) { onAuth(); navigate('/'); } else { setError(res.error || '操作失败'); }
    } catch { setError('网络错误'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(ellipse at top, #2A2A48 0%, #1A1A2E 60%)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(44,44,44,0.6)', borderRadius: 20, padding: 36, border: '1px solid rgba(255,215,0,0.12)', backdropFilter: 'blur(16px)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px', background: 'linear-gradient(135deg, #FFD700, #FF6B6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎨</div>
          <h1 style={{ color: '#FFD700', fontSize: 24, marginBottom: 6 }}>{mode === 'login' ? '欢迎回来' : '创建账号'}</h1>
          <p style={{ color: '#808080', fontSize: 13 }}>进入虚拟艺术世界</p>
        </div>
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', background: 'rgba(26,26,46,0.6)', marginBottom: 22 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '10px 0', border: 'none', background: mode === m ? '#FFD700' : 'transparent', color: mode === m ? '#1A1A2E' : '#A0A0A0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div><label style={{ display: 'block', color: '#A0A0A0', fontSize: 12, marginBottom: 6 }}>用户名</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="至少2个字符" style={inputStyle} /></div>
          )}
          <div><label style={{ display: 'block', color: '#A0A0A0', fontSize: 12, marginBottom: 6 }}>邮箱</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" style={inputStyle} /></div>
          <div><label style={{ display: 'block', color: '#A0A0A0', fontSize: 12, marginBottom: 6 }}>密码</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="至少6位" style={inputStyle} /></div>
          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,107,107,0.12)', color: '#FF6B6B', fontSize: 13 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ marginTop: 6, padding: '13px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#1A1A2E', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 20px rgba(255,215,0,0.25)' }}>
            {loading ? '处理中...' : mode === 'login' ? '登 录' : '注 册'}
          </button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center', color: '#666', fontSize: 12 }}>
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: '#FFD700', cursor: 'pointer', fontWeight: 600, marginLeft: 4 }}>
            {mode === 'login' ? '立即注册' : '去登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

const GalleryCard: React.FC<{ gallery: Gallery; onClick: () => void; isFollowing: boolean; onFollowToggle: () => void; disabledFollow?: boolean }> = ({ gallery, onClick, isFollowing, onFollowToggle, disabledFollow }) => {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick}
      style={{
        width: 280, height: 160, borderRadius: 12, position: 'relative', overflow: 'hidden', cursor: 'pointer',
        transform: hover ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hover ? '0 8px 20px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.25s ease', flexShrink: 0, border: '1px solid rgba(255,255,255,0.04)',
      }}>
      <div style={{ width: '100%', height: '100%', background: gallery.coverImage ? `url(${gallery.coverImage}) center/cover` : 'linear-gradient(135deg, #3A3A5E, #2A3A4E)', position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gallery.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>📍 {gallery.location.city} · {gallery.creatorName} · 🖼️ {gallery.artworks.length}</div>
        </div>
        {!disabledFollow && (
          <button onClick={(e) => { e.stopPropagation(); onFollowToggle(); }}
            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              background: isFollowing ? 'rgba(78,205,196,0.18)' : 'rgba(255,215,0,0.9)',
              color: isFollowing ? '#4ECDC4' : '#1A1A2E',
            }}>
            {isFollowing ? '已关注' : '+ 关注'}
          </button>
        )}
      </div>
    </div>
  );
};

const GalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const galleries = useArtworkStore(s => s.galleries.filter(g => g.isPublic));
  const createGallery = useArtworkStore(s => s.createGallery);
  const followGallery = useArtworkStore(s => s.followGallery);
  const unfollowGallery = useArtworkStore(s => s.unfollowGallery);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', wallColor: '#C4B7A6' });
  const unread = useCommentStore(s => s.unreadCount);

  const seedDemo = (u: User) => {
    const demos = [
      { name: '印象派艺术展', desc: '莫奈与雷诺阿的光影世界', color: '#C4B7A6' },
      { name: '现代抽象画廊', desc: '探索当代艺术的边界', color: '#B0A090' },
      { name: '东方水墨意境', desc: '传统与现代的融合', color: '#A8B5A0' },
      { name: '数字艺术新纪元', desc: 'AI辅助创作视觉盛宴', color: '#A098B8' },
      { name: '古典肖像馆', desc: '文艺复兴至十九世纪', color: '#C8B898' },
      { name: '摄影艺术长廊', desc: '捕捉永恒的瞬间', color: '#B8B0A0' },
    ];
    const gradients = [
      ['#FF6B6B', '#4ECDC4'], ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'],
      ['#30cfd0', '#330867'], ['#a8edea', '#fed6e3'], ['#5ee7df', '#b490ca'],
    ];
    demos.forEach((d, i) => {
      const g = createGallery(d.name, d.desc, u.id, u.username, d.color, true);
      const count = 5 + Math.floor(Math.random() * 4);
      for (let a = 0; a < count; a++) {
        const [c1, c2] = gradients[(i * 3 + a) % gradients.length];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g${i}_${a}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g${i}_${a})"/><circle cx="${100 + Math.random() * 600}" cy="${100 + Math.random() * 400}" r="${40 + Math.random() * 80}" fill="rgba(255,255,255,0.2)"/></svg>`;
        const url = 'data:image/svg+xml;base64,' + btoa(svg);
        useArtworkStore.getState().addArtwork(g.id, {
          title: ['晨曦之光', '静谧时分', '色彩的诗', '流动的梦', '永恒瞬间', '自然之心', '记忆碎片', '时空交错'][a % 8] + ` #${a + 1}`,
          description: '一件独特的数字艺术作品', imageUrl: url, thumbnailUrl: url,
          authorId: u.id, authorName: u.username, galleryId: g.id, width: 800, height: 600,
        });
      }
    });
  };

  useEffect(() => {
    if (galleries.length > 0) return;
    if (!user) {
      AuthService.register('艺术爱好者', 'demo@art.com', '123456').then(r => {
        if (r.success) { setUser(r.user); seedDemo(r.user!); }
      });
    } else { seedDemo(user); }
  }, []);

  const onCreate = () => {
    if (!user) { navigate('/login'); return; }
    if (!form.name.trim()) return;
    const g = createGallery(form.name, form.description, user.id, user.username, form.wallColor, true);
    setIsCreating(false); setForm({ name: '', description: '', wallColor: '#C4B7A6' }); navigate(`/gallery/${g.id}`);
  };

  const toggleFollow = (g: Gallery) => {
    if (!user) { navigate('/login'); return; }
    if (AuthService.isFollowing(g.id)) { AuthService.unfollowGallery(g.id); unfollowGallery(g.id, user.id); }
    else { AuthService.followGallery(g.id); followGallery(g.id, user.id); }
    setUser({ ...AuthService.getCurrentUser()! });
  };

  return (
    <div style={{ minHeight: 0, flex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '40px 28px 20px', background: 'radial-gradient(ellipse at 30% 0%, #2A2A48 0%, transparent 60%)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{ color: '#FFD700', fontSize: 13, fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>— VIRTUAL ART GALLERY —</div>
              <h1 style={{ color: '#fff', fontSize: 38, fontWeight: 700, marginBottom: 10 }}>探索世界的艺术角落</h1>
              <p style={{ color: '#A0A0A0', fontSize: 15, maxWidth: 560, lineHeight: 1.7 }}>发现来自全球艺术家的精彩创作，沉浸式3D观展体验，实时评论与互动。开启你的艺术之旅 ✨</p>
            </div>
            <button onClick={() => user ? setIsCreating(true) : navigate('/login')}
              style={{ padding: '13px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(255,107,107,0.35)' }}>
              + 创建我的画廊
            </button>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { n: galleries.length, l: '公开画廊', c: '#FFD700' },
              { n: galleries.reduce((s, g) => s + g.artworks.length, 0), l: '展示作品', c: '#FF6B6B' },
              { n: new Set(galleries.map(g => g.location.city)).size, l: '覆盖城市', c: '#4ECDC4' },
            ].map(s => (
              <div key={s.l} style={{ padding: '14px 22px', borderRadius: 14, background: 'rgba(44,44,44,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: s.c, fontSize: 28, fontWeight: 700, marginBottom: 2 }}>{s.n}</div>
                <div style={{ color: '#808080', fontSize: 12.5 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '8px 28px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ color: '#E0E0E0', fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 4, height: 22, background: 'linear-gradient(to bottom, #FFD700, #FF6B6B)', borderRadius: 2 }} />
            全部画廊空间
          </h2>
          <span style={{ color: '#666', fontSize: 13 }}>共 {galleries.length} 个</span>
        </div>
        {galleries.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div><div>暂无画廊，点击上方按钮创建</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, justifyItems: 'center' }}>
            {galleries.map(g => (
              <GalleryCard key={g.id} gallery={g} onClick={() => navigate(`/gallery/${g.id}`)}
                isFollowing={user ? AuthService.isFollowing(g.id) : false}
                onFollowToggle={() => toggleFollow(g)} disabledFollow={g.creatorId === user?.id} />
            ))}
          </div>
        )}
      </div>
      {isCreating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }} onClick={() => setIsCreating(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#2C2C2C', borderRadius: 20, padding: 28, border: '1px solid rgba(255,215,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#FFD700', fontSize: 18, fontWeight: 600 }}>创建新画廊</h3>
              <button onClick={() => setIsCreating(false)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#A0A0A0', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={{ display: 'block', color: '#A0A0A0', fontSize: 12, marginBottom: 6 }}>画廊名称 *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="给你的画廊起个名字" style={inputStyle} /></div>
              <div><label style={{ display: 'block', color: '#A0A0A0', fontSize: 12, marginBottom: 6 }}>简介</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="描述画廊主题..." rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} /></div>
              <div><label style={{ display: 'block', color: '#A0A0A0', fontSize: 12, marginBottom: 6 }}>墙面颜色</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={form.wallColor} onChange={e => setForm({ ...form, wallColor: e.target.value })} style={{ width: 44, height: 44, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }} />
                  <input value={form.wallColor} onChange={e => setForm({ ...form, wallColor: e.target.value })} style={{ ...inputStyle, fontFamily: 'monospace' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {['#C4B7A6', '#B0A090', '#A8B5A0', '#A098B8', '#C8B898', '#D4C4B0', '#9AA898', '#B8A090'].map(c => (
                    <button key={c} onClick={() => setForm({ ...form, wallColor: c })}
                      style={{ width: 28, height: 28, borderRadius: 6, background: c, border: form.wallColor === c ? '2px solid #FFD700' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <button onClick={onCreate} disabled={!form.name.trim()}
                style={{ padding: '13px 24px', borderRadius: 12, border: 'none', background: form.name.trim() ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#444', color: form.name.trim() ? '#1A1A2E' : '#888', fontSize: 14, fontWeight: 700, cursor: form.name.trim() ? 'pointer' : 'not-allowed' }}>
                创建画廊
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const ExhibitionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const size = useWindowSize();
  const gallery = useArtworkStore(s => s.galleries.find(g => g.id === id));
  const setCurrentGallery = useArtworkStore(s => s.setCurrentGallery);
  const addArtwork = useArtworkStore(s => s.addArtwork);
  const updateGallery = useArtworkStore(s => s.updateGallery);
  const followGallery = useArtworkStore(s => s.followGallery);
  const unfollowGallery = useArtworkStore(s => s.unfollowGallery);
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isMobile = size.w < 768;
  const isTablet = size.w >= 768 && size.w < 1100;

  useEffect(() => { if (id) setCurrentGallery(id); return () => setCurrentGallery(null); }, [id, setCurrentGallery]);

  const toggleFollow = () => {
    if (!gallery) return;
    if (!user) { navigate('/login'); return; }
    if (AuthService.isFollowing(gallery.id)) { AuthService.unfollowGallery(gallery.id); unfollowGallery(gallery.id, user.id); }
    else { AuthService.followGallery(gallery.id); followGallery(gallery.id, user.id); }
    setUser({ ...AuthService.getCurrentUser()! });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || !gallery || !user) return;
    const list = Array.from(files).filter(f => {
      if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(f.type)) { alert('仅支持 JPEG/PNG 格式'); return false; }
      if (f.size > 5 * 1024 * 1024) { alert(`${f.name} 超过5MB限制`); return false; }
      return true;
    });
    setUploading(true);
    let remaining = list.length;
    if (remaining === 0) { setUploading(false); return; }
    list.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || 800;
          const h = img.naturalHeight || 600;
          const canvas = document.createElement('canvas');
          const thW = 280, thH = Math.round(thW * h / w);
          canvas.width = thW; canvas.height = thH;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, thW, thH);
          const thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
          const title = file.name.replace(/\.[^.]+$/, '') || '未命名作品';
          addArtwork(gallery.id, {
            title, description: '', imageUrl: dataUrl, thumbnailUrl: thumbUrl,
            authorId: user!.id, authorName: user!.username, galleryId: gallery.id, width: w, height: h,
          });
          if (!gallery.coverImage) updateGallery(gallery.id, { coverImage: thumbUrl });
          remaining--;
          if (remaining === 0) { setUploading(false); setShowUploader(false); }
        };
        img.onerror = () => { remaining--; if (remaining === 0) { setUploading(false); setShowUploader(false); } };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  if (!gallery) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
        <div style={{ fontSize: 64 }}>🔍</div>
        <div style={{ color: '#A0A0A0', fontSize: 16 }}>画廊不存在或已被删除</div>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#FFD700', color: '#1A1A2E', fontWeight: 600, cursor: 'pointer' }}>返回首页</button>
      </div>
    );
  }

  const isOwner = user?.id === gallery.creatorId;
  const isFollowing = user ? AuthService.isFollowing(gallery.id) : false;
  const emptyArtwork = { id: 'none', title: '点击画作查看详情', thumbnailUrl: '', imageUrl: '', authorName: '', likes: 0, ratings: [], averageRating: 0, commentCount: 0 } as Artwork;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '12px 20px', background: 'rgba(44,44,44,0.6)', borderBottom: '1px solid rgba(