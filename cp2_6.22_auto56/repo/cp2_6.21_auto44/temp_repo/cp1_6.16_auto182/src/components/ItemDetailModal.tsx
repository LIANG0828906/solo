import { useState } from 'react';
import {
  Modal,
  Tag,
  Avatar,
  Flex,
  Carousel,
  Divider,
  Input,
  Button,
  message
} from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import type { Item, ItemCategory } from '../types';
import { sendMessage } from '../api/fetchData';

const { TextArea } = Input;

interface ItemDetailModalProps {
  visible: boolean;
  item: Item | null;
  onClose: () => void;
}

const categoryColors: Record<ItemCategory, string> = {
  家具: 'blue',
  电器: 'orange',
  书籍: 'green',
  服装: 'purple',
  其他: 'default'
};

const DEFAULT_IMAGE = 'https://picsum.photos/seed/default/600/450';

export default function ItemDetailModal({ visible, item, onClose }: ItemDetailModalProps) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  if (!item) return null;

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const success = await sendMessage(item.id, messageText.trim());
      if (success) {
        message.success('已发送！');
        setMessageText('');
      }
    } finally {
      setSending(false);
    }
  };

  const modalTitle = (
    <Flex align="center" gap={8}>
      <span style={{ fontSize: 18, fontWeight: 600, color: '#5D4037' }}>{item.name}</span>
      <Tag color={categoryColors[item.category]}>{item.category}</Tag>
    </Flex>
  );

  return (
    <Modal
      open={visible}
      title={modalTitle}
      onCancel={onClose}
      footer={null}
      width="60%"
      centered
      destroyOnClose
    >
      <Flex gap={24} style={{ minHeight: 350 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {item.images.length > 1 ? (
            <Carousel autoplay style={{ borderRadius: 12, overflow: 'hidden' }}>
              {item.images.map((img, idx) => (
                <div key={idx}>
                  <img
                    src={img}
                    alt={`${item.name}-${idx}`}
                    style={{ width: '100%', height: 350, objectFit: 'cover', borderRadius: 12 }}
                  />
                </div>
              ))}
            </Carousel>
          ) : (
            <img
              src={item.images.length > 0 ? item.images[0] : DEFAULT_IMAGE}
              alt={item.name}
              style={{ width: '100%', height: 350, objectFit: 'cover', borderRadius: 12 }}
            />
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ color: '#E53935', fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
            ¥{item.price}
          </div>
          <div style={{ fontSize: 14, color: '#5D4037', lineHeight: 1.7, marginBottom: 8 }}>
            {item.description}
          </div>

          <Divider style={{ margin: '16px 0', borderColor: '#D7CCC8' }} />

          <Flex align="center" gap={10} style={{ marginBottom: 8 }}>
            <Avatar src={item.sellerAvatar} size={44} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, color: '#5D4037' }}>{item.sellerName}</span>
              <span style={{ fontSize: 12, color: '#8D6E63' }}>注册于 {item.sellerRegisterDate}</span>
            </div>
          </Flex>

          <div style={{ fontSize: 13, color: '#8D6E63', marginBottom: 16 }}>
            距离：{item.distance}km · {item.area}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <TextArea
              placeholder="输入您想对卖家说的话..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              maxLength={200}
              showCount
              rows={3}
              style={{
                marginBottom: 12,
                borderRadius: 8,
                resize: 'none'
              }}
            />
            <Button
              type="primary"
              icon={<MessageOutlined />}
              onClick={handleSendMessage}
              loading={sending}
              disabled={!messageText.trim()}
              block
              style={{
                background: '#8D6E63',
                borderColor: '#8D6E63',
                borderRadius: 8,
                height: 40,
                fontWeight: 500
              }}
            >
              发送私信
            </Button>
          </div>
        </div>
      </Flex>
    </Modal>
  );
}
