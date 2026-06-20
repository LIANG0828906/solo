import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Tag, Avatar, Space, Descriptions, Pagination, Modal,
  Form, Input, Spin, Typography, Row, Col, message, Tooltip, Empty
} from 'antd';
import {
  ArrowLeftOutlined, CalendarOutlined, EnvironmentOutlined,
  TeamOutlined, CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useClubStore } from '../stores/useClubStore';
import type { ApplicationStatus } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const categoryMap: Record<string, { label: string; color: string }> = {
  academic: { label: '学术', color: 'blue' },
  sports: { label: '体育', color: 'green' },
  arts: { label: '文艺', color: 'magenta' },
  charity: { label: '公益', color: 'orange' },
};

const frequencyMap: Record<string, string> = {
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月',
};

const PAGE_SIZE = 5;
const DISPLAY_MEMBERS = 8;

function ClubDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentClub, loading, fetchClubDetail, applyClub, getApplicationStatus, fetchApplications } = useClubStore();
  const [page, setPage] = useState(1);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [form] = Form.useForm();

  const clubId = Number(id);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (clubId) {
      fetchClubDetail(clubId);
    }
  }, [fetchClubDetail, clubId]);

  const appStatus: ApplicationStatus | null = currentClub ? getApplicationStatus(currentClub.id) : null;
  const gradient = currentClub ? gradients[currentClub.id % gradients.length] : gradients[0];
  const category = currentClub ? categoryMap[currentClub.category] : null;

  const paginatedActivities = currentClub?.activities
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];

  const displayedMembers = currentClub
    ? showAllMembers
      ? currentClub.members
      : currentClub.members.slice(0, DISPLAY_MEMBERS)
    : [];

  const hasMoreMembers = currentClub && currentClub.members.length > DISPLAY_MEMBERS;

  const handleApply = async () => {
    if (!currentClub) return;

    if (currentClub.requiresReason) {
      setApplyModal(true);
    } else {
      await submitApply();
    }
  };

  const submitApply = async (reason?: string) => {
    if (!currentClub) return;
    setApplyLoading(true);
    const result = await applyClub(currentClub.id, reason);
    setApplyLoading(false);

    if (result.success) {
      message.success(result.message);
      setApplyModal(false);
      form.resetFields();
    } else {
      message.error(result.message);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      await submitApply(values.reason);
    } catch {
      // validation failed
    }
  };

  const getApplyButton = () => {
    if (!currentClub) return null;

    const isFull = currentClub.memberCount >= currentClub.maxMembers;

    if (isFull) {
      return (
        <Button size="large" disabled icon={<ExclamationCircleOutlined />}>
          已满员
        </Button>
      );
    }

    if (appStatus === 'pending') {
      return (
        <Button size="large" disabled icon={<ExclamationCircleOutlined />} style={{ background: '#fffbe6', borderColor: '#ffe58f', color: '#d48806' }}>
          待审核
        </Button>
      );
    }

    if (appStatus === 'approved') {
      return (
        <Button size="large" disabled icon={<CheckCircleOutlined />} style={{ background: '#f6ffed', borderColor: '#b7eb8f', color: '#389e0d' }}>
          已报名
        </Button>
      );
    }

    if (appStatus === 'rejected') {
      return (
        <Button size="large" danger disabled>
          未通过
        </Button>
      );
    }

    return (
      <Button type="primary" size="large" onClick={handleApply} loading={loading}>
        {currentClub.requiresReason ? '申请加入（需审核）' : '立即报名'}
      </Button>
    );
  };

  if (loading && !currentClub) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentClub) {
    return (
      <Card>
        <Empty description="社团不存在" />
      </Card>
    );
  }

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 16, color: '#666' }}
      >
        返回社团列表
      </Button>

      <div className="cover-gradient" style={{ background: gradient }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80, fontWeight: 800, letterSpacing: 4, marginBottom: 12 }}>
            {currentClub.name.charAt(0)}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{currentClub.name}</div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 12, marginBottom: 24 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Space size={12} wrap>
                <Tag color={category?.color}>{category?.label}</Tag>
                <Tag color="purple">{frequencyMap[currentClub.activityFrequency]}</Tag>
                {currentClub.requiresReason && (
                  <Tag color="gold">需要审核</Tag>
                )}
              </Space>

              <Title level={4} style={{ margin: 0 }}>{currentClub.slogan}</Title>

              <div>
                <Text strong style={{ color: '#333', fontSize: 15, marginBottom: 8, display: 'block' }}>社团介绍</Text>
                <Paragraph style={{ color: '#555', lineHeight: 1.8, fontSize: 14, margin: 0 }}>
                  {currentClub.description}
                </Paragraph>
              </div>
            </Space>
          </Card>

          <Card
            title={
              <Space size={8}>
                <CalendarOutlined style={{ color: '#667eea' }} />
                <span>近期活动</span>
                <Text type="secondary" style={{ fontWeight: 'normal', fontSize: 13 }}>
                  （共 {currentClub.activities.length} 场）
                </Text>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            {currentClub.activities.length === 0 ? (
              <Empty description="暂无活动安排" style={{ padding: '30px 0' }} />
            ) : (
              <>
                {paginatedActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <Space size={16} align="start">
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #667eea33, #764ba233)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#667eea' }}>
                          {dayjs(activity.date).format('DD')}
                        </div>
                        <div style={{ fontSize: 10, color: '#764ba2' }}>
                          {dayjs(activity.date).format('MM月')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{activity.name}</div>
                        <Space size={16} style={{ color: '#888', fontSize: 13 }}>
                          <span><EnvironmentOutlined style={{ marginRight: 4 }} />{activity.location}</span>
                          <span><TeamOutlined style={{ marginRight: 4 }} />{activity.registered}/{activity.maxCapacity}</span>
                        </Space>
                      </div>
                    </Space>
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      disabled={activity.registered >= activity.maxCapacity}
                    >
                      {activity.registered >= activity.maxCapacity ? '已满' : '报名活动'}
                    </Button>
                  </div>
                ))}

                {currentClub.activities.length > PAGE_SIZE && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Pagination
                      simple
                      current={page}
                      pageSize={PAGE_SIZE}
                      total={currentClub.activities.length}
                      onChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: 12, marginBottom: 24 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Descriptions column={1} size="small" labelStyle={{ color: '#999' }}>
                <Descriptions.Item label="成员人数">
                  <span style={{ color: '#333', fontWeight: 600 }}>{currentClub.memberCount}</span>
                  <span style={{ color: '#999' }}> / {currentClub.maxMembers} 人</span>
                </Descriptions.Item>
                <Descriptions.Item label="活动频次">{frequencyMap[currentClub.activityFrequency]}</Descriptions.Item>
                <Descriptions.Item label="社团类别">{category?.label}</Descriptions.Item>
              </Descriptions>
              {getApplyButton()}
            </Space>
          </Card>

          <Card
            title={
              <Space size={8}>
                <TeamOutlined style={{ color: '#667eea' }} />
                <span>社团成员</span>
                <Text type="secondary" style={{ fontWeight: 'normal', fontSize: 13 }}>
                  （{currentClub.members.length} 人）
                </Text>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            {currentClub.members.length === 0 ? (
              <Empty description="暂无成员" style={{ padding: '10px 0' }} />
            ) : (
              <>
                <Avatar.Group size={42} style={{ flexWrap: 'wrap', gap: 8 }} maxStyle={{ color: '#667eea', background: '#f0f0ff' }}>
                  {displayedMembers.map((m) => (
                    <Tooltip key={m.id} title={m.name}>
                      <Avatar className="member-avatar" src={m.avatar} />
                    </Tooltip>
                  ))}
                </Avatar.Group>

                {hasMoreMembers && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setShowAllMembers(!showAllMembers)}
                    style={{ padding: 0, marginTop: 12 }}
                  >
                    {showAllMembers ? '收起' : `展开全部（${currentClub.members.length}人）`}
                  </Button>
                )}
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="提交申请理由"
        open={applyModal}
        onOk={handleModalOk}
        onCancel={() => setApplyModal(false)}
        confirmLoading={applyLoading}
        okText="提交申请"
        cancelText="取消"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          {currentClub?.name}需要审核，请填写50-200字的申请理由：
        </Text>
        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            rules={[
              { required: true, message: '请填写申请理由' },
              { min: 50, message: '申请理由不少于50字' },
              { max: 200, message: '申请理由不超过200字' },
            ]}
          >
            <TextArea
              rows={5}
              placeholder="请描述你想加入本社团的原因、相关经历或期望..."
              showCount
              maxLength={200}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ClubDetail;
