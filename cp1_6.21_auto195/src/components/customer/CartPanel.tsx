import React from 'react';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Props {
  cart: CartItem[];
  totalPrice: number;
  onClose: () => void;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemove: (menuItemId: string) => void;
  onCheckout: () => void;
}

const CartPanel: React.FC<Props> = ({
  cart,
  totalPrice,
  onClose,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}) => {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 200,
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '480px',
    background: '#FFFFFF',
    zIndex: 201,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInRight 0.3s ease-out',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px',
    borderBottom: '0.5px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF2F2 100%)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1F2937',
  };

  const closeBtnStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    border: '0.5px solid #E5E7EB',
  };

  const itemsContainerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 24px',
  };

  const itemCardStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: '#FDF2F8',
    borderRadius: '16px',
    border: '0.5px solid #E5E7EB',
    marginBottom: '12px',
    alignItems: 'center',
  };

  const itemImageStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    objectFit: 'cover',
    borderRadius: '12px',
    flexShrink: 0,
  };

  const itemInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const itemNameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const itemPriceStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 700,
    color: '#EF4444',
    marginBottom: '8px',
  };

  const qtyControlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const qtyBtnStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: '0.5px solid #E5E7EB',
    background: '#FFFFFF',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  };

  const qtyStyle: React.CSSProperties = {
    minWidth: '32px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1F2937',
  };

  const removeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    padding: '4px',
  };

  const footerStyle: React.CSSProperties = {
    padding: '24px',
    borderTop: '0.5px solid #E5E7EB',
    background: '#FFFFFF',
  };

  const totalRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  };

  const totalLabelStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#6B7280',
  };

  const totalValueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 800,
    color: '#EF4444',
  };

  const checkoutBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    background: '#F59E0B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const emptyCartStyle: React.CSSProperties = {
    padding: '60px 24px',
    textAlign: 'center',
    color: '#6B7280',
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>🛒 购物车 ({cart.length})</h2>
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#FECACA';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
            }}
          >
            ✕
          </button>
        </div>

        <div style={itemsContainerStyle}>
          {cart.length === 0 ? (
            <div style={emptyCartStyle}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🍽️</div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                购物车是空的
              </div>
              <div style={{ fontSize: '14px' }}>快去挑选喜欢的美食吧！</div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.menuItemId} style={itemCardStyle} className="animate-fade-in-up">
                <img
                  src={item.image}
                  alt={item.name}
                  style={itemImageStyle}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop';
                  }}
                />
                <div style={itemInfoStyle}>
                  <div style={itemNameStyle}>{item.name}</div>
                  <div style={itemPriceStyle}>¥{item.price.toFixed(2)}</div>
                  <div style={qtyControlsStyle}>
                    <button
                      style={qtyBtnStyle}
                      onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#FEF3C7';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                      }}
                    >
                      −
                    </button>
                    <span style={qtyStyle}>{item.quantity}</span>
                    <button
                      style={qtyBtnStyle}
                      onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#FEF3C7';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                      }}
                    >
                      +
                    </button>
                    <button
                      style={removeBtnStyle}
                      onClick={() => onRemove(item.menuItemId)}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={footerStyle}>
            <div style={totalRowStyle}>
              <span style={totalLabelStyle}>合计金额</span>
              <span style={totalValueStyle}>¥{totalPrice.toFixed(2)}</span>
            </div>
            <button
              style={checkoutBtnStyle}
              onClick={onCheckout}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#D97706';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F59E0B';
              }}
            >
              <span>📋</span>
              <span>提交预订订单</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPanel;
