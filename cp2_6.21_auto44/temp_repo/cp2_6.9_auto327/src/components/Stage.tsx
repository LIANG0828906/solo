import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, Actor, Play, ShowRecord } from '../types';
import { getItemById } from '../data/mockData';

interface StageProps {
  actors: Actor[];
  items: Item[];
  currentPlay: Play;
  currentShow: ShowRecord;
  onEndShow: (hasMistake: boolean, hasDamage: boolean) => void;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  size: number;
  symbol: string;
}

export default function Stage({
  actors,
  items,
  currentPlay,
  currentShow,
  onEndShow,
}: StageProps) {
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showEndOptions, setShowEndOptions] = useState(false);
  const [performanceTime, setPerformanceTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const performingActors = useMemo(() => {
    return currentShow.actorRecords.map(record => {
      const actor = actors.find(a => a.id === record.actorId)!;
      const wornItems = record.wornItems.map(id => getItemById(items, id)).filter(Boolean) as Item[];
      return { ...actor, wornItems, role: record.role };
    });
  }, [currentShow, actors, items]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setPerformanceTime(prev => {
        const newTime = prev + 1;
        const nextLyric = currentPlay.lyrics.findIndex(l => l.time === newTime);
        if (nextLyric !== -1) {
          setCurrentLyricIndex(nextLyric);
        }
        if (newTime >= currentPlay.lyrics.length + 5) {
          setShowEndOptions(true);
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPlay, isPaused]);

  const handleApplause = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: Math.random() * 12 + 8,
      symbol: ['✨', '🌟', '💫', '⭐', '🎊'][Math.floor(Math.random() * 5)],
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 2000);
  }, []);

  const handleEndShow = (hasMistake: boolean, hasDamage: boolean) => {
    onEndShow(hasMistake, hasDamage);
  };

  const currentLyric = currentPlay.lyrics[currentLyricIndex];

  const getPerformanceStyle = (index: number) => {
    const baseDelay = index * 0.3;
    return {
      animation: `characterPerform 6s ease-in-out infinite`,
      animationDelay: `${baseDelay}s`,
    };
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 12px',
      }}>
        <h2 style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          color: '#c79a32',
        }}>
          {currentPlay.title}
        </h2>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px', opacity: 0.7 }}>
            演出时长: {Math.floor(performanceTime / 60)}:{(performanceTime % 60).toString().padStart(2, '0')}
          </span>
          <motion.button
            onClick={() => setIsPaused(!isPaused)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#8b0000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
          </motion.button>
        </div>
      </div>

      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        gap: '20px',
        alignItems: 'stretch',
      }}>
        <div style={{
          flex: 1,
          position: 'relative',
          perspective: '1000px',
        }}>
          <div style={{
            position: 'relative',
            backgroundColor: '#a52a2a',
            borderRadius: '8px',
            minHeight: '400px',
            border: '4px solid #8b0000',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>
            <div className="lantern" style={{
              position: 'absolute',
              top: '10px',
              left: '10%',
              fontSize: '32px',
              zIndex: 10,
            }}>
              🏮
            </div>
            <div className="lantern" style={{
              position: 'absolute',
              top: '10px',
              right: '10%',
              fontSize: '32px',
              zIndex: 10,
              animationDelay: '0.5s',
            }}>
              🏮
            </div>

            <div className="curtain" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '15%',
              height: '100%',
              background: 'linear-gradient(to right, #8b0000, #a52a2a)',
              zIndex: 5,
              boxShadow: '5px 0 15px rgba(0,0,0,0.3)',
            }} />
            <div className="curtain" style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '15%',
              height: '100%',
              background: 'linear-gradient(to left, #8b0000, #a52a2a)',
              zIndex: 5,
              boxShadow: '-5px 0 15px rgba(0,0,0,0.3)',
              animationDelay: '0.5s',
            }} />

            <div style={{
              position: 'absolute',
              left: '3%',
              top: '50%',
              transform: 'translateY(-50%)',
              writingMode: 'vertical-rl',
              color: '#c79a32',
              fontSize: '16px',
              textShadow: '0 0 10px rgba(0,0,0,0.8)',
              zIndex: 6,
              fontFamily: "'Noto Serif SC', serif",
            }}>
              台上一声啼
            </div>
            <div style={{
              position: 'absolute',
              right: '3%',
              top: '50%',
              transform: 'translateY(-50%)',
              writingMode: 'vertical-rl',
              color: '#c79a32',
              fontSize: '16px',
              textShadow: '0 0 10px rgba(0,0,0,0.8)',
              zIndex: 6,
              fontFamily: "'Noto Serif SC', serif",
            }}>
              台下十年功
            </div>

            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '40px',
              zIndex: 3,
            }}>
              {performingActors.map((actor, index) => (
                <motion.div
                  key={actor.id}
                  style={getPerformanceStyle(index)}
                  animate={isPaused ? { animationPlayState: 'paused' } : {}}
                >
                  <div style={{
                    position: 'relative',
                    textAlign: 'center',
                  }}>
                    {actor.wornItems.filter(i => i.category === 'helmet').map(item => (
                      <div
                        key={item.id}
                        style={{
                          fontSize: '36px',
                          marginBottom: '-10px',
                          filter: `drop-shadow(0 0 6px ${item.color})`,
                        }}
                      >
                        {item.thumbnail}
                      </div>
                    ))}
                    <div style={{
                      fontSize: '72px',
                      filter: actor.wornItems.some(i => i.category === 'robe' || i.category === 'cape' || i.category === 'folded')
                        ? `drop-shadow(0 0 12px ${actor.wornItems.find(i => i.category === 'robe' || i.category === 'cape' || i.category === 'folded')?.color || '#fff'})`
                        : 'none',
                    }}>
                      {actor.avatar}
                    </div>
                    {actor.wornItems.filter(i => i.category === 'accessory').map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          position: 'absolute',
                          fontSize: '20px',
                          right: idx % 2 === 0 ? '-10px' : 'auto',
                          left: idx % 2 === 1 ? '-10px' : 'auto',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          filter: `drop-shadow(0 0 4px ${item.color})`,
                        }}
                      >
                        {item.thumbnail}
                      </div>
                    ))}
                    <div style={{
                      marginTop: '8px',
                      fontSize: '14px',
                      color: '#c79a32',
                      textShadow: '0 0 8px rgba(0,0,0,0.9)',
                      fontWeight: 600,
                    }}>
                      {actor.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#fff',
                      textShadow: '0 0 6px rgba(0,0,0,0.9)',
                      opacity: 0.9,
                    }}>
                      饰 {actor.role}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '15%',
              right: '15%',
              height: '60px',
              background: 'linear-gradient(to top, #8b0000, transparent)',
              zIndex: 2,
            }} />

            <AnimatePresence>
              {particles.map(particle => (
                <motion.div
                  key={particle.id}
                  initial={{ opacity: 1, y: -20, rotate: 0, scale: 1 }}
                  animate={{ opacity: 0, y: 400, rotate: 360, scale: 0.5 }}
                  transition={{ duration: 2, delay: particle.delay, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: `${particle.x}%`,
                    top: 0,
                    fontSize: `${particle.size}px`,
                    pointerEvents: 'none',
                    zIndex: 100,
                  }}
                >
                  {particle.symbol}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div style={{
          width: '80px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          padding: '16px 8px',
          border: '1px solid #444',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '400px',
        }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              {currentLyric && (
                <motion.div
                  key={currentLyricIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                    color: '#ffffe0',
                    fontSize: '20px',
                    lineHeight: '2',
                    letterSpacing: '4px',
                    fontFamily: "'Noto Serif SC', serif",
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textShadow: '0 0 10px rgba(255,255,224,0.3)',
                  }}
                >
                  {currentLyric.text.split('').map((char, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.3 }}
                      style={{ display: 'block' }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        <motion.button
          onClick={handleApplause}
          whileHover={{
            backgroundColor: '#dc143c',
            y: -3,
            boxShadow: '0 8px 20px rgba(220, 20, 60, 0.4)',
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '12px 32px',
            backgroundColor: '#8b0000',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <span>👏</span>
          叫好
        </motion.button>

        <motion.button
          onClick={() => setShowEndOptions(true)}
          whileHover={{
            backgroundColor: '#dc143c',
            y: -3,
            boxShadow: '0 8px 20px rgba(220, 20, 60, 0.4)',
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '12px 32px',
            backgroundColor: '#8b0000',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <span>🏁</span>
          结束演出
        </motion.button>
      </div>

      <AnimatePresence>
        {showEndOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              style={{
                backgroundColor: '#2a2a2a',
                padding: '32px',
                borderRadius: '16px',
                maxWidth: '400px',
                width: '90%',
                border: '2px solid #c79a32',
              }}
            >
              <h3 style={{
                color: '#c79a32',
                fontSize: '1.3rem',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                演出已完成
              </h3>
              <p style={{
                color: '#fff',
                marginBottom: '24px',
                textAlign: 'center',
                opacity: 0.8,
              }}>
                请记录本场演出情况
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
              }}>
                <motion.button
                  onClick={() => handleEndShow(false, false)}
                  whileHover={{
                    backgroundColor: '#2f7a3a',
                    y: -2,
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '14px',
                    backgroundColor: '#51cf66',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ✅ 完美演出，无差错
                </motion.button>
                <motion.button
                  onClick={() => handleEndShow(true, false)}
                  whileHover={{
                    backgroundColor: '#c92a2a',
                    y: -2,
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '14px',
                    backgroundColor: '#ff6b6b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ❌ 行头有穿错
                </motion.button>
                <motion.button
                  onClick={() => handleEndShow(false, true)}
                  whileHover={{
                    backgroundColor: '#d9480f',
                    y: -2,
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '14px',
                    backgroundColor: '#ffa94d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ⚠️ 行头有损坏
                </motion.button>
                <motion.button
                  onClick={() => handleEndShow(true, true)}
                  whileHover={{
                    backgroundColor: '#862e9c',
                    y: -2,
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    padding: '14px',
                    backgroundColor: '#cc5de8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ❌⚠️ 既有穿错又有损坏
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
