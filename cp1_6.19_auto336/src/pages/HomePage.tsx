import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useOrderStore } from '../store/useOrderStore';
import OrderCard from '../components/OrderCard';
import './HomePage.css';

let socket: Socket | null = null;

export default function HomePage() {
  const { orders, setOrders, updateOrder, addNotification, user } = useOrderStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    title: '',
    type: 'shopping' as const,
    totalAmount: '',
    targetMembers: '',
    deadline: '',
    matchRule: {
      minAmount: '',
      maxMembers: '',
      autoRejectBelow: '',
    },
  });

  useEffect(() => {
    socket = io('http://localhost:3002');

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('order-update', (updatedOrder) => {
      updateOrder(updatedOrder);
    });

    socket.on('notification', (notification) => {
      if (notification.userId === user.id || notification.forCreator) {
        addNotification(notification);
      }
    });

    fetchOrders();

    return () => {
      socket?.disconnect();
    };
  }, [updateOrder, addNotification, user.id]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/orders');
      const data = await response.json();
      setOrders(data.filter((o: any) => o.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders(mockOrders);
    }
  };

  const handleCreateOrder = async () => {
    if (!newOrder.title || !newOrder.totalAmount || !newOrder.targetMembers || !newOrder.deadline) {
      alert('请填写完整信息');
      return;
    }

    const orderData = {
      title: newOrder.title,
      type: newOrder.type,
      totalAmount: parseFloat(newOrder.totalAmount),
      targetMembers: parseInt(newOrder.targetMembers),
      deadline: new Date(newOrder.deadline).toISOString(),
      creatorId: user.id,
      creatorName: user.name,
      creatorAvatar: user.avatar,
      matchRule: {
        minAmount: newOrder.matchRule.minAmount ? parseFloat(newOrder.matchRule.minAmount) : undefined,
        maxMembers: newOrder.matchRule.maxMembers ? parseInt(newOrder.matchRule.maxMembers) : undefined,
        autoRejectBelow: newOrder.matchRule.autoRejectBelow ? parseFloat(newOrder.matchRule.autoRejectBelow) : undefined,
      },
    };

    try {
      const response = await fetch('http://localhost:3002/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const data = await response.json();
      setOrders([data, ...orders]);
      setShowCreateModal(false);
      setNewOrder({
        title: '',
        type: 'shopping',
        totalAmount: '',
        targetMembers: '',
        deadline: '',
        matchRule: { minAmount: '', maxMembers: '', autoRejectBelow: '' },
      });
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  return (
    <div className="home-page">
      <div className="page-header">
        <h1>发现拼单</h1>
        <button className="create-button" onClick={() => setShowCreateModal(true)}>
          + 发起拼单
        </button>
      </div>

      <div className="orders-grid">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <h2>发起新拼单</h2>

            <div className="form-group">
              <label>拼单标题</label>
              <input
                type="text"
                value={newOrder.title}
                onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })}
                placeholder="例如：奶茶凑单满30减10"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>拼单类型</label>
              <select
                value={newOrder.type}
                onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value as any })}
                className="form-input"
              >
                <option value="shopping">🛒 凑满减</option>
                <option value="carpool">🚗 拼车</option>
                <option value="food">🍔 拼外卖</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>总金额 (元)</label>
                <input
                  type="number"
                  value={newOrder.totalAmount}
                  onChange={(e) => setNewOrder({ ...newOrder, totalAmount: e.target.value })}
                  placeholder="100"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>目标人数</label>
                <input
                  type="number"
                  value={newOrder.targetMembers}
                  onChange={(e) => setNewOrder({ ...newOrder, targetMembers: e.target.value })}
                  placeholder="3"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>截止时间</label>
              <input
                type="datetime-local"
                value={newOrder.deadline}
                onChange={(e) => setNewOrder({ ...newOrder, deadline: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="match-rules-section">
              <h3>自动匹配规则（可选）</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>最低拼单金额</label>
                  <input
                    type="number"
                    value={newOrder.matchRule.minAmount}
                    onChange={(e) => setNewOrder({
                      ...newOrder,
                      matchRule: { ...newOrder.matchRule, minAmount: e.target.value }
                    })}
                    placeholder="20"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>最多人数</label>
                  <input
                    type="number"
                    value={newOrder.matchRule.maxMembers}
                    onChange={(e) => setNewOrder({
                      ...newOrder,
                      matchRule: { ...newOrder.matchRule, maxMembers: e.target.value }
                    })}
                    placeholder="5"
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>自动拒绝低于 (元)</label>
                <input
                  type="number"
                  value={newOrder.matchRule.autoRejectBelow}
                  onChange={(e) => setNewOrder({
                    ...newOrder,
                    matchRule: { ...newOrder.matchRule, autoRejectBelow: e.target.value }
                  })}
                  placeholder="20"
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-button" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="confirm-button" onClick={handleCreateOrder}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const mockOrders: Order[] = [
  {
    id: '1',
    title: '奶茶凑单 满30减10 还差1人',
    type: 'food',
    totalAmount: 35,
    targetMembers: 3,
    currentMembers: 2,
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-1',
    creatorName: '小明',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
    members: [
      { userId: 'user-1', userName: '小明', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming', paymentStatus: 'paid', shareAmount: 11.67 },
      { userId: 'user-2', userName: '小红', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong', paymentStatus: 'pending', shareAmount: 11.67 },
    ],
    status: 'active',
    matchRule: { minAmount: 10, maxMembers: 5, autoRejectBelow: 5 },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '京东凑单 满200减30',
    type: 'shopping',
    totalAmount: 200,
    targetMembers: 4,
    currentMembers: 1,
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-3',
    creatorName: '购物达人',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gouwudaren',
    members: [
      { userId: 'user-3', userName: '购物达人', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gouwudaren', paymentStatus: 'paid', shareAmount: 50 },
    ],
    status: 'active',
    matchRule: { minAmount: 30 },
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: '下班拼车 市区→郊区 每人分摊',
    type: 'carpool',
    totalAmount: 80,
    targetMembers: 4,
    currentMembers: 3,
    deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-4',
    creatorName: '老司机',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laosiji',
    members: [
      { userId: 'user-4', userName: '老司机', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laosiji', paymentStatus: 'paid', shareAmount: 20 },
      { userId: 'user-5', userName: '乘客A', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=passengerA', paymentStatus: 'paid', shareAmount: 20 },
      { userId: 'user-6', userName: '乘客B', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=passengerB', paymentStatus: 'pending', shareAmount: 20 },
    ],
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: '外卖拼单 麻辣烫 起送25',
    type: 'food',
    totalAmount: 50,
    targetMembers: 3,
    currentMembers: 2,
    deadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-7',
    creatorName: '吃货小王',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chihuoxiaowang',
    members: [
      { userId: 'user-7', userName: '吃货小王', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chihuoxiaowang', paymentStatus: 'paid', shareAmount: 16.67 },
      { userId: 'user-8', userName: '隔壁小李', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gebixiaoli', paymentStatus: 'received', shareAmount: 16.67 },
    ],
    status: 'active',
    matchRule: { autoRejectBelow: 10 },
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: '淘宝凑单 跨店满300减50',
    type: 'shopping',
    totalAmount: 300,
    targetMembers: 5,
    currentMembers: 2,
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-9',
    creatorName: '省钱小能手',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shengqianxiaonengshou',
    members: [
      { userId: 'user-9', userName: '省钱小能手', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shengqianxiaonengshou', paymentStatus: 'paid', shareAmount: 60 },
      { userId: 'user-10', userName: '剁手党', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=duoshoudang', paymentStatus: 'pending', shareAmount: 60 },
    ],
    status: 'active',
    matchRule: { minAmount: 50, maxMembers: 5 },
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: '周末拼车去机场',
    type: 'carpool',
    totalAmount: 120,
    targetMembers: 4,
    currentMembers: 1,
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    creatorId: 'user-11',
    creatorName: '旅行者',
    creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lvxingzhe',
    members: [
      { userId: 'user-11', userName: '旅行者', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lvxingzhe', paymentStatus: 'paid', shareAmount: 30 },
    ],
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];
