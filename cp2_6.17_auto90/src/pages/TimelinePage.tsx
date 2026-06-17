import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTimelineStore } from '../store';
import { COLOR_PRESETS, formatDate, darkenColor, lightenColor } from '../constants';
import type { Event } from '../types';

const TimelinePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const timelineRef = useRef<HTMLDivElement>(null);

  const getTimelineById = useTimelineStore((state) => state.getTimelineById);
  const getEventsByTimelineId = useTimelineStore((state) => state.getEventsByTimelineId);
  const addEvent = useTimelineStore((state) => state.addEvent);
  const updateEvent = useTimelineStore((state) => state.updateEvent);
  const deleteEvent = useTimelineStore((state) => state.deleteEvent);
  const exportTimeline = useTimelineStore((state) => state.exportTimeline);
  const importTimeline = useTimelineStore((state) => state.importTimeline);

  const timeline = id ? getTimelineById(id) : undefined;
  const events = id ? getEventsByTimelineId(id) : [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [exportAnimating, setExportAnimating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    if (events.length === 0) {
      const today = new Date();
      return { min: today, max: today };
    }
    const dates = events.map((e) => new Date(e.date).getTime());
    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates)),
    };
  }, [events]);

  const getDotPosition = (event: Event) => {
    if (events.length <= 1) return 50;
    const eventTime = new Date(event.date).getTime();
    const minTime = dateRange.min.getTime();
    const maxTime = dateRange.max.getTime();
    const range = maxTime - minTime;
    if (range === 0) return 50;
    return ((eventTime - minTime) / range) * 100;
  };

  const resetForm = () => {
    setEventTitle('');
    setEventDate('');
    setEventDescription('');
    setSelectedColor(COLOR_PRESETS[0]);
    setShowAddForm(false);
    setEditingEvent(null);
  };

  const handleAddEvent = async () => {
    if (!id || !eventTitle.trim() || !eventDate) return;

    if (editingEvent) {
      await updateEvent(editingEvent.id, {
        title: eventTitle.trim(),
        date: eventDate,
        description: eventDescription.trim(),
        color: selectedColor,
      });
    } else {
      await addEvent(id, {
        title: eventTitle.trim(),
        date: eventDate,
        description: eventDescription.trim(),
        color: selectedColor,
      });
    }

    resetForm();
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventDescription(event.description);
    setSelectedColor(event.color);
    setShowAddForm(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('确定要删除这个事件吗？')) {
      await deleteEvent(eventId);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      const data = await exportTimeline(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.timeline.title}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportAnimating(true);
      setTimeout(() => setExportAnimating(false), 500);
    } catch (error) {
      alert('导出失败：' + (error as Error).message);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.timeline || !Array.isArray(data.events)) {
        throw new Error('无效的文件格式');
      }
      await importTimeline(data);
      setShowImportModal(false);
      alert('导入成功！');
    } catch (error) {
      alert('导入失败：' + (error as Error).message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImportFile(file);
    }
  };

  const scrollToEvent = (eventId: string) => {
    const element = document.getElementById(`event-${eventId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!timeline) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <div style={{ color: '#888899', fontSize: '16px', marginBottom: '20px' }}>
          时间线不存在
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6C63FF',
            color: '#FFFFFF',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#888899',
              fontSize: '14px',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2D2D3F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ← 返回
          </button>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#E0E0E0',
            }}>
              {timeline.title}
            </h1>
            {timeline.description && (
              <p style={{ color: '#888899', fontSize: '14px', marginTop: '4px' }}>
                {timeline.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1E1E2E',
              color: '#E0E0E0',
              border: '1px solid #3A3A5C',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2D2D3F';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1E1E2E';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {exportAnimating ? '✓' : '⬇'} 导出
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1E1E2E',
              color: '#E0E0E0',
              border: '1px solid #3A3A5C',
              borderRadius: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2D2D3F';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1E1E2E';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ⬆ 导入
          </button>
        </div>
      </div>

      {events.length > 0 && (
        <div
          style={{
            display: 'block',
            backgroundColor: '#1E1E2E',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            overflowX: 'auto',
          }}
        >
          <div style={{
            position: 'relative',
            height: '40px',
            minWidth: '100%',
            width: Math.max(600, events.length * 40),
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              height: '2px',
              backgroundColor: '#3A3A5C',
              transform: 'translateY(-50%)',
            }} />
            {events.map((event) => {
              const position = getDotPosition(event);
              return (
                <div
                  key={event.id}
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: hoveredDot === event.id ? 10 : 1,
                  }}
                  onClick={() => scrollToEvent(event.id)}
                  onMouseEnter={() => setHoveredDot(event.id)}
                  onMouseLeave={() => setHoveredDot(null)}
                >
                  <div
                    style={{
                      width: hoveredDot === event.id ? '10px' : '6px',
                      height: hoveredDot === event.id ? '10px' : '6px',
                      borderRadius: '50%',
                      backgroundColor: event.color,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  {hoveredDot === event.id && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#1A1A2E',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      zIndex: 100,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    }}>
                      {event.title}
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderTop: '4px solid #1A1A2E',
                      }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          style={{
            padding: '12px 32px',
            backgroundColor: '#6C63FF',
            color: '#FFFFFF',
            fontSize: '14px',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = darkenColor('#6C63FF', 10);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6C63FF';
          }}
        >
          + 添加事件
        </button>
      </div>

      {showAddForm && (
        <div
          onClick={resetForm}
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
              width: '480px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '24px',
              color: '#E0E0E0',
            }}>
              {editingEvent ? '编辑事件' : '添加事件'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
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
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="请输入事件标题"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#2D2D3F',
                  border: '1px solid #4A4A6E',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; }}
                onBlur={(e) => { e.target.style.borderColor = '#4A4A6E'; }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#888899',
                marginBottom: '8px',
              }}>
                日期 <span style={{ color: '#F50057' }}>*</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#2D2D3F',
                  border: '1px solid #4A4A6E',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; }}
                onBlur={(e) => { e.target.style.borderColor = '#4A4A6E'; }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#888899',
                marginBottom: '8px',
              }}>
                描述
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="请输入事件描述（可选）"
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '12px 16px',
                  backgroundColor: '#2D2D3F',
                  border: '1px solid #4A4A6E',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  resize: 'none',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#6C63FF'; }}
                onBlur={(e) => { e.target.style.borderColor = '#4A4A6E'; }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: '#888899',
                marginBottom: '12px',
              }}>
                颜色标签
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: selectedColor === color ? '3px solid #FFFFFF' : '3px solid transparent',
                      transition: 'transform 0.2s ease',
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={resetForm}
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
                onClick={handleAddEvent}
                disabled={!eventTitle.trim() || !eventDate}
                style={{
                  padding: '12px 24px',
                  backgroundColor: eventTitle.trim() && eventDate ? '#6C63FF' : '#3A3A5C',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: eventTitle.trim() && eventDate ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (eventTitle.trim() && eventDate) {
                    e.currentTarget.style.backgroundColor = darkenColor('#6C63FF', 10);
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = eventTitle.trim() && eventDate ? '#6C63FF' : '#3A3A5C';
                }}
              >
                {editingEvent ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div ref={timelineRef} style={{ position: 'relative' }}>
        {events.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#888899',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <div style={{ fontSize: '16px' }}>还没有事件，点击上方按钮添加第一个事件吧</div>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '20px' }}>
            <div style={{
              position: 'absolute',
              left: '9px',
              top: '0',
              bottom: '0',
              width: '2px',
              backgroundColor: '#6C63FF',
            }} />

            {events.map((event, index) => (
              <div
                key={event.id}
                id={`event-${event.id}`}
                style={{
                  position: 'relative',
                  marginBottom: index === events.length - 1 ? '0' : '16px',
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: '-23px',
                  top: '24px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: event.color,
                  border: '3px solid #121221',
                  zIndex: 1,
                }} />

                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#2A2A3E',
                    borderRadius: '10px',
                    borderLeft: `4px solid ${event.color}`,
                    padding: '20px',
                    marginLeft: '20px',
                    transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#E0E0E0',
                      }}>
                        {event.title}
                      </h3>
                      <div style={{
                        fontSize: '12px',
                        color: '#6C63FF',
                        marginTop: '4px',
                      }}>
                        {formatDate(event.date)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditEvent(event)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'transparent',
                          color: '#888899',
                          fontSize: '12px',
                          borderRadius: '4px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3A3A5C';
                          e.currentTarget.style.color = '#E0E0E0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#888899';
                        }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'transparent',
                          color: '#F50057',
                          fontSize: '12px',
                          borderRadius: '4px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(245, 0, 87, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  {event.description && (
                    <p style={{
                      fontSize: '14px',
                      color: '#AAAAAA',
                      lineHeight: 1.6,
                    }}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showImportModal && (
        <div
          onClick={() => setShowImportModal(false)}
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
              width: '480px',
              maxWidth: '90vw',
            }}
          >
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '24px',
              color: '#E0E0E0',
            }}>
              导入时间线
            </h2>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              style={{
                border: isDragOver ? '2px solid #6C63FF' : '2px dashed #6C63FF',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragOver ? lightenColor('#1E1E2E', 10) : '#1E1E2E',
                transition: 'all 0.2s ease',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
              <div style={{ color: '#E0E0E0', marginBottom: '4px' }}>
                点击或拖拽JSON文件到此处
              </div>
              <div style={{ fontSize: '12px', color: '#888899' }}>
                支持 .json 格式文件
              </div>
              <input
                id="file-input"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowImportModal(false)}
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
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="display: block"][style*="backgroundColor: #1E1E2E"][style*="borderRadius: 12px"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TimelinePage;
