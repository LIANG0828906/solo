import { useState } from 'react';
import { useAppStore, type Appointment } from '../stores/appStore';
import { catalog, type Course } from '../data/courseData';
import CourseCard from './CourseCard';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div
      className="modal-overlay"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 24,
          minWidth: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <p style={{ fontSize: 16, color: '#2D3436', marginBottom: 24, textAlign: 'center' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={cancelBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E0E0E0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F0F0F0')}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            style={confirmBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#C0392B')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#E74C3C')}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

const cancelBtnStyle: React.CSSProperties = {
  border: 'none',
  padding: '10px 24px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  background: '#F0F0F0',
  color: '#2D3436',
  transition: 'background 0.2s',
};

const confirmBtnStyle: React.CSSProperties = {
  border: 'none',
  padding: '10px 24px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  background: '#E74C3C',
  color: 'white',
  transition: 'background 0.2s',
};

type TabType = 'appointments' | 'favorites';

function UserProfile() {
  const [activeTab, setActiveTab] = useState<TabType>('appointments');
  const appointments = useAppStore((state) => state.appointments);
  const removeAppointment = useAppStore((state) => state.removeAppointment);
  const favoriteIds = useAppStore((state) => state.favoriteIds);

  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const getCourseName = (courseId: string): string => {
    const course = catalog.find((c) => c.id === courseId);
    return course?.name || '未知课程';
  };

  const favoriteCourses: Course[] = catalog.filter((course) => favoriteIds.includes(course.id));

  const handleRemoveAppointment = (appointmentId: string) => {
    removeAppointment(appointmentId);
    setShowConfirm(null);
  };

  const containerStyle: React.CSSProperties = {
    paddingTop: 80,
    paddingBottom: 40,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  };

  const tabContainerStyle: React.CSSProperties = {
    marginBottom: 24,
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '12px 24px',
    fontSize: 16,
    cursor: 'pointer',
    position: 'relative',
    color: isActive ? '#5B9279' : '#636E72',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '3px solid #5B9279' : '3px solid transparent',
    transition: 'all 0.2s',
  });

  const appointmentItemStyle: React.CSSProperties = {
    background: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const getStatusStyle = (status: Appointment['status']): React.CSSProperties => ({
    borderRadius: 12,
    padding: '4px 12px',
    fontSize: 12,
    color: 'white',
    background: status === '已预约' ? '#F5A623' : '#5B9279',
  });

  const [cancelBtnHovered, setCancelBtnHovered] = useState<string | null>(null);
  const [cancelBtnActive, setCancelBtnActive] = useState<string | null>(null);

  const getCancelBtnStyle = (appointmentId: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      background: '#E74C3C',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: 6,
      cursor: 'pointer',
      transition: 'background 0.2s, transform 0.1s',
    };
    if (cancelBtnHovered === appointmentId) {
      base.background = '#C0392B';
    }
    if (cancelBtnActive === appointmentId) {
      base.transform = 'scale(0.95)';
    }
    return base;
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#636E72',
    padding: '40px 0',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 24,
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>个人中心</h1>

      <div style={tabContainerStyle}>
        <span
          style={getTabStyle(activeTab === 'appointments')}
          onClick={() => setActiveTab('appointments')}
        >
          我的预约
        </span>
        <span
          style={getTabStyle(activeTab === 'favorites')}
          onClick={() => setActiveTab('favorites')}
        >
          我的收藏
        </span>
      </div>

      {activeTab === 'appointments' && (
        <div>
          {appointments.length === 0 ? (
            <div style={emptyStateStyle}>暂无预约记录</div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} style={appointmentItemStyle}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2D3436' }}>
                    {getCourseName(appointment.courseId)}
                  </div>
                  <div style={{ fontSize: 14, color: '#636E72', marginTop: 4 }}>
                    {appointment.time}
                  </div>
                </div>
                <span style={getStatusStyle(appointment.status)}>
                  {appointment.status}
                </span>
                <button
                  style={getCancelBtnStyle(appointment.id)}
                  onClick={() => setShowConfirm(appointment.id)}
                  onMouseEnter={() => setCancelBtnHovered(appointment.id)}
                  onMouseLeave={() => { setCancelBtnHovered(null); setCancelBtnActive(null); }}
                  onMouseDown={() => setCancelBtnActive(appointment.id)}
                  onMouseUp={() => setCancelBtnActive(null)}
                >
                  取消预约
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {favoriteCourses.length === 0 ? (
            <div style={emptyStateStyle}>暂无收藏课程</div>
          ) : (
            <div style={gridStyle}>
              {favoriteCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      )}

      {showConfirm && (
        <ConfirmModal
          message="确定要取消此预约吗？"
          onConfirm={() => handleRemoveAppointment(showConfirm)}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </div>
  );
}

export default UserProfile;
