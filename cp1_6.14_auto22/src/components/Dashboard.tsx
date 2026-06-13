import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

const AnimatedNumber: React.FC<{ value: number; duration?: number; delay?: number }> = ({
  value,
  duration = 1500,
  delay = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const startAnimation = () => {
      startTimeRef.current = null;
      setDisplayValue(0);

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(easeOutQuart * value);

        setDisplayValue(currentValue);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    const timer = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, delay]);

  return <>{displayValue}</>;
};

interface TopCardItem {
  cardId: string;
  count: number;
  card: ReturnType<typeof useAppContext>['cards'][number];
}

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const TopCardsCanvasBarChart: React.FC<{ cards: TopCardItem[] }> = ({ cards }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }>>([]);

  const barColors = [
    { top: '#fbbf24', bottom: '#f59e0b', glow: 'rgba(251, 191, 36, 0.6)' },
    { top: '#c0c0c0', bottom: '#9ca3af', glow: 'rgba(192, 192, 192, 0.5)' },
    { top: '#d97706', bottom: '#b45309', glow: 'rgba(217, 119, 6, 0.5)' },
  ];
  const medals = ['🥇', '🥈', '🥉'];
  const rarityColors: Record<string, string> = { common: '#c0c0c0', rare: '#4a90d9', epic: '#a855f7', legendary: '#fbbf24' };

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

    const w = rect.width;
    const h = rect.height;
    const maxCount = Math.max(...cards.map((c) => c.count), 1);
    const barCount = cards.length;
    const barAreaWidth = w / barCount;
    const barWidth = Math.min(60, barAreaWidth * 0.5);
    const barMaxHeight = h * 0.55;
    const barBottomY = h - 50;

    const spawnParticles = (barIndex: number, barHeight: number) => {
      const cx = barAreaWidth * barIndex + barAreaWidth / 2;
      const topY = barBottomY - barHeight;
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        particlesRef.current.push({
          x: cx + (Math.random() - 0.5) * barWidth,
          y: topY + Math.random() * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          color: barColors[barIndex]?.top || '#fff',
          size: 2 + Math.random() * 3,
        });
      }
    };

    const drawRoundRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      const gridLines = 4;
      for (let i = 0; i <= gridLines; i++) {
        const y = barBottomY - (barMaxHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(w - 20, y);
        ctx.stroke();
      }

      cards.forEach((tc, idx) => {
        const cx = barAreaWidth * idx + barAreaWidth / 2;
        const barX = cx - barWidth / 2;
        const targetHeight = Math.max(20, (tc.count / maxCount) * barMaxHeight);
        const currentHeight = targetHeight * easeOutBack(Math.min(progress * 1.2 - idx * 0.15, 1));

        if (progress > 0.8 + idx * 0.05 && particlesRef.current.length < 50 + idx * 12) {
          if (Math.random() < 0.3) {
            spawnParticles(idx, currentHeight);
          }
        }

        ctx.save();
        ctx.shadowColor = barColors[idx]?.glow || 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 20 * progress;

        const gradient = ctx.createLinearGradient(barX, barBottomY - currentHeight, barX, barBottomY);
        gradient.addColorStop(0, barColors[idx]?.top || '#fff');
        gradient.addColorStop(1, barColors[idx]?.bottom || '#888');

        drawRoundRect(barX, barBottomY - currentHeight, barWidth, currentHeight, 8);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        if (progress > 0.6) {
          const textProgress = Math.min((progress - 0.6) / 0.4, 1);
          ctx.save();
          ctx.globalAlpha = textProgress;
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${tc.count}`, cx, barBottomY - currentHeight - 12);
          ctx.restore();
        }
      });

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.02;
        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      cards.forEach((tc, idx) => {
        const cx = barAreaWidth * idx + barAreaWidth / 2;
        const nameY = barBottomY + 36;

        if (progress > 0.7) {
          const textProgress = Math.min((progress - 0.7) / 0.3, 1);
          ctx.save();
          ctx.globalAlpha = textProgress;

          const rarityColor = rarityColors[tc.card.rarity] || '#fff';
          ctx.fillStyle = '#eaeaea';
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const maxTextWidth = barWidth + 20;
          let displayName = tc.card.name;
          if (ctx.measureText(displayName).width > maxTextWidth) {
            while (ctx.measureText(displayName + '...').width > maxTextWidth && displayName.length > 0) {
              displayName = displayName.slice(0, -1);
            }
            displayName += '...';
          }
          ctx.fillText(displayName, cx, nameY);

          ctx.fillStyle = 'rgba(160, 160, 176, 0.8)';
          ctx.font = '11px sans-serif';
          ctx.fillText(`${tc.card.cost}费 · ${tc.card.attack}/${tc.card.health}`, cx, nameY + 18);

          ctx.fillStyle = rarityColor;
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(tc.card.rarity.toUpperCase(), cx, nameY + 34);

          const medalX = cx;
          const medalY = barBottomY - 10;
          ctx.font = '20px sans-serif';
          ctx.fillText(medals[idx] || '', medalX, medalY);

          ctx.restore();
        }
      });
    };

    const animate = () => {
      progressRef.current += 0.018;
      if (progressRef.current >= 1) {
        progressRef.current = 1;
        draw(1);

        const idleAnim = () => {
          progressRef.current = 1;
          draw(1);
          if (particlesRef.current.length > 0) {
            animRef.current = requestAnimationFrame(idleAnim);
          }
        };
        animRef.current = requestAnimationFrame(idleAnim);
        return;
      }
      draw(progressRef.current);
      animRef.current = requestAnimationFrame(animate);
    };

    progressRef.current = 0;
    particlesRef.current = [];
    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [cards]);

  return (
    <div style={{ width: '100%', height: 280 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

const WordCloudView: React.FC<{ cards: TopCardItem[] }> = ({ cards }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const placedRef = useRef<Array<{ x: number; y: number; width: number; height: number }>>([]);

  const rarityColors: Record<string, string> = {
    common: '#c0c0c0',
    rare: '#4a90d9',
    epic: '#a855f7',
    legendary: '#fbbf24',
  };

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

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;

    const maxCount = Math.max(...cards.map((c) => c.count), 1);
    const minCount = Math.min(...cards.map((c) => c.count), 1);

    const wordList = cards.map((tc, idx) => {
      const normalized = (tc.count - minCount) / (maxCount - minCount || 1);
      const fontSize = 16 + normalized * 28;
      return {
        text: tc.card.name,
        count: tc.count,
        rarity: tc.card.rarity,
        fontSize,
        weight: idx === 0 ? 'bold' : idx === 1 ? '600' : 'normal',
        delay: idx * 0.08,
      };
    });

    placedRef.current = [];

    const checkCollision = (x: number, y: number, width: number, height: number): boolean => {
      for (const p of placedRef.current) {
        if (
          x < p.x + p.width &&
          x + width > p.x &&
          y < p.y + p.height &&
          y + height > p.y
        ) {
          return true;
        }
      }
      return false;
    };

    const placeWord = (
      text: string,
      fontSize: number,
      weight: string,
      startIdx: number
    ): { x: number; y: number; width: number; height: number } | null => {
      ctx.font = `${weight} ${fontSize}px sans-serif`;
      const textWidth = ctx.measureText(text).width;
      const textHeight = fontSize;

      const maxRadius = Math.min(cx, cy) * 0.9;
      const angleStep = 0.3;
      const radiusStep = 3;

      for (let r = 0; r < maxRadius; r += radiusStep) {
        const startAngle = startIdx * (Math.PI * 2 / wordList.length);
        for (let a = 0; a < Math.PI * 2; a += angleStep) {
          const angle = startAngle + a;
          const x = cx + r * Math.cos(angle) - textWidth / 2;
          const y = cy + r * Math.sin(angle) - textHeight / 2;

          if (x < 10 || x + textWidth > w - 10) continue;
          if (y < 10 || y + textHeight > h - 10) continue;

          if (!checkCollision(x, y, textWidth + 6, textHeight + 4)) {
            return { x, y, width: textWidth + 6, height: textHeight + 4 };
          }
        }
      }
      return null;
    };

    const positions = wordList.map((word, idx) => {
      const pos = placeWord(word.text, word.fontSize, word.weight, idx);
      if (pos) {
        placedRef.current.push(pos);
      }
      return { ...word, pos };
    });

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, w, h);

      positions.forEach((word, idx) => {
        if (!word.pos) return;

        const wordProgress = Math.max(0, Math.min(1, (progress - word.delay) / 0.6));
        if (wordProgress <= 0) return;

        const eased = easeOutBack(wordProgress);
        const alpha = Math.min(1, wordProgress);
        const scale = 0.5 + eased * 0.5;

        ctx.save();
        ctx.globalAlpha = alpha;

        const px = word.pos.x + word.pos.width / 2;
        const py = word.pos.y + word.pos.height / 2;

        ctx.translate(px, py);
        ctx.scale(scale, scale);
        ctx.translate(-px, -py);

        const color = rarityColors[word.rarity] || '#fff';

        ctx.shadowColor = color;
        ctx.shadowBlur = 8 * eased;

        ctx.fillStyle = color;
        ctx.font = `${word.weight} ${word.fontSize}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(word.text, word.pos.x + 3, word.pos.y + 2);

        if (wordProgress > 0.8) {
          const countAlpha = (wordProgress - 0.8) / 0.2;
          ctx.globalAlpha = alpha * countAlpha * 0.7;
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '11px sans-serif';
          ctx.fillText(`×${word.count}`, word.pos.x + 3, word.pos.y + word.fontSize + 2);
        }

        ctx.restore();
      });
    };

    const animate = () => {
      progressRef.current += 0.015;
      if (progressRef.current >= 1.2) {
        progressRef.current = 1.2;
        draw(1.2);
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
  }, [cards]);

  return (
    <div style={{ width: '100%', height: 280 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

const OverviewPanel: React.FC = () => {
  const { userStats, cards } = useAppContext();
  const [viewMode, setViewMode] = useState<'bar' | 'cloud'>('bar');

  const topCardsWithDetail = useMemo(
    () =>
      userStats.topCards
        .map((tc) => ({ ...tc, card: cards.find((c) => c.id === tc.cardId) }))
        .filter((x) => x.card) as TopCardItem[],
    [userStats.topCards, cards]
  );

  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">卡组数量</div>
              <div className="stat-card-value">
                <AnimatedNumber value={userStats.deckCount} delay={0} />
              </div>
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
              <div className="stat-card-value">
                <AnimatedNumber value={userStats.battleCount} delay={200} />
              </div>
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
              <div className="stat-card-value">
                <AnimatedNumber value={cards.length} delay={400} />
              </div>
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
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${viewMode === 'bar' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('bar')}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              📊 柱状图
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'cloud' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('cloud')}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              ☁️ 词云
            </button>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: -8, marginBottom: 16 }}>
          根据已保存卡组中的使用频率统计
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
            <div key={viewMode}>
              {viewMode === 'bar' && <TopCardsCanvasBarChart cards={topCardsWithDetail} />}
              {viewMode === 'cloud' && <WordCloudView cards={topCardsWithDetail} />}
            </div>
            <div style={{ marginTop: 24 }}>
              <RadarStatsChart />
            </div>
          </>
        )}
      </div>
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

      const gridProgress = Math.min(progress * 2, 1);
      if (gridProgress > 0) {
        ctx.strokeStyle = `rgba(255,255,255,${0.08 * gridProgress})`;
        ctx.lineWidth = 1;
        for (let r = 1; r <= 4; r++) {
          const rad = (radius * r) / 4 * easeOutCubic(gridProgress);
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

        ctx.strokeStyle = `rgba(255,255,255,${0.12 * gridProgress})`;
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
          const rad = radius * easeOutCubic(gridProgress);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + rad * Math.cos(angle), cy + rad * Math.sin(angle));
          ctx.stroke();
        }
      }

      const dataProgress = Math.max(0, (progress - 0.3) / 0.7);
      if (dataProgress > 0) {
        const easedData = easeOutCubic(dataProgress);
        const currentStats = stats.map((s) => s * easedData);

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, `rgba(233,69,96,${0.4 * dataProgress})`);
        gradient.addColorStop(1, `rgba(233,69,96,${0.1 * dataProgress})`);

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
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = `rgba(233, 69, 96, ${dataProgress})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (progress >= 0.85) {
          const dotProgress = Math.min(1, (progress - 0.85) / 0.15);
          for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
            const r = (currentStats[i] / 100) * radius;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            const dotSize = 5 * dotProgress;
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = 'var(--accent)';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        if (progress >= 0.95) {
          const labelProgress = Math.min(1, (progress - 0.95) / 0.1);
          for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
            const labelR = radius + 28;
            const lx = cx + labelR * Math.cos(angle);
            const ly = cy + labelR * Math.sin(angle);

            ctx.globalAlpha = labelProgress;
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[i], lx, ly);
            ctx.fillStyle = 'var(--accent)';
            ctx.font = '11px sans-serif';
            ctx.fillText(`${Math.round(stats[i])}`, lx, ly + 16);
            ctx.globalAlpha = 1;
          }
        }
      }
    };

    const animate = () => {
      progressRef.current += 0.012;
      if (progressRef.current >= 1.1) {
        progressRef.current = 1.1;
        draw(1.1);
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
