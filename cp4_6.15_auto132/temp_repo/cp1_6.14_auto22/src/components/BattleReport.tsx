import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BattleRecord, BattleTurn } from '../types';
import { useAppContext } from '../App';
import { battleApi } from '../api';

const sampleBattle = {
  player1: '玩家A',
  player2: '玩家B',
  winner: 1 as const,
  turns: Array.from({ length: 8 }).map((_, i) => ({
    turn: i + 1,
    actions: [
      {
        type: 'play' as const,
        player: (i % 2 === 0 ? 1 : 2) as 1 | 2,
        cardName: ['火球术', '圣光骑士', '新兵战士', '精灵弓手', '狂战士', '冰霜女巫', '火焰元素', '暗影刺客'][i % 8],
        timestamp: Date.now() + i * 30000,
      },
      {
        type: 'attack' as const,
        player: ((i + 1) % 2 === 0 ? 1 : 2) as 1 | 2,
        damage: (i + 1) * 2,
        hero1Health: 30 - (i + 1),
        hero2Health: 30 - (i + 2),
        timestamp: Date.now() + i * 30000 + 15000,
      },
      {
        type: 'hero_skill' as const,
        player: (i % 2 === 0 ? 2 : 1) as 1 | 2,
        damage: 2,
        timestamp: Date.now() + i * 30000 + 30000,
      },
    ],
    manaData: [0, 1, 2, Math.min(i + 1, 10), Math.min(i + 1, 10) - 2, 0],
    powerData: [0, 2, 4, 6 + i, 4 + i, 3 + i],
  })),
};

