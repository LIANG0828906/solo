import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import { ToastProvider, useToast } from './components/Toast';
import GoodsList from './pages/GoodsList';
import MyOrders from './pages/MyOrders';
import OrderManagement from './pages/OrderManagement';
import Login from './pages/Login';
import InventoryManagement from './pages/InventoryManagement';
import useStore from './store/useStore';
import { getGoodsList } from './api/goodsApi';
import { getOrders, getDeliveryOrders } from './api/orderApi';
import { createOrder } from './api/orderApi';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useStore();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const {
    cart,
    isCartOpen,
    toggleCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadProducts,
    loadOrders,
    loadDeliveryOrders,
    isLoggedIn,
  } = useStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [products, orders, deliveryOrders] = await Promise.all([
          getGoodsList(),
          getOrders(),
          getDeliveryOrders(),
        ]);
        loadProducts(products);
        loadOrders(orders);
        loadDeliveryOrders(deliveryOrders);
      } catch (error) {
        showToast('加载数据失败', 'error');
      }
    };
    loadInitialData();
  }, [loadProducts, loadOrders, loadDeliveryOrders, showToast]);

  const cartItems = cart.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    image: item.product.image_url,
  }));

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, quantity);
    }
  };

  const handleSubmitOrder = async (data: { username: string; address: string }) => {
    if (cart.length === 0) return;

    try {
      const orderData = {
        user: data.username,
        items: cart,
        total: cart.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),
        address: data.address,
      };

      await createOrder(orderData);
      clearCart();
      toggleCart();
      showToast('订单提交成功', 'success');

      const orders = await getOrders();
      loadOrders(orders);

      navigate('/orders');
    } catch (error) {
      showToast('订单提交失败', 'error');
    }
  };

  return (
    <div className="app-container">
      <Navbar cartItemCount={cartItemCount} onCartClick={toggleCart} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<GoodsList />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <OrderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <InventoryManagement />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={toggleCart}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={removeFromCart}
        onSubmitOrder={handleSubmitOrder}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
