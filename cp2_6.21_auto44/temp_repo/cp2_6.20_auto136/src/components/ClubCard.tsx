import { Card, Avatar, Tag, Typography } from 'antd'
import { TeamOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Club } from '@/types'

const { Title, Paragraph } = Typography

const categoryMap: Record<string, { label: string; color: string }> = {
  academic: { label: '学术', color: 'blue' },
  sports: { label: '体育', color: 'red' },
  art: { label: '文艺', color: 'cyan' },
  public: { label: '公益', color: 'green' },
}

const frequencyMap: Record<string, string> = {
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月',
}

interface ClubCardProps {
  club: Club
}

const ClubCard = ({ club }: ClubCardProps) => {
  const navigate = useNavigate()
  const cat = categoryMap[club.category]

  return (
    <div
      className="club-card"
      onClick={() => navigate(`/clubs/${club.id}`)}
    >
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <Avatar
            size={48}
            src={club.logo}
            style={{
              background: 'linear-gradient(135deg, #667eea33 0%, #764ba233 100%)',
              marginRight: 12,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {club.name.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
              {club.name}
            </Title>
            <Tag color={cat.color} style={{ margin: 0 }}>
              {cat.label}
            </Tag>
          </div>
        </div>

        <Paragraph
          type="secondary"
          style={{
            fontSize: 13,
            marginBottom: 16,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 38,
          }}
        >
          {club.summary}
        </Paragraph>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#999',
            fontSize: 12,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarOutlined />
            {frequencyMap[club.frequency]}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <TeamOutlined />
            {club.memberCount}/{club.maxMembers}
          </span>
        </div>
      </div>
      <div className="club-card-bottom-bar" />
    </div>
  )
}

export default ClubCard
