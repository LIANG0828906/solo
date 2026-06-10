import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTavernStore } from './store';
import OrderPanel from './components/OrderPanel';
import LedgerView from './components/LedgerView';

const App: React.FC = () => {
  const {
    fetchDrinks,
    fetchVessels,
    fetchShichens,
    fetchRecords,
    triggerGamble,
    updateInventory,
    gamblePopup,
    clearGamble
  } = useTavernStore();

  useEffect(() => {
    fetchDrinks();
    fetchVessels();
    fetchShichens();
    fetchRecords();
  }, []);

  useEffect(() => {
    const scheduleGamble = () => {
      const delay = 30000 + Math.random() * 10000;
      setTimeout(async () => {
        await triggerGamble();
        setTimeout(() => {
          clearGamble();
        }, 3000);
        scheduleGamble();
      }, delay);
    };

    const initialDelay = 15000 + Math.random() * 5000;
    const initialTimer = setTimeout(scheduleGamble, initialDelay);

    return () => clearTimeout(initialTimer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateInventory();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <AnimatePresence>
        {gamblePopup && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="gamble-popup"
          >
            <div className="gamble-title">🏇 马球开赛！</div>
            <svg className="gamble-svg" viewBox="0 0 280 100">
              <line x1="0" y1="85" x2="280" y2="85" stroke="#c9a84c" strokeWidth="2" strokeDasharray="5,5" />
              
              <g className="horse" transform="translate(30, 40)">
                <ellipse cx="40" cy="30" rx="25" ry="15" fill="#722f37" />
                <circle cx="60" cy="20" r="10" fill="#722f37" />
                <rect x="55" y="10" width="10" height="15" fill="#5a252c" />
                <line x1="58" y1="22" x2="62" y2="22" stroke="#c9a84c" strokeWidth="2" />
                <line x1="20" y1="45" x2="18" y2="55" stroke="#722f37" strokeWidth="4" strokeLinecap="round" />
                <line x1="35" y1="45" x2="33" y2="55" stroke="#722f37" strokeWidth="4" strokeLinecap="round" />
                <line x1="45" y1="45" x2="47" y2="55" stroke="#722f37" strokeWidth="4" strokeLinecap="round" />
                <line x1="60" y1="45" x2="62" y2="55" stroke="#722f37" strokeWidth="4" strokeLinecap="round" />
                <path d="M 15 25 Q 5 15 10 30" fill="none" stroke="#722f37" strokeWidth="3" />
                <circle cx="80" cy="25" r="6" fill="#c9a84c" />
                <circle cx="80" cy="25" r="3" fill="#722f37" />
              </g>

              <g className="horse" transform="translate(150, 40)">
                <ellipse cx="40" cy="30" rx="25" ry="15" fill="#8b4513" />
                <circle cx="60" cy="20" r="10" fill="#8b4513" />
                <rect x="55" y="10" width="10" height="15" fill="#6b3410" />
                <line x1="58" y1="22" x2="62" y2="22" stroke="#c9a84c" strokeWidth="2" />
                <line x1="20" y1="45" x2="18" y2="55" stroke="#8b4513" strokeWidth="4" strokeLinecap="round" />
                <line x1="35" y1="45" x2="33" y2="55" stroke="#8b4513" strokeWidth="4" strokeLinecap="round" />
                <line x1="45" y1="45" x2="47" y2="55" stroke="#8b4513" strokeWidth="4" strokeLinecap="round" />
                <line x1="60" y1="45" x2="62" y2="55" stroke="#8b4513" strokeWidth="4" strokeLinecap="round" />
                <path d="M 15 25 Q 5 15 10 30" fill="none" stroke="#8b4513" strokeWidth="3" />
                <circle cx="80" cy="25" r="6" fill="#c9a84c" />
                <circle cx="80" cy="25" r="3" fill="#8b4513" />
              </g>

              <g className="dust" transform="translate(10, 80)">
                <circle cx="0" cy="0" r="3" fill="#c9a84c" opacity="0.6" />
                <circle cx="10" cy="-2" r="2" fill="#c9a84c" opacity="0.4" />
                <circle cx="5" cy="3" r="2" fill="#c9a84c" opacity="0.5" />
              </g>
              <g className="dust" transform="translate(130, 80)">
                <circle cx="0" cy="0" r="3" fill="#c9a84c" opacity="0.6" />
                <circle cx="10" cy="-2" r="2" fill="#c9a84c" opacity="0.4" />
                <circle cx="5" cy="3" r="2" fill="#c9a84c" opacity="0.5" />
              </g>
            </svg>
            <div className="gamble-result">
              {gamblePopup.winner === 'customer' ? (
                <span style={{ color: '#2e7d32' }}>🎉 客人赢！入账 {gamblePopup.amount}文</span>
              ) : (
                <span style={{ color: '#722f37' }}>🏆 庄家赢！</span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              下注客人：{gamblePopup.record.customerName}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="header">
        <h1>🏮 西市胡商酒肆 🏮</h1>
        <div className="subtitle">葡萄美酒夜光杯 · 胡姬当垆笑春风</div>
      </header>

      <div className="main-layout">
        <div className="column">
          <div className="column-title">酒单与时辰</div>
          <div className="info-text" style={{ marginBottom: '16px' }}>
            本店提供西域佳酿，按斗、杯、壶、盏计量。<br/>
            时辰不同，酒价浮动 ±20%。<br/>
            支持象牙筹签(5文/根)与绢帛(500文/匹)支付。
          </div>

          <div className="section-title">⏰ 十二时辰</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.8rem' }}>
            {[
              { name: '子时', mod: -20, range: '23-01' },
              { name: '丑时', mod: 0, range: '01-03' },
              { name: '寅时', mod: 0, range: '03-05' },
              { name: '卯时', mod: 0, range: '05-07' },
              { name: '辰时', mod: 0, range: '07-09' },
              { name: '巳时', mod: 0, range: '09-11' },
              { name: '午时', mod: +20, range: '11-13' },
              { name: '未时', mod: 0, range: '13-15' },
              { name: '申时', mod: 0, range: '15-17' },
              { name: '酉时', mod: 0, range: '17-19' },
              { name: '戌时', mod: 0, range: '19-21' },
              { name: '亥时', mod: 0, range: '21-23' },
            ].map(s => (
              <div key={s.name} style={{ 
                padding: '6px', 
                background: s.mod !== 0 ? '#fff8e7' : 'white', 
                border: '1px solid #c9a84c', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 600, color: '#722f37' }}>{s.name}</div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>{s.range}</div>
                {s.mod !== 0 && (
                  <div style={{ 
                    color: s.mod > 0 ? '#c0392b' : '#2e7d32', 
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}>
                    {s.mod > 0 ? '+' : ''}{s.mod}%
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="section-title">💰 支付折算</div>
          <div className="info-text">
            • 象牙筹签：每根5文（限100根）<br/>
            • 绢帛：每匹500文（限10匹）<br/>
            • 找零优先绢帛，再筹签，余数现金
          </div>

          <div className="section-title">🎲 打马球</div>
          <div className="info-text">
            每30-40秒自动开赛，胜负各半。<br/>
            客人赢则入账50文，庄家赢则无。<br/>
            记录归入"博戏收入"。
          </div>

          <div className="section-title">📦 库存说明</div>
          <div className="info-text">
            • 每种酒水初始100单位<br/>
            • 库存&lt;10显示告急，归零售罄<br/>
            • 每分钟自动补货5单位
          </div>
        </div>

        <div className="column">
          <OrderPanel />
        </div>

        <div className="column">
          <LedgerView />
        </div>
      </div>
    </div>
  );
};

export default App;
