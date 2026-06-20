import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Spin, Tag, Modal, Typography } from 'antd';
import { CoffeeOutlined, InboxOutlined } from '@ant-design/icons';
import { useStore } from '@/stores/store';
import type { Coffee } from '@/types';

const { Title, Text } = Typography;

function CoffeeCard({ coffee, index, userPoints, loading, onExchange }: {
  coffee: Coffee;
  index: number;
  userPoints: number;
  loading: boolean;
  onExchange: (coffee: Coffee) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const delayClass = `fade-in-delay-${Math.min(index + 1, 5)}`;
  const canAfford = userPoints >= coffee.requiredPoints;
  const outOfStock = coffee.stock <= 0;
  const disabled = outOfStock || !canAfford || loading;

  return (
    <Col xs={24} sm={12} lg={8} key={coffee.id} className={delayClass}>
      <div
        className="card coffee-card"
        style={{ height: '100%', position: 'relative' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {outOfStock && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 10,
            }}
          >
            已兑罄
          </div>
        )}

        <img
          src={coffee.image}
          alt={coffee.name}
          className="coffee-card-image"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coffee%20cup%20latte%20art&image_size=square';
          }}
        />

        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <Title level={4} style={{ margin: 0, color: '#3D2914', fontSize: '18px' }}>
              {coffee.name}
            </Title>
            <Tag
              color={outOfStock ? 'default' : canAfford ? 'gold' : 'red'}
              icon={<CoffeeOutlined />}
            >
              {coffee.requiredPoints} 积分
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {coffee.brand}
          </Text>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <Text style={{ color: '#8B7355', fontSize: '14px' }}>
            口味：{coffee.flavor}
          </Text>
          <Text style={{ color: outOfStock ? '#FF4D4F' : '#52C41A', fontSize: '14px', fontWeight: 500 }}>
            剩余：{coffee.stock} 份
          </Text>
        </div>

        <div
          style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            opacity: isHovered && !disabled ? 1 : 0.7,
            transform: isHovered && !disabled ? 'translateY(0)' : 'translateY(5px)',
          }}
        >
          <button
            className="btn-primary"
            style={{ width: '100%', height: '100%' }}
            disabled={disabled}
            onClick={() => onExchange(coffee)}
          >
            {outOfStock ? '已兑罄' : !canAfford ? '积分不足' : loading ? '兑换中...' : '立即兑换'}
          </button>
        </div>
      </div>
    </Col>
  );
}

function ExchangePage() {
  const {
    user,
    coffees,
    loading,
    fetchCoffees,
    exchangeCoffee,
  } = useStore();

  const [confirmModal, setConfirmModal] = useState<Coffee | null>(null);

  useEffect(() => {
    fetchCoffees();
  }, [fetchCoffees]);

  const handleExchange = useCallback((coffee: Coffee) => {
    setConfirmModal(coffee);
  }, []);

  const handleConfirmExchange = useCallback(async () => {
    if (confirmModal) {
      await exchangeCoffee(confirmModal.id);
      setConfirmModal(null);
    }
  }, [confirmModal, exchangeCoffee]);

  const isLoading = loading.coffees || loading.exchange;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">咖啡兑换</h1>
        <p className="page-subtitle">
          使用积分兑换限定联名咖啡券，每日限量，先到先得
          {user && (
            <span style={{ marginLeft: '16px', color: '#D4A574', fontWeight: 500 }}>
              当前积分：{user.points}
            </span>
          )}
        </p>
      </div>

      {isLoading && coffees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : coffees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8B7355' }}>
          <InboxOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p>暂无可用咖啡券</p>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {coffees.map((coffee, index) => (
            <CoffeeCard
              key={coffee.id}
              coffee={coffee}
              index={index}
              userPoints={user?.points || 0}
              loading={loading.exchange}
              onExchange={handleExchange}
            />
          ))}
        </Row>
      )}

      <Modal
        title="确认兑换"
        open={confirmModal !== null}
        onOk={handleConfirmExchange}
        onCancel={() => setConfirmModal(null)}
        okText="确认兑换"
        cancelText="再想想"
        confirmLoading={loading.exchange}
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #D4A574 0%, #C4956A 100%)',
            border: 'none',
          },
        }}
      >
        {confirmModal && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <img
              src={confirmModal.image}
              alt={confirmModal.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '12px',
                objectFit: 'cover',
                marginBottom: '16px',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coffee%20cup%20latte%20art&image_size=square';
              }}
            />
            <h3 style={{ margin: '0 0 8px 0', color: '#3D2914' }}>{confirmModal.name}</h3>
            <p style={{ margin: '0 0 16px 0', color: '#8B7355' }}>{confirmModal.brand}</p>
            <p style={{ margin: 0, fontSize: '16px' }}>
              消耗 <strong style={{ color: '#D4A574' }}>{confirmModal.requiredPoints}</strong> 积分
            </p>
            {user && user.points < confirmModal.requiredPoints && (
              <p style={{ margin: '8px 0 0 0', color: '#FF4D4F', fontSize: '14px' }}>
                积分不足，还差 {confirmModal.requiredPoints - user.points} 积分
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ExchangePage;
