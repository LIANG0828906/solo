import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, categoryColors, getRelativeTime } from '../data';

interface ItemListProps {
  items: Item[];
  onOpenChat: (item: Item) => void;
}

const ItemList: React.FC<ItemListProps> = ({ items, onOpenChat }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedItem]);

  const handleCardClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleClosePanel = () => {
    setSelectedItem(null);
  };

  const handleExchangeClick = () => {
    if (selectedItem) {
      onOpenChat(selectedItem);
      setSelectedItem(null);
    }
  };

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 240px)',
        gap: 24,
        justifyContent: 'flex-start',
        padding: '24px 0',
        maxWidth: '100%'
      }}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={() => handleCardClick(item)}
            style={{
              width: 240,
              height: 320,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '4px 8px',
              borderRadius: 4,
              backgroundColor: categoryColors[item.category],
              color: '#FFF',
              fontSize: 11,
              fontWeight: 500,
              zIndex: 2
            }}>
              {item.category}
            </div>
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontSize: 11,
              color: '#999',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '3px 8px',
              borderRadius: 4,
              zIndex: 2
            }}>
              {getRelativeTime(item.createdAt)}
            </div>
            <div style={{
              width: '100%',
              height: 180,
              backgroundColor: '#F5F5F5',
              overflow: 'hidden'
            }}>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  color: '#DDD'
                }}>
                  📦
                </div>
              )}
            </div>
            <div style={{
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flex: 1
            }}>
              <h3 style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: '#333',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {item.name}
              </h3>
              <p style={{
                margin: 0,
                fontSize: 12,
                color: '#888',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flex: 1
              }}>
                {item.description}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 'auto'
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: item.ownerAvatar,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  {item.ownerName.charAt(0)}
                </div>
                <span style={{ fontSize: 12, color: '#666' }}>{item.ownerName}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: '#999'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <p style={{ fontSize: 16 }}>没有找到相关物品</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>试试其他关键词吧</p>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 50
              }}
              onClick={handleClosePanel}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: 350,
                maxWidth: '100vw',
                height: '100vh',
                backgroundColor: '#FAFAFA',
                borderLeft: '3px solid',
                borderImage: 'linear-gradient(to bottom, #6C63FF, #FF6584) 1',
                zIndex: 51,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleClosePanel}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#FFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  zIndex: 5,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
              >
                ×
              </button>

              <div style={{
                width: '100%',
                height: 260,
                backgroundColor: '#F5F5F5',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 80,
                    color: '#DDD'
                  }}>
                    📦
                  </div>
                )}
              </div>

              <div style={{
                padding: '24px 20px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  display: 'inline-flex',
                  padding: '4px 10px',
                  borderRadius: 4,
                  backgroundColor: categoryColors[selectedItem.category],
                  color: '#FFF',
                  fontSize: 12,
                  fontWeight: 500,
                  alignSelf: 'flex-start',
                  marginBottom: 12
                }}>
                  {selectedItem.category}
                </div>

                <h2 style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#333',
                  lineHeight: 1.4,
                  marginBottom: 12
                }}>
                  {selectedItem.name}
                </h2>

                <p style={{
                  margin: 0,
                  fontSize: 14,
                  color: '#666',
                  lineHeight: 1.7,
                  marginBottom: 24
                }}>
                  {selectedItem.description}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px',
                  backgroundColor: '#FFF',
                  borderRadius: 12,
                  marginBottom: 24
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: selectedItem.ownerAvatar,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    fontWeight: 600,
                    fontSize: 16,
                    flexShrink: 0
                  }}>
                    {selectedItem.ownerName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                      {selectedItem.ownerName}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      发布于 {getRelativeTime(selectedItem.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExchangeClick}
                    style={{
                      width: '100%',
                      height: 44,
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                      color: '#FFF',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    💬 交换意向
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ItemList;
