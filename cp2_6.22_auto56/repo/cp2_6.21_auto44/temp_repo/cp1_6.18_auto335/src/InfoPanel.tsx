import React, { useState, useEffect, useRef } from 'react';
import useGameStore from './gameStore';
import type { ReactionType, RateStatus } from './types';

const InfoPanel: React.FC = () => {
  const counts = useGameStore((state) => state.counts);
  const rateStatus = useGameStore((state) => state.rateStatus);
  const equilibriumConstant = useGameStore((state) => state.equilibriumConstant);
  const lastReaction = useGameStore((state) => state.lastReaction);

  const [animatingCount, setAnimatingCount] = useState<{ A: boolean; B: boolean; C: boolean }>({
    A: false,
    B: false,
    C: false,
  });
  const [animatingK, setAnimatingK] = useState(false);
  const prevCountsRef = useRef(counts);
  const prevKRef = useRef(equilibriumConstant);

  useEffect(() => {
    const prev = prevCountsRef.current;
    const newAnimating = { A: false, B: false, C: false };

    if (prev.A !== counts.A) newAnimating.A = true;
    if (prev.B !== counts.B) newAnimating.B = true;
    if (prev.C !== counts.C) newAnimating.C = true;

    if (newAnimating.A || newAnimating.B || newAnimating.C) {
      setAnimatingCount(newAnimating);
      setTimeout(() => {
        setAnimatingCount({ A: false, B: false, C: false });
      }, 200);
    }

    prevCountsRef.current = counts;
  }, [counts]);

  useEffect(() => {
    if (prevKRef.current !== equilibriumConstant) {
      setAnimatingK(true);
      setTimeout(() => setAnimatingK(false), 200);
      prevKRef.current = equilibriumConstant;
    }
  }, [equilibriumConstant]);

  const getRateStatusText = (status: RateStatus): string => {
    switch (status) {
      case 'normal':
        return '正常';
      case 'accelerated':
        return '加速';
      case 'stopped':
        return '停摆';
    }
  };

  const getRateStatusColor = (status: RateStatus): string => {
    switch (status) {
      case 'normal':
        return '#2ECC71';
      case 'accelerated':
        return '#F39C12';
      case 'stopped':
        return '#E74C3C';
    }
  };

  const getReactionText = (type: ReactionType): string => {
    switch (type) {
      case 'forward':
        return '正反应 (2A → B)';
      case 'reverse':
        return '逆反应 (B → 2A)';
      case 'catalyst-poisoning':
        return '催化剂中毒，反应停摆';
      case 'none':
        return '无反应';
    }
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const countStyle = (isAnimating: boolean): React.CSSProperties => ({
    fontFamily: 'monospace',
    fontSize: '28px',
    fontWeight: 'bold',
    textShadow: '0 0 10px currentColor',
    transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
    transition: 'transform 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '24px',
          width: '280px',
          color: '#F0F0F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', textAlign: 'center' }}>
          化学平衡模拟器
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#E74C3C',
                  boxShadow: '0 0 8px #E74C3C',
                }}
              />
              <span style={{ fontSize: '14px' }}>反应物 A</span>
            </div>
            <span style={{ ...countStyle(animatingCount.A), color: '#E74C3C' }}>
              {counts.A}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#3498DB',
                  boxShadow: '0 0 8px #3498DB',
                }}
              />
              <span style={{ fontSize: '14px' }}>生成物 B</span>
            </div>
            <span style={{ ...countStyle(animatingCount.B), color: '#3498DB' }}>
              {counts.B}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#95A5A6',
                  boxShadow: '0 0 8px #95A5A6',
                }}
              />
              <span style={{ fontSize: '14px' }}>催化剂 C</span>
            </div>
            <span style={{ ...countStyle(animatingCount.C), color: '#95A5A6' }}>
              {counts.C}
            </span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>反应速率</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                fontWeight: 'bold',
                color: getRateStatusColor(rateStatus),
                textShadow: `0 0 8px ${getRateStatusColor(rateStatus)}`,
              }}
            >
              {getRateStatusText(rateStatus)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>平衡常数 K</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#F1C40F',
                textShadow: '0 0 10px #F1C40F',
                transform: animatingK ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.2s ease',
              }}
            >
              {equilibriumConstant.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '16px 24px',
          width: '280px',
          color: '#F0F0F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '13px',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>最近反应：</div>
        <div style={{ color: '#BDC3C7' }}>{getReactionText(lastReaction.type)}</div>
        <div style={{ marginTop: '4px', color: '#7F8C8D', fontFamily: 'monospace' }}>
          {formatTime(lastReaction.timestamp)}
        </div>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '16px 24px',
          width: '280px',
          color: '#BDC3C7',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          lineHeight: '1.6',
        }}
      >
        <div style={{ fontWeight: 'bold', color: '#F0F0F0', marginBottom: '8px' }}>操作说明：</div>
        <div>• 拖拽分子棋子移动</div>
        <div>• 相同颜色分子可重叠</div>
        <div>• A &gt; 10 触发正反应</div>
        <div>• B &gt; 8 触发逆反应</div>
        <div>• 按 R 键重置棋盘</div>
      </div>
    </div>
  );
};

export default InfoPanel;
