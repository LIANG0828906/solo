import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Collapse,
  Card,
  Avatar,
  Typography,
  Tag,
  Spin,
  Empty,
  Space,
  Menu,
  Layout,
  Button,
} from 'antd'
import {
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useClubStore } from '@/stores/useClubStore'
import type { Application, Club } from '@/types'

const { Title, Paragraph } = Typography
const { Sider, Content } = Layout

const statusMap = {
  pending: { label: '待审核', icon: <ClockCircleOutlined />, color: 'gold' },
  approved: { label: '已通过', icon: <CheckCircleOutlined />, color: 'green' },
  rejected: { label: '未通过', icon: <CloseCircleOutlined />, color: 'red' },
}

interface ClubApp extends Application {
  club: Club
}

const MyClubs = () => {
  const navigate = useNavigate()
  const { myApplications, loading, fetchMyApplications } = useClubStore()

  useEffect(() => {
    fetchMyApplications()
  }, [fetchMyApplications])

  const grouped = useMemo(() => {
    const g: Record<string, ClubApp[]> = {
      pending: [],
      approved: [],
      rejected: [],
    }
    myApplications.forEach((app) => {
      if (g[app.status]) {
        g[app.status].push(app)
      }
    })
    return g
  }, [myApplications])

  const renderClubCard = (app: ClubApp) => {
    const club = app.club
    return (
      <Card
        key={app.id}
        hoverable
        style={{ marginBottom: 12 }}
        onClick={() => navigate(`/clubs/${club.id}`)}
        styles={{ body: { padding: 16 } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={48}
            src={club.logo}
            style={{
              background: 'linear-gradient(135deg, #667eea33 0%, #764ba233 100%)',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {club.name.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Title level={5} style={{ margin: 0 }}>
                {club.name}
              </Title>
              <Tag color={statusMap[app.status].color}>
                {statusMap[app.status].icon} {statusMap[app.status].label}
              </Tag>
            </div>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
              {club.summary}
            </Paragraph>
            <Space size={16} style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
              <span>
                <TeamOutlined /> {club.memberCount}/{club.maxMembers} 成员
              </span>
              <span>
                <CalendarOutlined /> 报名时间：{dayjs(app.appliedAt).format('YYYY-MM-DD')}
              </span>
            </Space>
          </div>
        </div>
      </Card>
    )
  }

  const items = [
    {
      key: 'pending',
      label: (
        <span>
          <ClockCircleOutlined /> 待审核 ({grouped.pending.length})
        </span>
      ),
      children:
        grouped.pending.length === 0 ? (
          <Empty description="暂无待审核申请" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          grouped.pending.map(renderClubCard)
        ),
    },
    {
      key: 'approved',
      label: (
        <span>
          <CheckCircleOutlined /> 已通过 ({grouped.approved.length})
        </span>
      ),
      children:
        grouped.approved.length === 0 ? (
          <Empty description="暂无已通过的社团" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          grouped.approved.map(renderClubCard)
        ),
    },
    {
      key: 'rejected',
      label: (
        <span>
          <CloseCircleOutlined /> 未通过 ({grouped.rejected.length})
        </span>
      ),
      children:
        grouped.rejected.length === 0 ? (
          <Empty description="暂无未通过申请" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          grouped.rejected.map(renderClubCard)
        ),
    },
  ]

  return (
    <Layout style={{ background: 'transparent' }}>
      <Sider width={220} style={{ background: 'transparent', marginRight: 0 }}>
        <div className="sidebar-menu">
          <Menu
            mode="inline"
            selectedKeys={['my-clubs']}
            style={{ border: 'none', background: 'transparent' }}
            onClick={({ key }) => {
              if (key === 'home') navigate('/')
              if (key === 'my-clubs') navigate('/my-clubs')
            }}
            items={[
              { key: 'home', icon: <HomeOutlined />, label: '社团探索' },
              { key: 'my-clubs', icon: <UserOutlined />, label: '我的社团' },
            ]}
          />
        </div>
      </Sider>
      <Content style={{ background: 'transparent' }}>
        <div style={{ marginBottom: 20 }}>
          <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
            我的社团
          </Title>
          <Typography.Text type="secondary">
            查看和管理你已报名的所有社团
          </Typography.Text>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : myApplications.length === 0 ? (
          <Card style={{ padding: 40 }}>
            <Empty description="你还没有报名任何社团，快去探索吧！">
              <Button type="primary" onClick={() => navigate('/')}>
                探索社团
              </Button>
            </Empty>
          </Card>
        ) : (
          <Collapse
            items={items}
            defaultActiveKey={['pending', 'approved']}
            size="large"
            style={{ background: '#fff', borderRadius: 12, border: 'none' }}
          />
        )}
      </Content>
    </Layout>
  )
}

export default MyClubs
