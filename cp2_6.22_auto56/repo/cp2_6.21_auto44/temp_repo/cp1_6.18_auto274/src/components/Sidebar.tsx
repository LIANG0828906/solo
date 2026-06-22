import { useState } from 'react';
import { Users, MapPin, Menu, X, LogOut, ChevronRight } from 'lucide-react';
import { useMarkersStore } from '../store/markersStore';
import { disconnectSocket } from '../utils/socket';

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const { users, markers, currentUser, roomId, selectedMarkerId, setSelectedMarker } =
    useMarkersStore();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'markers'>('users');

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toTimeString().slice(0, 8);
  };

  const handleLogout = () => {
    disconnectSocket();
    onLogout();
  };

  const sidebarWidth = isOpen ? '280px' : '0';
  const toggleButtonLeft = isOpen ? '280px' : '0';

  return (
    <>
      <div
        className="sidebar"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: sidebarWidth,
          height: '100%',
          background: 'rgba(30, 39, 58, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 60,
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            whiteSpace: 'nowrap',
          }}
        >
          <div>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
              房间 #{roomId}
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '2px' }}>
              {markers.length} 个标记 · {users.length} 人在线
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={() => setActiveTab('users')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              color: activeTab === 'users' ? '#3498DB' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: activeTab === 'users' ? '2px solid #3498DB' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <Users size={16} />
            用户
          </button>
          <button
            onClick={() => setActiveTab('markers')}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              color: activeTab === 'markers' ? '#3498DB' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderBottom: activeTab === 'markers' ? '2px solid #3498DB' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <MapPin size={16} />
            标记
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: user.id === currentUser?.id
                      ? 'rgba(52, 152, 219, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: user.id === currentUser?.id
                      ? '1px solid rgba(52, 152, 219, 0.3)'
                      : '1px solid transparent',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#1ABC9C',
                      flexShrink: 0,
                      boxShadow: '0 0 8px rgba(26, 188, 156, 0.6)',
                    }}
                  />
                  <span
                    style={{
                      color: '#fff',
                      fontSize: '13px',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.nickname}
                  </span>
                  {user.id === currentUser?.id && (
                    <span
                      style={{
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '11px',
                      }}
                    >
                      我
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'markers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {markers.length === 0 ? (
                <p
                  style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '12px',
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  暂无标记，点击模型添加
                </p>
              ) : (
                markers.map((marker) => (
                  <div
                    key={marker.id}
                    onClick={() => setSelectedMarker(marker.id)}
                    style={{
                      padding: '10px 12px',
                      background: selectedMarkerId === marker.id
                        ? 'rgba(255, 215, 0, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedMarkerId === marker.id
                        ? '1px solid rgba(255, 215, 0, 0.3)'
                        : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedMarkerId !== marker.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMarkerId !== marker.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#FFD700',
                        }}
                      />
                      <span
                        style={{
                          color: '#FFD700',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {marker.author}
                      </span>
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.4)',
                          fontSize: '10px',
                        }}
                      >
                        {formatTime(marker.createdAt)}
                      </span>
                    </div>
                    <p
                      style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '12px',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {marker.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(231, 76, 60, 0.1)',
              border: '1px solid rgba(231, 76, 60, 0.3)',
              borderRadius: '8px',
              color: '#E74C3C',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
            }}
          >
            <LogOut size={16} />
            退出房间
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          top: '16px',
          left: toggleButtonLeft,
          width: '32px',
          height: '32px',
          background: 'rgba(30, 39, 58, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: isOpen ? '0 6px 6px 0' : '6px',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 55,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.3s ease',
          marginLeft: isOpen ? '-1px' : '16px',
        }}
      >
        {isOpen ? <ChevronRight size={18} /> : <Menu size={18} />}
      </button>
    </>
  );
}
