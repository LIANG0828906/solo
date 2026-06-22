import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Item,
  ExchangeRecord,
  items as initialItems,
  exchangeRecords as initialRecords,
  addItem,
  addExchangeRecord,
  formatDateTime
} from './data';
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';
import ChatPanel from './components/ChatPanel';

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([...initialItems]);
  const [records, setRecords] = useState<ExchangeRecord[]>([...initialRecords]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatItem, setChatItem] = useState<Item | null>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch.trim()) return items;
    const keyword = debouncedSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword)
    );
  }, [items, debouncedSearch]);

  const handleAddItem = (itemData: Omit<Item, 'id' | 'createdAt'>) => {
    const newItem = addItem(itemData);
    setItems([newItem, ...items]);
  };

  const handleOpenChat = (item: Item) => {
    setChatItem(item);
    setIsChatOpen(true);
  };

  const handleExchangeComplete = (itemAName: string, itemBName: string) => {
    const newRecord = addExchangeRecord({
      itemAName,
      itemBName,
      status: '进行中'
    });
    setRecords([newRecord, ...records]);
  };

  const stats = useMemo(() => {
    const completed = records.filter((r) => r.status === '已完成').length;
    const inProgress = records.filter((r) => r.status === '进行中').length;
    return {
      published: items.length,
      completed,
      inProgress
    };
  }, [items, records]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }
        .gradient-text {
          background: linear-gradient(135deg, #6C63FF, #FF6584);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        height: 64
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              color: 'inherit'
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: 20,
                fontWeight: 700
              }}>
                ↔
              </div>
              <span style={{
                fontSize: 20,
                fontWeight: 700
              }}>
                <span className="gradient-text">易物集市</span>
              </span>
            </Link>
          </div>

          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="搜索物品..."
              style={{
                width: 200,
                height: 36,
                padding: '0 14px',
                borderRadius: 8,
                border: isSearchFocused
                  ? '2px solid transparent'
                  : '1px solid #E0E0E0',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.3s',
                backgroundImage: isSearchFocused
                  ? 'linear-gradient(#fff, #fff), linear-gradient(to right, #6C63FF, #FF6584)'
                  : 'none',
                backgroundOrigin: isSearchFocused ? 'border-box' : 'padding-box',
                backgroundClip: isSearchFocused ? 'padding-box, border-box' : 'border-box',
                backgroundColor: '#FAFAFA'
              }}
            />

            <Link
              to="/records"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                color: location.pathname === '/records' ? '#6C63FF' : '#555',
                fontWeight: 500,
                fontSize: 14,
                transition: 'background-color 0.2s',
                backgroundColor: location.pathname === '/records' ? 'rgba(108, 99, 255, 0.08)' : 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(108, 99, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = location.pathname === '/records' ? 'rgba(108, 99, 255, 0.08)' : 'transparent'}
            >
              <span style={{ fontSize: 18 }}>↔</span>
              交换记录
            </Link>

            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                color: location.pathname === '/' ? '#6C63FF' : '#555',
                fontWeight: 500,
                fontSize: 14,
                transition: 'background-color 0.2s',
                backgroundColor: location.pathname === '/' ? 'rgba(108, 99, 255, 0.08)' : 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(108, 99, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = location.pathname === '/' ? 'rgba(108, 99, 255, 0.08)' : 'transparent'}
            >
              <span style={{ fontSize: 16 }}>🏠</span>
              首页
            </Link>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFormOpen(true)}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: 300,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.4)',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.4)'}
            >
              +
            </motion.button>
          </div>

          <button
            className="mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#F5F5F5',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <span style={{ width: 20, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
            <span style={{ width: 20, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
            <span style={{ width: 20, height: 2, backgroundColor: '#333', borderRadius: 1 }} />
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mobile-only"
              style={{
                position: 'absolute',
                top: 64,
                left: 0,
                right: 0,
                backgroundColor: '#FFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                zIndex: 40
              }}
            >
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索物品..."
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 14px',
                    borderRadius: 8,
                    border: '1px solid #E0E0E0',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: location.pathname === '/' ? '#6C63FF' : '#333',
                    fontWeight: 500,
                    backgroundColor: location.pathname === '/' ? 'rgba(108, 99, 255, 0.08)' : 'transparent'
                  }}
                >
                  🏠 首页
                </Link>
                <Link
                  to="/records"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: location.pathname === '/records' ? '#6C63FF' : '#333',
                    fontWeight: 500,
                    backgroundColor: location.pathname === '/records' ? 'rgba(108, 99, 255, 0.08)' : 'transparent'
                  }}
                >
                  ↔ 交换记录
                </Link>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsFormOpen(true);
                  }}
                  style={{
                    height: 44,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: '#4CAF50',
                    color: '#FFF',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + 发布闲置物品
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '24px'
      }}>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <div style={{ marginBottom: 8 }}>
                  <h1 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: 8,
                    color: '#333'
                  }}>
                    发现好物，以物易物
                  </h1>
                  <p style={{
                    fontSize: 14,
                    color: '#888',
                    margin: 0
                  }}>
                    浏览 {items.length} 件闲置物品，找到你的心仪之物
                    {debouncedSearch && (
                      <span style={{ color: '#6C63FF', marginLeft: 8 }}>
                        （搜索: "{debouncedSearch}"，找到 {filteredItems.length} 件）
                      </span>
                    )}
                  </p>
                </div>
                <ItemList items={filteredItems} onOpenChat={handleOpenChat} />
              </div>
            }
          />

          <Route
            path="/records"
            element={
              <div>
                <h1 style={{
                  fontSize: 28,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 24,
                  color: '#333'
                }}>
                  交换记录统计
                </h1>

                <div style={{
                  display: 'flex',
                  gap: 20,
                  marginBottom: 32,
                  flexWrap: 'wrap'
                }}>
                  {[
                    { label: '发布物品数', value: stats.published, icon: '📦' },
                    { label: '交换成功数', value: stats.completed, icon: '✅' },
                    { label: '进行中数', value: stats.inProgress, icon: '⏳' }
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        flex: '1 1 200px',
                        minWidth: 180,
                        maxWidth: '30%',
                        height: 80,
                        backgroundColor: '#FFF',
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14
                      }}
                    >
                      <span style={{ fontSize: 32 }}>{stat.icon}</span>
                      <div>
                        <div
                          className="gradient-text"
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            lineHeight: 1.1
                          }}
                        >
                          {stat.value}
                        </div>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  backgroundColor: '#FFF',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #F0F0F0',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#333'
                  }}>
                    交换历史
                  </div>
                  {records.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                      <p>暂无交换记录</p>
                    </div>
                  ) : (
                    <div>
                      {records.map((record, index) => (
                        <div
                          key={record.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '16px 24px',
                            backgroundColor: index % 2 === 1 ? '#F9F9F9' : '#FFF',
                            transition: 'background-color 0.2s',
                            gap: 16,
                            flexWrap: 'wrap'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFEFEF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 1 ? '#F9F9F9' : '#FFF'}
                        >
                          <span style={{
                            fontSize: 18,
                            flexShrink: 0
                          }}>
                            🔄
                          </span>
                          <div style={{
                            flex: 1,
                            minWidth: 200,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: '#333',
                              padding: '4px 12px',
                              backgroundColor: '#F5F5F5',
                              borderRadius: 6
                            }}>
                              {record.itemAName}
                            </span>
                            <span style={{ color: '#6C63FF', fontWeight: 600 }}>↔</span>
                            <span style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: '#333',
                              padding: '4px 12px',
                              backgroundColor: '#F5F5F5',
                              borderRadius: 6
                            }}>
                              {record.itemBName}
                            </span>
                          </div>
                          <span style={{
                            fontSize: 13,
                            color: '#999',
                            flexShrink: 0
                          }}>
                            {formatDateTime(record.exchangeTime)}
                          </span>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 500,
                            padding: '4px 10px',
                            borderRadius: 20,
                            backgroundColor: record.status === '已完成'
                              ? 'rgba(76, 175, 80, 0.12)'
                              : 'rgba(108, 99, 255, 0.12)',
                            color: record.status === '已完成' ? '#4CAF50' : '#6C63FF',
                            flexShrink: 0
                          }}>
                            {record.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    style={{
                      padding: '10px 28px',
                      borderRadius: 8,
                      border: '1px solid #E0E0E0',
                      backgroundColor: '#FFF',
                      color: '#555',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6C63FF';
                      e.currentTarget.style.color = '#6C63FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E0E0E0';
                      e.currentTarget.style.color = '#555';
                    }}
                  >
                    ← 返回首页
                  </motion.button>
                </div>
              </div>
            }
          />
        </Routes>
      </main>

      <ItemForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddItem}
      />

      <ChatPanel
        isOpen={isChatOpen}
        item={chatItem}
        onClose={() => setIsChatOpen(false)}
        onExchangeComplete={handleExchangeComplete}
      />
    </div>
  );
};

export default App;
