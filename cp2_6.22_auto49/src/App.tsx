import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { Auction, User, ViewMode } from './types';
import AuctionList from './components/AuctionList';
import AuctionDetail from './components/AuctionDetail';
import UserProfile from './components/UserProfile';

interface AppProps {
  socket: Socket;
}

interface CreateFormState {
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  startPrice: string;
  durationHours: string;
}

const initialForm: CreateFormState = {
  title: '',
  author: '',
  description: '',
  coverUrl: '',
  startPrice: '',
  durationHours: '24',
};

const App: React.FC<AppProps> = ({ socket }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('user-1');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formState, setFormState] = useState<CreateFormState>(initialForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState<{ auctionId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const auctionsRef = useRef<Map<string, Auction>>(new Map());

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  useEffect(() => {
    const initData = async () => {
      try {
        const [aRes, uRes] = await Promise.all([fetch('/api/auctions'), fetch('/api/users')]);
        if (aRes.ok) {
          const aData: Auction[] = await aRes.json();
          setAuctions(aData);
          aData.forEach((a) => auctionsRef.current.set(a.id, a));
        }
        if (uRes.ok) {
          setUsers(await uRes.json());
        }
      } catch (e) {
        console.error('加载初始数据失败:', e);
      } finally {
        setLoading(false);
      }
    };
    initData();

    const handleAuctionsUpdated = (list: Auction[]) => {
      setAuctions(list);
      list.forEach((a) => auctionsRef.current.set(a.id, a));
    };
    const handleAuctionCreated = (auction: Auction) => {
      auctionsRef.current.set(auction.id, auction);
    };
    const handleAuctionBid = (data: { auction: Auction; bid: unknown }) => {
      auctionsRef.current.set(data.auction.id, data.auction);
    };
    const handleAuctionEnded = (auction: Auction) => {
      auctionsRef.current.set(auction.id, auction);
    };

    socket.on('auctions:updated', handleAuctionsUpdated);
    socket.on('auction:created', handleAuctionCreated);
    socket.on('auction:bid', handleAuctionBid);
    socket.on('auction:ended', handleAuctionEnded);

    return () => {
      socket.off('auctions:updated', handleAuctionsUpdated);
      socket.off('auction:created', handleAuctionCreated);
      socket.off('auction:bid', handleAuctionBid);
      socket.off('auction:ended', handleAuctionEnded);
    };
  }, [socket]);

  const handleUpdateAuction = useCallback((updated: Auction) => {
    setAuctions((prev) => {
      const idx = prev.findIndex((a) => a.id === updated.id);
      if (idx === -1) return [...prev, updated];
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
  }, []);

  const handleSelectAuction = useCallback(
    (auction: Auction | string) => {
      const id = typeof auction === 'string' ? auction : auction.id;
      setSelectedAuctionId(id);
      setViewMode('detail');
    },
    []
  );

  const handleBackToList = useCallback(() => {
    setSelectedAuctionId(null);
    setViewMode('list');
  }, []);

  const handleGoProfile = useCallback(() => {
    setViewMode('profile');
  }, []);

  const handleGoHome = useCallback(() => {
    setViewMode('list');
    setSelectedAuctionId(null);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setFormState(initialForm);
    setFormError('');
    setFormSuccess(null);
    setShowCreateModal(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setShowCreateModal(false);
    if (formSuccess) {
      setFormSuccess(null);
    }
  }, [formSuccess]);

  const handleSubmitCreate = useCallback(async () => {
    setFormError('');
    const { title, author, description, coverUrl, startPrice, durationHours } = formState;

    if (!title.trim()) return setFormError('请输入书名');
    if (!author.trim()) return setFormError('请输入作者');
    if (!coverUrl.trim()) return setFormError('请输入书籍封面图片URL');
    const price = parseInt(startPrice, 10);
    if (!startPrice || isNaN(price) || price <= 0 || !Number.isInteger(price)) {
      return setFormError('起拍价必须是正整数');
    }
    const duration = parseInt(durationHours, 10);
    if (!durationHours || isNaN(duration) || duration < 1 || duration > 72) {
      return setFormError('拍卖时长需在1-72小时之间');
    }
    if (!currentUser) return setFormError('用户信息异常');

    try {
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: currentUser.id,
          title: title.trim(),
          author: author.trim(),
          description: description.trim(),
          coverUrl: coverUrl.trim(),
          startPrice: price,
          durationHours: duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || '创建拍卖失败');
        return;
      }
      auctionsRef.current.set(data.id, data);
      setAuctions((prev) => [data, ...prev]);
      setFormSuccess({ auctionId: data.id });
    } catch (e) {
      console.error('创建拍卖失败:', e);
      setFormError('网络错误，请稍后重试');
    }
  }, [formState, currentUser]);

  const handleJumpToNew = useCallback(() => {
    if (formSuccess) {
      handleSelectAuction(formSuccess.auctionId);
      setShowCreateModal(false);
      setFormSuccess(null);
    }
  }, [formSuccess, handleSelectAuction]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading" style={{ fontSize: 16 }}>
          正在加载书阁拍卖平台...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="top-nav">
        <div className="nav-content">
          <h1 onClick={handleGoHome}>📚 书阁拍卖</h1>
          <div className="nav-right">
            {currentUser && (
              <div className="user-selector">
                <span style={{ fontSize: 12, opacity: 0.85 }}>当前用户：</span>
                <select
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nickname} (¥{u.balance})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} onClick={handleGoProfile}>
              👤 个人中心
            </button>
            <button className="btn btn-secondary" onClick={handleOpenCreate}>
              + 发布拍卖
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 24 }}>
        {viewMode === 'list' && (
          <>
            <div className="page-title">🏷️ 拍卖市场</div>
            <AuctionList auctions={auctions} onSelect={handleSelectAuction} />
          </>
        )}

        {viewMode === 'detail' && selectedAuctionId && currentUser && (
          <AuctionDetail
            auctionId={selectedAuctionId}
            socket={socket}
            currentUser={currentUser}
            onBack={handleBackToList}
            auctionsRef={auctionsRef}
            onUpdateAuction={handleUpdateAuction}
          />
        )}

        {viewMode === 'profile' && currentUser && (
          <>
            <div className="back-btn" onClick={handleGoHome}>
              ← 返回拍卖市场
            </div>
            <div style={{ height: 16 }} />
            <div className="page-title">👤 个人中心</div>
            <UserProfile
              user={currentUser}
              socket={socket}
              onSelectAuction={handleSelectAuction}
              auctionsRef={auctionsRef}
            />
          </>
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseCreate();
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>📖 发布书籍拍卖</h2>
              <button className="modal-close" onClick={handleCloseCreate}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {formSuccess ? (
                <>
                  <div className="form-success">
                    <div>🎉 拍卖创建成功！</div>
                    <a onClick={handleJumpToNew}>→ 立即查看拍卖详情</a>
                  </div>
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <img
                      src={formState.coverUrl}
                      alt="book"
                      style={{
                        maxWidth: 160,
                        aspectRatio: '3/4',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 14 }}>
                      {formState.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      作者：{formState.author}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                      起拍价 ¥{formState.startPrice}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      时长 {formState.durationHours} 小时
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {formError && <div className="form-error">⚠️ {formError}</div>}

                  <div className="form-group">
                    <label>书名 *</label>
                    <input
                      type="text"
                      placeholder="例如：百年孤独"
                      value={formState.title}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, title: e.target.value }))
                      }
                      maxLength={60}
                    />
                  </div>

                  <div className="form-group">
                    <label>作者 *</label>
                    <input
                      type="text"
                      placeholder="例如：加西亚·马尔克斯"
                      value={formState.author}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, author: e.target.value }))
                      }
                      maxLength={40}
                    />
                  </div>

                  <div className="form-group">
                    <label>书籍描述</label>
                    <textarea
                      placeholder="描述书籍的品相、亮点等信息..."
                      value={formState.description}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, description: e.target.value }))
                      }
                      maxLength={500}
                    />
                  </div>

                  <div className="form-group">
                    <label>封面图片URL *</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formState.coverUrl}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, coverUrl: e.target.value }))
                      }
                    />
                    {formState.coverUrl && (
                      <div style={{ marginTop: 10 }}>
                        <img
                          src={formState.coverUrl}
                          alt="preview"
                          style={{
                            width: 80,
                            height: 106,
                            objectFit: 'cover',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://picsum.photos/seed/placeholder/160/212';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>起拍价（元）*</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="正整数，例如 20"
                        value={formState.startPrice}
                        onChange={(e) =>
                          setFormState((s) => ({ ...s, startPrice: e.target.value }))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>拍卖时长（小时）*</label>
                      <input
                        type="number"
                        min={1}
                        max={72}
                        step={1}
                        placeholder="1-72"
                        value={formState.durationHours}
                        onChange={(e) =>
                          setFormState((s) => ({ ...s, durationHours: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            {!formSuccess && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseCreate}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSubmitCreate}>
                  ✓ 确认发布
                </button>
              </div>
            )}
            {formSuccess && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseCreate}>
                  继续浏览
                </button>
                <button className="btn btn-primary" onClick={handleJumpToNew}>
                  查看拍卖 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