const BattleReport: React.FC = () => {
  const { battles, refreshBattles } = useAppContext();
  const [selectedBattle, setSelectedBattle] = useState<BattleRecord | null>(null);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 2500);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await battleApi.create(data);
      setSelectedBattle(result);
      await refreshBattles();
      showMessage('success', '对局导入成功');
    } catch (err: any) {
      showMessage('error', err.response?.data?.error || '文件解析失败，请检查JSON格式');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDelete = async (battleId: string) => {
    if (!confirm('确定删除此对局记录？')) return;
    try {
      await battleApi.delete(battleId);
      await refreshBattles();
      if (selectedBattle?.id === battleId) {
        setSelectedBattle(null);
        setExpandedTurn(null);
      }
      showMessage('success', '删除成功');
    } catch (err) {
      showMessage('error', '删除失败');
    }
  };

  const loadSampleBattle = async () => {
    try {
      const result = await battleApi.create(sampleBattle);
      setSelectedBattle(result);
      await refreshBattles();
      showMessage('success', '示例对局加载成功');
    } catch (err) {
      showMessage('error', '加载示例失败');
    }
  };

  return (
    <div>
      <div className="page-title">
        <span>⚔️</span>
        <span>对局分析</span>
      </div>

      {message && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            padding: '12px 20px',
            borderRadius: 8,
            background: message.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
            color: 'white',
            fontWeight: 500,
            zIndex: 9999,
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          {message.text}
        </div>
      )}

      {!selectedBattle ? (
        <>
          <div
            className={`battle-import-area ${isDragging ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="import-icon">📁</div>
            <div className="import-title">导入对局回放</div>
            <div className="import-desc">点击选择或拖拽JSON格式的对局回放文件到此处</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                📂 选择文件
              </button>
              <button
                className="btn btn-secondary"
                onClick={(e) => { e.stopPropagation(); loadSampleBattle(); }}
              >
                🎮 加载示例对局
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="file-input-hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="section-title">
            历史对局（{battles.length}）
          </div>

          {battles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <div>暂无对局记录，导入或加载示例对局开始分析</div>
            </div>
          ) : (
            <div className="battle-list">
              {battles.map((b) => (
                <div key={b.id} className="battle-card">
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
                      {b.winner === 1 ? '玩家1胜' : '玩家2胜'}
                    </span>
                  </div>
                  <div className="battle-meta">
                    <span>回合数: {b.totalTurns}</span>
                    <span>{new Date(b.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => { setSelectedBattle(b); setExpandedTurn(null); }}
                    >
                      🔍 查看详情
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(b.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>
                {selectedBattle.player1} vs {selectedBattle.player2}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>🏆 胜者: {selectedBattle.winner === 1 ? selectedBattle.player1 : selectedBattle.player2}</span>
                <span>📅 {new Date(selectedBattle.createdAt).toLocaleString()}</span>
                <span>🎯 共 {selectedBattle.totalTurns} 回合</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => { setSelectedBattle(null); setExpandedTurn(null); }}>
                ← 返回列表
              </button>
            </div>
          </div>

          <div className="timeline-container">
            <div className="timeline-line" />
            {selectedBattle.turns.map((turn, idx) => (
              <BattleTurnNode
                key={turn.turn}
                turn={turn}
                turnIndex={idx}
                expanded={expandedTurn === turn.turn}
                highlighted={expandedTurn !== null && Math.abs(idx - (selectedBattle.turns.findIndex((t) => t.turn === expandedTurn))) <= 1}
                onToggle={() => setExpandedTurn(expandedTurn === turn.turn ? null : turn.turn)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface TurnNodeProps {
  turn: BattleTurn;
  turnIndex: number;
  expanded: boolean;
  highlighted: boolean;
  onToggle: () => void;
}

const BattleTurnNode: React.FC<TurnNodeProps> = ({ turn, expanded, highlighted, onToggle }) => {
  const lastAttack = [...turn.actions].reverse().find((a) => a.type === 'attack');
  const p1Health = lastAttack?.hero1Health ?? 30;
  const p2Health = lastAttack?.hero2Health ?? 30;
  const totalDamage = turn.actions.reduce((sum, a) => sum + (a.damage || 0), 0);

  return (
    <div className={`timeline-node ${expanded ? 'expanded' : ''}`}>
      <div
        className="timeline-dot"
        onClick={onToggle}
        style={highlighted && !expanded ? { boxShadow: '0 0 12px rgba(233,69,96,0.6)' } : undefined}
      >
        {turn.turn}
      </div>
      <div className="timeline-content" onClick={onToggle}>
        <div className="timeline-header">
          <div className="timeline-turn">回合 {turn.turn}</div>
          <div className="timeline-health">
            <div className="health-item p1">
              👤 P1: ❤ {p1Health}
            </div>
            <div className="health-item p2">
              👤 P2: ❤ {p2Health}
            </div>
            <span style={{ fontSize: 12, color: 'var(--warning)', padding: '4px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: 6 }}>
              💥 {totalDamage} 伤害
            </span>
          </div>
        </div>
        <div className="timeline-actions">
          {turn.actions.slice(0, expanded ? turn.actions.length : 3).map((action, i) => (
            <div key={i} className="action-item">
              <div className={`action-player p${action.player}`}>{action.player}</div>
              <span className={`action-type ${action.type}`}>
                {action.type === 'play' ? '出牌' : action.type === 'attack' ? '攻击' : '英雄技能'}
              </span>
              <span style={{ flex: 1 }}>
                {action.type === 'play' && `使用 ${action.cardName}`}
                {action.type === 'attack' && `造成 ${action.damage} 点伤害`}
                {action.type === 'hero_skill' && `释放英雄技能${action.damage ? `（造成${action.damage}点伤害）` : ''}`}
              </span>
            </div>
          ))}
          {!expanded && turn.actions.length > 3 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '4px 12px' }}>
              ...还有 {turn.actions.length - 3} 个动作，点击展开查看
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="timeline-detail-panel">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            📈 回合 {turn.turn} 费用与战力分析
          </div>
          <TurnLineChart turn={turn} />
        </div>
      )}
    </div>
  );
};

const TurnLineChart: React.FC<{ turn: BattleTurn }> = ({ turn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const animStateRef = useRef({
    startTime: 0,
    lastTime: 0,
    gridProgress: 0,
    manaProgress: 0,
    powerProgress: 0,
    pointScales: [] as number[],
    labelAlphas: [] as number[],
  });

  const data = useMemo(() => {
    const mana = turn.manaData.length > 0 ? turn.manaData : [0, 1, 2, 3, 2, 1, 0];
    const power = turn.powerData.length > 0 ? turn.powerData : [0, 1, 3, 5, 6, 4, 3];
    const len = Math.max(mana.length, power.length);
    return {
      mana: Array.from({ length: len }, (_, i) => mana[i] ?? 0),
      power: Array.from({ length: len }, (_, i) => power[i] ?? 0),
      points: len,
    };
  }, [turn]);

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

    const DURATION_GRID = 600;
    const DURATION_LINE = 1000;
    const DELTA_POWER = 300;
    const DURATION_POINT = 400;
    const DURATION_LABEL = 500;
    const DELTA_POINT = 80;
    const DELTA_LABEL = 120;
    const TOTAL_DURATION = DURATION_GRID + DURATION_LINE + DELTA_POWER + DURATION_POINT + DELTA_POINT * data.points + 200;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };
    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

    const drawSmoothCurve = (values: number[], progress: number, maxVal: number, padding: any, chartW: number, chartH: number) => {
      const points = values.length;
      if (points === 0) return;
      const stepX = points > 1 ? chartW / (points - 1) : 0;

      ctx.beginPath();

      const totalSegments = points - 1;
      const currentProgress = progress * totalSegments;
      const fullSegments = Math.floor(currentProgress);
      const partialFrac = currentProgress - fullSegments;

      if (fullSegments === 0 && partialFrac === 0) {
        const val = values[0];
        const y = padding.top + chartH - (val / Math.max(maxVal, 1)) * chartH;
        ctx.moveTo(padding.left, y);
        return;
      }

      const firstVal = values[0];
      const firstY = padding.top + chartH - (firstVal / Math.max(maxVal, 1)) * chartH;
      ctx.moveTo(padding.left, firstY);

      for (let i = 0; i < fullSegments && i < points - 1; i++) {
        const x0 = padding.left + stepX * i;
        const x1 = padding.left + stepX * (i + 1);
        const y0 = padding.top + chartH - (values[i] / Math.max(maxVal, 1)) * chartH;
        const y1 = padding.top + chartH - (values[i + 1] / Math.max(maxVal, 1)) * chartH;
        const cpX = (x0 + x1) / 2;
        ctx.bezierCurveTo(cpX, y0, cpX, y1, x1, y1);
      }

      if (partialFrac > 0 && fullSegments < points - 1) {
        const i = fullSegments;
        const x0 = padding.left + stepX * i;
        const x1 = padding.left + stepX * (i + 1);
        const y0 = padding.top + chartH - (values[i] / Math.max(maxVal, 1)) * chartH;
        const y1 = padding.top + chartH - (values[i + 1] / Math.max(maxVal, 1)) * chartH;
        const cpX = (x0 + x1) / 2;

        const t = partialFrac;
        const mt = 1 - t;
        const endX = mt * mt * x0 + 2 * mt * t * cpX + t * t * x1;
        const endY = mt * mt * y0 + 2 * mt * t * ((y0 + y1) / 2) + t * t * y1;

        const cp1X = x0 + t * (cpX - x0);
        const cp1Y = y0 + t * ((y0 + y1) / 2 - y0);

        ctx.bezierCurveTo(cp1X, cp1Y, cp1X, cp1Y + (endY - cp1Y) * 0.5, endX, endY);
      }
    };

    const drawFillArea = (values: number[], progress: number, maxVal: number, padding: any, chartW: number, chartH: number, fillStart: string) => {
      const points = values.length;
      if (points === 0) return;
      const stepX = points > 1 ? chartW / (points - 1) : 0;

      ctx.save();
      ctx.beginPath();

      const totalSegments = points - 1;
      const currentProgress = progress * totalSegments;
      const fullSegments = Math.floor(currentProgress);
      const partialFrac = currentProgress - fullSegments;

      const firstVal = values[0];
      const firstY = padding.top + chartH - (firstVal / Math.max(maxVal, 1)) * chartH;
      ctx.moveTo(padding.left, firstY);

      for (let i = 0; i < fullSegments && i < points - 1; i++) {
        const x0 = padding.left + stepX * i;
        const x1 = padding.left + stepX * (i + 1);
        const y0 = padding.top + chartH - (values[i] / Math.max(maxVal, 1)) * chartH;
        const y1 = padding.top + chartH - (values[i + 1] / Math.max(maxVal, 1)) * chartH;
        const cpX = (x0 + x1) / 2;
        ctx.bezierCurveTo(cpX, y0, cpX, y1, x1, y1);
      }

      let endX = padding.left;
      if (partialFrac > 0 && fullSegments < points - 1) {
        const i = fullSegments;
        const x0 = padding.left + stepX * i;
        const x1 = padding.left + stepX * (i + 1);
        const y0 = padding.top + chartH - (values[i] / Math.max(maxVal, 1)) * chartH;
        const y1 = padding.top + chartH - (values[i + 1] / Math.max(maxVal, 1)) * chartH;
        const cpX = (x0 + x1) / 2;

        const t = partialFrac;
        const mt = 1 - t;
        endX = mt * mt * x0 + 2 * mt * t * cpX + t * t * x1;
        const endY = mt * mt * y0 + 2 * mt * t * ((y0 + y1) / 2) + t * t * y1;

        const cp1X = x0 + t * (cpX - x0);
        const cp1Y = y0 + t * ((y0 + y1) / 2 - y0);

        ctx.bezierCurveTo(cp1X, cp1Y, cp1X, cp1Y + (endY - cp1Y) * 0.5, endX, endY);
      } else if (fullSegments >= points - 1) {
        endX = padding.left + stepX * (points - 1);
      }

      ctx.lineTo(endX, padding.top + chartH);
      ctx.lineTo(padding.left, padding.top + chartH);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, fillStart);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    };

    const draw = (elapsed: number) => {
      const w = rect.width;
      const h = rect.height;
      const padding = { top: 40, right: 30, bottom: 40, left: 50 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;
      const maxVal = Math.max(...data.mana, ...data.power, 1);

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, 0, w, h);

      const gridT = Math.min(1, elapsed / DURATION_GRID);
      const gridProgress = easeOutCubic(gridT);

      const gridLines = 5;
      const gridAlpha = 0.05 * gridProgress;
      ctx.strokeStyle = `rgba(255,255,255,${gridAlpha})`;
      ctx.lineWidth = 1;

      for (let i = 0; i <= gridLines; i++) {
        const lineDelay = (i / gridLines) * 200;
        const lineT = Math.min(1, Math.max(0, (elapsed - lineDelay) / (DURATION_GRID * 0.6)));
        if (lineT <= 0) continue;

        const y = padding.top + (chartH * i) / gridLines;
        const lineWidth = chartW * easeOutCubic(lineT);

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + lineWidth, y);
        ctx.stroke();

        const labelAlpha = 0.3 * Math.min(1, Math.max(0, (elapsed - lineDelay - 100) / 300));
        if (labelAlpha > 0) {
          const val = Math.round(maxVal * (1 - i / gridLines));
          ctx.fillStyle = `rgba(255,255,255,${labelAlpha})`;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(String(val), padding.left - 8, y + 4);
        }
      }

      const manaStart = DURATION_GRID;
      const manaElapsed = Math.max(0, elapsed - manaStart);
      const manaT = Math.min(1, manaElapsed / DURATION_LINE);
      const manaProgress = easeInOutSine(manaT);

      const powerStart = DURATION_GRID + DELTA_POWER;
      const powerElapsed = Math.max(0, elapsed - powerStart);
      const powerT = Math.min(1, powerElapsed / DURATION_LINE);
      const powerProgress = easeInOutSine(powerT);

      if (manaProgress > 0) {
        drawFillArea(data.mana, manaProgress, maxVal, padding, chartW, chartH, 'rgba(74,144,217,0.2)');
      }
      if (powerProgress > 0) {
        drawFillArea(data.power, powerProgress, maxVal, padding, chartW, chartH, 'rgba(233,69,96,0.2)');
      }

      if (manaProgress > 0) {
        drawSmoothCurve(data.mana, manaProgress, maxVal, padding, chartW, chartH);
        ctx.strokeStyle = '#4a90d9';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      if (powerProgress > 0) {
        drawSmoothCurve(data.power, powerProgress, maxVal, padding, chartW, chartH);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      const stepX = data.points > 1 ? chartW / (data.points - 1) : 0;
      const pointStartMana = manaStart + DURATION_LINE * 0.7;
      const pointStartPower = powerStart + DURATION_LINE * 0.7;

      for (let i = 0; i < data.points; i++) {
        const x = padding.left + stepX * i;

        const manaPointDelay = i * DELTA_POINT;
        const manaPointElapsed = Math.max(0, elapsed - pointStartMana - manaPointDelay);
        const manaPointT = Math.min(1, manaPointElapsed / DURATION_POINT);
        const manaScale = easeOutBack(manaPointT);

        if (manaScale > 0 && manaProgress >= (i / Math.max(data.points - 1, 1))) {
          const val = data.mana[i];
          const y = padding.top + chartH - (val / Math.max(maxVal, 1)) * chartH;
          const radius = 5 * manaScale;

          if (radius > 0) {
            ctx.beginPath();
            ctx.arc(x, y, radius + 3 * manaScale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(74,144,217,${0.2 * manaPointT})`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#4a90d9';
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        const powerPointDelay = i * DELTA_POINT;
        const powerPointElapsed = Math.max(0, elapsed - pointStartPower - powerPointDelay);
        const powerPointT = Math.min(1, powerPointElapsed / DURATION_POINT);
        const powerScale = easeOutBack(powerPointT);

        if (powerScale > 0 && powerProgress >= (i / Math.max(data.points - 1, 1))) {
          const val = data.power[i];
          const y = padding.top + chartH - (val / Math.max(maxVal, 1)) * chartH;
          const radius = 5 * powerScale;

          if (radius > 0) {
            ctx.beginPath();
            ctx.arc(x, y, radius + 3 * powerScale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(233,69,96,${0.2 * powerPointT})`;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#e94560';
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      const labelStart = pointStartPower + data.points * DELTA_POINT;
      const labels = ['起始', '抽牌', '出牌', '战斗', '结束', '终态'];

      for (let i = 0; i < Math.min(data.points, labels.length); i++) {
        const labelDelay = i * DELTA_LABEL;
        const labelElapsed = Math.max(0, elapsed - labelStart - labelDelay);
        const labelT = Math.min(1, labelElapsed / DURATION_LABEL);
        const labelAlpha = easeOutCubic(labelT);

        if (labelAlpha > 0) {
          const stepXLabel = data.points > 1 ? chartW / (data.points - 1) : 0;
          const x = padding.left + stepXLabel * i;
          ctx.fillStyle = `rgba(255,255,255,${0.4 * labelAlpha})`;
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(labels[i] || String(i + 1), x, h - 12);
        }
      }

      const valueLabelStart = pointStartMana + data.points * DELTA_POINT;
      for (let i = 0; i < data.points; i++) {
        const x = padding.left + stepX * i;

        const manaLabelDelay = i * 60;
        const manaLabelElapsed = Math.max(0, elapsed - valueLabelStart - manaLabelDelay);
        const manaLabelT = Math.min(1, manaLabelElapsed / 400);
        const manaLabelAlpha = easeOutCubic(manaLabelT);

        if (manaLabelAlpha > 0 && manaProgress >= (i / Math.max(data.points - 1, 1))) {
          const val = data.mana[i];
          const y = padding.top + chartH - (val / Math.max(maxVal, 1)) * chartH - 12;
          ctx.fillStyle = `rgba(74,144,217,${0.9 * manaLabelAlpha})`;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(val), x, y);
        }

        const powerLabelDelay = i * 60 + 100;
        const powerLabelElapsed = Math.max(0, elapsed - valueLabelStart - powerLabelDelay);
        const powerLabelT = Math.min(1, powerLabelElapsed / 400);
        const powerLabelAlpha = easeOutCubic(powerLabelT);

        if (powerLabelAlpha > 0 && powerProgress >= (i / Math.max(data.points - 1, 1))) {
          const val = data.power[i];
          const y = padding.top + chartH - (val / Math.max(maxVal, 1)) * chartH - 24;
          ctx.fillStyle = `rgba(233,69,96,${0.9 * powerLabelAlpha})`;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(val), x, y);
        }
      }
    };

    const animate = (timestamp: number) => {
      if (!animStateRef.current.startTime) {
        animStateRef.current.startTime = timestamp;
        animStateRef.current.lastTime = timestamp;
      }

      const elapsed = timestamp - animStateRef.current.startTime;
      animStateRef.current.lastTime = timestamp;

      draw(elapsed);

      if (elapsed < TOTAL_DURATION) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animStateRef.current = {
      startTime: 0,
      lastTime: 0,
      gridProgress: 0,
      manaProgress: 0,
      powerProgress: 0,
      pointScales: new Array(data.points).fill(0),
      labelAlphas: new Array(data.points).fill(0),
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [data, turn.turn]);

  return (
    <div>
      <div className="chart-container">
        <canvas ref={canvasRef} className="chart-canvas" />
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#4a90d9' }}></span>
          <span>费用 (Mana)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#e94560' }}></span>
          <span>战力 (Power)</span>
        </div>
      </div>
    </div>
  );
};

export default BattleReport;
