import React, { useState } from 'react';
import { Event, Participant } from './types';

interface ManageEventsProps {
  events: Event[];
}

const ManageEvents: React.FC<ManageEventsProps> = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'signed'>('enrolled');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredParticipants = (participants: Participant[]) => {
    if (!searchQuery.trim()) return participants;
    
    const query = searchQuery.toLowerCase();
    return participants.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.phone.includes(query)
    );
  };

  const enrolledParticipants = selectedEvent
    ? filteredParticipants(selectedEvent.participants)
    : [];

  const signedParticipants = selectedEvent
    ? filteredParticipants(selectedEvent.participants.filter(p => p.signedIn))
    : [];

  const displayParticipants = activeTab === 'enrolled'
    ? enrolledParticipants
    : signedParticipants;

  return (
    <div>
      <div className="manage-header">
        <h2 style={{ color: '#3B4A6B' }}>活动管理</h2>
      </div>

      {!selectedEvent ? (
        <div className="manage-list">
          {events.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📊</div>
              <p>暂无活动数据</p>
            </div>
          ) : (
            events.map(event => {
              const signedInCount = event.participants.filter(p => p.signedIn).length;
              
              return (
                <div
                  key={event.id}
                  className="event-manage-card"
                  onClick={() => setSelectedEvent(event)}
                >
                  <h3 style={{ color: '#3B4A6B', marginBottom: '8px' }}>{event.name}</h3>
                  <p style={{ color: '#666', marginBottom: '4px' }}>
                    📅 {formatDate(event.date)} | ⏱️ {event.duration}分钟 | 📍 {event.location}
                  </p>
                  <p style={{ color: '#666' }}>
                    👥 报名人数：{event.participants.length} / {event.capacity}
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    ✅ 已签到：{signedInCount} 人
                  </p>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div>
          <button
            className="back-btn"
            style={{ marginBottom: '20px' }}
            onClick={() => {
              setSelectedEvent(null);
              setSearchQuery('');
            }}
          >
            ← 返回活动列表
          </button>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h2 style={{ color: '#3B4A6B', marginBottom: '12px' }}>{selectedEvent.name}</h2>
            <p style={{ color: '#666' }}>
              📅 {formatDate(selectedEvent.date)} | ⏱️ {selectedEvent.duration}分钟 | 📍 {selectedEvent.location}
            </p>
            <p style={{ color: '#666', marginTop: '4px' }}>
              👥 报名人数：{selectedEvent.participants.length} / {selectedEvent.capacity}
              &nbsp;&nbsp;|&nbsp;&nbsp;
              ✅ 已签到：{selectedEvent.participants.filter(p => p.signedIn).length} 人
            </p>
          </div>

          <div className="manage-header">
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className={`tab-btn ${activeTab === 'enrolled' ? 'active' : ''}`}
                onClick={() => setActiveTab('enrolled')}
              >
                报名列表 ({selectedEvent.participants.length})
              </button>
              <button
                className={`tab-btn ${activeTab === 'signed' ? 'active' : ''}`}
                onClick={() => setActiveTab('signed')}
              >
                签到列表 ({selectedEvent.participants.filter(p => p.signedIn).length})
              </button>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="搜索姓名或手机号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="table-container">
            {displayParticipants.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <p>{searchQuery ? '未找到匹配的参与者' : (activeTab === 'enrolled' ? '暂无报名数据' : '暂无签到数据')}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>姓名</th>
                    <th>手机号</th>
                    <th>报名时间</th>
                    {activeTab === 'signed' && <th>签到时间</th>}
                    {activeTab === 'enrolled' && <th>签到状态</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayParticipants.map((participant, index) => (
                    <tr key={participant.id}>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: '500' }}>{participant.name}</td>
                      <td>{participant.phone}</td>
                      <td>{formatDateTime(participant.enrolledAt)}</td>
                      {activeTab === 'signed' && (
                        <td>{participant.signedInAt ? formatDateTime(participant.signedInAt) : '-'}</td>
                      )}
                      {activeTab === 'enrolled' && (
                        <td>
                          <span className={`status-badge ${participant.signedIn ? 'status-signed' : 'status-pending'}`}>
                            {participant.signedIn ? '已签到' : '待签到'}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;
