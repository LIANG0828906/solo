import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketStore } from '../store/useMarketStore';
import { submitTransaction } from '../api/marketApi';

const playDealSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 1200;
      osc2.type = 'sine';
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.2);
    }, 150);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const BambooSlip: React.FC<{
  side: 'left' | 'right';
  x: number;
  price: number;
  label: string;
  color: string;
}> = ({ side, x, price, label, color }) => {
  const { setBambooPosition, setDraggingBamboo, gapPercentage, dealCompleted } = useMarketStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (dealCompleted) return;
    e.preventDefault();
    setIsDragging(true);
    setDraggingBamboo(side);
  };

  const handleTouchStart = (_e: React.TouchEvent) => {
    if (dealCompleted) return;
    setIsDragging(true);
    setDraggingBamboo(side);
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !containerRef.current) return;
      const container = containerRef.current.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relativeX = ((clientX - rect.left) / rect.width) * 100;
      setBambooPosition(side, relativeX);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
      setDraggingBamboo(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, side, setBambooPosition, setDraggingBamboo]);

  const gapColor = gapPercentage <= 5 ? '#2ecc71' : gapPercentage <= 20 ? '#f39c12' : '#e74c3c';

  return (
    <motion.div
      ref={containerRef}
      initial={false}
      animate={{
        left: `${x}%`,
        scale: dealCompleted ? 0.8 : 1,
        opacity: dealCompleted ? 0 : 1,
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        cursor: dealCompleted ? 'default' : 'grab',
        zIndex: 10,
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div style={{
        width: 70,
        padding: '15px 10px',
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        borderRadius: 5,
        border: '3px solid #5a4a3a',
        boxShadow: isDragging
          ? '0 10px 30px rgba(0,0,0,0.5)'
          : '0 4px 15px rgba(0,0,0,0.3)',
        textAlign: 'center',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.1s',
      }}>
        <div style={{
          color: '#3a2a1a',
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 5,
        }}>
          {label}
        </div>
        <div style={{
          color: '#1a1a1a',
          fontSize: 22,
          fontWeight: 'bold',
          fontFamily: 'serif',
        }}>
          {price}两
        </div>
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: -30,
          transform: 'translateX(-50%)',
          fontSize: 11,
          color: gapColor,
          whiteSpace: 'nowrap',
          fontWeight: 'bold',
        }}>
          差价: {gapPercentage.toFixed(1)}%
        </div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: '100%',
          height: 1,
          background: 'rgba(90, 74, 58, 0.3)',
          top: `${20 + i * 15}%`,
          left: 0,
        }} />
      ))}
    </motion.div>
  );
};

const Coin: React.FC<{
  id: string;
  amount: number;
  index: number;
  onDragEnd: (id: string, x: number, y: number) => void;
  isUsed: boolean;
}> = ({ id, amount, index, onDragEnd, isUsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const coinRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isUsed) return;
    e.preventDefault();
    const rect = coinRef.current?.getBoundingClientRect();
    if (!rect) return;
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isUsed) return;
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      setPosition({
        x: clientX - startPos.x,
        y: clientY - startPos.y,
      });
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleEnd = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      setIsDragging(false);
      onDragEnd(id, clientX, clientY);
    };

    const handleMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, startPos, id, onDragEnd]);

  if (isUsed) return null;

  return (
    <motion.div
      ref={coinRef}
      animate={{
        x: position.x,
        y: position.y,
        scale: isDragging ? 1.2 : 1,
        zIndex: isDragging ? 100 : 10,
      }}
      transition={{ duration: 0, type: 'tween' }}
      style={{
        position: 'absolute',
        left: `${20 + index * 20}%`,
        bottom: 30,
        width: 60,
        height: 60,
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 30% 30%, #f4c77a 0%, var(--coin) 50%, #a4774a 100%)',
        borderRadius: '50%',
        border: '3px solid #8b6914',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isDragging
          ? '0 8px 25px rgba(0,0,0,0.5)'
          : '0 3px 10px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        <div style={{
          width: 18,
          height: 18,
          background: '#f5e6d3',
          border: '2px solid #8b6914',
        }} />
        <div style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
      </div>
      <div style={{
        position: 'absolute',
        bottom: -20,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 10,
        color: '#333',
        whiteSpace: 'nowrap',
        fontWeight: 'bold',
      }}>
        {amount}两
      </div>
    </motion.div>
  );
};

