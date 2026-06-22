import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Typography,
  Button,
  Avatar,
  Tag,
  List,
  Pagination,
  Modal,
  Input,
  message,
  Spin,
  Empty,
  Space,
  Tooltip,
} from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useClubStore } from '@/stores/useClubStore'

const { Title, Paragraph } = Typography
const { TextArea } = Input

const frequencyMap: Record<string, string> = {
  weekly: '每周活动',
  biweekly: '每两周活动',
  monthly: '每月活动',
}

const categoryMap: Record<string, { label: string; color: string }> = {
  academic: { label: '学术', color: 'blue' },
  sports: { label: '体育', color: 'red' },
  art: { label: '文艺', color: 'cyan' },
  public: { label: '公益', color: 'green' },
}

const gradientMap: Record<string, string> = {
  academic: 'gradient-academic',
  sports: 'gradient-sports',
  art: 'gradient-art',
  public: 'gradient-public',
}

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    clubDetail,
    activities,
    activitiesTotal,
    members,
    loading,
    fetchClubDetail,
    fetchClubActivities,
    fetchClubMembers,
    applyClub,
    clearClubDetail,
    myApplications,
    fetchMyApplications,
  } = useClubStore()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [showAllMembers, setShowAllMembers] = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [applyReason, setApplyReason] = useState('')
  const [applying, setApplying] = useState(false)

  const clubId = Number(id)

  useEffect(() => {
    if (clubId) {
      fetchClubDetail(clubId)
      fetchClubActivities(clubId, 1, pageSize)
      fetchClubMembers(clubId)
      fetchMyApplications()
    }
    return () => {
      clearClubDetail()
    }
  }, [clubId, pageSize])

  useEffect(() => {
    if (clubId) {
      fetchClubActivities(clubId, page, pageSize)
    }
  }, [page, clubId, pageSize])

  const myApp = useMemo(
    () => myApplications.find((a) => a.clubId === clubId),
    [myApplications, clubId]
  )

  const displayMembers = showAllMembers ? members : members.slice(0, 8)

  const handleApply = async () => {
    if (!clubDetail) return

    if (clubDetail.requiresApplication) {
      if (applyReason.length < 50 || applyReason.length > 200) {
        message.warning('申请理由需要50-200字')
        return
      }
    }

    try {
      setApplying(true)
      await applyClub(clubId, clubDetail.requiresApplication ? applyReason : undefined)
      message.success('报名提交成功，请等待审核')
      setApplyModalOpen(false)
      setApplyReason('')
      fetchMyApplications()
    } catch (err) {
      message.error('报名失败，请重试')
    } finally {
      setApplying(false)
    }
  }

  const openApplyModal = () => {
    if (!clubDetail) return
    if (clubDetail.memberCount >= clubDetail.maxMembers) {
      message.warning('该社团成员已满')
      return
    }
    if (myApp) {
      return
    }
    setApplyModalOpen(true)
  }

  if (loading && !clubDetail) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!clubDetail) {
    return (
      <div style={{ padding: 80 }}>
        <Empty description="社团不存在" />
      </div>
    )
  }

  const cat = categoryMap[clubDetail.category]
  const isFull = clubDetail.memberCount >= clubDetail.maxMembers

  const getApplyButton = () => {
    if (myApp?.status === 'pending') {
      return (
        <Button type="primary" disabled size="large">
          待审核
        </Button>
      )
    }
    if (myApp?.status === 'approved') {
      return (
        <Button type="primary" disabled size="large">
          已报名
        </Button>
      )
    }
    if (myApp?.status === 'rejected') {
      return (
        <Button type="primary" danger disabled size="large">
          未通过
        </Button>
      )
    }
    if (isFull) {
      return (
        <Button type="primary" disabled size="large">
          已满
        </Button>
      )
    }
    return (
      <Button type="primary" size="large" onClick={openApplyModal}>
        立即报名
      </Button>
    )
  }

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <div className={`club-cover ${gradientMap[clubDetail.category]}`}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <Tag color={cat.color} style={{ marginBottom: 8 }}>
              {cat.label}
            </Tag>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
              {clubDetail.name}
            </Title>
            <Space size={16} style={{ color: 'rgba(255,255,255,0.9)' }}>
              <span>
                <TeamOutlined /> {clubDetail.memberCount}/{clubDetail.maxMembers} 成员
              </span>
              <span>
                <CalendarOutlined /> {frequencyMap[clubDetail.frequency]}
              </span>
            </Space>
          </div>
          {getApplyButton()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginBottom: 24 }}>
            <Title level={4} style={{ marginTop: 0 }}>社团介绍</Title>
            <Paragraph style={{ fontSize: 14, lineHeight: 1.8, color: '#555' }}>
              {clubDetail.description}
            </Paragraph>
          </div>

          <div style={{ background: '#fff', padding: 24, borderRadius: 12 }}>
            <Title level={4} style={{ marginTop: 0 }}>近期活动</Title>
            {activities.length === 0 ? (
              <Empty description="暂无活动安排" />
            ) : (
              <>
                <List
                  dataSource={activities}
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>
                          {item.name}
                        </div>
                        <Space size={16} style={{ color: '#999', fontSize: 13 }}>
                          <span>
                            <CalendarOutlined /> {dayjs(item.date).format('YYYY-MM-DD HH:mm')}
                          </span>
                          <span>
                            <EnvironmentOutlined /> {item.location}
                          </span>
                        </Space>
                      </div>
                      <Button size="small" type="primary" ghost>
                        报名活动
                      </Button>
                    </List.Item>
                  )}
                />
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={activitiesTotal}
                    onChange={setPage}
                    showSizeChanger={false}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, position: 'sticky', top: 88 }}>
            <Title level={4} style={{ marginTop: 0 }}>
              社团成员 ({members.length})
            </Title>
            {members.length === 0 ? (
              <Empty description="暂无成员" />
            ) : (
              <>
                <div className="member-avatar-group">
                  {displayMembers.map((m) => (
                    <Tooltip key={m.id} title={m.name}>
                      <Avatar
                        size={40}
                        src={m.avatar}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontSize: 14,
                        }}
                      >
                        {m.name.charAt(0)}
                      </Avatar>
                    </Tooltip>
                  ))}
                </div>
                {members.length > 8 && (
                  <Button
                    type="link"
                    style={{ marginTop: 12, padding: 0 }}
                    onClick={() => setShowAllMembers(!showAllMembers)}
                  >
                    {showAllMembers ? '收起' : `展开全部 (${members.length})`}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={`申请加入「${clubDetail.name}」`}
        open={applyModalOpen}
        onOk={handleApply}
        onCancel={() => {
          setApplyModalOpen(false)
          setApplyReason('')
        }}
        confirmLoading={applying}
        okText="提交申请"
        cancelText="取消"
      >
        {clubDetail.requiresApplication ? (
          <div>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              该社团需要审核，请填写申请理由（50-200字）：
            </Paragraph>
            <TextArea
              value={applyReason}
              onChange={(e) => setApplyReason(e.target.value)}
              rows={5}
              placeholder="请简要说明你对该社团的兴趣以及为什么想加入..."
              showCount
              maxLength={200}
            />
            <div style={{ color: applyReason.length < 50 ? '#ff4d4f' : '#52c41a', fontSize: 12, marginTop: 4 }}>
              当前字数：{applyReason.length}/50-200
            </div>
          </div>
        ) : (
          <Paragraph>确认申请加入「{clubDetail.name}」吗？</Paragraph>
        )}
      </Modal>
    </div>
  )
}

export default ClubDetail
