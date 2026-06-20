import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketStore } from '../store/useMarketStore';

const Cattle: React.FC<{
  id: number;
  x: number;
  y: number;
  scale?: number;
}> = ({ id, x, y, scale = 1 }) => {
  const { cattle, evaluateCattle, setShowEvaluationPopup, selectedCattleId, setSelectedCattle } = useMarketStore();
  const cow = cattle.find(c => c.id === id);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  const handlePartClick = (part: string, e: React.MouseEvent) => {
    e.stopPropagation();
    evaluateCattle(id, part);
    setSelectedCattle(id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setShowEvaluationPopup(true, { x: rect.left + rect.width / 2, y: rect.top }, part);
  };

  if (!cow) return null;

  const soldOpacity = cow.isSold ? 0.6 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: soldOpacity,
        cursor: 'pointer',
        zIndex: 10,
      }}
      onClick={() => setSelectedCattle(id === selectedCattleId ? null : id)}
    >
      <div style={{ position: 'relative', width: 120, height: 80 }}>
        <div
          style={{
            position: 'absolute',
            width: 80,
            height: 45,
            background: 'var(--cattle)',
            borderRadius: '50% 45% 40% 50%',
            top: 20,
            left: 20,
            boxShadow: 'inset -5px -5px 10px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => handlePartClick('back', e)}
          onMouseEnter={() => setHoveredPart('back')}
          onMouseLeave={() => setHoveredPart(null)}
        >
          {hoveredPart === 'back' && (
            <div style={{
              position: 'absolute',
              top: -25,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              点击摸牛脊
            </div>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            width: 35,
            height: 30,
            background: 'var(--cattle)',
            borderRadius: '50% 60% 40% 50%',
            top: 15,
            left: 0,
            boxShadow: 'inset -3px -3px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 12,
              height: 8,
              background: '#b8985e',
              borderRadius: '50%',
              top: 5,
              left: 5,
              cursor: 'pointer',
              animation: 'earTwitch 3s ease-in-out infinite',
              transformOrigin: 'bottom center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 12,
              height: 8,
              background: '#b8985e',
              borderRadius: '50%',
              top: 5,
              right: 5,
              animation: 'earTwitch 3s ease-in-out infinite 1.5s',
              transformOrigin: 'bottom center',
            }}
          />
          <div
            onClick={(e) => handlePartClick('mouth', e)}
            onMouseEnter={() => setHoveredPart('mouth')}
            onMouseLeave={() => setHoveredPart(null)}
            style={{
              position: 'absolute',
              width: 20,
              height: 12,
              background: '#a8884e',
              borderRadius: '40% 40% 50% 50%',
              bottom: 2,
              left: 8,
              cursor: 'pointer',
            }}
          >
            {hoveredPart === 'mouth' && (
            <div style={{
              position: 'absolute',
              top: -25,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              zIndex: 20,
            }}>
              点击看牛齿
            </div>
          )}
          </div>
          <div style={{
            position: 'absolute',
            width: 4,
            height: 4,
            background: '#2a2a2a',
            borderRadius: '50%',
            top: 10,
            left: 10,
          }} />
          <div style={{
            position: 'absolute',
            width: 4,
            height: 4,
            background: '#2a2a2a',
            borderRadius: '50%',
            top: 10,
            right: 10,
          }} />

          {cow.showRedRibbon && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                width: 20,
                height: 30,
                background: 'var(--red-ribbon)',
                top: -5,
                left: '50%',
                transform: 'translateX(-50%)',
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                animation: 'ribbonFlow 1s ease-in-out infinite',
                transformOrigin: 'top center',
              }}
            />
          )}
        </div>

        <div
          onClick={(e) => handlePartClick('leg', e)}
          onMouseEnter={() => setHoveredPart('leg')}
          onMouseLeave={() => setHoveredPart(null)}
          style={{
            position: 'absolute',
            width: 12,
            height: 25,
            background: '#b8985e',
            borderRadius: '0 0 4px 4px',
            bottom: 0,
            left: 25,
            cursor: 'pointer',
            animation: 'legStep 2s ease-in-out infinite',
          }}
        >
          <div style={{
            position: 'absolute',
            width: 14,
            height: 6,
            background: '#3a3a3a',
            borderRadius: '50%',
            bottom: -2,
            left: -1,
          }} />
        </div>

        <div
          onClick={(e) => handlePartClick('leg', e)}
          style={{
            position: 'absolute',
            width: 12,
            height: 25,
            background: '#b8985e',
            borderRadius: '0 0 4px 4px',
            bottom: 0,
            left: 45,
            cursor: 'pointer',
            animation: 'legStep 2s ease-in-out infinite 0.5s',
          }}
        >
          <div style={{
            position: 'absolute',
            width: 14,
            height: 6,
            background: '#3a3a3a',
            borderRadius: '50%',
            bottom: -2,
            left: -1,
          }} />
        </div>

        <div style={{
          position: 'absolute',
          width: 12,
          height: 25,
          background: '#b8985e',
          borderRadius: '0 0 4px 4px',
          bottom: 0,
          right: 25,
          animation: 'legStep 2s ease-in-out infinite 1s',
        }}>
          <div style={{
            position: 'absolute',
            width: 14,
            height: 6,
            background: '#3a3a3a',
            borderRadius: '50%',
            bottom: -2,
            left: -1,
          }} />
        </div>

        <div style={{
          position: 'absolute',
          width: 12,
          height: 25,
          background: '#b8985e',
          borderRadius: '0 0 4px 4px',
          bottom: 0,
          right: 5,
          animation: 'legStep 2s ease-in-out infinite 1.5s',
        }}>
          <div style={{
            position: 'absolute',
            width: 14,
            height: 6,
            background: '#3a3a3a',
            borderRadius: '50%',
            bottom: -2,
            left: -1,
          }} />
        </div>

        <div style={{
          position: 'absolute',
          width: 8,
          height: 25,
          background: '#b8985e',
          borderRadius: '50%',
          top: 25,
          right: -5,
          animation: 'tailWag 1.5s ease-in-out infinite',
          transformOrigin: 'top center',
        }} />

        {hoveredPart === 'leg' && (
          <div style={{
            position: 'absolute',
            bottom: 30,
            left: 40,
            background: '#fff',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 20,
          }}>
            点击掂牛腿
          </div>
        )}
      </div>

      {cow.evaluation && (
        <div style={{
          position: 'absolute',
          top: -25,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(90, 74, 58, 0.95)',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: 12,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          总分: {cow.evaluation.totalScore}分
        </div>
      )}

      {cow.isSold && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'var(--red-ribbon)',
          fontSize: 48,
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          zIndex: 5,
        }}>
          售
        </div>
      )}
    </div>
  );
};

