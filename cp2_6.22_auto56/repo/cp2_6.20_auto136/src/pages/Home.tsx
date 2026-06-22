import { useEffect, useState } from 'react'
import { Segmented, Space, Typography, Spin, Empty, Select } from 'antd'
import { useClubStore } from '@/stores/useClubStore'
import ClubCard from '@/components/ClubCard'
import type { ClubCategory, ActivityFrequency } from '@/types'

const { Title } = Typography

const categoryOptions = [
  { label: '全部', value: '' },
  { label: '学术', value: 'academic' },
  { label: '体育', value: 'sports' },
  { label: '文艺', value: 'art' },
  { label: '公益', value: 'public' },
]

const frequencyOptions = [
  { label: '全部频次', value: '' },
  { label: '每周', value: 'weekly' },
  { label: '每两周', value: 'biweekly' },
  { label: '每月', value: 'monthly' },
]

const Home = () => {
  const { clubs, loading, fetchClubs } = useClubStore()
  const [category, setCategory] = useState<ClubCategory | ''>('')
  const [frequency, setFrequency] = useState<ActivityFrequency | ''>('')

  useEffect(() => {
    fetchClubs({
      category: category || undefined,
      frequency: frequency || undefined,
    })
  }, [category, frequency, fetchClubs])

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
          探索校园社团
        </Title>
        <Typography.Text type="secondary">
          发现志同道合的伙伴，开启精彩的校园生活
        </Typography.Text>
      </div>

      <div className="filter-bar">
        <Space size={24} wrap>
          <div>
            <span style={{ color: '#666', marginRight: 12, fontSize: 14 }}>
              社团类别：
            </span>
            <Segmented
              value={category}
              onChange={(val) => setCategory(val as ClubCategory | '')}
              options={categoryOptions.map((o) => ({
                label: o.label,
                value: o.value,
              }))}
            />
          </div>
          <div>
            <span style={{ color: '#666', marginRight: 12, fontSize: 14 }}>
              活动频次：
            </span>
            <Select
              value={frequency || undefined}
              onChange={(val) => setFrequency(val || '')}
              style={{ width: 140 }}
              options={frequencyOptions}
              placeholder="选择频次"
              allowClear
            />
          </div>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : clubs.length === 0 ? (
        <div style={{ padding: 80 }}>
          <Empty description="暂无符合条件的社团" />
        </div>
      ) : (
        <div className="club-card-grid">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Home
