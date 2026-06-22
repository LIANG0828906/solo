import { useState, useEffect } from 'react';
import type { Order, Fabric } from '../types';
import { fetchOrders, createOrder, updateOrderStatus, deleteOrder } from '../orderManager';
import { fetchFabrics } from '../fabricInventory';
import OrderCard from '../components/OrderCard';

interface OrdersPageProps {
  orders: Order[];
  onStatusChange: (order: Order) => void;
  onOrderCreated: (order: Order) => void;
}

export default function OrdersPage({ orders, onStatusChange, onOrderCreated }: OrdersPageProps) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    fabricItems: [{ fabricId: '', metersNeeded: 5 }],
  });

  useEffect(() => {
    const loadFabrics = async () => {
      try {
        const data = await fetchFabrics();
        setFabrics(data);
      } catch (error) {
        console.error('Failed to load fabrics:', error);
      }
    };
    loadFabrics();
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      try {
        const response = await fetchOrders(page, 20);
        setTotalPages(response.pagination.totalPages);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrders();
  }, [page]);

  const handleCreateOrder = async () => {
    if (!newOrder.customerName.trim()) {
      alert('请输入客户名称');
      return;
    }
    const validItems = newOrder.fabricItems.filter((item) => item.fabricId && item.metersNeeded > 0);
    if (validItems.length === 0) {
      alert('请至少添加一种面料');
      return;
    }

    try {
      const created = await createOrder({
        customerName: newOrder.customerName,
        fabricItems: validItems,
        sketchUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20design%20sketch&image_size=square',
        status: '设计中',
      });
      onOrderCreated(created);
      setShowCreateModal(false);
      setNewOrder({
        customerName: '',
        fabricItems: [{ fabricId: '', metersNeeded: 5 }],
      });
    } catch (error: any) {
      alert(error.message || '创建订单失败');
    }
  };

  const addFabricItem = () => {
    setNewOrder((prev) => ({
      ...prev,
      fabricItems: [...prev.fabricItems, { fabricId: '', metersNeeded: 5 }],
    }));
  };

  const removeFabricItem = (index: number) => {
    if (newOrder.fabricItems.length > 1) {
      setNewOrder((prev) => ({
        ...prev,
        fabricItems: prev.fabricItems.filter((_, i) => i !== index),
      }));
    }
  };

  const updateFabricItem = (index: number, field: string, value: any) => {
    setNewOrder((prev) => ({
      ...prev,
      fabricItems: prev.fabricItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={pageTitleStyle}>订单管理</h1>
        <button onClick={() => setShowCreateModal(true)} style={createButtonStyle}>
          + 新建订单
        </button>
      </div>

      {isLoading ? (
        <div style={loadingStyle}>
          <div style={loadingSpinnerStyle} />
          <div style={loadingTextStyle}>加载中...</div>
        </div>
      ) : orders.length > 0 ? (
        <>
          <div style={ordersGridStyle} className="orders-grid">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={paginationStyle}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={pageButtonStyle}
              >
                上一页
              </button>
              <span style={pageInfoStyle}>
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={pageButtonStyle}
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={emptyStyle}>暂无订单数据</div>
      )}

      {showCreateModal && (
        <div style={modalOverlayStyle} onClick={() => setShowCreateModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>新建订单</h3>
              <button onClick={() => setShowCreateModal(false)} style={closeButtonStyle}>
                ✕
              </button>
            </div>
            <div style={modalContentStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>客户名称</label>
                <input
                  type="text"
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder((prev) => ({ ...prev, customerName: e.target.value }))}
                  style={inputStyle}
                  placeholder="请输入客户名称"
                />
              </div>

              <div style={formGroupStyle}>
                <div style={formHeaderStyle}>
                  <label style={labelStyle}>面料清单</label>
                  <button onClick={addFabricItem} style={addButtonStyle}>
                    + 添加面料
                  </button>
                </div>
                {newOrder.fabricItems.map((item, index) => (
                  <div key={index} style={fabricItemRowStyle}>
                    <select
                      value={item.fabricId}
                      onChange={(e) => updateFabricItem(index, 'fabricId', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">选择面料</option>
                      {fabrics.map((fabric) => (
                        <option key={fabric.id} value={fabric.id}>
                          {fabric.name} - {fabric.color} (剩余{fabric.totalMeters}米)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.metersNeeded}
                      onChange={(e) => updateFabricItem(index, 'metersNeeded', parseFloat(e.target.value) || 0)}
                      style={numberInputStyle}
                      min="0.1"
                      step="0.1"
                      placeholder="米数"
                    />
                    <span style={unitStyle}>米</span>
                    {newOrder.fabricItems.length > 1 && (
                      <button onClick={() =>