import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, fetchRooms, createRoom } from '../api/debateApi';

const DebateList: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch (e) {
      console.error('Failed to load rooms', e);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !topic.trim()) return;
    try {
      const room = await createRoom(name.trim(), topic.trim());
      setRooms([...rooms, room]);
      setShowModal(false);
      setName('');
      setTopic('');
    } catch (e) {
      console.error('Failed to create room', e);
    }
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, color: '#1e3a5f', fontSize: '28px', fontWeight: 700 }}>辩论赛实时模拟</h1>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: '#1890ff',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#40a9ff')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1890ff')}
          >
            创建房间
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => navigate(`/room/${room.id}`)}
              className="card-hover"
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e3a5f', fontWeight: 600 }}>{room.name}</h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: room.status === 'active' ? '#e6f7ff' : '#f5f5f5',
                    color: room.status === 'active' ? '#1890ff' : '#8c8c8c',
                  }}
                >
                  {room.status === 'active' ? '进行中' : '已结束'}
                </span>
              </div>
              <p style={{ margin: '0 0 12px 0', color: '#595959', fontSize: '14px', lineHeight: 1.5 }}>
                {room.topic.length > 60 ? room.topic.substring(0, 60) + '...' : room.topic}
              </p>
              <div style={{ display: 'flex', color: '#8c8c8c', fontSize: '13px' }}>
                <span>👥 {room.participants} 人参与</span>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              animation: 'fadeIn 0.3s',
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                width: '480px',
                maxWidth: '90%',
              }}
            >
              <h2 style={{ margin: '0 0 20px 0', color: '#1e3a5f', fontSize: '20px' }}>创建辩论房间</h2>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#595959', fontSize: '14px' }}>房间名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入房间名称"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1890ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#595959', fontSize: '14px' }}>辩论议题</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="请输入辩论议题，如：AI是否应该拥有法律人格"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1890ff')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#d9d9d9')}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 20px',
                    border: '1px solid #d9d9d9',
                    background: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#595959',
                    transition: 'all 0.3s',
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  style={{
                    padding: '8px 20px',
                    border: 'none',
                    background: '#1890ff',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.3s',
                  }}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebateList;
