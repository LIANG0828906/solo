import { useState, useEffect } from 'react';
import type { Order, Fabric } from '../types';
import { updateOrderStatus } from '../orderManager';
import { fetchFabrics } from '../fabricInventory';

interface OrderCardProps {
  order: Order;
  onStatusChange?: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  '设计中': '#5B8DEF',
  '生产中': '#F5A623',
  '已完成': '#B0B0B0',
};

const statusList = ['设计中', '生产中', '已完成'] as const;

const colorMap: Record<string, string> = {
  '白色': '#FFFFFF',
  '黑色': '#2C3E50',
  '红色': '#E74C3C',
  '蓝色': '#3498DB',
  '绿色': '#27AE60',
  '黄色': '#F1C40F',
  '灰色': '#95A5A6',
  '粉色': '#FFB6C1',
  '紫色': '#9B59B6',
  '棕色': '#8B4513',
  '米色': '#F5F5DC',
  '卡其色': '#C3B091',
};

export default function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);

  useEffect(() => {
    const loadFabrics = async () => {
      try {
        const data = await fetchFabrics();
        setFabrics(data);
      } catch (error) {
        console.error('Failed to load fabrics:', error);
      }
    };
    loadFabrics();
  }, []);

  const getFabricName = (fabricId: string) => {
    const fabric = fabrics.find((f) => f.id === fabricId);
    return fabric ? fabric.name : '未知面料';
  };

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (newStatus === order.status) return;
    setIsUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, newStatus);
      onStatusChange?.(updated);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      style={{
        ...cardStyle,
        ...(isExpanded ? expandedCardStyle : {}),
      }}
      onClick={() => !isUpdating && setIsExpanded(!isExpanded)}
    >
      <div style={{ ...topBarStyle, backgroundColor: statusColors[order.status] }} />
      <div style={cardContentStyle}>
        <div style={headerStyle}>
          <div>
            <div style={orderIdStyle}>订单 #{order.id.slice(0, 8)}</div>
            <div style={customerStyle}>{order.customerName}</div>
          </div>
          <div
            style={{
              ...statusBadgeStyle,
              backgroundColor: statusColors[order.status] + '20',
              color: statusColors[order.status],
            }}
          >
            {order.status}
          </div>
        </div>

        <div style={dateStyle}>
          创建于 {new Date(order.createdAt).toLocaleDateString('zh-CN')}
        </div>

        {isExpanded && (
          <div style={detailsStyle} onClick={(e) => e.stopPropagation()}>
            <div style={detailSectionStyle}>
              <div style={detailTitleStyle}>客户信息</div>
              <div style={detailTextStyle}>{order.customerName}</div>
            </div>

            <div style={detailSectionStyle}>
              <div style={detailTitleStyle}>设计草图</div>
              {order.sketchUrl ? (
                <img
                  src={order.sketchUrl}
                  alt="设计草图"
                  style={sketchImageStyle}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                  }}
                />
              ) : null}
              <div style={placeholderStyle}>暂无草图</div>
            </div>

            <div style={detailSectionStyle}>
              <div style={detailTitleStyle}>面料清单</div>
              <div style={fabricListStyle}>
                {order.fabricItems.map((item, index) => (
                  <div key={index} style={fabricItemStyle}>
                    <span style={fabricNameStyle}>{getFabricName(item.fabricId)}</span>
                    <span style={fabricMetersStyle}>{item.metersNeeded}米</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={detailSectionStyle}>
              <div style={detailTitleStyle}>修改状态</div>
              <div style={statusButtonsStyle}>
                {statusList.map((status) => (
                  <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isUpdating || order.status === status}
                  style={{
                    ...statusButtonStyle,
                    ...(order.status === status
                      ? {
                          backgroundColor: statusColors[status],
                          color: '#FFFFFF',
                        }
                      : {
                          borderColor: statusColors[status],
                          color: statusColors[status],
                        }),
                    ...(isUpdating ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                  }}
                >
                  {status}
                </button>
              ))}
              </div>
            </div>
          </div>
        )}

        <div style={expandHintStyle}>
          {isExpanded ? '点击收起' : '点击展开详情'}
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  width: '300px',
  borderRadius: '12px',
  backgroundColor: '#FDF6F0',
  border: '1px solid #E6D5C0',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
};

const expandedCardStyle: React.CSSProperties = {
  transform: 'translateY(-6px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
};

const topBarStyle: React.CSSProperties = {
  height: '6px',
  width: '100%',
};

const cardContentStyle: React.CSSProperties = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
};

const orderIdStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#333333',
};

const customerStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666666',
  marginTop: '4px',
};

const statusBadgeStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
  flexShrink: 0,
};

const dateStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999999',
};

const detailsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  paddingTop: '12px',
  borderTop: '1px solid #E6D5C0',
  marginTop: '4px',
};

const detailSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const detailTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#333333',
};

const detailTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#666666',
};

const sketchImageStyle: React.CSSProperties = {
  width: '100%',
  height: '120px',
  objectFit: 'cover',
  borderRadius: '8px',
  backgroundColor: '#F5F5F5',
};

const placeholderStyle: React.CSSProperties = {
  display: 'none',
  padding: '20px',
  textAlign: 'center',
  color: '#999999',
  fontSize: '12px',
  backgroundColor: '#F5F5F5',
  borderRadius: '8px',
};

const fabricListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const fabricItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 12px',
  backgroundColor: '#FFFFFF',
  borderRadius: '6px',
  fontSize: '12px',
};

const fabricNameStyle: React.CSSProperties = {
  color: '#333333',
};

const fabricMetersStyle: React.CSSProperties = {
  color: '#666666',
};

const statusButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

const statusButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: '16px',
  border: '1px solid',
  backgroundColor: 'transparent',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const expandHintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#999999',
  textAlign: 'center',
  marginTop: '4px',
};
