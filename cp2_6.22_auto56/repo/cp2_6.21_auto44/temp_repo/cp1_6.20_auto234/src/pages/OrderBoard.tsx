import { useState, useEffect, useRef, useCallback } from 'react';
import type { Order, OrderPart, Part, OrderStatus, PaginatedResponse } from '../types';

const statusConfig: Record<OrderStatus, { label: string; bg: string; labelColor: string }> = {
  pending: { label: '待处理', bg: '#fff3e0', labelColor: '#ff9800' },
  repairing: { label: '维修中', bg: '#e3f2fd', labelColor: '#2196f3' },
  completed: { label: '已完成', bg: '#e8f5e9', labelColor: '#4caf50' }
};

const statusList: OrderStatus[] = ['pending', 'repairing', 'completed'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function OrderBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [orderParts, setOrderParts] = useState<OrderPart[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [addQuantity, setAddQuantity] = useState(1);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<OrderStatus | null>(null);
  const [formData, setFormData] = useState({
    device_model: '',
    fault_description: '',
    customer_name: '',
    customer_phone: ''
  });
  const [isMobile, setIsMobile] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadOrders = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      const currentPage = reset ? 1 : page;
      try {
        const url = `/api/orders?page=${currentPage}&pageSize=20${
          filterStatus !== 'all' ? `&status=${filterStatus}` : ''
        }`;
        const res = await fetch(url);
        const data: PaginatedResponse<Order> = await res.json();
        if (reset) {
          setOrders(data.data);
          setPage(2);
        } else {
          setOrders((prev) => [...prev, ...data.data]);
          setPage((prev) => prev + 1);
        }
        setTotal(data.total);
        setHasMore(currentPage * data.pageSize < data.total);
      } finally {
        setLoading(false);
      }
    },
    [loading, page, filterStatus]
  );

  useEffect(() => {
    setOrders([]);
    setPage(1);
    setHasMore(true);
    loadOrders(true);
  }, [filterStatus]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadOrders();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadOrders]);

  const loadAllParts = async () => {
    const res = await fetch('/api/parts?pageSize=2000');
    const data: PaginatedResponse<Part> = await res.json();
    setAllParts(data.data);
  };

  const loadOrderParts = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}/parts`);
    const data = await res.json();
    setOrderParts(data);
  };

  const handleCreateOrder = async () => {
    if (
      !formData.device_model ||
      !formData.fault_description ||
      !formData.customer_name ||
      !formData.customer_phone
    ) {
      return;
    }
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setFormData({ device_model: '', fault_description: '', customer_name: '', customer_phone: '' });
      setShowCreateModal(false);
      setOrders([]);
      setPage(1);
      setHasMore(true);
      loadOrders(true);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o
        )
      );
    }
  };

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDrop = (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    if (draggedOrder && draggedOrder.status !== status) {
      handleStatusChange(draggedOrder.id, status);
    }
    setDraggedOrder(null);
    setDragOverStatus(null);
  };

  const handleAddPart = async () => {
    if (!expandedOrderId || !selectedPartId || addQuantity <= 0) return;
    const res = await fetch(`/api/orders/${expandedOrderId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part_id: selectedPartId, quantity: addQuantity })
    });
    if (res.ok) {
      loadOrderParts(expandedOrderId);
      loadAllParts();
      setAddQuantity(1);
      setSelectedPartId('');
    } else {
      const data = await res.json();
      alert(data.error || '操作失败');
    }
  };

  const openPartsModal = async () => {
    loadOrderParts(expandedOrderId!);
    loadAllParts();
    setShowPartsModal(true);
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);
  const groupedOrders: Record<OrderStatus, Order[]> = {
    pending: [],
    repairing: [],
    completed: []
  };
  filteredOrders.forEach((o) => groupedOrders[o.status].push(o));

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>工单看板</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>共 {total} 条工单，拖拽卡片更改状态</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="repairing">维修中</option>
            <option value="completed">已完成</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            + 新建工单
          </button>
        </div>
      </div>

      <div
        style={{
          display: isMobile ? 'block' : 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px'
        }}
      >
        {statusList.map((status) => {
          const config = statusConfig[status];
          return (
            <div
              key={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={(e) => handleDrop(e, status)}
              onDragLeave={() => setDragOverStatus(null)}
              style={{
                backgroundColor: dragOverStatus === status ? config.bg : '#fafafa',
                borderRadius: '12px',
                padding: '16px',
                minHeight: isMobile ? 'auto' : '400px',
                border: dragOverStatus === status ? `2px dashed ${config.labelColor}` : '2px solid transparent',
                transition: 'all 0.2s ease',
                marginBottom: isMobile ? '16px' : '0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.labelColor }} />
                  <h3 style={{ fontSize: '14px', fontWeight: '600' }}>{config.label}</h3>
                </div>
                <span style={{ fontSize: '12px', color: '#999', backgroundColor: '#eee', padding: '2px 8px', borderRadius: '10px' }}>
                  {groupedOrders[status].length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedOrders[status].map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order)}
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    style={{
                      backgroundColor: config.bg,
                      borderRadius: '8px',
                      padding: '14px',
                      cursor: 'pointer',
                      boxShadow:
                        draggedOrder?.id === order.id
                          ? '0 8px 24px rgba(0,0,0,0.2)'
                          : '0 2px 8px rgba(0,0,0,0.1)',
                      transform: draggedOrder?.id === order.id ? 'scale(1.05) rotate(2deg)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      border: '2px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (draggedOrder?.id !== order.id) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (draggedOrder?.id !== order.id) {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: config.labelColor,
                          color: 'white',
                          fontWeight: '600'
                        }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '6px' }}>
                      {order.device_model}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: '1.5' }}>
                      {order.fault_description.length > 50
                        ? order.fault_description.slice(0, 50) + '...'
                        : order.fault_description}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                      <span>👤 {order.customer_name}</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>

                    {expandedOrderId === order.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(0,0,0,0.1)',
                          animation: 'fadeIn 0.3s ease'
                        }}
                      >
                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                          <strong>客户电话：</strong>
                          {order.customer_phone}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                          <strong>详细描述：</strong>
                          {order.fault_description}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                          <strong>创建时间：</strong>
                          {formatDate(order.created_at)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', marginBottom: '12px' }}>
                          <strong>更新时间：</strong>
                          {formatDate(order.updated_at)}
                        </div>
                        <button
                          onClick={openPartsModal}
                          style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          查看关联备件
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div ref={sentinelRef} style={{ height: '20px', margin: '20px 0' }} />
      {loading && <div style={{ textAlign: 'center', color: '#999', padding: '16px' }}>加载中...</div>}

      {showCreateModal && (
        <CreateModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateOrder}
        />
      )}

      {showPartsModal && expandedOrderId && (
        <PartsModal
          orderParts={orderParts}
          allParts={allParts}
          selectedPartId={selectedPartId}
          setSelectedPartId={setSelectedPartId}
          addQuantity={addQuantity}
          setAddQuantity={setAddQuantity}
          onAdd={handleAddPart}
          onClose={() => setShowPartsModal(false)}
        />
      )}
    </div>
  );
}

function CreateModal({
  formData,
  setFormData,
  onClose,
  onSubmit
}: {
  formData: { device_model: string; fault_description: string; customer_name: string; customer_phone: string };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 250);
  };
  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '480px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: closing ? 'modalOut 0.25s ease forwards' : 'modalIn 0.3s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>新建维修工单</h3>
          <button onClick={handleClose} style={{ backgroundColor: 'transparent', fontSize: '20px', color: '#999' }}>
            ✕
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>设备型号 *</label>
            <input
              type="text"
              value={formData.device_model}
              onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
              placeholder="如：iPhone 15 Pro"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>故障描述 *</label>
            <textarea
              value={formData.fault_description}
              onChange={(e) => setFormData({ ...formData, fault_description: e.target.value })}
              placeholder="请详细描述故障情况"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>客户姓名 *</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="姓名"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>联系电话 *</label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="手机号"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            style={{
              flex: 1,
              padding: '10px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            创建工单
          </button>
        </div>
      </div>
    </div>
  );
}

function PartsModal({
  orderParts,
  allParts,
  selectedPartId,
  setSelectedPartId,
  addQuantity,
  setAddQuantity,
  onAdd,
  onClose
}: {
  orderParts: OrderPart[];
  allParts: Part[];
  selectedPartId: string;
  setSelectedPartId: (v: string) => void;
  addQuantity: number;
  setAddQuantity: (v: number) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 250);
  };
  const totalCost = orderParts.reduce((sum, p) => sum + p.quantity * p.unit_price, 0);
  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: closing ? 'modalOut 0.25s ease forwards' : 'modalIn 0.3s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>关联备件</h3>
          <button onClick={handleClose} style={{ backgroundColor: 'transparent', fontSize: '20px', color: '#999' }}>
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>添加新备件</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
            >
              <option value="">选择备件</option>
              {allParts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.model}) - 库存: {p.quantity} - ¥{p.unit_price}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={addQuantity}
              onChange={(e) => setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              style={{
                width: '80px',
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={onAdd}
              style={{
                padding: '8px 16px',
                backgroundColor: '#667eea',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'transform 0.15s ease'
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              添加
            </button>
          </div>
        </div>

        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>已使用备件</div>

        {orderParts.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: '#999',
              backgroundColor: '#fafafa',
              borderRadius: '8px'
            }}
          >
            暂无使用备件
          </div>
        ) : (
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      fontSize: '12px',
                      color: '#666',
                      fontWeight: '600'
                    }}
                  >
                    备件名称
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#666',
                      fontWeight: '600'
                    }}
                  >
                    数量
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'right',
                      fontSize: '12px',
                      color: '#666',
                      fontWeight: '600'
                    }}
                  >
                    单价
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'right',
                      fontSize: '12px',
                      color: '#666',
                      fontWeight: '600'
                    }}
                  >
                    小计
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderParts.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontSize: '14px' }}>
                      <div>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>{p.model}</div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '14px' }}>{p.quantity}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px' }}>
                      ¥{p.unit_price.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>
                      ¥{(p.quantity * p.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <span style={{ fontSize: '14px' }}>
            总计：
            <span style={{ fontWeight: 'bold', color: '#667eea', fontSize: '18px' }}>¥{totalCost.toFixed(2)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
