import { useEffect, useState } from 'react';
import { Row, Col, Select, Space, Typography, Spin, Empty, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ClubCard from '../components/ClubCard';
import { useClubStore } from '../stores/useClubStore';
import type { ClubCategory, ActivityFrequency } from '../types';

const { Title, Text } = Typography;

const categoryOptions = [
  { value: 'all', label: '全部类别' },
  { value: 'academic', label: '学术' },
  { value: 'sports', label: '体育' },
  { value: 'arts', label: '文艺' },
  { value: 'charity', label: '公益' },
];

const frequencyOptions = [
  { value: 'all', label: '全部频次' },
  { value: 'weekly', label: '每周' },
  { value: 'biweekly', label: '每两周' },
  { value: 'monthly', label: '每月' },
];

function Home() {
  const { clubs, loading, fetchClubs, fetchApplications } = useClubStore();
  const [category, setCategory] = useState<ClubCategory | 'all'>('all');
  const [frequency, setFrequency] = useState<ActivityFrequency | 'all'>('all');

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    fetchClubs({
      category: category === 'all' ? undefined : category,
      frequency: frequency === 'all' ? undefined : frequency,
    });
  }, [fetchClubs, category, frequency]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>发现精彩社团</Title>
        <Text type="secondary" style={{ fontSize: 14, marginTop: 6, display: 'block' }}>
          探索 {clubs.length} 个校园社团，找到属于你的兴趣天地
        </Text>
      </div>

      <div className="filter-bar">
        <Space size={16} wrap>
          <Space align="center" size={8}>
            <Text strong style={{ color: '#555' }}>类别：</Text>
            <Select
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              style={{ width: 140 }}
              suffixIcon={<SearchOutlined style={{ color: '#999' }} />}
            />
          </Space>

          <Space align="center" size={8}>
            <Text strong style={{ color: '#555' }}>频次：</Text>
            <Select
              value={frequency}
              onChange={setFrequency}
              options={frequencyOptions}
              style={{ width: 140 }}
            />
          </Space>

          <div style={{ flex: 1 }} />

          <Space size={8}>
            <Tag color="blue" style={{ margin: 0, padding: '2px 10px' }}>学术 12</Tag>
            <Tag color="green" style={{ margin: 0, padding: '2px 10px' }}>体育 8</Tag>
            <Tag color="magenta" style={{ margin: 0, padding: '2px 10px' }}>文艺 9</Tag>
            <Tag color="orange" style={{ margin: 0, padding: '2px 10px' }}>公益 5</Tag>
          </Space>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : clubs.length === 0 ? (
        <Empty description="暂无符合条件的社团" style={{ padding: '60px 0' }} />
      ) : (
        <div className="clubs-grid">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
