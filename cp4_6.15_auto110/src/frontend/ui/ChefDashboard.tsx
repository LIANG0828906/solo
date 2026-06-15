import { useState, useEffect, useRef, useCallback } from 'react';
import { MenuItem, Booking, BookingStatus, MenuCategory, PurchaseList, Ingredient } from '../../types';
import { useMenuStore } from '../store/menuStore';
import {
  createMenuItem as apiCreateMenuItem,
  deleteMenuItem as apiDeleteMenuItem,
  updateBookingStatus as apiUpdateBookingStatus,
  generatePurchaseList as apiGeneratePurchaseList,
  fetchBookings as apiFetchBookings,
  fetchMenuItems as apiFetchMenuItems,
} from '../api/menuApi';

const CATEGORY_LABELS: Record<MenuCategory, string> = {
  appetizer: '前菜',
  main: '主菜',
  dessert: '甜点',
  drink: '饮品',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
};

const STATUS_FLOW: Record<BookingStatus, BookingStatus | null> = {
  pending: 'confirmed',
  confirmed: 'completed',
  completed: null,
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'var(--color-blue)',
  confirmed: 'var(--color-green)',
  completed: 'var(--color-gray)',
};

interface NewMenuItemForm {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: MenuCategory;
  optionalToppings: string;
  dailyLimit: string;
  ingredients: Ingredient[];
}

const INITIAL_FORM: NewMenuItemForm = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: 'main',
  optionalToppings: '',
  dailyLimit: '',
  ingredients: [],
};

const FORM_FIELDS = [
  ['name'],
  ['description', 'price', 'dailyLimit'],
  ['category', 'imageUrl'],
  ['optionalToppings', 'ingredients'],
  ['submit'],
];

function AnimatedNumber({ value, duration = 300 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    if (start === end) return;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayValue(current);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = end;
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, duration]);

  const formatted = Number.isInteger(displayValue)
    ? Math.round(displayValue)
    : displayValue.toFixed(1);

  return <span className="animated-number">{formatted}</span>;
}