const Farmer: React.FC = () => (
  <div style={{
    position: 'absolute',
    left: '8%',
    top: '45%',
    transform: 'translateY(-50%)',
    zIndex: 15,
  }}>
    <div style={{
      width: 50,
      height: 35,
      background: 'var(--farmer-hat)',
      borderRadius: '50% 50% 0 0',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        width: 70,
        height: 8,
        background: 'var(--farmer-hat)',
        borderRadius: '50%',
        bottom: -4,
        left: -10,
      }} />
    </div>
    <div style={{
      width: 35,
      height: 30,
      background: '#e8c8a8',
      borderRadius: '50%',
      margin: '0 auto',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', width: 5, height: 5, background: '#2a2a2a', borderRadius: '50%', top: 10, left: 8 }} />
      <div style={{ position: 'absolute', width: 5, height: 5, background: '#2a2a2a', borderRadius: '50%', top: 10, right: 8 }} />
    </div>
    <div style={{
      width: 60,
      height: 80,
      background: 'var(--farmer-cloth)',
      borderRadius: '5px 5px 0 0',
      margin: '0 auto',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        width: 15,
        height: 40,
        background: 'var(--farmer-cloth)',
        left: -10,
        top: 10,
        borderRadius: 5,
        transform: 'rotate(-20deg)',
      }} />
      <div style={{
        position: 'absolute',
        width: 15,
        height: 40,
        background: 'var(--farmer-cloth)',
        right: -10,
        top: 10,
        borderRadius: 5,
        transform: 'rotate(20deg)',
      }} />
    </div>
    <div style={{
      width: 25,
      height: 30,
      background: '#3a3a3a',
      margin: '0 auto',
    }} />
  </div>
);

const Shopkeeper: React.FC = () => (
  <div style={{
    position: 'absolute',
    right: '8%',
    top: '45%',
    transform: 'translateY(-50%)',
    zIndex: 15,
  }}>
    <div style={{
      width: 45,
      height: 20,
      background: 'var(--shopkeeper-hat)',
      borderRadius: '5px 5px 0 0',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        width: 60,
        height: 8,
        background: 'var(--shopkeeper-hat)',
        borderRadius: 3,
        bottom: -4,
        left: -7,
      }} />
    </div>
    <div style={{
      width: 35,
      height: 30,
      background: '#e8c8a8',
      borderRadius: '50%',
      margin: '0 auto',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', width: 5, height: 5, background: '#2a2a2a', borderRadius: '50%', top: 10, left: 8 }} />
      <div style={{ position: 'absolute', width: 5, height: 5, background: '#2a2a2a', borderRadius: '50%', top: 10, right: 8 }} />
      <div style={{ position: 'absolute', width: 12, height: 2, background: '#2a2a2a', top: 22, left: '50%', transform: 'translateX(-50%)' }} />
    </div>
    <div style={{
      width: 70,
      height: 90,
      background: 'var(--shopkeeper-cloth)',
      borderRadius: '20px 20px 0 0',
      margin: '0 auto',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        width: 50,
        height: 70,
        background: 'var(--primary-gold)',
        left: 10,
        top: 15,
        borderRadius: 15,
      }} />
      <div style={{
        position: 'absolute',
        width: 18,
        height: 50,
        background: 'var(--shopkeeper-cloth)',
        left: -12,
        top: 10,
        borderRadius: 5,
        transform: 'rotate(-15deg)',
      }} />
      <div style={{
        position: 'absolute',
        width: 18,
        height: 50,
        background: 'var(--shopkeeper-cloth)',
        right: -12,
        top: 10,
        borderRadius: 5,
        transform: 'rotate(15deg)',
      }} />
    </div>
    <div style={{
      width: 30,
      height: 25,
      background: '#3a3a3a',
      margin: '0 auto',
    }} />
  </div>
);

const MarketFlag: React.FC = () => {
  const { marketTrend } = useMarketStore();

  const flagColor = marketTrend === '旺' ? '#c41e3a' : marketTrend === '平' ? '#d4a76a' : '#4a7c9c';
  const flagText = marketTrend === '旺' ? '旺市' : marketTrend === '平' ? '平市' : '淡市';

  return (
    <div style={{
      position: 'absolute',
      top: '2%',
      right: '3%',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        width: 6,
        height: 80,
        background: '#5a4a3a',
        borderRadius: 3,
      }} />
      <motion.div
        animate={{
          rotate: [-5, 5, -5],
          skewX: [-5, 5, -5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: 5,
          left: 6,
          width: 60,
          height: 40,
          background: flagColor,
          clipPath: 'polygon(0 0, 100% 20%, 100% 80%, 0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 14,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          transformOrigin: 'left center',
        }}
      >
        {flagText}
      </motion.div>
    </div>
  );
};

const EvaluationPopup: React.FC = () => {
  const { showEvaluationPopup, evaluationPopupPos, evaluationPart, selectedCattleId, cattle, setShowEvaluationPopup } = useMarketStore();

  const cow = cattle.find(c => c.id === selectedCattleId);

  if (!showEvaluationPopup || !cow || !cow.evaluation) return null;

  const getPartInfo = () => {
    switch (evaluationPart) {
      case 'back':
        return { label: '膘情等级', value: cow.evaluation!.backFat, color: cow.evaluation!.backFat === '上' ? '#2ecc71' : cow.evaluation!.backFat === '中' ? '#f39c12' : '#e74c3c' };
      case 'mouth':
        return { label: '齿龄', value: `${cow.evaluation!.teethAge}岁`, color: '#3498db' };
      case 'leg':
        return { label: '腿力', value: `${cow.evaluation!.legStrength}分`, color: '#9b59b6' };
      default:
        return null;
    }
  };

  const partInfo = getPartInfo();
  if (!partInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        onClick={() => setShowEvaluationPopup(false)}
        style={{
          position: 'fixed',
          left: evaluationPopupPos.x,
          top: evaluationPopupPos.y - 120,
          background: '#fff8e7',
          border: '3px solid var(--primary-wood)',
          borderRadius: 8,
          padding: 15,
          minWidth: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 100,
          transform: 'translateX(-50%)',
        }}
      >
        <div style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: 'var(--primary-brown)',
          marginBottom: 10,
          borderBottom: '2px solid var(--primary-gold)',
          paddingBottom: 5,
        }}>
          牛只评估 - 第{cow.id}号
        </div>
        <div style={{ marginBottom: 8, fontSize: 14 }}>
          <span style={{ color: '#666' }}>{partInfo.label}：</span>
          <span style={{ color: partInfo.color, fontWeight: 'bold', fontSize: 16 }}>{partInfo.value}</span>
        </div>
        {cow.evaluation && (
          <>
            <div style={{ marginBottom: 5, fontSize: 14 }}>
              <span style={{ color: '#666' }}>膘情：</span>
              <span style={{ color: cow.evaluation.backFat === '上' ? '#2ecc71' : cow.evaluation.backFat === '中' ? '#f39c12' : '#e74c3c', fontWeight: 'bold' }}>{cow.evaluation.backFat}等</span>
            </div>
            <div style={{ marginBottom: 5, fontSize: 14 }}>
              <span style={{ color: '#666' }}>总分：</span>
              <span style={{ color: 'var(--primary-gold)', fontWeight: 'bold', fontSize: 20 }}>{cow.evaluation.totalScore}分</span>
            </div>
            <div style={{ fontSize: 14, marginTop: 10, paddingTop: 10, borderTop: '1px dashed #ccc' }}>
              <span style={{ color: '#666' }}>农户底价：</span>
              <span style={{ color: 'var(--red-ribbon)', fontWeight: 'bold' }}>{cow.evaluation.basePrice}两</span>
            </div>
          </>
        )}
        <div style={{ marginTop: 10, fontSize: 11, color: '#999', textAlign: 'center' }}>
          点击任意处关闭
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const GoldParticles: React.FC = () => {
  const { goldParticles } = useMarketStore();
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; size: number }>>([]);

  useEffect(() => {
    if (goldParticles) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1,
        size: Math.random() * 10 + 5,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [goldParticles]);

  if (!goldParticles) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1000,
    }}>
      {particles.map(p => (
        <motion.div
        key={p.id}
        animate={{
          y: ['-100px', '100vh'],
          rotate: [0, 720],
          opacity: [1, 0],
        }}
        transition={{
          duration: 2,
          delay: p.delay,
          ease: 'easeIn',
        }}
        style={{
          position: 'absolute',
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          background: 'radial-gradient(circle, #ffd700 0%, #ffb347 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 10px #ffd700, 0 0 20px #ffb347',
        }}
      />
    ))}
    </div>
  );
};

export const MarketScene: React.FC = () => {
  const { marketTrend, cattle } = useMarketStore();

  const trendMessage = marketTrend === '旺'
    ? '【旺市】买家出价上浮15%'
    : marketTrend === '淡'
    ? '【淡市】卖家底价下跌10%'
    : '【平市】行情平稳';

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '45%',
        background: 'linear-gradient(180deg, #87ceeb 0%, #b0c4de 100%)',
      }} />

      <div style={{
        position: 'absolute',
        top: '20%',
        left: 0,
        width: '100%',
        height: '30%',
        background: 'repeating-linear-gradient(90deg, var(--bg-tile-dark) 0px, var(--bg-tile-dark) 60px, var(--bg-tile-light) 60px, var(--bg-tile-light) 120px)',
        clipPath: 'polygon(0 50%, 5% 20%, 10% 50%, 15% 15%, 20% 50%, 25% 25%, 30% 50%, 35% 20%, 40% 50%, 45% 30%, 50% 50%, 55% 15%, 60% 50%, 65% 25%, 70% 50%, 75% 20%, 80% 50%, 85% 30%, 90% 50%, 95% 20%, 100% 50%, 100% 100%, 0 100%)',
        opacity: 0.8,
      }} />

      <div style={{
        position: 'absolute',
        top: '45%',
        left: 0,
        width: '100%',
        height: '55%',
        background: 'repeating-linear-gradient(90deg, var(--ground) 0px, var(--ground) 80px, #7a8a7a 80px, #7a8a7a 160px)',
      }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 100,
            height: 5,
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '50%',
            left: `${i * 7 + 5}%`,
            top: `${i % 3 * 15 + 10}%`,
          }} />
        ))}
      </div>

      <div style={{
        position: 'absolute',
        top: '35%',
        left: '35%',
        width: 100,
        height: 120,
        background: 'var(--tent)',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        opacity: 0.7,
      }} />
      <div style={{
        position: 'absolute',
        top: '35%',
        left: '55%',
        width: 120,
        height: 140,
        background: 'var(--tent)',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        opacity: 0.7,
      }} />

      <div style={{
        position: 'absolute',
        top: '35%',
        left: '40%',
        width: 8,
        height: 140,
        background: '#8b7355',
        borderRadius: 4,
      }} />
      <div style={{
        position: 'absolute',
        top: '35%',
        left: '60%',
        width: 8,
        height: 160,
        background: '#8b7355',
        borderRadius: 4,
      }} />

      <Cattle id={1} x={38} y={60} scale={1.1} />
      <Cattle id={2} x={50} y={68} scale={0.9} />
      <Cattle id={3} x={62} y={60} scale={1.0} />

      <Farmer />
      <Shopkeeper />
      <MarketFlag />

      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(90, 74, 58, 0.9)',
        color: '#fff',
        padding: '10px 30px',
        borderRadius: 20,
        fontSize: 16,
        fontWeight: 'bold',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: 25,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 18, marginBottom: 5 }}>汴京大相国寺 万姓交易</div>
        <div style={{ fontSize: 13, opacity: 0.9 }}>{trendMessage}</div>
        <div style={{ fontSize: 12, marginTop: 5, opacity: 0.8 }}>
          已售 {cattle.filter(c => c.isSold).length} / {cattle.length} 头
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '18%',
        background: 'var(--table)',
        borderTop: '8px solid #6b5335',
        boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          position: 'absolute',
          bottom: '50%',
          left: '10%',
          display: 'flex',
          gap: 5,
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              width: 8,
              height: i % 2 === 0 ? 40 : 50,
              background: 'var(--chopstick)',
              borderRadius: 2,
              boxShadow: '1px 1px 3px rgba(0,0,0,0.3)',
            }} />
          ))}
        </div>
        <div style={{
          position: 'absolute',
          right: '15%',
          bottom: '45%',
          width: 60,
          height: 15,
          background: '#3a3a3a',
          borderRadius: 3,
          boxShadow: '2px 2px 8px rgba(0,0,0,0.5)',
        }} />
        <div style={{
          position: 'absolute',
          right: '20%',
          bottom: '55%',
          width: 5,
          height: 40,
          background: 'linear-gradient(90deg, #8b7355, #6b5335)',
          borderRadius: 2,
          transform: 'rotate(-10deg)',
        }} />
      </div>

      <EvaluationPopup />
      <GoldParticles />
    </div>
  );
};

export default MarketScene;
