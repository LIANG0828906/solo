import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimelineStore } from '../store';
import { truncateText, darkenColor, formatRelativeTime } from '../constants';
import type { Timeline } from '../types';

const HomePage = () => {
  const navigate = useNavigate();
  const timelines = useTimelineStore((state) => state.timelines);
  const addTimeline = useTimelineStore((state) => state.addTimeline);
  const getEventsByTimelineId = useTimelineStore((state) => state.getEventsByTimelineId);
  const deleteTimeline = useTimelineStore((state) => state.deleteTimeline);
  const isLoading = useTimelineStore((state) => state.isLoading);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateTimeline = async () => {
    if (!title.trim()) return;

    const newTimeline = await addTimeline(title.trim(), description.trim());
    setShowModal(false);
    setTitle('');
    setDescription('');
    navigate(`/timeline/${newTimeline.id}`);
  };

  const handleCardClick = (timeline: Timeline) => {
    navigate(`/timeline/${timeline.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条时间线吗？相关的所有事件也将被删除。')) {
      await deleteTimeline(id);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}>
        <div style={{ color: '#888899', fontSize: '16px' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 600,
        marginBottom: '8px',
        color: '#E0E0E0',
      }}>
        时间线事件管理
      </h1>
      <p style={{
        color: '#888899',
        marginBottom: '40px',
        fontSize: '14px',
      }}>
        创建、编辑和分享你的时间线，让历史事件和项目里程碑清晰呈现
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '48px',
      }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            width: '240px',
            height: '48px',
            backgroundColor: '#6C63FF',
            color: '#FFFFFF',
            fontSize: '16px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = darkenColor('#6C63FF', 10);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6C63FF';
          }}
        >
          + 新建时间线
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 300px)',
        gap: '24px',
        justifyContent: 'center',
      }}>
        {timelines.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            color: '#888899',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <div style={{ fontSize: '16px' }}>还没有时间线，点击上方按钮创建第一条吧</div>
          </div>
        ) : (
          timelines.map((timeline) => {
            const eventCount = getEventsByTimelineId(timeline.id).length;
            return (
              <div
                key={timeline.id}
                onClick={() => handleCardClick(timeline)}
                style={{
                  width: '300px',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#1E1E2E',
                  borderRadius: '12px',
                  border: '0.5px solid #3A3A5C',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                  position: 'relative',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <button
                  onClick={(e) => handleDelete(e, timeline.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'transparent',
                    color: '#F50057',
                    fontSize: '18px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(245, 0, 87, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ×
                </button>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: '#E0E0E0',
                  paddingRight: '24px',
                }}>
                  {timeline.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#888899',
                  marginBottom: '16px',
                  lineHeight: 1.5,
                  minHeight: '42px',
                }}>
                  {truncateText(timeline.description, 60)}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: 'auto',
                  paddingTop: '12px',
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#6C63FF',
                    fontWeight: 500,
                    pointerEvents: 'none',
                  }}>
                    {eventCount} 个事件
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#666677',
                    pointerEvents: 'none',
                    paddingLeft: '12px',
                  }}>
                    {formatRelativeTime(timeline.updatedAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#00000066',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1E1E2E',
              borderRadius: '16px',
              padding: '32px',
              width: '420px',
              maxWidth: '90vw',
            }}
          >
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '24px',
              color: '#E0E0E0',
            }}>
              新建时间线
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#888899',
                marginBottom: '8px',
              }}>
                标题 <span style={{ color: '#F50057' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                placeholder="请输入时间线标题"
                style={{
                  width: '360px',
                  maxWidth: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#2D2D3F',
                  border: '1px solid #4A4A6E',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6C63FF';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4A4A6E';
                }}
              />
              <div style={{
                fontSize: '12px',
                color: '#666677',
                marginTop: '4px',
                textAlign: 'right',
              }}>
                {title.length}/50
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#888899',
                marginBottom: '8px',
              }}>
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入时间线描述（可选）"
                style={{
                  width: '360px',
                  maxWidth: '100%',
                  height: '120px',
                  padding: '12px 16px',
                  backgroundColor: '#2D2D3F',
                  border: '1px solid #4A4A6E',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  resize: 'none',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6C63FF';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4A4A6E';
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#888899',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2D2D3F';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateTimeline}
                disabled={!title.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: title.trim() ? '#6C63FF' : '#3A3A5C',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: title.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (title.trim()) {
                    e.currentTarget.style.backgroundColor = darkenColor('#6C63FF', 10);
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = title.trim() ? '#6C63FF' : '#3A3A5C';
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
