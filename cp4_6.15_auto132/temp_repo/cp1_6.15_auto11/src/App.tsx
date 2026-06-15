import React, { useState, useEffect, useCallback } from 'react';
import OrderBoard from './components/OrderBoard';
import SplitResult from './components/SplitResult';
import {
  Order,
  SplitResult as SplitResultType,
  createOrder as apiCreateOrder,
  getOrder,
  joinOrder as apiJoinOrder,
  getSplitResult,
  togglePayment as apiTogglePayment,
  createWebSocket,
} from './api/orderApi';

type TabType = 'order' | 'split' | 'settle';

function App() {
  const [order, setOrder] = useState<Order | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('order');
  const [splitResult, setSplitResult] = useState<SplitResultType | null>(null);
  const [error, setError] = useState<string>('');
  const [joiningFromLink, setJoiningFromLink] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createMaxAmount, setCreateMaxAmount] = useState('');
  const [createParticipantName, setCreateParticipantName] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');

  const fetchSplitResult = useCallback(async (orderId: string) => {
    try {
      const result = await getSplitResult(orderId);
      setSplitResult(result);
    } catch (e) {
      console.error('Failed to fetch split result:', e);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const stored = localStorage.getItem(`participant_${hash}`);
    if (stored) {
      setCurrentParticipantId(stored);
      getOrder(hash)
        .then(setOrder)
        .catch((e) => setError(e.message));
    } else {
      setJoinCode(hash);
      getOrder(hash)
        .then((o) => {
          setOrder(o);
          setJoiningFromLink(true);
        })
        .catch((e) => setError(e.message));
    }
  }, []);

  useEffect(() => {
    if (!order) return;

    const websocket = createWebSocket(order.id);

    websocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWsMessage(msg);
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };

    return () => {
      websocket.close();
    };
  }, [order?.id]);

  useEffect(() => {
    if (order && (activeTab === 'split' || activeTab === 'settle')) {
      fetchSplitResult(order.id);
    }
  }, [activeTab, order?.items?.length, order?.participants?.length, order?.id]);

  const handleWsMessage = useCallback(
    (msg: { event: string; data: any }) => {
      setOrder((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };

        switch (msg.event) {
          case 'item_added':
            updated.items = [...updated.items, msg.data];
            break;
          case 'item_removed':
            updated.items = updated.items.filter((i) => i.id !== msg.data.id);
            break;
          case 'item_updated':
            updated.items = updated.items.map((i) =>
              i.id === msg.data.id ? msg.data : i
            );
            break;
          case 'participant_added':
            updated.participants = [...updated.participants, msg.data];
            break;
          case 'payment_updated':
            updated.participants = updated.participants.map((p) =>
              p.id === msg.data.participantId
                ? { ...p, paid: msg.data.paid }
                : p
            );
            break;
        }
        return updated;
      });

      if (
        msg.event === 'payment_updated' ||
        msg.event === 'item_added' ||
        msg.event === 'item_removed' ||
        msg.event === 'item_updated'
      ) {
        const oid = order?.id;
        if (oid && (activeTab === 'split' || activeTab === 'settle')) {
          fetchSplitResult(oid);
        }
      }
    },
    [order?.id, activeTab, fetchSplitResult]
  );

  const handleCreateOrder = async () => {
    if (!createName || !createParticipantName) return;
    try {
      setError('');
      const { order: newOrder, currentParticipantId: pid } =
        await apiCreateOrder(
          createName,
          createMaxAmount ? Number(createMaxAmount) : undefined,
          createParticipantName
        );
      setOrder(newOrder);
      setCurrentParticipantId(pid);
      localStorage.setItem(`participant_${newOrder.id}`, pid);
      window.location.hash = newOrder.id;
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleJoinOrder = async () => {
    if (!joinCode || !joinName) return;
    try {
      setError('');
      const { currentParticipantId: pid } = await apiJoinOrder(
        joinCode,
        joinName
      );
      const orderData = await getOrder(joinCode);
      setOrder(orderData);
      setCurrentParticipantId(pid);
      setJoiningFromLink(false);
      localStorage.setItem(`participant_${joinCode}`, pid);
      window.location.hash = joinCode;
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleTogglePayment = async (participantId: string) => {
    if (!order) return;
    try {
      await apiTogglePayment(order.id, participantId);
      if (activeTab === 'settle' || activeTab === 'split') {
        fetchSplitResult(order.id);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${order?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('链接已复制到剪贴板！');
    });
  };

  if (joiningFromLink && order) {
    return (
      <div className="landing-page">
        <div className="landing-card animate-bounce-in">
          <div className="landing-emoji">🎉</div>
          <h1 className="landing-title">加入拼单</h1>
          <p className="landing-subtitle">
            你被邀请加入「{order.name}」
          </p>
          <div className="form-section">
            <input
              placeholder="输入你的名字"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinOrder()}
            />
            <button className="btn-primary" onClick={handleJoinOrder}>
              加入拼单
            </button>
          </div>
          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="landing-page">
        <div className="landing-card">
          <div className="landing-emoji">🍲</div>
          <h1 className="landing-title">拼单点餐</h1>
          <p className="landing-subtitle">一起点外卖，轻松分费用</p>

          {!showJoin ? (
            <div className="form-section">
              <h2>创建拼单</h2>
              <input
                placeholder="你的名字"
                value={createParticipantName}
                onChange={(e) => setCreateParticipantName(e.target.value)}
              />
              <input
                placeholder="拼单名称（如：周五午餐）"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
              <input
                type="number"
                placeholder="金额上限（可选）"
                value={createMaxAmount}
                onChange={(e) => setCreateMaxAmount(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={handleCreateOrder}
                disabled={!createName || !createParticipantName}
              >
                创建拼单
              </button>
              <button className="btn-link" onClick={() => setShowJoin(true)}>
                已有拼单？加入拼单 →
              </button>
            </div>
          ) : (
            <div className="form-section join-section animate-bounce-in">
              <h2>加入拼单</h2>
              <input
                placeholder="拼单代码"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <input
                placeholder="你的名字"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={handleJoinOrder}
                disabled={!joinCode || !joinName}
              >
                加入拼单
              </button>
              <button className="btn-link" onClick={() => setShowJoin(false)}>
                ← 创建新拼单
              </button>
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    );
  }

  const currentParticipant = order.participants.find(
    (p) => p.id === currentParticipantId
  );
  const paidCount = splitResult
    ? splitResult.splits.filter((s) => s.paid).length
    : 0;
  const totalCount = order.participants.length;

  return (
    <div className="order-page">
      <header className="order-header">
        <div className="order-info">
          <h1 className="order-name">{order.name}</h1>
          {order.maxAmount && (
            <span className="order-limit">上限 ¥{order.maxAmount}</span>
          )}
          <span className="order-code">拼单码: {order.id}</span>
          <button className="btn-share" onClick={handleShareLink}>
            📋 分享
          </button>
        </div>

        <div className="participants-bar">
          {order.participants.map((p) => (
            <div
              key={p.id}
              className={`participant-avatar ${
                p.id === currentParticipantId ? 'avatar-active' : ''
              }`}
              style={{ backgroundColor: p.color }}
              title={p.name}
            >
              {p.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {currentParticipant && (
            <div className="current-user-label">
              👤 {currentParticipant.name}
            </div>
          )}
        </div>
      </header>

      <nav className="tab-bar">
        {(['order', 'split', 'settle'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'order'
              ? '🍽️ 点菜'
              : tab === 'split'
              ? '💰 分摊'
              : '✅ 结算'}
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {activeTab === 'order' && (
          <OrderBoard
            order={order}
            currentParticipantId={currentParticipantId}
          />
        )}
        {activeTab === 'split' && splitResult && (
          <SplitResult splitResult={splitResult} orderId={order.id} />
        )}
        {activeTab === 'split' && !splitResult && (
          <div className="empty-state">
            <p>暂无分摊数据，请先添加菜品 🍽️</p>
          </div>
        )}
        {activeTab === 'settle' && splitResult && (
          <div className="settle-panel">
            <div className="settle-progress">
              <div className="progress-label">
                <span>结算进度</span>
                <span>
                  {paidCount} / {totalCount} 人已付
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      totalCount
                        ? (paidCount / totalCount) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="settle-list">
              {splitResult.splits.map((split) => (
                <div
                  key={split.participantId}
                  className={`settle-item ${
                    split.paid ? 'settle-paid' : ''
                  }`}
                  onClick={() => handleTogglePayment(split.participantId)}
                >
                  <div
                    className={`settle-avatar ${
                      split.paid ? 'avatar-paid' : ''
                    }`}
                    style={{
                      backgroundColor: split.paid
                        ? '#66BB6A'
                        : split.participantColor,
                    }}
                  >
                    {split.paid ? (
                      <span className="check-mark">✓</span>
                    ) : (
                      split.participantName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="settle-info">
                    <span className="settle-name">
                      {split.participantName}
                    </span>
                    <span className="settle-amount">
                      ¥{split.total.toFixed(2)}
                    </span>
                  </div>
                  <div
                    className={`settle-status ${
                      split.paid ? 'status-paid' : 'status-unpaid'
                    }`}
                  >
                    {split.paid ? '已付 ✓' : '未付'}
                  </div>
                </div>
              ))}
            </div>

            <div className="settle-total">
              总计: ¥{splitResult.totalAmount.toFixed(2)}
            </div>
          </div>
        )}
        {activeTab === 'settle' && !splitResult && (
          <div className="empty-state">
            <p>暂无结算数据，请先添加菜品 🍽️</p>
          </div>
        )}
      </main>

      {error && (
        <div className="error-toast" onClick={() => setError('')}>
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
