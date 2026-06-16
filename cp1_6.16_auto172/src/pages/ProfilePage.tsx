import { useEffect, useCallback } from 'react';
import { Row, Col, Avatar, Spin, Table, Pagination, Empty } from 'antd';
import {
  UserOutlined,
  CoffeeOutlined,
  CalendarOutlined,
  GiftOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useStore } from '@/stores/store';

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProfilePage() {
  const {
    user,
    exchangeRecords,
    exchangeRecordsTotal,
    currentPage,
    loading,
    fetchExchangeRecords,
    setCurrentPage,
  } = useStore();

  useEffect(() => {
    fetchExchangeRecords(1, 10);
  }, [fetchExchangeRecords]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchExchangeRecords(page, 10);
  }, [setCurrentPage, fetchExchangeRecords]);

  const tableColumns = [
    {
      title: '兑换时间',
      dataIndex: 'exchangedAt',
      key: 'exchangedAt',
      render: (date: string) => (
        <span style={{ color: '#8B7355' }}>
          <CalendarOutlined style={{ marginRight: '8px' }} />
          {formatDate(date)}
        </span>
      ),
    },
    {
      title: '咖啡名称',
      dataIndex: 'coffeeName',
      key: 'coffeeName',
      render: (name: string) => (
        <span style={{ color: '#3D2914', fontWeight: 500 }}>
          <CoffeeOutlined style={{ marginRight: '8px', color: '#D4A574' }} />
          {name}
        </span>
      ),
    },
    {
      title: '消耗积分',
      dataIndex: 'pointsSpent',
      key: 'pointsSpent',
      align: 'right' as const,
      render: (points: number) => (
        <span style={{ color: '#FF4D4F', fontWeight: 500 }}>
          -{points}
        </span>
      ),
    },
  ];

  const isLoading = loading.user || loading.records;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">个人中心</h1>
        <p className="page-subtitle">查看您的积分信息和兑换记录</p>
      </div>

      {isLoading && !user ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            <Col xs={24} md={8} className="fade-in-delay-1">
              <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <Avatar
                  src={user?.avatar}
                  size={80}
                  icon={<UserOutlined />}
                  style={{ marginBottom: '16px' }}
                />
                <h2 style={{ margin: '0 0 8px 0', color: '#3D2914', fontSize: '20px' }}>
                  {user?.nickname}
                </h2>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #FFF8F0 0%, #F5E6D3 100%)',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    border: '1px solid #D4A574',
                  }}
                >
                  <CoffeeOutlined style={{ color: '#D4A574', fontSize: '18px' }} />
                  <span style={{ fontSize: '18px', fontWeight: 600, color: '#6B4226' }}>
                    {user?.points}
                  </span>
                  <span style={{ color: '#8B7355', fontSize: '14px' }}>积分</span>
                </div>
              </div>
            </Col>

            <Col xs={24} md={8} className="fade-in-delay-2">
              <div className="card" style={{ height: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #D4A574 0%, #C4956A 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GiftOutlined style={{ fontSize: '24px', color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ color: '#8B7355', fontSize: '14px' }}>累计兑换</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#3D2914' }}>
                      {exchangeRecordsTotal} 次
                    </div>
                  </div>
                </div>
                <p style={{ margin: 0, color: '#8B7355', fontSize: '13px' }}>
                  兑换次数越多，等级越高哦
                </p>
              </div>
            </Col>

            <Col xs={24} md={8} className="fade-in-delay-3">
              <div className="card" style={{ height: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #FAAD14 0%, #D48806 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrophyOutlined style={{ fontSize: '24px', color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ color: '#8B7355', fontSize: '14px' }}>今日已完成</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#3D2914' }}>
                      {user?.completedTasks.length || 0} / 4 个任务
                    </div>
                  </div>
                </div>
                <p style={{ margin: 0, color: '#8B7355', fontSize: '13px' }}>
                  每日0点重置任务，记得明天再来哦
                </p>
              </div>
            </Col>
          </Row>

          <div className="card fade-in-delay-4">
            <h3 style={{ margin: '0 0 20px 0', color: '#3D2914', fontSize: '18px' }}>
              <GiftOutlined style={{ color: '#D4A574', marginRight: '8px' }} />
              兑换记录
              <span style={{ marginLeft: '8px', color: '#8B7355', fontSize: '14px', fontWeight: 400 }}>
                (最近20条)
              </span>
            </h3>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : exchangeRecords.length === 0 ? (
              <Empty
                description="暂无兑换记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            ) : (
              <>
                <Table
                  dataSource={exchangeRecords}
                  columns={tableColumns}
                  rowKey="id"
                  pagination={false}
                  scroll={{ x: true }}
                />
                {exchangeRecordsTotal > 10 && (
                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Pagination
                      current={currentPage}
                      pageSize={10}
                      total={Math.min(exchangeRecordsTotal, 20)}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProfilePage;
