import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collapse, Empty, Tag, Space, Typography, Spin, Row, Col } from 'antd';
import {
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  TeamOutlined, CalendarOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useClubStore } from '../stores/useClubStore';
import type { UserApplication, ApplicationStatus } from '../types';

const { Title, Text } = Typography;

const statusConfig: Record<ApplicationStatus, {
  label: string;
  color: string;
  icon: React.ReactNode;
  panelKey: string;
}> = {
  pending: { label: '待审核', color: 'gold', icon: <ClockCircleOutlined />, panelKey: '1' },
  approved: { label: '已通过', color: 'green', icon: <CheckCircleOutlined />, panelKey: '2' },
  rejected: { label: '未通过', color: 'red', icon: <CloseCircleOutlined />, panelKey: '3' },
};

function MyClubs() {
  const navigate = useNavigate();
  const { applications, loading, fetchApplications } = useClubStore();

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const grouped = {
    pending: applications.filter((a) => a.status === 'pending'),
    approved: applications.filter((a) => a.status === 'approved'),
    rejected: applications.filter((a) => a.status === 'rejected'),
  };

  const renderApplicationCard = (app: UserApplication) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ];
    const gradient = gradients[app.clubId % gradients.length];
    const config = statusConfig[app.status];

    return (
      <div
        key={app.id}
        className="my-club-card"
        onClick={() => navigate(`/club/${app.clubId}`)}
      >
        <Row gutter={12} align="middle">
          <Col span={4}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: 22,
              }}
            >
              {app.clubName.charAt(0)}
            </div>
          </Col>
          <Col span={14}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space size={8}>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>{app.clubName}</span>
                <Tag color={config.color} icon={config.icon} style={{ margin: 0 }}>
                  {config.label}
                </Tag>
              </Space>
              <Space size={16} style={{ color: '#999', fontSize: 12 }}>
                <span><TeamOutlined style={{ marginRight: 4 }} />{app.memberCount} 成员</span>
                <span><CalendarOutlined style={{ marginRight: 4 }} />报名于 {dayjs(app.appliedAt).format('YYYY-MM-DD')}</span>
              </Space>
            </Space>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <ArrowRightOutlined style={{ color: '#bbb' }} />
          </Col>
        </Row>
      </div>
    );
  };

  const collapseItems = (Object.keys(statusConfig) as ApplicationStatus[]).map((status) => {
    const config = statusConfig[status];
    const list = grouped[status];
    return {
      key: config.panelKey,
      label: (
        <Space size={12}>
          <span style={{ color: config.color, fontSize: 18 }}>{config.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{config.label}</span>
          <Tag color={config.color} style={{ margin: 0 }}>{list.length}</Tag>
        </Space>
      ),
      children:
        list.length === 0 ? (
          <Empty description={`暂无${config.label}的社团`} style={{ padding: '20px 0' }} />
        ) : (
          list.map(renderApplicationCard)
        ),
    };
  });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>我的社团</Title>
        <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>
          管理已报名的社团，查看申请状态
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {(Object.keys(statusConfig) as ApplicationStatus[]).map((status) => {
          const config = statusConfig[status];
          const list = grouped[status];
          return (
            <Col xs={8} key={status}>
              <div
                className="collapse-panel"
                style={{
                  padding: '16px 20px',
                  margin: 0,
                  borderTop: `3px solid var(--ant-${config.color === 'gold' ? 'warning' : config.color}-color)`,
                }}
              >
                <div style={{ color: config.color, marginBottom: 6 }}>
                  {config.icon} <span style={{ fontSize: 13, color: '#666' }}>{config.label}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#333' }}>{list.length}</div>
              </div>
            </Col>
          );
        })}
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : applications.length === 0 ? (
        <div className="collapse-panel" style={{ padding: '60px 0', textAlign: 'center' }}>
          <Empty
            description={
              <Space direction="vertical" size={8}>
                <Text type="secondary">你还没有报名任何社团</Text>
                <a onClick={() => navigate('/')} style={{ color: '#667eea' }}>
                  去发现社团 →
                </a>
              </Space>
            }
          />
        </div>
      ) : (
        <Collapse
          items={collapseItems}
          defaultActiveKey={['1', '2', '3']}
          ghost
          style={{
            background: 'transparent',
          }}
        />
      )}
    </div>
  );
}

export default MyClubs;
