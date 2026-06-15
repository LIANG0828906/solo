import { useState, useEffect } from 'react';
import { Booking, BookingItem } from '../../types';
import { useMenuStore } from '../store/menuStore';
import { createBooking } from '../api/menuApi';

interface BookingPageProps {
  onGoToMenu: () => void;
}

const TIME_SLOTS = [
  '11:30', '12:00', '12:30', '13:00', '13:30',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

const FULL_SLOTS = ['12:00', '19:00'];

function CircularProgress({ value }: { value: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="circular-progress">
      <svg width="120" height="120">
        <circle className="progress-bg" cx="60" cy="60" r={radius} />
        <circle
          className="progress-fill-circle"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-text">{value}%</div>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <div className="success-modal">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="success-title">预订成功！</h2>
          <p className="success-message">
            我们已收到您的预订请求，请耐心等待厨师确认。
          </p>
          <button className="btn btn-primary" onClick={onClose}>
            好的
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingPage({ onGoToMenu }: BookingPageProps) {
  const selectedItems = useMenuStore((state) => state.selectedBookingItems);
  const menuItems = useMenuStore((state) => state.menuItems);
  const removeBookingItem = useMenuStore((state) => state.removeBookingItem);
  const updateBookingItemQuantity = useMenuStore(
    (state) => state.updateBookingItemQuantity
  );
  const clearBookingItems = useMenuStore((state) => state.clearBookingItems);
  const addBooking = useMenuStore((state) => state.addBooking);
  const updateMenuItem = useMenuStore((state) => state.updateMenuItem);
  const setError = useMenuStore((state) => state.setError);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const getMenuItemPrice = (menuItemId: string) => {
    return menuItems.find((m) => m.id === menuItemId)?.price || 0;
  };

  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + getMenuItemPrice(item.menuItemId) * item.quantity,
    0
  );

  const canSubmit =
    selectedItems.length > 0 &&
    date &&
    timeSlot &&
    guestCount > 0 &&
    customerName.trim() &&
    phone.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setProgress(0);
    setSubmitError('');

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        return p + 5;
      });
    }, 40);

    try {
      const booking: Omit<Booking, 'id' | 'status' | 'createdAt'> = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        date,
        timeSlot,
        guestCount,
        items: selectedItems as BookingItem[],
      };

      const newBooking = await createBooking(booking);

      clearInterval(timer);
      setProgress(100);

      addBooking(newBooking);
      newBooking.items.forEach((bi) => {
        const menuItem = menuItems.find((m) => m.id === bi.menuItemId);
        if (menuItem) {
          updateMenuItem(bi.menuItemId, {
            remaining: menuItem.remaining - bi.quantity,
          });
        }
      });

      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(true);
        clearBookingItems();
      }, 500);
    } catch (err: any) {
      clearInterval(timer);
      setProgress(0);
      setIsSubmitting(false);
      setSubmitError(err.response?.data?.error || err.message || '提交失败');
      setError(err.message);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCustomerName('');
    setPhone('');
    setTimeSlot('');
    onGoToMenu();
  };

  if (selectedItems.length === 0 && !isSubmitting && !showSuccess) {
    return (
      <div className="booking-page">
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <h3 style={{ marginBottom: 8 }}>还没有选择菜品</h3>
          <p style={{ marginBottom: 24 }}>请先从菜单中选择您喜欢的菜品</p>
          <button className="btn btn-primary" onClick={onGoToMenu}>
            浏览菜单
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-header">
        <h1>确认预订</h1>
        <p>请填写以下信息完成预订</p>
      </div>

      <div className="booking-section">
        <h3 className="booking-section-title">已选菜品</h3>
        <div className="selected-items-list">
          {selectedItems.map((item) => (
            <div key={item.menuItemId} className="selected-item">
              <div className="selected-item-info">
                <span className="selected-item-name">{item.menuItemName}</span>
                {item.selectedToppings.length > 0 && (
                  <span className="selected-item-toppings">
                    {item.selectedToppings.join('、')}
                  </span>
                )}
              </div>
              <div className="selected-item-right">
                <div className="quantity-control" style={{ gap: 8 }}>
                  <button
                    className="quantity-btn"
                    style={{ width: 30, height: 30, fontSize: 14 }}
                    onClick={() =>
                      updateBookingItemQuantity(
                        item.menuItemId,
                        Math.max(1, item.quantity - 1)
                      )
                    }
                  >
                    −
                  </button>
                  <span className="quantity-value" style={{ fontSize: 16, minWidth: 24 }}>
                    {item.quantity}
                  </span>
                  <button
                    className="quantity-btn"
                    style={{ width: 30, height: 30, fontSize: 14 }}
                    onClick={() =>
                      updateBookingItemQuantity(
                        item.menuItemId,
                        item.quantity + 1
                      )
                    }
                  >
                    +
                  </button>
                </div>
                <span className="selected-item-price">
                  ¥{getMenuItemPrice(item.menuItemId) * item.quantity}
                </span>
                <button
                  className="remove-item-btn"
                  onClick={() => removeBookingItem(item.menuItemId)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="booking-total">
          <span className="booking-total-label">合计</span>
          <span className="booking-total-value">¥{totalPrice}</span>
        </div>
      </div>

      <div className="booking-section">
        <h3 className="booking-section-title">就餐信息</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">就餐日期</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="form-group">
            <label className="form-label">就餐人数</label>
            <div className="guest-selector">
              <button
                className="quantity-btn"
                onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
              >
                −
              </button>
              <span className="quantity-value">{guestCount} 人</span>
              <button
                className="quantity-btn"
                onClick={() => setGuestCount((c) => c + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">选择时间</label>
          <div className="timeline-container">
            {TIME_SLOTS.map((slot) => {
              const isFull = FULL_SLOTS.includes(slot);
              const isSelected = timeSlot === slot;
              return (
                <button
                  key={slot}
                  className={`timeline-slot ${
                    isSelected ? 'selected' : isFull ? '' : 'available'
                  }`}
                  disabled={isFull}
                  onClick={() => !isFull && setTimeSlot(slot)}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="booking-section">
        <h3 className="booking-section-title">联系信息</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">姓名</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入您的姓名"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">电话</label>
            <input
              type="tel"
              className="form-input"
              placeholder="请输入联系电话"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {submitError && (
        <div
          style={{
            padding: 16,
            background: 'rgba(214, 69, 69, 0.1)',
            color: 'var(--color-red)',
            borderRadius: 10,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          {submitError}
        </div>
      )}

      <button
        className="btn btn-primary booking-submit"
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        style={{ opacity: canSubmit && !isSubmitting ? 1 : 0.5 }}
      >
        提交预订
      </button>

      {isSubmitting && (
        <div className="loading-overlay">
          <CircularProgress value={progress} />
        </div>
      )}

      {showSuccess && <SuccessModal onClose={handleSuccessClose} />}
    </div>
  );
}

export default BookingPage;
