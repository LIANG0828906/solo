import { useState, useCallback, useMemo } from 'react';
import OrderForm from './OrderForm';
import OrderList from './OrderList';
import DeliveryMap from './DeliveryMap';
import type { Order, NotificationItem } from './types';
import { groupOrdersByCommunity } from './utils/sorting';
import './styles/App.css';

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    customerName: '张三',
    phone: '13800138001',
    community: '阳光花园',
    productName: '有机蔬菜包',
    quantity: 2,
    createdAt: Date.now() - 86400000,
  },
  {
    id: '2',
    customerName: '李四',
    phone: '13800138002',
    community: '阳光花园',
    productName: '有机蔬菜包',
    quantity: 3,
    createdAt: Date.now() - 80000000,
  },
  {
    id: '3',
    customerName: '王五',
    phone: '13800138003',
    community: '翠湖小区',
    productName: '新鲜水果箱',
    quantity: 1,
    createdAt: Date.now() - 70000000,
  },
  {
    id: '4',
    customerName: '赵六',
    phone: '13800138004',
    community: '绿城家园',
    productName: '有机蔬菜包',
    quantity: 1,
    createdAt: Date.now() - 60000000,
  },
  {
    id: '5',
    customerName: '钱七',
    phone: '13800138005',
    community: '绿城家园',
    productName: '土鸡蛋',
    quantity: 5,
    createdAt: Date.now() - 50000000,
  },
  {
    id: '6',
    customerName: '孙八',
    phone: '13800138006',
    community: '幸福里',
    productName: '新鲜水果箱',
    quantity: 2,
    createdAt: Date.now() - 40000000,
  },
  {
    id: '7',
    customerName: '周九',
    phone: '13800138007',
    community: '金色港湾',
    productName: '有机蔬菜包',
    quantity: 4,
    createdAt: Date.now() - 30000000,
  },
  {
    id: '8',
    customerName: '吴十',
    phone: '13800138008',
    community: '翠湖小区',
    productName: '土鸡蛋',
    quantity: 2,
    createdAt: Date.now() - 20000000,
  },
];

function App() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const communityGroups = useMemo(() => groupOrdersByCommunity(orders), [orders]);

  const uniqueCommunities = useMemo(() => {
    return Array.from(new Set(orders.map((o) => o.community)));
  }, [orders]);

  const handleAddOrder = useCallback((newOrder: Omit<Order, 'id' | 'createdAt'>) => {
    const order: Order = {
      ...newOrder,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setOrders((prev) => [order, ...prev]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  }, []);

  const handleSendNotification = useCallback((community: string) => {
    const communityOrders = orders.filter((o) => o.community === community);
    const customerSet = new Map<string, { name: string; phone: string }>();

    for (const order of communityOrders) {
      customerSet.set(order.phone, { name: order.customerName, phone: order.phone });
    }

    const newNotifications: NotificationItem[] = [];
    for (const [, customer] of customerSet) {
      newNotifications.push({
        id: `${Date.now()}-${customer.phone}`,
        community,
        customerName: customer.name,
        phone: customer.phone,
        message: `【社区团购】${community}的商品已到货，请您尽快到指定地点取货，谢谢配合！`,
        sentAt: Date.now(),
      });
    }

    setNotifications((prev) => [...newNotifications, ...prev]);
    setModalVisible(true);
  }, [orders]);

  const closeNotificationModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>社区团购订单管理</h1>
        <p className="subtitle">订单录入 · 分拣统计 · 配送路线 · 到货通知</p>
      </header>

      {showSuccess && (
        <div className="success-toast">
          <span className="success-icon">✓</span>
          订单添加成功！
        </div>
      )}

      <div className="app-container">
        <div className="left-panel">
          <OrderForm onSubmit={handleAddOrder} existingCommunities={uniqueCommunities} />
        </div>

        <div className="right-panel">
          <OrderList
            groups={communityGroups}
            onSendNotification={handleSendNotification}
          />
          <DeliveryMap communities={uniqueCommunities} />
        </div>
      </div>

      <div
        className={`modal-overlay ${modalVisible ? 'modal-visible' : ''}`}
        onClick={closeNotificationModal}
      >
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>到货通知已发送</h2>
            <button className="modal-close" onClick={closeNotificationModal}>
              ×
            </button>
          </div>
          <div className="modal-body">
            {notifications.length === 0 ? (
              <p className="empty-text">暂无通知记录</p>
            ) : (
              <ul className="notification-list">
                {notifications.map((notif) => (
                  <li key={notif.id} className="notification-item">
                    <div className="notification-header">
                      <span className="notification-community">{notif.community}</span>
                      <span className="notification-name">{notif.customerName}</span>
                      <span className="notification-phone">{notif.phone}</span>
                    </div>
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">
                      {new Date(notif.sentAt).toLocaleTimeString('zh-CN')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
