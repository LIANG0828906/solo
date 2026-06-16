import { memo } from 'react';
import { Card, Tag, Avatar, Flex } from 'antd';
import type { Item, ItemCategory } from '../types';

interface ItemCardProps {
  item: Item;
  onClick: () => void;
  index: number;
}

const categoryColors: Record<ItemCategory, string> = {
  家具: 'blue',
  电器: 'orange',
  书籍: 'green',
  服装: 'purple',
  其他: 'default'
};

const DEFAULT_IMAGE = 'https://picsum.photos/seed/default/400/300';

function truncate(str: string, maxLen: number) {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

function ItemCard({ item, onClick, index }: ItemCardProps) {
  const delay = index < 9 ? `${(index + 1) * 0.05}s` : '0.5s';

  return (
    <div
      className="item-card"
      style={{
        animation: 'fadeInUp 0.5s ease forwards',
        animationDelay: delay,
        opacity: 0
      }}
      onClick={onClick}
    >
      <Card
        hoverable
        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #D7CCC8' }}
        cover={
          <img
            alt={item.name}
            src={item.images.length > 0 ? item.images[0] : DEFAULT_IMAGE}
            style={{ height: 200, objectFit: 'cover' }}
          />
        }
      >
        <Card.Meta
          title={<span style={{ fontWeight: 600, fontSize: 15 }}>{truncate(item.name, 20)}</span>}
          description={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <Tag color={categoryColors[item.category]}>{item.category}</Tag>
              <div style={{ color: '#E53935', fontSize: 22, fontWeight: 700 }}>¥{item.price}</div>
              <Flex justify="space-between" align="center" style={{ marginTop: 4 }}>
                <Flex align="center" gap={6}>
                  <Avatar src={item.sellerAvatar} size={20} />
                  <span style={{ fontSize: 12, color: '#6D4C41' }}>{item.sellerName}</span>
                  <span style={{ fontSize: 12, color: '#8D6E63' }}>· {item.distance}km</span>
                </Flex>
                <span style={{ fontSize: 12, color: '#8D6E63' }}>...</span>
              </Flex>
            </div>
          }
        />
      </Card>
    </div>
  );
}

export default memo(ItemCard);
