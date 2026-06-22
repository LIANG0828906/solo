import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, type CourseType } from '../data/courseData';
import { useAppStore } from '../stores/appStore';
import { useToast } from '../App';

const typeStyles: Record<CourseType, React.CSSProperties> = {
  '陶艺': { background: '#DDB892', color: '#2D3436' },
  '皮具': { background: '#8B5E3C', color: 'white' },
  '木工': { background: '#A68A64', color: 'white' },
};

interface ImageModalProps {
  image: string;
  onClose: () => void;
}

function ImageModal({ image, onClose }: ImageModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <img
        src={image}
        alt="作品展示"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: 8,
        }}
      />
    </div>
  );
}

function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const course = id ? getCourseById(id) : undefined;

  const addAppointment = useAppStore((state) => state.addAppointment);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const favoriteIds = useAppStore((state) => state.favoriteIds);

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [modalImage, setModalImage] = useState<string>('');

  if (!course) {
    return <div style={{ paddingTop: 80, paddingBottom: 40, color: '#636E72' }}>课程不存在</div>;
  }

  const isFavorited = favoriteIds.includes(course.id);

  const handleAppointment = () => {
    if (!selectedTime || !userName.trim()) {
      showToast('error', '请选择时间段并填写姓名');
      return;
    }
    addAppointment({ courseId: course.id, time: selectedTime, name: userName.trim() });
    showToast('success', '预约成功！');
    setTimeout(() => {
      navigate('/profile');
    }, 2000);
  };

  const openImageModal = (image: string) => {
    setModalImage(image);
    setShowImageModal(true);
  };

  const containerStyle: React.CSSProperties = {
    paddingTop: 80,
    paddingBottom: 40,
  };

  const coverImageStyle: React.CSSProperties = {
    width: 600,
    maxWidth: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 24,
    objectFit: 'cover',
    display: 'block',
  };

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  };

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    marginTop: 12,
  };

  const descStyle: React.CSSProperties = {
    marginTop: 24,
    lineHeight: 1.8,
    color: '#636E72',
    fontSize: 15,
  };

  const worksTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 32,
    marginBottom: 16,
  };

  const worksContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  };

  const workThumbStyle: React.CSSProperties = {
    width: 120,
    height: 120,
    borderRadius: 4,
    objectFit: 'cover',
    cursor: 'pointer',
    transition: 'transform 0.3s',
  };

  const appointmentCardStyle: React.CSSProperties = {
    background: 'white',
    padding: 24,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginTop: 32,
  };

  const formLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    color: '#2D3436',
    marginBottom: 8,
  };

  const selectStyle: React.CSSProperties = {
    border: '1px solid #DDB892',
    padding: '8px 12px',
    borderRadius: 4,
    width: '100%',
    marginBottom: 16,
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: 14,
    background: 'white',
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid #DDB892',
    padding: '8px 12px',
    borderRadius: 4,
    width: '100%',
    marginBottom: 20,
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: 14,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const favoriteBtnStyle: React.CSSProperties = {
    fontSize: 24,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    color: isFavorited ? '#E76F51' : '#CCC',
  };

  const submitBtnStyle: React.CSSProperties = {
    background: '#5B9279',
    color: 'white',
    width: 200,
    height: 48,
    borderRadius: 8,
    fontSize: 16,
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
  };

  const [submitHovered, setSubmitHovered] = useState(false);
  const [submitActive, setSubmitActive] = useState(false);

  const getSubmitBtnStyle = (): React.CSSProperties => {
    let style = { ...submitBtnStyle };
    if (submitHovered) {
      style.background = '#4A7A63';
    }
    if (submitActive) {
      style.transform = 'scale(0.95)';
    }
    return style;
  };

  return (
    <div style={containerStyle}>
      <img src={course.coverImage} alt={course.name} style={coverImageStyle} className="course-cover-image" />

      <div style={titleRowStyle}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#2D3436' }}>{course.name}</h1>
        <span
          style={{
            ...typeStyles[course.type],
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
          }}
        >
          {course.type}
        </span>
      </div>

      <div style={infoRowStyle}>
        <span style={{ fontSize: 16, color: '#636E72' }}>导师：{course.teacher}</span>
        <span style={{ fontSize: 16, color: '#E76F51', fontWeight: 'bold' }}>¥{course.price}</span>
        <span style={{ fontSize: 16, color: '#636E72' }}>{course.duration}</span>
      </div>

      <p style={descStyle}>{course.description}</p>

      <div>
        <h2 style={worksTitleStyle}>学员作品</h2>
        <div style={worksContainerStyle}>
          {course.works.map((work, index) => (
            <WorkThumb
              key={index}
              src={work}
              onClick={() => openImageModal(work)}
            />
          ))}
        </div>
      </div>

      <div style={appointmentCardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>预约课程</h2>

        <label style={formLabelStyle}>选择时间段</label>
        <select
          style={selectStyle}
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#5B9279')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#DDB892')}
        >
          <option value="">请选择时间段</option>
          {course.availableTimes.map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>

        <label style={formLabelStyle}>您的姓名</label>
        <input
          type="text"
          style={inputStyle}
          placeholder="请输入您的姓名"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#5B9279')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#DDB892')}
        />

        <div style={buttonRowStyle}>
          <button
            style={favoriteBtnStyle}
            onClick={() => toggleFavorite(course.id)}
          >
            ❤
          </button>
          <button
            style={getSubmitBtnStyle()}
            onClick={handleAppointment}
            onMouseEnter={() => setSubmitHovered(true)}
            onMouseLeave={() => { setSubmitHovered(false); setSubmitActive(false); }}
            onMouseDown={() => setSubmitActive(true)}
            onMouseUp={() => setSubmitActive(false)}
          >
            立即预约
          </button>
        </div>
      </div>

      {showImageModal && (
        <ImageModal image={modalImage} onClose={() => setShowImageModal(false)} />
      )}
    </div>
  );
}

interface WorkThumbProps {
  src: string;
  onClick: () => void;
}

function WorkThumb({ src, onClick }: WorkThumbProps) {
  const [hovered, setHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    width: 120,
    height: 120,
    borderRadius: 4,
    objectFit: 'cover',
    cursor: 'pointer',
    transition: 'transform 0.3s',
    transform: hovered ? 'scale(1.1)' : 'scale(1)',
  };

  return (
    <img
      src={src}
      alt="学员作品"
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    />
  );
}

export default CourseDetail;
