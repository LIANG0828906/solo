import React, { useEffect, useRef } from 'react';
import { useMarketStore, MarketTrend } from './store/useMarketStore';
import MarketScene from './components/MarketScene';
import DealPanel from './components/DealPanel';
import { getMarketTrend } from './api/marketApi';

const App: React.FC = () => {
  const { setMarketTrend } = useMarketStore();
  const refreshTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number>(30);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const data = await getMarketTrend();
        setMarketTrend(data.trend as MarketTrend);
        countdownRef.current = 30;
      } catch (e) {
        const trends: MarketTrend[] = ['旺', '平', '淡'];
        const randomTrend = trends[Math.floor(Math.random() * 3)];
        setMarketTrend(randomTrend);
        countdownRef.current = 30;
      }
    };

    fetchTrend();

    const intervalId = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        fetchTrend();
      }
    }, 1000);

    refreshTimerRef.current = intervalId;

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [setMarketTrend]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: '#2a2a2a',
    }}>
      <MarketScene />
      <DealPanel />

      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '2%',
        background: 'rgba(90, 74, 58, 0.95)',
        color: '#fff',
        padding: '15px 20px',
        borderRadius: 10,
        fontSize: 13,
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
        zIndex: 25,
        maxWidth: 250,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'var(--primary-gold)' }}>
          🎯 游戏说明
        </div>
        <div style={{ lineHeight: 1.8, opacity: 0.9 }}>
          <div>1. 点击牛的部位进行评估</div>
          <div>2. 拖动竹简撮合双方价格</div>
          <div>3. 差价≤5%自动成交</div>
          <div>4. 拖动铜钱到对应格结算</div>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.7 }}>
          行情刷新倒计时：{countdownRef.current}秒
        </div>
      </div>
    </div>
  );
};

export default App;