const CoinSlot: React.FC<{
  id: string;
  label: string;
  amount: number;
  filled: boolean;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  isShaking: boolean;
}> = ({ id, label, amount, filled, registerRef, isShaking }) => {
  return (
    <div
      ref={(el) => registerRef(id, el)}
      style={{
        width: 100,
        height: 100,
        background: filled ? 'rgba(46, 204, 113, 0.2)' : 'rgba(90, 74, 58, 0.1)',
        border: `3px dashed ${filled ? '#2ecc71' : '#8b7355'}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        animation: isShaking ? 'shake 0.3s ease-in-out' : 'none',
        transition: 'all 0.3s',
      }}
    >
      <div style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: 'var(--primary-brown)',
        marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: 'var(--primary-gold)',
      }}>
        {amount}两
      </div>
      {filled && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          style={{
            position: 'absolute',
            width: 50,
            height: 50,
            background: 'radial-gradient(circle at 30% 30%, #f4c77a 0%, var(--coin) 50%, #a4774a 100%)',
            borderRadius: '50%',
            border: '3px solid #8b6914',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{
            width: 15,
            height: 15,
            background: '#f5e6d3',
            border: '2px solid #8b6914',
          }} />
        </motion.div>
      )}
    </div>
  );
};

const SettlementPanel: React.FC = () => {
  const {
    showSettlement,
    setShowSettlement,
    transactionAmount,
    agentFee,
    taxFee,
    coinSlots,
    fillCoinSlot,
    resetCoinSlot,
    triggerGoldParticles,
    resetMarket,
    marketTrend,
    cattle,
  } = useMarketStore();

  const [slotRefs, setSlotRefs] = useState<Map<string, HTMLDivElement>>(new Map());
  const [shakingSlots, setShakingSlots] = useState<Set<string>>(new Set());
  const [usedCoins, setUsedCoins] = useState<Set<string>>(new Set());
  const [showContract, setShowContract] = useState(false);
  const [transactionSubmitted, setTransactionSubmitted] = useState(false);

  const registerRef = (id: string, el: HTMLDivElement | null) => {
    setSlotRefs(prev => {
      const next = new Map(prev);
      if (el) next.set(id, el);
      else next.delete(id);
      return next;
    });
  };

  const handleCoinDragEnd = async (coinId: string, x: number, y: number) => {
    let matchedSlot: string | null = null;

    slotRefs.forEach((el, slotId) => {
      const rect = el.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom &&
        !coinSlots.find(s => s.id === slotId)?.filled
      ) {
        matchedSlot = slotId;
      }
    });

    if (matchedSlot) {
      const slot = coinSlots.find(s => s.id === matchedSlot);
      const coinAmount = parseInt(coinId.split('-')[1]);

      if (slot && slot.amount === coinAmount) {
        fillCoinSlot(matchedSlot);
        setUsedCoins(prev => new Set(prev).add(coinId));
      } else {
        setShakingSlots(prev => new Set(prev).add(matchedSlot!));
        setTimeout(() => {
          setShakingSlots(prev => {
            const next = new Set(prev);
            next.delete(matchedSlot!);
            return next;
          });
        }, 300);
        resetCoinSlot(matchedSlot);
      }
    }
  };

  const allFilled = coinSlots.every(s => s.filled);

  useEffect(() => {
    if (allFilled && !transactionSubmitted) {
      setShowContract(true);
      const unsoldCattle = cattle.find(c => c.isSold);
      if (unsoldCattle) {
        submitTransaction({
          transactionAmount,
          agentFee,
          taxFee,
          farmerPrice: transactionAmount,
          shopkeeperPrice: transactionAmount,
          marketTrend,
          cattleId: unsoldCattle.id,
        }).then(() => {
          setTransactionSubmitted(true);
          triggerGoldParticles();
        });
      }
    }
  }, [allFilled, transactionSubmitted, transactionAmount, agentFee, taxFee, marketTrend, cattle, triggerGoldParticles]);

  const handleClose = () => {
    setShowSettlement(false);
    resetMarket();
    setUsedCoins(new Set());
    setShowContract(false);
    setTransactionSubmitted(false);
  };

  if (!showSettlement) return null;

  const coins = [
    { id: `coin-${transactionAmount}`, amount: transactionAmount },
    { id: `coin-${transactionAmount}-2`, amount: transactionAmount },
    { id: `coin-${agentFee}`, amount: agentFee },
    { id: `coin-${taxFee}`, amount: taxFee },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #fff8e7 0%, #f5e6d3 100%)',
            borderRadius: 15,
            padding: 30,
            minWidth: 600,
            maxWidth: '90vw',
            border: '5px solid var(--primary-wood)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
        >
          <div style={{
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'var(--primary-brown)',
            marginBottom: 20,
            borderBottom: '3px solid var(--primary-gold)',
            paddingBottom: 15,
          }}>
            🎉 交易成功！结算清账 🎉
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 15,
            marginBottom: 25,
            flexWrap: 'wrap',
          }}>
            {coinSlots.map(slot => (
              <CoinSlot
                key={slot.id}
                id={slot.id}
                label={slot.label}
                amount={slot.amount}
                filled={slot.filled}
                registerRef={registerRef}
                isShaking={shakingSlots.has(slot.id)}
              />
            ))}
          </div>

          <div style={{
            position: 'relative',
            height: 120,
            background: 'rgba(139, 115, 85, 0.1)',
            borderRadius: 10,
            marginBottom: 20,
            border: '2px dashed var(--primary-wood)',
          }}>
            <div style={{
              position: 'absolute',
              top: 5,
              left: 10,
              fontSize: 12,
              color: 'var(--primary-brown)',
            }}>
              ↓ 拖动铜钱到对应格子
            </div>
            {coins.map((coin, index) => (
              <Coin
                key={coin.id}
                id={coin.id}
                amount={coin.amount}
                index={index}
                onDragEnd={handleCoinDragEnd}
                isUsed={usedCoins.has(coin.id)}
              />
            ))}
          </div>

          <div style={{
            background: 'rgba(196, 30, 58, 0.1)',
            border: '2px solid var(--red-ribbon)',
            borderRadius: 8,
            padding: 15,
            marginBottom: 15,
          }}>
            <div style={{ fontSize: 14, color: 'var(--primary-brown)', marginBottom: 8 }}>
              <strong>交易明细：</strong>
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
              <div>交易额：<strong style={{ color: 'var(--primary-gold)' }}>{transactionAmount}两</strong></div>
              <div>牙钱(3%)：<strong style={{ color: 'var(--primary-wood)' }}>{agentFee}两</strong></div>
              <div>税钱(2%)：<strong style={{ color: 'var(--red-ribbon)' }}>{taxFee}两</strong></div>
            </div>
          </div>

          {allFilled && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              style={{
                width: '100%',
                padding: 15,
                background: 'linear-gradient(135deg, var(--primary-gold) 0%, #a8884e 100%)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(200, 168, 110, 0.5)',
              }}
            >
              完成交易，继续下一单
            </motion.button>
          )}

          <AnimatePresence>
            {showContract && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 200 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                  border: '4px solid var(--red-ribbon)',
                  borderRadius: 10,
                  padding: 25,
                  minWidth: 350,
                  boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
                  zIndex: 10,
                }}
              >
                <div style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: 'var(--red-ribbon)',
                  textAlign: 'center',
                  marginBottom: 15,
                }}>
                  📜 官 印 牙 契 📜
                </div>
                <div style={{
                  fontSize: 13,
                  color: '#333',
                  lineHeight: 2,
                  borderTop: '2px dashed var(--red-ribbon)',
                  paddingTop: 15,
                }}>
                  <div>立契人：牙人 <strong>张二郎</strong></div>
                  <div>卖主：农户 <strong>李老大</strong></div>
                  <div>买主：酒铺掌柜 <strong>王员外</strong></div>
                  <div>交易：黄牛 <strong>壹头</strong></div>
                  <div>时值：<strong>{transactionAmount}两</strong> 白银</div>
                  <div>牙钱：<strong>{agentFee}两</strong></div>
                  <div>税钱：<strong>{taxFee}两</strong></div>
                  <div style={{ marginTop: 10, textAlign: 'right', fontSize: 11, color: '#666' }}>
                    大宋汴京 熙宁年间
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  right: 20,
                  width: 60,
                  height: 60,
                  border: '3px solid var(--red-ribbon)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--red-ribbon)',
                  fontSize: 16,
                  fontWeight: 'bold',
                  transform: 'rotate(-15deg)',
                  opacity: 0.6,
                }}>
                  官印
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const DealPanel: React.FC = () => {
  const {
    farmerPrice,
    shopkeeperPrice,
    bambooLeftX,
    bambooRightX,
    gapPercentage,
    completeDeal,
    dealCompleted,
  } = useMarketStore();

  const prevGapRef = useRef(gapPercentage);

  useEffect(() => {
    if (gapPercentage <= 5 && prevGapRef.current > 5 && !dealCompleted) {
      playDealSound();
      completeDeal();
    }
    prevGapRef.current = gapPercentage;
  }, [gapPercentage, dealCompleted, completeDeal]);

  return (
    <>
      <div style={{
        position: 'absolute',
        top: '25%',
        right: '2%',
        width: '200px',
        height: '50%',
        background: 'rgba(245, 230, 211, 0.95)',
        border: '4px solid var(--primary-wood)',
        borderRadius: 10,
        padding: 15,
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        zIndex: 30,
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: 'var(--primary-brown)',
          textAlign: 'center',
          marginBottom: 15,
          borderBottom: '2px solid var(--primary-gold)',
          paddingBottom: 10,
        }}>
          📜 交易撮合 📜
        </div>

        <div style={{
          position: 'relative',
          height: 'calc(100% - 120px)',
          minHeight: 200,
          background: 'rgba(139, 115, 85, 0.1)',
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px dashed var(--primary-wood)',
        }}>
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 2,
            background: 'repeating-linear-gradient(to bottom, var(--primary-gold) 0, var(--primary-gold) 5px, transparent 5px, transparent 10px)',
            transform: 'translateX(-50%)',
            opacity: 0.5,
          }} />

          <BambooSlip
            side="left"
            x={bambooLeftX}
            price={farmerPrice}
            label="农户底价"
            color="#d4b896"
          />
          <BambooSlip
            side="right"
            x={bambooRightX}
            price={shopkeeperPrice}
            label="掌柜出价"
            color="#c8a86e"
          />

          {gapPercentage > 20 && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(231, 76, 60, 0.9)',
                color: '#fff',
                padding: '8px 15px',
                borderRadius: 20,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              💰 差价过大！继续撮合
            </motion.div>
          )}

          {gapPercentage <= 20 && gapPercentage > 5 && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(243, 156, 18, 0.9)',
                color: '#fff',
                padding: '8px 15px',
                borderRadius: 20,
                fontSize: 12,
                whiteSpace: 'nowrap',
              }}
            >
              ⚖️ 接近成交！再加把劲
            </motion.div>
          )}

          {dealCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(46, 204, 113, 1)',
                color: '#fff',
                padding: '15px 30px',
                borderRadius: 30,
                fontSize: 18,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                boxShadow: '0 5px 20px rgba(46, 204, 113, 0.5)',
                zIndex: 20,
              }}
            >
              👏 啪！成交！
            </motion.div>
          )}
        </div>

        <div style={{
          marginTop: 15,
          fontSize: 11,
          color: '#666',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          💡 拖动左右竹简向中间靠拢<br/>
          差价 ≤ 5% 即可成交
        </div>
      </div>

      <SettlementPanel />
    </>
  );
};

export default DealPanel;
