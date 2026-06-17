import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCalendarAlt, FaMapMarkerAlt, FaUserShield } from 'react-icons/fa'
import { useStore } from '../../data/store'
import type { Activity } from '../../data/db'
import { v4 as uuidv4 } from 'uuid'

const PAGE_SIZE = 6

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const navigate = useNavigate()
  const getRegistrationCount = useStore((state) => state.getRegistrationCount)
  const [registered, setRegistered] = useState(0)

  useEffect(() => {
    setRegistered(getRegistrationCount(activity.id))
  }, [activity.id, getRegistrationCount])

  const progress = Math.min((registered / activity.maxParticipants) * 100, 100)
  const progressRounded = Math.round(progress)
  const isFull = registered >= activity.maxParticipants

  return (
    <div
      onClick={() => navigate(`/activity/${activity.id}`)}
      style={{
        width: 320,
        backgroundColor: '#1E1E2E',
        borderRadius: 16,
        border: '0.5px solid #3A3A5C',
        padding: 0,
        cursor: 'pointer',
        transition: 'all 0.3s ease-out',
        overflow: 'hidden',
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0px 0px 0px rgba(108, 99, 255, 0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#6C63FF'
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0px 8px 24px rgba(108, 99, 255, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#3A3A5C'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0px 0px 0px rgba(108, 99, 255, 0)'
      }}
    >
      {activity.poster ? (
        <img
          src={activity.poster}
          alt={activity.title}
          style={{
            width: '100%',
            height: 160,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: 160,
            background: 'linear-gradient(135deg, #6C63FF 0%, #E94560 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#ffffff', fontSize: 48, fontWeight: 700, opacity: 0.3 }}>
            {activity.title.charAt(0)}
          </span>
        </div>
      )}

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3
          style={{
            color: '#ffffff',
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 12,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: 50,
          }}
        >
          {activity.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <FaCalendarAlt size={14} color="#6C63FF" />
          <span style={{ color: '#B0B0C3', fontSize: 13 }}>
            {activity.date} {activity.time}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <FaMapMarkerAlt size={14} color="#E94560" />
          <span style={{ color: '#B0B0C3', fontSize: 13 }}>{activity.location}</span>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ color: '#B0B0C3', fontSize: 12 }}>
              报名人数
            </span>
            <span
              style={{
                color: isFull ? '#E94560' : '#6C63FF',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {registered}/{activity.maxParticipants}
              {isFull && ' 已满'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 6,
                backgroundColor: '#3A3A5C',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6C63FF 0%, #E94560 100%)',
                  borderRadius: 3,
                  transition: 'width 0.5s ease-out',
                }}
              />
            </div>
            <span
              style={{
                color: '#B0B0C3',
                fontSize: 12,
                fontWeight: 500,
                minWidth: 32,
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {progressRounded}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityList() {
  const navigate = useNavigate()
  const activities = useStore((state) => state.activities)
  const addActivity = useStore((state) => state.addActivity)
  const [currentPage, setCurrentPage] = useState(1)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (activities.length === 0) {
      setShowWelcome(true)
    }
  }, [activities.length])

  const handleAddDemoData = async () => {
    const demoActivities: Omit<Activity, 'id'>[] = [
      {
        title: '校园歌手大赛',
        description: '一年一度的校园歌手大赛即将拉开帷幕！无论你是流行唱法还是民族唱法，都可以在这里展示你的歌喉。现场还有专业评委点评和丰厚奖品等你来拿！',
        date: '2026-07-15',
        time: '19:00',
        location: '学校大礼堂',
        maxParticipants: 20,
      },
      {
        title: '编程马拉松',
        description: '48小时不间断编程挑战！组队完成创意项目，展示你的技术实力。奖品包括实习机会和技术书籍大礼包。欢迎所有编程爱好者参加！',
        date: '2026-07-20',
        time: '09:00',
        location: '计算机学院实验楼',
        maxParticipants: 30,
      },
      {
        title: '摄影作品展',
        description: '记录生活中的美好瞬间，用镜头讲述你的故事。本次摄影展主题为"光影校园"，所有作品将在校内展出，优秀作品可获得精美奖品。',
        date: '2026-07-25',
        time: '10:00',
        location: '艺术楼展厅',
        maxParticipants: 50,
      },
      {
        title: '英语角活动',
        description: '提升英语口语，结交志同道合的朋友。每周英语角邀请外教与大家交流，还有有趣的互动游戏和话题讨论。欢迎所有英语爱好者！',
        date: '2026-07-10',
        time: '16:00',
        location: '外语学院咖啡厅',
        maxParticipants: 25,
      },
      {
        title: '创业分享会',
        description: '邀请优秀校友创业者分享他们的创业故事和经验。内容涵盖创业思路、融资经验、团队管理等，还有现场问答环节。',
        date: '2026-07-18',
        time: '14:00',
        location: '创新创业中心',
        maxParticipants: 40,
      },
      {
        title: '篮球友谊赛',
        description: '各学院之间的篮球友谊赛，以球会友，增强体质。欢迎各年级同学报名参赛，也欢迎观众到场加油助威！',
        date: '2026-07-22',
        time: '15:00',
        location: '学校体育馆',
        maxParticipants: 24,
      },
    ]

    for (const act of demoActivities) {
      await addActivity({ ...act, id: uuidv4() })
    }
    setShowWelcome(false)
  }

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE))
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const pageActivities = activities.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#16162A' }}>
      <header
        style={{
          padding: '24px 48px',
          backgroundColor: '#1E1E2E',
          borderBottom: '0.5px solid #3A3A5C',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div>
          <h1
            style={{
              color: '#ffffff',
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            社团活动中心
          </h1>
          <p style={{ color: '#B0B0C3', fontSize: 14 }}>
            发现精彩活动，开启校园生活
          </p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            backgroundColor: '#2A2A4E',
            color: '#B0B0C3',
            borderRadius: 8,
            fontSize: 14,
            transition: 'all 0.3s ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3A3A5C'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2A2A4E'
            e.currentTarget.style.color = '#B0B0C3'
          }}
        >
          <FaUserShield size={16} />
          管理员登录
        </button>
      </header>

      <main style={{ padding: 48 }}>
        {showWelcome && activities.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'linear-gradient(135deg, #6C63FF 0%, #E94560 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 36 }}>🎉</span>
            </div>
            <h2 style={{ color: '#ffffff', fontSize: 24, marginBottom: 12 }}>
              欢迎使用社团活动管理系统
            </h2>
            <p style={{ color: '#B0B0C3', fontSize: 14, marginBottom: 24, maxWidth: 400 }}>
              目前还没有活动，您可以先添加一些示例活动，或者以管理员身份登录创建新活动。
            </p>
            <button
              onClick={handleAddDemoData}
              style={{
                padding: '12px 32px',
                backgroundColor: '#6C63FF',
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.3s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5A52D8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6C63FF'
              }}
            >
              加载示例活动
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: 32,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ color: '#ffffff', fontSize: 20, fontWeight: 600 }}>
                全部活动 <span style={{ color: '#6C63FF' }}>({activities.length})</span>
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 320px)',
                gap: 24,
                justifyContent: 'flex-start',
                marginBottom: 48,
              }}
            >
              {pageActivities.map((activity, i) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  index={startIdx + i}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: currentPage === page ? '#6C63FF' : '#3A3A5C',
                      color: '#ffffff',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: currentPage === page ? 600 : 400,
                      transition: 'all 0.3s ease-out',
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ActivityList
