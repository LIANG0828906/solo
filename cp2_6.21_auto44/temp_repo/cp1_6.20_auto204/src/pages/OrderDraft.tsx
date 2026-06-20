import { useState, useEffect } from 'react';
import type { RestockSuggestion } from '../api';
import { api } from '../api';
import { createRipple } from '../utils/ripple';

interface OrderDraftProps {
  initialItems: RestockSuggestion[];
  onBack: () => void;
}

function OrderDraft({ initialItems, onBack }: OrderDraftProps) {
  const [items, setItems] = useState<RestockSuggestion[]>(
    initialItems.map((item) => ({
      ...item,
      quantity: item.suggestedQuantity,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(1, quantity),
              subtotal: Math.max(1, quantity) * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity || item.suggestedQuantity) * item.unitPrice,
    0
  );

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    if (items.length === 0) return;
    setLoading(true);
    try {
      const submitItems = items.map((item) => ({
        ...item,
        quantity: item.quantity || item.suggestedQuantity,
      }));
      const result = await api.submitOrder(submitItems);
      if (result.success) {
        alert(`订单生成成功！订单号：${result.orderId}`);
        onBack();
      }
    } catch (error) {
      console.error('提交订单失败:', error);
      alert('提交订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#141414',
    padding: '24px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  };

  const backBtnStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    border: '1px solid #3a3a3a',
    backgroundColor: 'transparent',
    color: '#e0e0e0',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#e0e0e0',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1f1f1f',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '24px',
  };

  const cardHeaderStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid #2a2a2a',
    fontSize: '16px',
    fontWeight: 600,
    color: '#e0e0e0',
  };

  const tableWrapperStyle: React.CSSProperties = {
    overflowX: 'auto',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#a0a0a0',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 20px',
    fontSize: '14px',
    borderBottom: '1px solid #2a2a2a',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  };

  const quantityInputStyle: React.CSSProperties = {
    width: '80px',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #3a3a3a',
    backgroundColor: '#1a1a1a',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    textAlign: 'center',
  };

  const removeBtnStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #3a3a3a',
    backgroundColor: 'transparent',
    color: '#f5222d',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  const summaryContainerStyle: React.CSSProperties = {
    backgroundColor: '#1f1f1f',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  };

  const summaryRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '14px',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  };

  const mobileCardStyle: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  };

  const mobileRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    fontSize: '13px',
  };

  if (items.length === 0) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <button
            className="btn"
            style={backBtnStyle}
            onClick={(e) => {
              createRipple(e);
              onBack();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2a2a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ←
          </button>
          <h1 style={titleStyle}>采购订单草稿</h1>
        </div>
        <div
          style={{
            backgroundColor: '#1f1f1f',
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#a0a0a0',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>
            订单草稿为空
          </div>
          <div style={{ fontSize: '13px', marginBottom: '24px' }}>
            请从控制台选择商品生成补货单
          </div>
          <button
            className="btn btn-primary"
            onClick={(e) => {
              createRipple(e);
              onBack();
            }}
          >
            返回控制台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <button
          className="btn"
          style={backBtnStyle}
          onClick={(e) => {
            createRipple(e);
            onBack();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2a2a2a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ←
        </button>
        <h1 style={titleStyle}>采购订单草稿</h1>
      </div>

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>商品清单（共 {items.length} 项）</div>
        {isMobile ? (
          <div style={{ padding: '16px' }}>
            {items.map((item) => (
              <div key={item.productId} style={mobileCardStyle}>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#e0e0e0',
                    marginBottom: '12px',
                  }}
                >
                  {item.product.name}
                </div>
                <div style={mobileRowStyle}>
                  <span style={{ color: '#a0a0a0' }}>商品编号</span>
                  <span>{item.product.sku}</span>
                </div>
                <div style={mobileRowStyle}>
                  <span style={{ color: '#a0a0a0' }}>当前库存</span>
                  <span>{item.currentStock}</span>
                </div>
                <div style={mobileRowStyle}>
                  <span style={{ color: '#a0a0a0' }}>建议补货</span>
                  <span>{item.suggestedQuantity}</span>
                </div>
                <div style={mobileRowStyle}>
                  <span style={{ color: '#a0a0a0' }}>单价</span>
                  <span>¥{item.unitPrice.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    ...mobileRowStyle,
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #2a2a2a',
                  }}
                >
                  <span style={{ color: '#a0a0a0' }}>采购数量</span>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || item.suggestedQuantity}
                    onChange={(e) =>
                      updateQuantity(
                        item.productId,
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    style={quantityInputStyle}
                  />
                </div>
                <div
                  style={{
                    ...mobileRowStyle,
                    fontWeight: 600,
                    color: '#52c41a',
                  }}
                >
                  <span>小计</span>
                  <span>
                    ¥
                    {(
                      (item.quantity || item.suggestedQuantity) * item.unitPrice
                    ).toFixed(2)}
                  </span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <button
                    className="btn"
                    style={removeBtnStyle}
                    onClick={(e) => {
                      createRipple(e);
                      removeItem(item.productId);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'rgba(245, 34, 45, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>商品名称</th>
                  <th style={thStyle}>商品编号</th>
                  <th style={thStyle}>当前库存</th>
                  <th style={thStyle}>建议数量</th>
                  <th style={thStyle}>采购数量</th>
                  <th style={thStyle}>单价</th>
                  <th style={thStyle}>小计</th>
                  <th style={thStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500 }}>{item.product.name}</span>
                    </td>
                    <td style={tdStyle}>{item.product.sku}</td>
                    <td style={tdStyle}>{item.currentStock}</td>
                    <td style={tdStyle}>
                      <span style={{ color: '#1890ff' }}>
                        {item.suggestedQuantity}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || item.suggestedQuantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.productId,
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        style={quantityInputStyle}
                      />
                    </td>
                    <td style={tdStyle}>¥{item.unitPrice.toFixed(2)}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#52c41a',
                        }}
                      >
                        ¥
                        {(
                          (item.quantity || item.suggestedQuantity) *
                          item.unitPrice
                        ).toFixed(2)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        className="btn"
                        style={removeBtnStyle}
                        onClick={(e) => {
                          createRipple(e);
                          removeItem(item.productId);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            'rgba(245, 34, 45, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={summaryContainerStyle}>
        <div style={summaryRowStyle}>
          <span style={{ color: '#a0a0a0' }}>商品项数</span>
          <span>{items.length} 项</span>
        </div>
        <div style={summaryRowStyle}>
          <span style={{ color: '#a0a0a0' }}>商品总数</span>
          <span>
            {items.reduce(
              (sum, item) => sum + (item.quantity || item.suggestedQuantity),
              0
            )}{' '}
            件
          </span>
        </div>
        <div
          style={{
            ...summaryRowStyle,
            marginTop: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #2a2a2a',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#e0e0e0' }}>
            订单总金额
          </span>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#52c41a',
            }}
          >
            ¥{totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div style={footerStyle}>
        <button
          className="btn btn-secondary"
          style={{ padding: '12px 24px', fontSize: '15px' }}
          onClick={(e) => {
            createRipple(e);
            onBack();
          }}
        >
          取消
        </button>
        <button
          className="btn btn-success"
          style={{ padding: '12px 32px', fontSize: '15px' }}
          onClick={handleSubmit}
          disabled={loading || items.length === 0}
        >
          {loading ? '提交中...' : '确认生成订单'}
        </button>
      </div>
    </div>
  );
}

export default OrderDraft;
