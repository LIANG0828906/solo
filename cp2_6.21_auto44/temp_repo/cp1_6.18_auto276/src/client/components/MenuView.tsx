import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface Seat {
  id: number;
  isBooked: boolean;
  customerName?: string;
}

interface OrderSeat {
  id: number;
  label: string;
}

function MenuView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [flashingItemId, setFlashingItemId] = useState<number | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMenu();
    fetchSeats();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get('/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('获取菜单数据失败:', error);
    }
  };

  const fetchSeats = async () => {
    try {
      const response = await axios.get('/api/seatings');
      setSeats(response.data);
    } catch (error) {
      console.error('获取座位数据失败:', error);
    }
  };

  const availableSeats: OrderSeat[] = seats
    .filter((seat) => seat.isBooked)
    .map((seat) => ({
      id: seat.id,
      label: `座位 ${seat.id} - ${seat.customerName}`
    }));

  const handleOrderClick = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedSeatId('');
    setQuantity(1);
    setOrderSuccess(null);
    setShowOrderModal(true);
  };

  const handleSubmitOrder = async () => {
    if (!selectedItem || selectedSeatId === '') return;

    setLoading(true);
    try {
      const response = await axios.post('/api/orders', {
        seatId: selectedSeatId,
        items: [
          {
            menuItemId: selectedItem.id,
            quantity: quantity
          }
        ]
      });

      setShowOrderModal(false);
      setFlashingItemId(selectedItem.id);

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = setTimeout(() => {
        setFlashingItemId(null);
      }, 600);

      setOrderSuccess(`下单成功！订单号：${response.data.orderId}`);

      setTimeout(() => {
        setOrderSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('下单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return `¥${price.toFixed(0)}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>今日菜单</h2>
      <p style={styles.subtitle}>精选美食，新鲜出炉</p>

      {orderSuccess && (
        <div style={styles.successToast}>
          {orderSuccess}
        </div>
      )}

      <div style={styles.menuGrid}>
        {menuItems.map((item) => (
          <div
            key={item.id}
            style={{
              ...styles.menuCard,
              ...(flashingItemId === item.id ? styles.menuCardFlash : {})
            }}
            className={flashingItemId === item.id ? 'flash-green' : ''}
          >
            <div style={styles.cardCategory}>{item.category}</div>
            <h3 style={styles.cardTitle}>{item.name}</h3>
            <p style={styles.cardDescription}>{item.description}</p>
            <div style={styles.cardFooter}>
              <span style={styles.cardPrice}>{formatPrice(item.price)}</span>
              <button
                style={styles.orderButton}
                onClick={() => handleOrderClick(item)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#D35400';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E67E22';
                }}
              >
                下单
              </button>
            </div>
          </div>
        ))}
      </div>

      {showOrderModal && selectedItem && (
        <div style={styles.modalOverlay} onClick={() => setShowOrderModal(false)}>
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>确认下单</h3>

            <div style={styles.orderItemInfo}>
              <div style={styles.orderItemName}>{selectedItem.name}</div>
              <div style={styles.orderItemPrice}>
                {formatPrice(selectedItem.price)} / 份
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>选择座位</label>
              <select
                style={styles.select}
                value={selectedSeatId}
                onChange={(e) => setSelectedSeatId(e.target.value ? parseInt(e.target.value) : '')}
              >
                <option value="">请选择已预订的座位</option>
                {availableSeats.map((seat) => (
                  <option key={seat.id} value={seat.id}>
                    {seat.label}
                  </option>
                ))}
              </select>
              {availableSeats.length === 0 && (
                <span style={styles.hintText}>暂无已预订座位，请先预订座位</span>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>数量</label>
              <select
                style={styles.select}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} 份
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.totalPrice}>
              <span>合计：</span>
              <span style={styles.totalPriceValue}>
                {formatPrice(selectedItem.price * quantity)}
              </span>
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowOrderModal(false)}
                disabled={loading}
              >
                取消
              </button>
              <button
                style={{
                  ...styles.confirmButton,
                  ...(selectedSeatId === '' || availableSeats.length === 0
                    ? styles.confirmButtonDisabled
                    : {})
                }}
                onClick={handleSubmitOrder}
                disabled={loading || selectedSeatId === '' || availableSeats.length === 0}
              >
                {loading ? '提交中...' : '确认下单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0 20px'
  },
  title: {
    fontSize: '24px',
    marginBottom: '8px',
    color: '#ECF0F1',
    textAlign: 'center' as const
  },
  subtitle: {
    fontSize: '14px',
    color: '#BDC3C7',
    marginBottom: '24px',
    textAlign: 'center' as const
  },
  successToast: {
    position: 'fixed' as const,
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#2ECC71',
    color: '#FFFFFF',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  menuCard: {
    backgroundColor: '#FDF2E9',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'box-shadow 0.3s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'default'
  },
  menuCardFlash: {
    backgroundColor: '#2ECC71'
  },
  cardCategory: {
    fontSize: '12px',
    color: '#E67E22',
    marginBottom: '8px',
    fontWeight: '500' as const
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#2C3E50',
    marginBottom: '8px'
  },
  cardDescription: {
    fontSize: '14px',
    color: '#7F8C8D',
    marginBottom: '16px',
    flex: 1,
    lineHeight: '1.5'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto'
  },
  cardPrice: {
    fontSize: '18px',
    fontStyle: 'italic' as const,
    color: '#E74C3C',
    fontWeight: 'bold' as const
  },
  orderButton: {
    padding: '8px 16px',
    fontSize: '13px',
    backgroundColor: '#E67E22',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s ease'
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: '32px',
    width: '90%',
    maxWidth: '400px',
    color: '#2C3E50'
  },
  modalTitle: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#2C3E50',
    textAlign: 'center' as const
  },
  orderItemInfo: {
    backgroundColor: '#FDF2E9',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px'
  },
  orderItemName: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: '#2C3E50',
    marginBottom: '4px'
  },
  orderItemPrice: {
    fontSize: '14px',
    color: '#E74C3C',
    fontStyle: 'italic' as const
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    marginBottom: '6px',
    color: '#2C3E50',
    fontWeight: '500' as const
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #BDC3C7',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer'
  },
  hintText: {
    display: 'block',
    fontSize: '12px',
    color: '#E67E22',
    marginTop: '4px'
  },
  totalPrice: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderTop: '1px solid #ECF0F1',
    fontSize: '16px',
    color: '#2C3E50',
    fontWeight: '500' as const
  },
  totalPriceValue: {
    fontSize: '20px',
    fontStyle: 'italic' as const,
    color: '#E74C3C',
    fontWeight: 'bold' as const
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    borderRadius: '8px',
    backgroundColor: '#ECF0F1',
    color: '#2C3E50',
    transition: 'background-color 0.2s ease'
  },
  confirmButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    borderRadius: '8px',
    backgroundColor: '#E67E22',
    color: '#FFFFFF',
    fontWeight: 'bold' as const,
    transition: 'background-color 0.2s ease'
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDC3C7',
    cursor: 'not-allowed'
  }
};

export default MenuView;
