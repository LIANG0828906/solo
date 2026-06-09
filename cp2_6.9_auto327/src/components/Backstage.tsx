import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, Actor, Play } from '../types';
import { BOX_IDS, BOX_NAMES, getItemById } from '../data/mockData';

interface BackstageProps {
  items: Item[];
  actors: Actor[];
  currentPlay: Play | null;
  onBorrowItem: (itemId: string, actorId: string) => void;
  onReturnItem: (itemId: string, actorId: string) => void;
  onStartShow: () => void;
}

interface DragItem {
  id: string;
  item: Item;
}

export default function Backstage({
  items,
  actors,
  currentPlay,
  onBorrowItem,
  onReturnItem,
  onStartShow,
}: BackstageProps) {
  const [openBoxId, setOpenBoxId] = useState<string | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string>(actors[0]?.id || '');
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dressingActorId, setDressingActorId] = useState<string | null>(null);
  const [recentlyWornItem, setRecentlyWornItem] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const getItemsByBox = useCallback((boxId: string) => {
    return items.filter(item => item.boxId === boxId);
  }, [items]);

  const getBoxHasWarning = useCallback((boxId: string) => {
    return items.some(item => item.boxId === boxId && item.status === 'needs-repair');
  }, [items]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, item: Item) => {
    if (item.status !== 'available') return;
    setDragItem({ id: item.id, item });
  };

  const handleDragEnd = () => {
    setDragItem(null);
  };

  const handleDropOnActor = (actorId: string) => {
    if (dragItem) {
      onBorrowItem(dragItem.id, actorId);
      setDressingActorId(actorId);
      setRecentlyWornItem(dragItem.id);
      setTimeout(() => {
        setDressingActorId(null);
        setRecentlyWornItem(null);
      }, 300);
      setDragItem(null);
    }
  };

  const handleItemClick = (item: Item, actor: Actor) => {
    if (item.status === 'available') {
      onBorrowItem(item.id, actor.id);
      setDressingActorId(actor.id);
      setRecentlyWornItem(item.id);
      setTimeout(() => {
        setDressingActorId(null);
        setRecentlyWornItem(null);
      }, 300);
    } else if (item.status === 'borrowed' && actor.currentItems.includes(item.id)) {
      onReturnItem(item.id, actor.id);
    }
  };

  const selectedActor = actors.find(a => a.id === selectedActorId);
  const selectedActorItems = selectedActor
    ? selectedActor.currentItems.map(id => getItemById(items, id)).filter(Boolean) as Item[]
    : [];

  const playActors = currentPlay?.cast.map(cast => {
    const actor = actors.find(a => a.id === cast.actorId)!;
    return { actor, role: cast.role };
  }) || [];

  return (
    <div>
      <h2 style={{
        fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
        marginBottom: '20px',
        color: '#c79a32',
        borderBottom: '1px solid #8b0000',
        paddingBottom: '8px',
      }}>
        后台 · {currentPlay?.title || '请选择戏码'}
      </h2>

      <div className="backstage-container" style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <div className="boxes-area" style={{
          flex: '1 1 400px',
          minWidth: '300px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
        }}>
          {BOX_IDS.map((boxId, index) => {
            const boxItems = getItemsByBox(boxId);
            const hasWarning = getBoxHasWarning(boxId);
            const isOpen = openBoxId === boxId;

            return (
              <div key={boxId} className="box-card" style={{ position: 'relative' }}>
                <motion.div
                  layout
                  style={{
                    backgroundColor: '#8b5a2b',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    border: '2px solid #5d3a1a',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onClick={() => setOpenBoxId(isOpen ? null : boxId)}
                  whileHover={{ scale: 1.02, y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  {hasWarning && (
                    <span className="warning-icon" style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      color: '#ff4444',
                      fontSize: '20px',
                      zIndex: 10,
                    }}>❗</span>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(0,0,0,0.2)',
                  }}>
                    <span style={{
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '14px',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    }}>
                      {BOX_NAMES[index]}
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                    }}>
                      {boxItems.length}
                    </span>
                  </div>

                  <div style={{ fontSize: '32px', textAlign: 'center', opacity: 0.8 }}>
                    {index < 3 ? '📦' : '👑'}
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(0,0,0,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '6px',
                        }}>
                          {boxItems.slice(0, 12).map(item => (
                            <motion.div
                              key={item.id}
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                padding: '6px',
                                textAlign: 'center',
                                cursor: item.status === 'available' ? 'grab' : 'not-allowed',
                                opacity: item.status === 'available' ? 1 : 0.5,
                                border: recentlyWornItem === item.id
                                  ? '2px solid #ffd700'
                                  : '1px solid rgba(0,0,0,0.2)',
                                position: 'relative',
                              }}
                              whileHover={item.status === 'available' ? { scale: 1.1 } : {}}
                              onMouseDown={(e) => handleDragStart(e, item)}
                              onTouchStart={(e) => handleDragStart(e, item)}
                              onMouseUp={handleDragEnd}
                              onTouchEnd={handleDragEnd}
                              onClick={() => selectedActor && handleItemClick(item, selectedActor)}
                              title={item.name}
                            >
                              <div style={{ fontSize: '20px' }}>{item.thumbnail}</div>
                              <div style={{
                                fontSize: '10px',
                                color: '#fff',
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {item.name}
                              </div>
                              <span style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                fontSize: '8px',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                backgroundColor: item.status === 'available' ? '#51cf66' :
                                  item.status === 'borrowed' ? '#ffd43b' : '#ff6b6b',
                                color: '#000',
                              }}>
                                {item.status === 'available' ? '可用' :
                                 item.status === 'borrowed' ? '借出' : '待修'}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>

        <div style={{
          flex: '1 1 400px',
          minWidth: '300px',
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #444',
          }}>
            <h3 style={{
              color: '#c79a32',
              marginBottom: '16px',
              fontSize: '1.1rem',
              borderBottom: '1px solid #444',
              paddingBottom: '8px',
            }}>
              伶人换装
            </h3>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}>
              {playActors.map(({ actor, role }) => (
                <motion.button
                  key={actor.id}
                  onClick={() => setSelectedActorId(actor.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedActorId === actor.id ? '#8b0000' : '#1a1a1a',
                    color: '#c79a32',
                    border: `2px solid ${selectedActorId === actor.id ? '#c79a32' : '#444'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{actor.avatar}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>{actor.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>饰 {role}</div>
                  </div>
                </motion.button>
              ))}
            </div>

            {selectedActor && (
              <motion.div
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  border: '2px dashed #444',
                  borderRadius: '12px',
                  minHeight: '300px',
                  position: 'relative',
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnActor(selectedActor.id)}
              >
                <motion.div
                  style={{
                    position: 'relative',
                    width: '150px',
                    height: '200px',
                    margin: '0 auto 20px',
                  }}
                  animate={dressingActorId === selectedActor.id ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 2, -2, 0],
                  } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {selectedActorItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selectedActorItems.filter(i => i.category === 'helmet').map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ y: -30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          style={{
                            fontSize: '40px',
                            filter: `drop-shadow(0 0 4px ${item.color})`,
                          }}
                        >
                          {item.thumbnail}
                        </motion.div>
                      ))}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                          fontSize: '80px',
                          position: 'relative',
                          filter: selectedActorItems.some(i => i.category === 'robe' || i.category === 'cape' || i.category === 'folded')
                            ? `drop-shadow(0 0 8px ${selectedActorItems.find(i => i.category === 'robe' || i.category === 'cape' || i.category === 'folded')?.color || '#fff'})`
                            : 'none',
                        }}
                      >
                        {selectedActor.avatar}
                      </motion.div>
                      {selectedActorItems.filter(i => i.category === 'accessory').map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ x: idx % 2 === 0 ? -20 : 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          style={{
                            fontSize: '24px',
                            position: 'absolute',
                            right: idx % 2 === 0 ? '10px' : 'auto',
                            left: idx % 2 === 1 ? '10px' : 'auto',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            filter: `drop-shadow(0 0 3px ${item.color})`,
                          }}
                        >
                          {item.thumbnail}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {selectedActorItems.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ fontSize: '80px' }}
                    >
                      {selectedActor.avatar}
                    </motion.div>
                  )}
                </motion.div>

                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#c79a32',
                  marginBottom: '8px',
                }}>
                  {selectedActor.name}
                </div>
                <div style={{
                  fontSize: '13px',
                  opacity: 0.7,
                  marginBottom: '16px',
                }}>
                  已穿戴 {selectedActorItems.length} 件行头
                </div>

                {selectedActorItems.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    justifyContent: 'center',
                    marginTop: '16px',
                  }}>
                    {selectedActorItems.map(item => (
                      <motion.div
                        key={item.id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: item.color + '33',
                          border: `1px solid ${item.color}`,
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleItemClick(item, selectedActor)}
                        title="点击脱下"
                      >
                        <span>{item.thumbnail}</span>
                        <span style={{ color: '#fff' }}>{item.name}</span>
                        <span style={{ opacity: 0.6 }}>✕</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            <motion.button
              onClick={onStartShow}
              whileHover={{
                backgroundColor: '#dc143c',
                y: -3,
                boxShadow: '0 8px 20px rgba(220, 20, 60, 0.4)',
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '14px',
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
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <span>🎪</span>
              登台表演
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {dragItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.7, scale: 1, x: mousePos.x - 24, y: mousePos.y - 24 }}
            style={{
              position: 'fixed',
              pointerEvents: 'none',
              zIndex: 9999,
              fontSize: '48px',
              filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.5))`,
              left: 0,
              top: 0,
            }}
          >
            {dragItem.item.thumbnail}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
