import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import axios from 'axios';
import { create } from 'zustand';

interface Order {
  id: string;
  leather_type: string;
  color: string;
  hardware: string[];
  length: number;
  width: number;
  height: number;
  status: string;
  sub_status: string | null;
  created_at: string;
}

interface OrderStore {
  orders: Order[];
  loading: boolean;
  fetchOrders: () => Promise<void>;
  createOrder: (data: Omit<Order, 'id' | 'status' | 'sub_status' | 'created_at'>) => Promise<void>;
  updateOrder: (id: string, data: { status?: string; sub_status?: string }) => Promise<void>;
}

const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  fetchOrders: async () => {
    set({ loading: true });
    try {
      const res = await axios.get('/api/orders');
      set({ orders: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  createOrder: async (data) => {
    const res = await axios.post('/api/orders', data);
    set({ orders: [res.data, ...get().orders] });
  },
  updateOrder: async (id, data) => {
    const res = await axios.patch(`/api/orders/${id}`, data);
    set({ orders: get().orders.map(o => o.id === id ? res.data : o) });
  },
}));

const LEATHER_TYPES = ['头层牛皮', '羊皮', '鳄鱼皮'];

const COLORS = [
  { name: '黑色', value: '#1A1A1A' },
  { name: '深棕', value: '#5D4037' },
  { name: '棕色', value: '#8D6E63' },
  { name: '浅棕', value: '#A1887F' },
  { name: '米白', value: '#F5F5DC' },
  { name: '白色', value: '#FAFAFA' },
  { name: '红色', value: '#C62828' },
  { name: '深蓝', value: '#1A237E' },
  { name: '墨绿', value: '#2E7D32' },
  { name: '酒红', value: '#880E4F' },
  { name: '橙色', value: '#E65100' },
  { name: '藏青', value: '#263238' },
];

const HARDWARE_OPTIONS = ['古铜扣', '拉链', '铆钉'];

const COLUMNS = [
  { id: '待接单', title: '待接单' },
  { id: '制作中', title: '制作中' },
  { id: '已完成', title: '已完成' },
];

const SUB_STATUSES = ['已接单', '裁料中', '缝制中', '五金安装', '质检'];

function getCardClass(leatherType: string): string {
  if (leatherType === '头层牛皮') return 'order-card-cow';
  if (leatherType === '羊皮') return 'order-card-sheep';
  if (leatherType === '鳄鱼皮') return 'order-card-croc';
  return '';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function OrderFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [leatherType, setLeatherType] = useState('头层牛皮');
  const [color, setColor] = useState('#1A1A1A');
  const [hardware, setHardware] = useState<string[]>([]);
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleHardware = (item: string) => {
    setHardware(prev =>
      prev.includes(item) ? prev.filter(h => h !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/orders', {
        leather_type: leatherType,
        color,
        hardware,
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
      });
      onSubmit();
      onClose();
    } catch (err) {
      console.error('Failed to create order:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">提交定制订单</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">皮料种类</label>
            <div className="leather-type-selector">
              {LEATHER_TYPES.map(type => (
                <div
                  key={type}
                  className={`leather-type-option ${leatherType === type ? 'leather-type-option-selected' : ''}`}
                  onClick={() => setLeatherType(type)}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">颜色选择</label>
            <div className="color-palette">
              {COLORS.map(c => (
                <div
                  key={c.value}
                  className={`color-swatch ${color === c.value ? 'color-swatch-selected' : ''}`}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                >
                  <div
                    className="color-swatch-inner"
                    style={{ backgroundColor: c.value }}
                  />
                </div>
              ))}
            </div>
            <div className="color-name-tooltip">
              {COLORS.find(c => c.value === color)?.name}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">五金件</label>
            <div className="hardware-checkboxes">
              {HARDWARE_OPTIONS.map(item => (
                <label key={item} className="hardware-checkbox">
                  <input
                    type="checkbox"
                    checked={hardware.includes(item)}
                    onChange={() => toggleHardware(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">尺寸 (英寸)</label>
            <div className="form-row">
              <input
                className="form-input"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="长"
                value={length}
                onChange={e => setLength(e.target.value)}
                required
              />
              <input
                className="form-input"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="宽"
                value={width}
                onChange={e => setWidth(e.target.value)}
                required
              />
              <input
                className="form-input"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="高"
                value={height}
                onChange={e => setHeight(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !length || !width || !height}
            >
              {submitting ? '提交中...' : '提交订单'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderCard({ order, index }: { order: Order; index: number }) {
  const updateOrder = useOrderStore(s => s.updateOrder);

  const advanceSubStatus = async () => {
    if (!order.sub_status) {
      await updateOrder(order.id, { sub_status: '已接单' });
      return;
    }
    const currentIdx = SUB_STATUSES.indexOf(order.sub_status);
    if (currentIdx < SUB_STATUSES.length - 1) {
      await updateOrder(order.id, { sub_status: SUB_STATUSES[currentIdx + 1] });
    }
  };

  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`order-card ${getCardClass(order.leather_type)}`}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.7 : 1,
            transition: snapshot.isDragging
              ? 'none'
              : 'box-shadow 0.3s ease, transform 0.3s ease, opacity 0.3s ease',
          }}
        >
          <div className="order-card-leather">
            {order.leather_type}
            <span style={{ marginLeft: 8, display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: order.color, border: '1px solid rgba(255,255,255,0.3)', verticalAlign: 'middle' }} />
          </div>
          <div className="order-card-details">
            尺寸: {order.length}" × {order.width}" × {order.height}"
          </div>
          {order.hardware.length > 0 && (
            <div className="order-card-hardware">
              {order.hardware.map(h => (
                <span key={h} className="hardware-tag">{h}</span>
              ))}
            </div>
          )}
          {order.sub_status && (
            <div className="order-card-sub-status">{order.sub_status}</div>
          )}
          {order.status === '制作中' && (
            <div className="order-card-actions">
              <button className="btn btn-sm" onClick={advanceSubStatus}>
                {order.sub_status ? '推进工序 ▸' : '开始制作 ▸'}
              </button>
            </div>
          )}
          <div className="order-card-time">{formatDate(order.created_at)}</div>
        </div>
      )}
    </Draggable>
  );
}

function OrderList() {
  const { orders, loading, fetchOrders, updateOrder } = useOrderStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const orderId = result.draggableId;
      const newStatus = result.destination.droppableId;
      const order = orders.find(o => o.id === orderId);
      if (!order || order.status === newStatus) return;

      const patch: { status: string; sub_status?: string } = { status: newStatus };
      if (newStatus === '制作中' && !order.sub_status) {
        patch.sub_status = '已接单';
      }
      if (newStatus === '已完成') {
        patch.sub_status = '质检';
      }
      updateOrder(orderId, patch);
    },
    [orders, updateOrder]
  );

  const getColumnOrders = (status: string) =>
    orders.filter(o => o.status === status);

  if (loading && orders.length === 0) {
    return (
      <div className="loading-wrapper">
        <div className="loading-spinner" />
        <p>加载订单数据...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">订单管理</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 新建订单
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const columnOrders = getColumnOrders(col.id);
            return (
              <div className="kanban-column" key={col.id}>
                <div className="kanban-column-header">
                  <span className="kanban-column-title">{col.title}</span>
                  <span className="kanban-column-count" key={columnOrders.length}>
                    {columnOrders.length}
                  </span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="kanban-cards"
                      style={{
                        background: snapshot.isDraggingOver
                          ? 'rgba(93, 64, 55, 0.06)'
                          : 'transparent',
                        borderRadius: 8,
                        transition: 'background 0.3s ease',
                      }}
                    >
                      {columnOrders.map((order, idx) => (
                        <OrderCard key={order.id} order={order} index={idx} />
                      ))}
                      {provided.placeholder}
                      {columnOrders.length === 0 && !snapshot.isDraggingOver && (
                        <div className="empty-state">暂无订单</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showForm && (
        <OrderFormModal
          onClose={() => setShowForm(false)}
          onSubmit={fetchOrders}
        />
      )}
    </div>
  );
}

export default OrderList;
