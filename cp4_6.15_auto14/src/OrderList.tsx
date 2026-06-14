import { useState, memo, useRef, useCallback, useEffect } from 'react';
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

const ITEM_HEIGHT = 36;
const BUFFER_COUNT = 5;

function CustomerVirtualList({ customers }: { customers: { customerName: string; phone: string; quantity: number }[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  const totalHeight = customers.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_COUNT);
  const endIndex = Math.min(customers.length - 1, Math.ceil((scrollTop + (scrollRef.current?.clientHeight || 200)) / ITEM_HEIGHT) + BUFFER_COUNT);

  return (
    <div
      ref={scrollRef}
      className="customer-virtual-scroll"
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {customers.slice(startIndex, endIndex + 1).map((customer, i) => {
          const idx = startIndex + i;
          return (
            <div
              key={idx}
              className="customer-row"
              style={{
                position: 'absolute',
                top: idx * ITEM_HEIGHT,
                height: ITEM_HEIGHT,
                left: 0,
                right: 0,
              }}
            >
              <span className="customer-cell">{customer.customerName}</span>
              <span className="customer-cell">{customer.phone}</span>
              <span className="customer-cell customer-cell-right">{customer.quantity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const GroupRow = memo(function GroupRow({ group, onSendNotification }: GroupRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const totalQuantity = group.products.reduce((sum, p) => sum + p.totalQuantity, 0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, expandedProducts, group]);

  const toggleExpand = () => {
    if (!expanded && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
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
          maxHeight: expanded ? `${contentHeight}px` : '0px',
        }}
      >
        <div ref={contentRef} className="group-content-inner">
          {group.products.map((product) => {
            const isProductExpanded = expandedProducts.has(product.productName);
            return (
              <div key={product.productName} className="product-section">
                <div
                  className="product-row"
                  onClick={() => toggleProduct(product.productName)}
                >
                  <span className={`arrow small ${isProductExpanded ? 'arrow-up' : ''}`}>
                    ▶
                  </span>
                  <span className="product-name">{product.productName}</span>
                  <span className="product-quantity">
                    {product.totalQuantity} 份
                  </span>
                </div>
                <div
                  className="product-detail"
                  style={{
                    maxHeight: isProductExpanded ? `${product.customers.length * ITEM_HEIGHT + 40}px` : '0px',
                  }}
                >
                  <div className="detail-header">
                    <span className="detail-header-cell">客户姓名</span>
                    <span className="detail-header-cell">手机号</span>
                    <span className="detail-header-cell detail-header-right">数量</span>
                  </div>
                  <CustomerVirtualList customers={product.customers} />
                </div>
              </div>
            );
          })}
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
        <div className="groups-scroll-container">
          <div className="groups-container">
            {groups.map((group) => (
              <GroupRow
                key={group.community}
                group={group}
                onSendNotification={onSendNotification}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(OrderList);
