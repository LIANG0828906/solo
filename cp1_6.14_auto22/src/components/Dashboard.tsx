import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../App';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { userStats, cards, decks, battles } = useAppContext();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<'overview' | 'decks' | 'battles'>('overview');

  return (
    <div>
      <div className="page-title">
        <span>📊</span>
        <span>个人面板</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          { k: 'overview', n: '概览', i: '📋' },
          { k: 'decks', n: '我的卡组', i: '📚' },
          { k: 'battles', n: '最近对局', i: '⚔️' },
        ] as const).map((t) => (
          <button
            key={t.k}
            className={`btn ${activePanel === t.k ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActivePanel(t.k)}
          >
            {t.i} {t.n}
          </button>
        ))}
      </div>

      <div key={activePanel}>
        {activePanel === 'overview' && <OverviewPanel />}
        {activePanel === 'decks' && <DecksPanel />}
        {activePanel === 'battles' && <BattlesPanel />}
      </div>
    </div>
  );
};

const OverviewPanel: React.FC = () => {
  const { userStats, cards } = useAppContext();
  const topCardsWithDetail = useMemo(
    () =>
      userStats.topCards
        .map((tc) => ({ ...tc, card: cards.find((c) => c.id === tc.cardId) }))
        .filter((x) => x.card),
    [userStats.topCards, cards]
  );

  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">卡组数量</div>
              <div className="stat-card-value">{userStats.deckCount}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                最多可创建 5 套
              </div>
            </div>
            <div className="stat-card-icon decks">📚</div>
          </div>
          <div className="stat-card-trend">↑ 卡组构建中</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">对局总数</div>
              <div className="stat-card-value">{userStats.battleCount}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                导入的对局记录
              </div>
            </div>
            <div className="stat-card-icon battles">⚔️</div>
          </div>
          <div className="stat-card-trend">↑ 持续积累</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">卡牌图鉴</div>
              <div className="stat-card-value">{cards.length}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                全部可收集卡牌
              </div>
            </div>
            <div className="stat-card-icon cards">🃏</div>
          </div>
          <div className="stat-card-trend">↑ 完整图鉴</div>
        </div>
      </div>

      <div className="top-cards-section">
        <div className="section-title">
          <span>🏆 常用卡牌 TOP 3</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 'normal' }}>
            根据已保存卡组中的使用频率统计
          </span>
        </div>

        {topCardsWithDetail.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div>暂无统计数据，创建卡组后将显示使用频率最高的卡牌</div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => window.location.href = '/deck'}
            >
              📚 立即创建卡组
            </button>
          </div>
        ) : (
          <>
            <TopCardsBarChart cards={topCardsWithDetail} />
            <div style={{ marginTop: 24 }}>
              <RadarStatsChart />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface TopCardItem {
  cardId: string;
  count: number;
  card: ReturnType<typeof useAppContext>['cards'][number];
}

const TopCardsBarChart: React.FC<{ cards: TopCardItem[] }> = ({ cards }) => {
  const maxCount = Math.max(...cards.map((c) => c.count), 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const medals = ['🥇', '🥈', '🥉'];
  const barColors = [
    'linear-gradient(180deg, #fbbf24, #f59e0b)',
    'linear-gradient(180deg, #c0c0c0, #9ca3af)',
    'linear-gradient(180deg, #d97706, #b45309)',
  ];
  const rarityClasses = { common: 'var(--common)', rare: 'var(--rare)', epic: 'var(--epic)', legendary: 'var(--legendary)' } as const;

  return (
    <div className="top-cards-chart">
      {cards.map((tc, idx) => (
        <div key={tc.cardId} className="top-card-bar-wrap">
          <div style={{ fontSize: 28 }}>{medals[idx]}</div>
          <div style={{ width: '100%', height: 160, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div
              className="top-card-bar"
              style={{
                width: '70%',
                height: mounted ? `${Math.max(20, (tc.count / maxCount) * 140)}px` : '0px',
                transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                background: barColors[idx],
              }}
            >
              <span className="top-card-count">{tc.count}</span>
            </div>
          </div>
          <div className="top-card-info">
            <img
              src={tc.card.image}
              alt={tc.card.name}
              className="top-card-mini"
              style={{ borderColor: rarityClasses[tc.card.rarity] }}
              onError={(e) => { ((e.currentTarget as HTMLImageElement).style.display = 'none'); }}
            />
            <div className="top-card-name">{tc.card.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {tc.card.cost}费 · {tc.card.attack}/{tc.card.health}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const RadarStatsChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const animRef = useRef<number | null>(null);

  const { decks, cards } = useAppContext();

  const stats = useMemo(() => {
    const allDeckCards = decks.flatMap((d) => d.cards);
    let totalCost = 0, totalAtk = 0, totalHp = 0;
    let rarityScore = { common: 0, rare: 0, epic: 0, legendary: 0 };
    let totalCount = 0;
    allDeckCards.forEach((dc) => {
      const c = cards.find((x) => x.id === dc.cardId);
      if (c) {
        totalCost += c.cost * dc.count;
        totalAtk += c.attack * dc.count;
        totalHp += c.health * dc.count;
        rarityScore[c.rarity] += dc.count;
        totalCount += dc.count;
      }
    });
    const ratio = totalCount > 0 ? 1 : 0;
    const avgCost = totalCount > 0 ? (totalCost / totalCount / 10) * 100 : 0;
    const atkScore = totalCount > 0 ? Math.min(100, (totalAtk / totalCount / 8) * 100) : 0;
    const hpScore = totalCount > 0 ? Math.min(100, (totalHp / totalCount / 8) * 100) : 0;
    const totalRarity = Object.values(rarityScore).reduce((a, b) => a + b, 0) || 1;
    const rarityScoreFinal = ((rarityScore.rare + rarityScore.epic * 2 + rarityScore.legendary * 3) / totalRarity / 3) * 100;
    const variety = totalCount > 0 ? Math.min(100, (allDeckCards.length / 15) * 100) : 0;
    return [avgCost || 30 * ratio, atkScore || 40 * ratio, hpScore || 40 * ratio, rarityScoreFinal || 25 * ratio, variety || 50 * ratio];
  }, [decks, cards]);

  const labels = ['费用分布', '攻击力', '生命值', '稀有度', '多样性'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy) - 60;
    const sides = 5;

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let r = 1; r <= 4; r++) {
        const rad = (radius * r) / 4;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
          const x = cx + rad * Math.cos(angle);
          const y = cy + rad * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
        ctx.stroke();
      }

      const currentStats = stats.map((s) => s * progress);

      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const idx = i % sides;
        const angle = (Math.PI * 2 * idx) / sides - Math.PI / 2;
        const r = (currentStats[idx] / 100) * radius;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, 'rgba(233,69,96,0.4)');
      grad.addColorStop(1, 'rgba(233,69,96,0.1)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (progress >= 0.95) {
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
          const r = (currentStats[i] / 100) * radius;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'var(--accent)';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();

          const labelR = radius + 28;
          const lx = cx + labelR * Math.cos(angle);
          const ly = cy + labelR * Math.sin(angle);
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labels[i], lx, ly);
          ctx.fillStyle = 'var(--accent)';
          ctx.font = '11px sans-serif';
          ctx.fillText(`${Math.round(stats[i])}`, lx, ly + 16);
        }
      }
    };

    const animate = () => {
      progressRef.current += 0.03;
      if (progressRef.current >= 1) {
        progressRef.current = 1;
        draw(1);
        return;
      }
      draw(progressRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    progressRef.current = 0;
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [stats]);

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
        🧭 卡组综合分析雷达图
      </div>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 20 }}>
        <div style={{ position: 'relative', width: '100%', height: 320 }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  );
};

const DecksPanel: React.FC = () => {
  const { decks, cards, setCurrentDeck } = useAppContext();
  const navigate = useNavigate();

  const goToDeck = (deck: any) => {
    setCurrentDeck(deck);
    navigate('/deck');
  };

  if (decks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
        <div style={{ fontSize: 18, marginBottom: 16 }}>还没有卡组，立即开始构建吧！</div>
        <button className="btn btn-primary" onClick={() => navigate('/deck')}>
          ✨ 创建第一套卡组
        </button>
      </div>
    );
  }

  return (
    <div className="decks-list">
      {decks.map((d) => {
        const totalCount = d.cards.reduce((s, x) => s + x.count, 0);
        const totalCost = d.cards.reduce((s, dc) => {
          const c = cards.find((x) => x.id === dc.cardId);
          return s + (c ? c.cost * dc.count : 0);
        }, 0);
        const avgCost = totalCount > 0 ? (totalCost / totalCount).toFixed(1) : '0';

        return (
          <div key={d.id} className="deck-preview" style={{ cursor: 'pointer' }} onClick={() => goToDeck(d)}>
            <div className="deck-preview-header">
              <div className="deck-preview-name">{d.name}</div>
              <div className="deck-preview-count">{totalCount}</div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--accent)' }}>{d.cards.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>种类</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#60a5fa' }}>{avgCost}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>平均费</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: totalCount >= 30 ? 'var(--success)' : 'var(--warning)' }}>
                  {totalCount >= 30 ? '✓' : '!'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {totalCount >= 30 ? '合规' : '缺卡'}
                </div>
              </div>
            </div>
            <div className="deck-preview-footer">
              <div className="deck-preview-date">
                更新于 {new Date(d.updatedAt).toLocaleString()}
              </div>
              <button className="btn btn-primary btn-sm">编辑</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BattlesPanel: React.FC = () => {
  const { battles, setCurrentDeck } = useAppContext();
  const navigate = useNavigate();

  if (battles.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
        <div style={{ fontSize: 18, marginBottom: 16 }}>还没有对局记录</div>
        <button className="btn btn-primary" onClick={() => navigate('/battle')}>
          📥 导入对局回放
        </button>
      </div>
    );
  }

  return (
    <div className="battle-list">
      {battles.slice(0, 12).map((b) => (
        <div key={b.id} className="battle-card" onClick={() => navigate('/battle')}>
          <div className="battle-players">
            <div className={`battle-player ${b.winner === 1 ? 'winner' : ''}`}>
              {b.player1} {b.winner === 1 && '🏆'}
            </div>
            <div className="battle-vs">VS</div>
            <div className={`battle-player ${b.winner === 2 ? 'winner' : ''}`}>
              {b.player2} {b.winner === 2 && '🏆'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span className={`battle-result-badge ${b.winner === 1 ? 'win' : 'lose'}`}>
              {b.winner === 1 ? b.player1 + '胜' : b.player2 + '胜'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>{b.totalTurns}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>回合数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                {b.turns.reduce((s, t) => s + t.actions.reduce((ss, a) => ss + (a.damage || 0), 0), 0)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>总伤害</div>
            </div>
          </div>
          <div className="battle-meta">
            <span>{new Date(b.createdAt).toLocaleDateString()}</span>
            <span>查看详情 →</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
