import { useState, useEffect } from 'react';
import MenuBoard from '@/components/MenuBoard';
import OrderPanel from '@/components/OrderPanel';
import OrderProgress from '@/components/OrderProgress';
import { fetchMenu } from '@/api';
import type { MenuItem, Order } from '@/types';

export default function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchMenu();
        setMenuItems(data);
      } catch (error) {
        console.error('加载菜单失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const handleOrderCreated = (order: Order) => {
    setCurrentOrder(order);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>☕ 暖阳咖啡馆</h1>
        <p>新鲜现磨，温暖每一刻</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8B7355' }}>
          <p>加载菜单中...</p>
        </div>
      ) : (
        <MenuBoard menuItems={menuItems} />
      )}

      {currentOrder && <OrderProgress orderId={currentOrder.id} />}

      <OrderPanel onOrderCreated={handleOrderCreated} />
    </div>
  );
}

