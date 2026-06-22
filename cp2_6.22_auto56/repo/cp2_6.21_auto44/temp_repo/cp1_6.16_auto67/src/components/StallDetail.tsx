import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stall, MenuItem, CartItem, Order, OrderStatus } from '../types';

interface StallDetailProps {
  stalls: Stall[];
  menuItems: MenuItem[];
  onAddToCart: (item: CartItem) => void;
  cart: CartItem[];
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export default function StallDetail({ stalls, menuItems, onAddToCart, cart, orders, onUpdateOrderStatus }: StallDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(false);
  const [fadeOutOrders, setFadeOutOrders] = useState<Set<string>>(new Set());

  const stall = stalls.find(s => s.id === id);
  const stallMenuItems = menuItems.filter(item => item.stallId === id);
  const stallOrders = orders.filter(o => o.stallId === id);

  useEffect(() => {
    const interval = setInterval(() => {
      const preparingOrders = stallOrders.filter(o => o.status === OrderStatus.PREPARING);
      if (preparingOrders.length > 0 && Math.random() > 0.7) {
        const randomOrder = preparingOrders[Math.floor(Math.random() * preparingOrders.length)];
        onUpdateOrderStatus(randomOrder.id, OrderStatus.READY);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [stallOrders, onUpdateOrderStatus]);

  const handleItemClick = (item: MenuItem) => {
    if (item.stockStatus === '售罄') return;
    setSelectedItem(item);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    const cartItem: CartItem = {
      menuItemId: selectedItem.id,
      stallId: selectedItem.stallId,
      name: selectedItem.name,
      price: selectedItem.price,
      quantity,
      image: selectedItem.image
    };
    onAddToCart(cartItem);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setSelectedItem(null);
    }, 1000);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, Math.min(selectedItem?.stock || 10, quantity + delta));
    setQuantity(newQty);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleCompleteOrder = (orderId: string) => {
    onUpdateOrderStatus(orderId, OrderStatus.READY);
  };

  const handlePickupOrder = (orderId: string) => {
    setFadeOutOrders(prev => new Set(prev).add(orderId));
    setTimeout(() => {
      onUpdateOrderStatus(orderId, OrderStatus.PICKED_UP);
      setFadeOutOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }, 2000);
  };

  const getStockBadgeStyle = (status: string) => {
    switch (status) {
      case '充足': return { background: '#2ECC71', color: 'white' };
      case '紧张': return { background: '#F39C12', color: 'white' };
      case '售罄': return { background: '#E74C3C', color: 'white' };
      default: return { background: '#95A5A6', color: 'white' };
    }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PLACED: return { background: '#3498DB', text: '已下单' };
      case OrderStatus.PREPARING: return { background: '#E85D2C', text: '制作中' };
      case OrderStatus.READY: return { background: '#2ECC71', text: '已完成' };
      case OrderStatus.PICKED_UP: return { background: '#95A5A6', text: '已取餐' };
      default: return { background: '#95A5A6', text: status };
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (!stall) {
    return <div style={styles.notFound}>摊位不存在</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/')}>
          ← 返回
        </button>
        <div style={styles.headerInfo}>
          <h1 className="brush-font" style={styles.stallName}>{stall.name}</h1>
          <span style={{ ...styles.cuisineBadge, backgroundColor: stall.cuisineColor + '20', color: stall.cuisineColor }}>
            {stall.cuisine}
          </span>
        </div>
        <button style={styles.orderPanelButton} onClick={() => setShowOrderPanel(!showOrderPanel)}>
          📋
          {stallOrders.length > 0 && (
            <span style={styles.orderPanelBadge}>{stallOrders.length}</span>
          )}
        </button>
      </div>

      <div style={styles.content}>
        <h2 style={styles.sectionTitle}>菜单</h2>
        <div style={styles.menuGrid}>
          {stallMenuItems.map((item, index) => (
            <div
              key={item.id}
              className="stagger-item"
              style={{
                ...styles.menuCard,
                animationDelay: `${index * 0.1}s`,
                opacity: item.stockStatus === '售罄' ? 0.6 : 1
              }}
              onClick={() => handleItemClick(item)}
            >
              <div style={styles.imageContainer}>
                <img src={item.image} alt={item.name} style={styles.foodImage} />
                <div style={{ ...styles.stockBadge, ...getStockBadgeStyle(item.stockStatus) }}>
                  {item.stockStatus}
                </div>
              </div>
              <div style={styles.itemInfo}>
                <h3 style={styles.itemName}>{item.name}</h3>
                <p style={styles.itemDesc}>{item.description}</p>
                <div style={styles.itemPrice}>
                  <span style={styles.priceSymbol}>¥</span>
                  <span style={styles.priceValue}>{item.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <div style={styles.drawerOverlay} onClick={() => setSelectedItem(null)}>
          <div
            style={styles.bottomDrawer}
            className="animate-slideInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.drawerHandle}></div>
            <img src={selectedItem.image} alt={selectedItem.name} style={styles.drawerImage} />
            <div style={styles.drawerContent}>
              <div style={styles.drawerHeader}>
                <h3 style={styles.drawerItemName}>{selectedItem.name}</h3>
                <div style={{ ...styles.drawerStockBadge, ...getStockBadgeStyle(selectedItem.stockStatus) }}>
                  库存 {selectedItem.stock}
                </div>
              </div>
              <p style={styles.drawerDesc}>{selectedItem.description}</p>
              
              <div style={styles.quantitySection}>
                <span style={styles.quantityLabel}>数量</span>
                <div style={styles.quantityControl}>
                  <button
                    style={styles.quantityBtn}
                    onClick={() => handleQuantityChange(-1)}
                  >
                    −
                  </button>
                  <span style={styles.quantityValue}>{quantity}</span>
                  <button
                    style={styles.quantityBtn}
                    onClick={() => handleQuantityChange(1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={styles.drawerFooter}>
                <div style={styles.drawerPrice}>
                  <span style={styles.priceSymbol}>¥</span>
                  <span style={styles.totalPrice}>{selectedItem.price * quantity}</span>
                </div>
                <button
                  style={{
                    ...styles.addCartButton,
                    ...(addedAnimation ? styles.addedButton : {})
                  }}
                  onClick={handleAddToCart}
                  disabled={addedAnimation}
                >
                  {addedAnimation ? '✓ 已添加' : '加入购物车'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOrderPanel && (
        <div style={styles.orderPanelOverlay} onClick={() => setShowOrderPanel(false)}>
          <div
            style={styles.orderPanel}
            className="animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.orderPanelHeader}>
              <h3 style={styles.orderPanelTitle}>订单管理</h3>
              <button style={styles.closeButton} onClick={() => setShowOrderPanel(false)}>✕</button>
            </div>
            <div style={styles.orderList}>
              {stallOrders.length === 0 ? (
                <p style={styles.emptyOrders}>暂无订单</p>
              ) : (
                stallOrders.map((order, index) => (
                  <div
                    key={order.id}
                    style={{
                      ...styles.orderCard,
                      animationDelay: `${index * 0.1}s`,
                      opacity: fadeOutOrders.has(order.id) ? 0 : 1,
                      transition: 'opacity 2s ease-out'
                    }}
                    className="stagger-item"
                  >
                    <div style={styles.orderCardHeader}>
                      <span style={styles.orderNumber}>#{order.id.slice(-4)}</span>
                      <span style={{
                        ...styles.orderStatusBadge,
                        backgroundColor: getStatusStyle(order.status).background,
                        animation: order.status === OrderStatus.PREPARING ? 'pulse 2s ease-in-out infinite' : 'none'
                      }}>
                        {getStatusStyle(order.status).text}
                      </span>
                    </div>
                    <div style={styles.orderItems}>
                      {order.items.map((item, i) => (
                      <div key={i} style={styles.orderItem}>
                        <span>{item.name} × {item.quantity}</span>
                        <span>¥{item.price * item.quantity}</span>
                      </div>
                    ))}
                    </div>
                    <div style={styles.orderCardFooter}>
                      <span style={styles.orderTime}>{formatTime(order.createdAt)}</span>
                      <span style={styles.orderTotal}>¥{order.totalPrice}</span>
                    </div>
                    <div style={styles.orderActions}>
                      {order.status === OrderStatus.PREPARING && (
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleCompleteOrder(order.id)}
                        >
                          完成制作
                        </button>
                      )}
                      {order.status === OrderStatus.READY && (
                        <button
                          style={{ ...styles.actionBtn, backgroundColor: '#2ECC71' }}
                          onClick={() => handlePickupOrder(order.id)}
                        >
                          确认取餐
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFF8EE',
    paddingBottom: '80px'
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  backButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  headerInfo: {
    flex: 1,
    textAlign: 'center'
  },
  stallName: {
    fontSize: '24px',
    color: 'white',
    margin: 0
  },
  cuisineBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    marginTop: '4px'
  },
  orderPanelButton: {
    position: 'relative',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orderPanelBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    background: '#E74C3C',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: '20px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#3D2B1F',
    marginBottom: '16px'
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%'
  },
  foodImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px 12px 0 0'
  },
  stockBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'transform 0.3s ease'
  },
  itemInfo: {
    padding: '12px'
  },
  itemName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#3D2B1F',
    marginBottom: '4px'
  },
  itemDesc: {
    fontSize: '12px',
    color: '#8B7355',
    marginBottom: '8px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: 1.4
  },
  itemPrice: {
    display: 'flex',
    alignItems: 'baseline'
  },
  priceSymbol: {
    fontSize: '14px',
    color: '#E85D2C',
    fontWeight: '600'
  },
  priceValue: {
    fontSize: '20px',
    color: '#E85D2C',
    fontWeight: 'bold',
    marginLeft: '2px'
  },
  notFound: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#8B7355'
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end'
  },
  bottomDrawer: {
    width: '100%',
    maxHeight: '80vh',
    backgroundColor: '#FFF8EE',
    borderRadius: '20px 20px 0 0',
    overflow: 'hidden'
  },
  drawerHandle: {
    width: '40px',
    height: '4px',
    borderRadius: '2px',
    backgroundColor: '#DDD',
    margin: '12px auto',
    marginTop: '16px'
  },
  drawerImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  drawerContent: {
    padding: '20px'
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  drawerItemName: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#3D2B1F',
    margin: 0
  },
  drawerStockBadge: {
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  drawerDesc: {
    fontSize: '14px',
    color: '#8B7355',
    lineHeight: 1.5,
    marginBottom: '20px'
  },
  quantitySection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  quantityLabel: {
    fontSize: '16px',
    color: '#3D2B1F',
    fontWeight: '500'
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  quantityBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#F4A261',
    color: 'white',
    border: 'none',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#3D2B1F',
    minWidth: '30px',
    textAlign: 'center'
  },
  drawerFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid rgba(0,0,0,0.1)'
  },
  drawerPrice: {
    display: 'flex',
    alignItems: 'baseline'
  },
  totalPrice: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#E85D2C',
    marginLeft: '4px'
  },
  addCartButton: {
    flex: 1,
    marginLeft: '20px',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #E85D2C 0%, #F4A261 100%)',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(232, 93, 44, 0.3)'
  },
  addedButton: {
    background: '#7CB342',
    boxShadow: 'none'
  },
  orderPanelOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 150,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  orderPanel: {
    width: '100%',
    maxWidth: '400px',
    height: '100%',
    backgroundColor: '#FFF8EE',
    display: 'flex',
    flexDirection: 'column'
  },
  orderPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid rgba(0,0,0,0.1)'
  },
  orderPanelTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#3D2B1F',
    margin: 0
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.1)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#3D2B1F',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orderList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  emptyOrders: {
    textAlign: 'center',
    color: '#8B7355',
    marginTop: '40px'
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  orderCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  orderNumber: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#3D2B1F'
  },
  orderStatusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white'
  },
  orderItems: {
    marginBottom: '12px'
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#5D4E37',
    padding: '4px 0'
  },
  orderCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid rgba(0,0,0,0.05)'
  },
  orderTime: {
    fontSize: '12px',
    color: '#8B7355'
  },
  orderTotal: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#E85D2C'
  },
  orderActions: {
    marginTop: '12px',
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#E85D2C',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

// 媒体查询 - 移动端
if (typeof window !== 'undefined' && window.innerWidth < 768) {
  styles.menuGrid.gridTemplateColumns = '1fr';
}
