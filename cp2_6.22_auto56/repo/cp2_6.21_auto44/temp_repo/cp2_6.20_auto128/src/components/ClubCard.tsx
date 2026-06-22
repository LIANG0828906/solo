import { Card, Tag, Space, Avatar } from 'antd';
import { TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import type { Club, ClubCategory, ActivityFrequency } from '../types';
import { useNavigate } from 'react-router-dom';

interface ClubCardProps {
  club: Club;
}

const categoryMap: Record<ClubCategory, { label: string; color: string }> = {
  academic: { label: '学术', color: 'blue' },
  sports: { label: '体育', color: 'green' },
  arts: { label: '文艺', color: 'magenta' },
  charity: { label: '公益', color: 'orange' },
};

const frequencyMap: Record<ActivityFrequency, string> = {
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月',
};

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

function ClubCard({ club }: ClubCardProps) {
  const navigate = useNavigate();
  const gradient = gradients[club.id % gradients.length];
  const category = categoryMap[club.category];

  return (
    <Card
      className="club-card"
      hoverable={false}
      bodyStyle={{ padding: 0 }}
      onClick={() => navigate(`/club/${club.id}`)}
    >
      <div className="club-logo" style={{ background: gradient }}>
        {club.name.charAt(0)}
      </div>
      <div style={{ padding: '16px 20px 20px' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{club.name}</h3>
            <Tag color={category.color} style={{ margin: 0 }}>{category.label}</Tag>
          </div>

          <p style={{ color: '#666', fontSize: 13, lineHeight: 1.5, margin: 0, minHeight: 36 }}>
            {club.slogan}
          </p>

          <Space size={16} style={{ color: '#999', fontSize: 12 }}>
            <span>
              <CalendarOutlined style={{ marginRight: 4 }} />
              {frequencyMap[club.activityFrequency]}
            </span>
            <span>
              <TeamOutlined style={{ marginRight: 4 }} />
              {club.memberCount} / {club.maxMembers} 人
            </span>
          </Space>

          {club.members.length > 0 && (
            <Avatar.Group max={{ count: 4, style: { color: '#667eea', background: '#f0f0ff' } }}>
              {club.members.slice(0, 4).map((m) => (
                <Avatar key={m.id} size={22} src={m.avatar} />
              ))}
            </Avatar.Group>
          )}
        </Space>
      </div>
    </Card>
  );
}

export default ClubCard;
