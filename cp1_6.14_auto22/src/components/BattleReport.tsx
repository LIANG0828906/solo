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
  const progressRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

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

    const draw = (progress: number) => {
      const w = rect.width;
      const h = rect.height;
      const padding = { top: 30, right: 20, bottom: 30, left: 40 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      const gridLines = 5;
      const maxVal = Math.max(...data.mana, ...data.power, 1);
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartH * i) / gridLines;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        const val = Math.round(maxVal * (1 - i / gridLines));
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(String(val), padding.left - 6, y + 4);
      }

      const drawLine = (values: number[], color: string, fillColor: string) => {
        const points = values.length;
        const stepX = points > 1 ? chartW / (points - 1) : 0;

        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const x = padding.left + stepX * i;
          const t = (i + 1) / points;
          const p = Math.min(1, Math.max(0, (progress - (1 - t)) / t));
          const val = values[i] * p;
          const y = padding.top + chartH - (val / Math.max(maxVal, 1)) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = padding.left + stepX * (i - 1);
            const prevT = i / points;
            const prevP = Math.min(1, Math.max(0, (progress - (1 - prevT)) / prevT));
            const prevVal = (values[i - 1] || 0) * prevP;
            const prevY = padding.top + chartH - (prevVal / Math.max(maxVal, 1)) * chartH;
            const cpX = (prevX + x) / 2;
            ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
          }
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.lineTo(padding.left + stepX * (points - 1), padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        if (progress >= 0.95) {
          for (let i = 0; i < points; i++) {
            const x = padding.left + stepX * i;
            const val = values[i];
            const y = padding.top + chartH - (val / Math.max(maxVal, 1)) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'var(--bg-secondary)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      };

      drawLine(data.mana, '#4a90d9', 'rgba(74,144,217,0.15)');
      drawLine(data.power, '#e94560', 'rgba(233,69,96,0.15)');

      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const labels = ['起始', '抽牌', '出牌', '战斗', '结束', '终态'];
      for (let i = 0; i < Math.min(data.points, labels.length); i++) {
        const stepX = data.points > 1 ? chartW / (data.points - 1) : 0;
        const x = padding.left + stepX * i;
        ctx.fillText(labels[i] || String(i + 1), x, h - 8);
      }
    };

    const animate = () => {
      progressRef.current += 0.035;
      if (progressRef.current >= 1) {
        progressRef.current = 1;
        draw(1);
        return;
      }
      draw(progressRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    progressRef.current = 0;
    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [data]);

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
