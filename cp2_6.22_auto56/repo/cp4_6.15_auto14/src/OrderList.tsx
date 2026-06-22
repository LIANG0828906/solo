import { useState, memo, useRef, useCallback, useEffect, useMemo } from 'react';
import type { CommunityGroup } from './types';
import './styles/OrderList.css';

interface OrderListProps {
  groups: CommunityGroup[];
  onSendNotification: (community: string) => void;
}

interface GroupRowProps {
  group: CommunityGroup;
  expanded: boolean;
  onToggleExpand: () => void;
  onSendNotification: (community: string) => void;
}

const ITEM_HEIGHT = 36;
const BUFFER_COUNT = 5;
const GROUP_COLLAPSED_HEIGHT = 52;
const CUSTOMER_SCROLL_HEIGHT = 180;
const PRODUCT_ROW_HEIGHT = 44;
const DETAIL_HEADER_HEIGHT = 36;
const GROUP_GAP = 12;

const CustomerVirtualList = memo(function CustomerVirtualList({
  customers,
}: {
  customers: { customerName: string; phone: string; quantity: number }[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(CUSTOMER_SCROLL_HEIGHT);

  useEffect(() => {
    if (scrollRef.current) {
      setViewportHeight(scrollRef.current.clientHeight || CUSTOMER_SCROLL_HEIGHT);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  const totalHeight = customers.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_COUNT);
  const endIndex = Math.min(
    customers.length - 1,
    Math.ceil((scrollTop + viewportHeight) / ITEM_HEIGHT) + BUFFER_COUNT
  );

  const visibleItems = useMemo(() => {
    return customers.slice(startIndex, endIndex + 1);
  }, [customers, startIndex, endIndex]);

  return (
    <div ref={scrollRef} className="customer-virtual-scroll" onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((customer, i) => {
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
});

const GroupRow = memo(function GroupRow({
  group,
  expanded,
  onToggleExpand,
  onSendNotification,
}: GroupRowProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const totalQuantity = group.products.reduce((sum, p) => sum + p.totalQuantity, 0);

  const toggleProduct = useCallback((productName: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productName)) {
        next.delete(productName);
      } else {
        next.add(productName);
      }
      return next;
    });
  }, []);

  const handleNotify = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSendNotification(group.community);
  };

  return (
    <div className="community-group">
      <div className="group-header" onClick={onToggleExpand}>
        <span className={`arrow ${expanded ? 'arrow-up' : ''}`}>▶</span>
        <span className="community-name">{group.community}</span>
        <span className="group-summary">
          {group.products.length} 种商品 · {totalQuantity} 份 · {group.orders.length} 单
        </span>
        <button className="notify-btn" onClick={handleNotify}>
          到货通知
        </button>
      </div>

      <div className={`group-content-grid ${expanded ? 'group-expanded' : ''}`}>
        <div className="group-content-inner">
          {group.products.map((product) => {
            const isProductExpanded = expandedProducts.has(product.productName);
            return (
              <div key={product.productName} className="product-section">
                <div className="product-row" onClick={() => toggleProduct(product.productName)}>
                  <span className={`arrow small ${isProductExpanded ? 'arrow-up' : ''}`}>▶</span>
                  <span className="product-name">{product.productName}</span>
                  <span className="product-quantity">{product.totalQuantity} 份</span>
                </div>
                <div
                  className={`product-detail-grid ${isProductExpanded ? 'product-expanded' : ''}`}
                >
                  <div className="product-detail-inner">
                    <div className="detail-header">
                      <span className="detail-header-cell">客户姓名</span>
                      <span className="detail-header-cell">手机号</span>
                      <span className="detail-header-cell detail-header-right">数量</span>
                    </div>
                    {isProductExpanded && (
                      <CustomerVirtualList customers={product.customers} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

interface VirtualListItem {
  group: CommunityGroup;
  offsetTop: number;
  height: number;
}

function OrderList({ groups, onSendNotification }: OrderListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);
  const [expandedCommunities, setExpandedCommunities] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    setContainerHeight(el.clientHeight || 500);
    const ro = new ResizeObserver(() => {
      setContainerHeight(el.clientHeight || 500);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, []);

  const toggleExpand = useCallback((community: string) => {
    setExpandedCommunities((prev) => {
      const next = new Set(prev);
      if (next.has(community)) {
        next.delete(community);
      } else {
        next.add(community);
      }
      return next;
    });
  }, []);

  const virtualList = useMemo<VirtualListItem[]>(() => {
    let offset = 0;
    const result: VirtualListItem[] = [];
    for (const group of groups) {
      const isExpanded = expandedCommunities.has(group.community);
      let height = GROUP_COLLAPSED_HEIGHT;
      if (isExpanded) {
        const productRows = group.products.length * PRODUCT_ROW_HEIGHT;
        const productDetails = group.products.reduce((acc, p) => {
          const detailH = Math.min(p.customers.length * ITEM_HEIGHT, CUSTOMER_SCROLL_HEIGHT) + DETAIL_HEADER_HEIGHT;
          return acc + detailH;
        }, 0);
        height = GROUP_COLLAPSED_HEIGHT + productRows + productDetails;
      }
      result.push({ group, offsetTop: offset, height });
      offset += height + GROUP_GAP;
    }
    return result;
  }, [groups, expandedCommunities]);

  const totalHeight = useMemo(() => {
    if (virtualList.length === 0) return 0;
    const last = virtualList[virtualList.length - 1];
    return last.offsetTop + last.height;
  }, [virtualList]);

  const startIndex = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < virtualList.length; i++) {
      const item = virtualList[i];
      if (item.offsetTop + item.height >= scrollTop) {
        idx = Math.max(0, i - BUFFER_COUNT);
        break;
      }
      idx = i;
    }
    return idx;
  }, [virtualList, scrollTop]);

  const endIndex = useMemo(() => {
    let idx = virtualList.length - 1;
    for (let i = startIndex; i < virtualList.length; i++) {
      const item = virtualList[i];
      if (item.offsetTop > scrollTop + containerHeight) {
        idx = Math.min(virtualList.length - 1, i + BUFFER_COUNT);
        break;
      }
      idx = i;
    }
    return idx;
  }, [virtualList, startIndex, scrollTop, containerHeight]);

  const visibleItems = useMemo(() => {
    return virtualList.slice(startIndex, endIndex + 1);
  }, [virtualList, startIndex, endIndex]);

  return (
    <div className="order-list-card">
      <h2 className="list-title">分拣统计</h2>
      {groups.length === 0 ? (
        <div className="empty-state">
          <p>暂无订单数据</p>
          <p className="empty-hint">请在左侧录入新订单</p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="groups-scroll-container"
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative', width: '100%' }}>
            {visibleItems.map((item) => (
              <div
                key={item.group.community}
                className="virtual-list-item"
                style={{
                  position: 'absolute',
                  top: item.offsetTop,
                  left: 0,
                  right: 0,
                }}
              >
                <GroupRow
                  group={item.group}
                  expanded={expandedCommunities.has(item.group.community)}
                  onToggleExpand={() => toggleExpand(item.group.community)}
                  onSendNotification={onSendNotification}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(OrderList);