function BookingTimelineCard({
  booking,
  onStatusChange,
  isFolding,
}: {
  booking: Booking;
  onStatusChange: (id: string, status: BookingStatus) => void;
  isFolding: boolean;
}) {
  const nextStatus = STATUS_FLOW[booking.status];

  return (
    <div
      className={`booking-card status-${booking.status} ${isFolding ? 'booking-card-folding' : ''}`}
    >
      <div className="booking-card-status-indicator" style={{ backgroundColor: STATUS_COLORS[booking.status] }} />
      <div className="booking-card-header">
        <span className="booking-customer">{booking.customerName}</span>
        <div className="booking-meta">
          <span>👥 {booking.guestCount}人</span>
          <span>📞 {booking.phone}</span>
          <span className="booking-time-label">🕐 {booking.timeSlot}</span>
        </div>
      </div>
      <div className="booking-items">
        {booking.items.map((item, i) => (
          <span key={i} className="booking-item-tag">
            {item.menuItemName} ×{item.quantity}
          </span>
        ))}
      </div>
      <div className="booking-card-footer">
        <span className="booking-submitted-time">
          提交于 {new Date(booking.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {nextStatus && (
          <button
            className={`status-btn status-btn-${booking.status}`}
            onClick={() => onStatusChange(booking.id, booking.status)}
          >
            {STATUS_LABELS[booking.status]} → {STATUS_LABELS[nextStatus]}
          </button>
        )}
        {!nextStatus && (
          <span className={`status-btn status-btn-completed`}>
            {STATUS_LABELS[booking.status]}
          </span>
        )}
      </div>
    </div>
  );
}

function ChefDashboard() {
  const menuItems = useMenuStore((state) => state.menuItems);
  const addMenuItem = useMenuStore((state) => state.addMenuItem);
  const removeMenuItem = useMenuStore((state) => state.removeMenuItem);
  const setMenuItems = useMenuStore((state) => state.setMenuItems);
  const bookings = useMenuStore((state) => state.bookings);
  const setBookings = useMenuStore((state) => state.setBookings);
  const updateBooking = useMenuStore((state) => state.updateBooking);
  const purchaseList = useMenuStore((state) => state.purchaseList);
  const setPurchaseList = useMenuStore((state) => state.setPurchaseList);
  const setLoading = useMenuStore((state) => state.setLoading);
  const setError = useMenuStore((state) => state.setError);

  const [showForm, setShowForm] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [form, setForm] = useState<NewMenuItemForm>(INITIAL_FORM);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [foldingId, setFoldingId] = useState<string | null>(null);
  const [newMenuItemId, setNewMenuItemId] = useState<string | null>(null);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    unit: '克',
  });

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await apiFetchBookings(selectedDate);
        setBookings(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    loadBookings();
  }, [selectedDate, setBookings, setError]);

  useEffect(() => {
    if (showForm) {
      setVisibleSteps(0);
      const timers: ReturnType<typeof setTimeout>[] = [];
      FORM_FIELDS.forEach((_, i) => {
        timers.push(setTimeout(() => {
          setVisibleSteps(i + 1);
        }, i * 120));
      });
      return () => timers.forEach(clearTimeout);
    } else {
      setVisibleSteps(0);
    }
  }, [showForm]);

  const refreshMenu = useCallback(async () => {
    try {
      const items = await apiFetchMenuItems();
      setMenuItems(items);
    } catch (err: any) {
      setError(err.message);
    }
  }, [setMenuItems, setError]);

  const handleCreateMenuItem = async () => {
    if (!form.name || !form.description || !form.price) return;

    setLoading(true);
    try {
      const optionalToppings = form.optionalToppings
        .split(/[,，、]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3);

      const newItem = await apiCreateMenuItem({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        imageUrl: form.imageUrl,
        category: form.category,
        optionalToppings,
        dailyLimit: Number(form.dailyLimit) || 10,
        ingredients: form.ingredients,
      });

      addMenuItem(newItem);
      setNewMenuItemId(newItem.id);
      setTimeout(() => setNewMenuItemId(null), 600);
      setForm(INITIAL_FORM);
      setShowForm(false);
      await refreshMenu();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('确定删除此菜品？')) return;
    try {
      await apiDeleteMenuItem(id);
      removeMenuItem(id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateBookingStatus = async (
    id: string,
    currentStatus: BookingStatus
  ) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (!nextStatus) return;

    setFoldingId(id);
    await new Promise((r) => setTimeout(r, 150));
    try {
      const updated = await apiUpdateBookingStatus(id, nextStatus);
      updateBooking(id, updated);
      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFoldingId(null);
    }
  };

  const handleGeneratePurchaseList = async () => {
    setLoading(true);
    try {
      const list = await apiGeneratePurchaseList(selectedDate);
      setPurchaseList(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (!newIngredient.name || !newIngredient.quantity) return;
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          name: newIngredient.name,
          quantity: Number(newIngredient.quantity),
          unit: newIngredient.unit,
        },
      ],
    }));
    setNewIngredient({ name: '', quantity: '', unit: '克' });
  };

  const removeIngredient = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const sortedBookings = [...bookings].sort((a, b) =>
    a.timeSlot.localeCompare(b.timeSlot)
  );

  const bookingsByTime = sortedBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    if (!acc[b.timeSlot]) acc[b.timeSlot] = [];
    acc[b.timeSlot].push(b);
    return acc;
  }, {});

  return (
    <div className="chef-dashboard">
      <div className="dashboard-section">
        <div className="dashboard-header">
          <h2 className="dashboard-title">菜单管理</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? '取消' : '+ 新增菜品'}
          </button>
        </div>

        {showForm && (
          <div className="menu-form">
            {visibleSteps >= 1 && (
              <div className="form-field form-field-slide" style={{ animationDelay: '0ms' }}>
                <label className="form-label">菜品名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：松露蘑菇汤"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}

            {visibleSteps >= 2 && (
              <>
                <div className="form-field form-field-slide" style={{ animationDelay: '40ms' }}>
                  <label className="form-label">菜品描述 *</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="描述菜品的特色和食材"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div className="form-row form-field-slide" style={{ marginBottom: 0, animationDelay: '80ms' }}>
                  <div className="form-field">
                    <label className="form-label">价格 (¥) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="68"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">每日限量</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="20"
                      value={form.dailyLimit}
                      onChange={(e) =>
                        setForm({ ...form, dailyLimit: e.target.value })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {visibleSteps >= 3 && (
              <>
                <div className="form-field form-field-slide" style={{ animationDelay: '0ms' }}>
                  <label className="form-label">分类</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as MenuCategory })
                    }
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field form-field-slide" style={{ animationDelay: '40ms' }}>
                  <label className="form-label">图片 URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  />
                </div>
              </>
            )}

            {visibleSteps >= 4 && (
              <>
                <div className="form-field form-field-slide" style={{ animationDelay: '0ms' }}>
                  <label className="form-label">可选配料（用逗号分隔，最多3种）</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="帕玛森芝士, 松露油, 香草碎"
                    value={form.optionalToppings}
                    onChange={(e) =>
                      setForm({ ...form, optionalToppings: e.target.value })
                    }
                  />
                </div>
                <div className="form-field form-field-slide" style={{ animationDelay: '40ms' }}>
                  <label className="form-label">配料清单</label>
                  {form.ingredients.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {form.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          className="topping-tag selected"
                          onClick={() => removeIngredient(i)}
                          style={{ cursor: 'pointer' }}
                        >
                          {ing.name} {ing.quantity}{ing.unit} ✕
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="食材名称"
                      value={newIngredient.name}
                      onChange={(e) =>
                        setNewIngredient({ ...newIngredient, name: e.target.value })
                      }
                    />
                    <input
                      type="number"
                      className="form-input"
                      placeholder="数量"
                      value={newIngredient.quantity}
                      onChange={(e) =>
                        setNewIngredient({ ...newIngredient, quantity: e.target.value })
                      }
                    />
                    <select
                      className="form-input"
                      value={newIngredient.unit}
                      onChange={(e) =>
                        setNewIngredient({ ...newIngredient, unit: e.target.value })
                      }
                    >
                      <option value="克">克</option>
                      <option value="毫升">毫升</option>
                      <option value="个">个</option>
                    </select>
                    <button className="btn btn-secondary" onClick={addIngredient}>
                      添加
                    </button>
                  </div>
                </div>
              </>
            )}

            {visibleSteps >= 5 && (
              <div className="form-field-slide" style={{ animationDelay: '0ms' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateMenuItem}
                  disabled={!form.name || !form.description || !form.price}
                  style={{ width: '100%' }}
                >
                  提交
                </button>
              </div>
            )}
          </div>
        )}

        <div className="menu-list" style={{ marginTop: 20 }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`menu-list-item ${newMenuItemId === item.id ? 'menu-list-item-new' : ''}`}
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="menu-list-image"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.background =
                    'var(--color-cream-dark)';
                }}
              />
              <div className="menu-list-info">
                <div className="menu-list-name">{item.name}</div>
                <div className="menu-list-meta">
                  {CATEGORY_LABELS[item.category]} · ¥{item.price} · 剩余 {item.remaining}/{item.dailyLimit}
                </div>
              </div>
              <div className="menu-list-actions">
                <button
                  className="icon-btn danger"
                  onClick={() => handleDeleteMenuItem(item.id)}
                  title="删除"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
          {menuItems.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>暂无菜品，点击上方按钮添加</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-header">
          <h2 className="dashboard-title">预订时间线</h2>
          <div className="date-selector">
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div className="timeline-view">
          {Object.entries(bookingsByTime).map(([timeSlot, timeBookings]) => (
            <div key={timeSlot} className="timeline-node">
              <div className="timeline-time">{timeSlot}</div>
              <div className="timeline-bookings">
                {timeBookings.map((booking) => (
                  <BookingTimelineCard
                    key={booking.id}
                    booking={booking}
                    onStatusChange={handleUpdateBookingStatus}
                    isFolding={foldingId === booking.id}
                  />
                ))}
              </div>
            </div>
          ))}
          {sortedBookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p>当日暂无预订</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section full-width">
        <div className="dashboard-header">
          <h2 className="dashboard-title">智能采购清单</h2>
          <button
            className="btn btn-primary"
            onClick={handleGeneratePurchaseList}
          >
            生成当日采购清单
          </button>
        </div>

        {purchaseList && purchaseList.items.length > 0 ? (
          <>
            <div className="purchase-list">
              {purchaseList.items.map((item, index) => (
                <div
                  key={item.name}
                  className="purchase-item"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <span className="purchase-item-name">{item.name}</span>
                  <span className="purchase-item-quantity">
                    <AnimatedNumber value={item.totalQuantity} /> {item.unit}
                  </span>
                </div>
              ))}
            </div>
            <div className="purchase-total">
              <span className="purchase-total-label">总计份数</span>
              <span className="purchase-total-value">
                <AnimatedNumber value={purchaseList.totalPortions} /> 份
              </span>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <p>
              {purchaseList
                ? '当日已确认订单暂无可汇总的食材'
                : '点击上方按钮根据已确认订单生成采购清单'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChefDashboard;
