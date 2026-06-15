import { useState, useEffect } from 'react';
import MenuPage from './ui/MenuPage';
import BookingPage from './ui/BookingPage';
import ChefDashboard from './ui/ChefDashboard';
import { useMenuStore } from './store/menuStore';
import { fetchMenuItems, fetchBookings } from './api/menuApi';

type Tab = 'menu' | 'booking' | 'chef';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const setMenuItems = useMenuStore((state) => state.setMenuItems);
  const setBookings = useMenuStore((state) => state.setBookings);
  const setLoading = useMenuStore((state) => state.setLoading);
  const selectedBookingItems = useMenuStore((state) => state.selectedBookingItems);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [items, bookings] = await Promise.all([
          fetchMenuItems(),
          fetchBookings(new Date().toISOString().split('T')[0]),
        ]);
        setMenuItems(items);
        setBookings(bookings);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setMenuItems, setBookings, setLoading]);

  const cartItemCount = selectedBookingItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-title">私家小厨</div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            菜单
          </button>
          <button
            className={`nav-tab ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            预订
          </button>
          <button
            className={`nav-tab ${activeTab === 'chef' ? 'active' : ''}`}
            onClick={() => setActiveTab('chef')}
          >
            厨师后台
          </button>
        </div>
      </nav>

      <main className="page-container">
        {activeTab === 'menu' && <MenuPage onGoToBooking={() => setActiveTab('booking')} />}
        {activeTab === 'booking' && <BookingPage onGoToMenu={() => setActiveTab('menu')} />}
        {activeTab === 'chef' && <ChefDashboard />}
      </main>

      {activeTab !== 'booking' && cartItemCount > 0 && (
        <button
          className="cart-fab"
          onClick={() => setActiveTab('booking')}
          title="前往预订"
        >
          <span>🛒</span>
          <span className="cart-fab-badge">{cartItemCount}</span>
        </button>
      )}
    </div>
  );
}

export default App;
