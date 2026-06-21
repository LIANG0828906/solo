import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Wheel from './components/Wheel';
import BidPanel from './components/BidPanel';
import AdminPanel from './components/AdminPanel';
import type { AuctionItem, BidRecord, AuctionContextType } from './types';

export const AuctionContext = createContext<AuctionContextType | null>(null);

const App: React.FC = () => {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [auctionActive, setAuctionActive] = useState(true);
  const [currentView, setCurrentView] = useState<'auction' | 'admin'>('auction');
  const [soldItems, setSoldItems] = useState<AuctionItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, statusRes] = await Promise.all([
          axios.get('/api/items'),
          axios.get('/api/items/status')
        ]);
        setItems(itemsRes.data);
        setAuctionActive(statusRes.data.active);
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      const fetchBids = async () => {
        try {
          const res = await axios.get(`/api/bids/${selectedItemId}`);
          setBids(res.data);
        } catch (error) {
          console.error('获取出价记录失败:', error);
        }
      };
      fetchBids();
    }
  }, [selectedItemId]);

  const handleToggleView = useCallback(() => {
    setCurrentView(prev => (prev === 'auction' ? 'admin' : 'auction'));
  }, []);

  const contextValue: AuctionContextType = {
    items,
    setItems,
    selectedItemId,
    setSelectedItemId,
    bids,
    setBids,
    auctionActive,
    setAuctionActive,
    currentView,
    setCurrentView,
    soldItems,
    setSoldItems
  };

  return (
    <AuctionContext.Provider value={contextValue}>
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-title">🎰 虚拟拍卖会轮盘</div>
          <div className="navbar-actions">
            <div className="auction-status">
              <span className={`status-dot ${auctionActive ? 'active' : 'inactive'}`}></span>
              <span>{auctionActive ? '拍卖进行中' : '拍卖已暂停'}</span>
            </div>
            <button
              className={`settings-icon ${currentView === 'admin' ? 'rotated' : ''}`}
              onClick={handleToggleView}
              title={currentView === 'admin' ? '返回拍卖大厅' : '管理后台'}
            >
              ⚙️
            </button>
          </div>
        </nav>

        <main className="main-content">
          {currentView === 'auction' ? (
            <div className="auction-layout">
              <Wheel />
              <BidPanel />
              <div className="sold-section">
                <h3 className="sold-title">已拍出</h3>
                <div className="sold-list">
                  {soldItems.length === 0 ? (
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>暂无已拍出物品</p>
                  ) : (
                    soldItems.map(item => (
                      <div key={item.id} className="sold-card">
                        <img src={item.image} alt={item.name} className="sold-card-image" />
                        <div className="sold-card-info">
                          <div className="sold-card-name">{item.name}</div>
                          <div className="sold-card-price">¥{item.currentPrice}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <AdminPanel />
          )}
        </main>
      </div>
    </AuctionContext.Provider>
  );
};

export default App;
