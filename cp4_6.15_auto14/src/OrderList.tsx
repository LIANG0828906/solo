import { useState, memo } from 'react';
import type { CommunityGroup } from './types';
import './styles/OrderList.css';

interface OrderListProps {
  groups: CommunityGroup[];
  onSendNotification: (community: string) => void;
}

interface GroupRowProps {
  group: CommunityGroup;
  onSendNotification: (community: string) => void;
}

const GroupRow = memo(function GroupRow({ group, onSendNotification }: GroupRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const totalQuantity = group.products.reduce((sum, p) => sum + p.totalQuantity, 0);

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  const toggleProduct = (productName: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productName)) {
        next.delete(productName);
      } else {
        next.add(productName);
      }
      return next;
    });
  };

  const handleNotify = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSendNotification(group.community);
  };

  return (
    <div className="community-group">
      <div className="group-header" onClick={toggleExpand}>
        <span className={`arrow ${expanded ? 'arrow-up' : ''}`}>▶</span>
        <span className="community-name">{group.community}</span>
        <span className="group-summary">
          {group.products.length} 种商品 · {totalQuantity} 份 · {group.orders.length} 单
        </span>
        <button className="notify-btn" onClick={handleNotify}>
          到货通知
        </button>
      </div>

      <div
        className="group-content"
        style={{
          maxHeight: expanded ? '2000px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>商品名称</th>
                <th style={{ width: '120px', textAlign: 'right' }}>总份数</th>
              </tr>
            </thead>
            <tbody>
              {group.products.map((product) => {
                const isProductExpanded = expandedProducts.has(product.productName);
                return (
                  <>
                    <tr
                      key={product.productName}
                      className="product-row"
                      onClick={() => toggleProduct(product.productName)}
                    >
                      <td>
                        <span className={`arrow small ${isProductExpanded ? 'arrow-up' : ''}`}>
                          ▶
                        </span>
                      </td>
                      <td>{product.productName}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {product.totalQuantity} 份
                      </td>
                    </tr>
                    <tr
                      key={`${product.productName}-detail`}
                      className="product-detail-row"
                      style={{
                        maxHeight: isProductExpanded ? '500px' : '0px',
                        opacity: isProductExpanded ? 1 : 0,
                      }}
                    >
                      <td colSpan={3}>
                        <div
                          className="product-detail-content"
                          style={{
                            maxHeight: isProductExpanded ? '500px' : '0px',
                            padding: isProductExpanded ? '12px 16px 16px 40px' : '0 16px 0 40px',
                          }}
                        >
                          <table className="customers-table">
                            <thead>
                              <tr>
                                <th>客户姓名</th>
                                <th>手机号</th>
                                <th style={{ textAlign: 'right' }}>数量</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.customers.map((customer, idx) => (
                                <tr key={idx}>
                                  <td>{customer.customerName}</td>
                                  <td>{customer.phone}</td>
                                  <td style={{ textAlign: 'right' }}>{customer.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

function OrderList({ groups, onSendNotification }: OrderListProps) {
  return (
    <div className="order-list-card">
      <h2 className="list-title">分拣统计</h2>
      {groups.length === 0 ? (
        <div className="empty-state">
          <p>暂无订单数据</p>
          <p className="empty-hint">请在左侧录入新订单</p>
        </div>
      ) : (
        <div className="groups-container">
          {groups.map((group) => (
            <GroupRow
              key={group.community}
              group={group}
              onSendNotification={onSendNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(OrderList);
