import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import Workbench from './pages/Workbench';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Modal from './components/Modal';
import './styles/global.css';
import type { Order } from './types';

function App() {
  const { 
    currentPanel, 
    setPanel, 
    money, 
    reputation, 
    materials, 
    showSweep,
    showModal,
    setShowModal,
    addWater,
    addOrder,
    checkDrying
  } = useGameStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersRes = await fetch('/api/orders');
        const orders = await ordersRes.json();
        orders.forEach((order: Order) => addOrder(order));
      } catch (e) {
        console.log('Using mock data from store');
      }
    };
    fetchData();
  }, [addOrder]);

  useEffect(() => {
    const interval = setInterval(checkDrying, 1000);
    return () => clearInterval(interval);
  }, [checkDrying]);

  const panels = [
    { id: 'workbench' as const, label: '工作台' },
    { id: 'inventory' as const, label: '库存' },
    { id: 'orders' as const, label: '订单' }
  ];

  return (
    <div className="app-container">
      {showSweep && <div className="sweep-effect" />}
      
      <header className="app-header">
        <h1 className="app-title">徽州墨坊</h1>
        
        <div className="stats-bar">
          <div className="stat-item">
            💰 银两: <strong>{money}</strong> 两
          </div>
          <div className="stat-item">
            ⭐ 声誉: <strong>{reputation}</strong> 点
          </div>
          <div className="stat-item">
            🧪 皮胶: <strong>{materials.glue}</strong>
          </div>
          <div className="stat-item">
            🌫️ 松烟: <strong>{materials.pineSoot}</strong>
          </div>
          <div className="stat-item">
            💧 清水: <strong>{materials.water}</strong>
          </div>
        </div>

        <nav className="nav-tabs">
          {panels.map(panel => (
            <button
              key={panel.id}
              className={`nav-tab ${currentPanel === panel.id ? 'active' : ''}`}
              onClick={() => setPanel(panel.id)}
            >
              {panel.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPanel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentPanel === 'workbench' && <Workbench />}
            {currentPanel === 'inventory' && <Inventory />}
            {currentPanel === 'orders' && <Orders />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Modal
        isOpen={showModal === 'water'}
        onClose={() => setShowModal(null)}
        title="墨团过硬！"
        message="墨团硬度过高，需要添加少量清水进行调和。"
      >
        <div className="modal-actions">
          <button className="btn-bronze" onClick={() => {
            addWater();
            setShowModal(null);
          }}>
            加水
          </button>
          <button className="btn-bronze" onClick={() => setShowModal(null)}>
            稍后
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showModal === 'bankrupt'}
        onClose={() => setShowModal(null)}
        title="墨坊破产"
        message="您的墨坊声誉已耗尽，无法继续经营。"
      >
        <div className="modal-actions">
          <button className="btn-bronze" onClick={() => window.location.reload()}>
            重新开始
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
