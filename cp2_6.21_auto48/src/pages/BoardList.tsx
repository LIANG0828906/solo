import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IBoardRoom } from '../types';
import { getBoardRooms, createBoardRoom } from '../api/boardApi';

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const BoardList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<IBoardRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await getBoardRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch board rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openModal = () => {
    setName('');
    setDescription('');
    setNameError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.length < 2 || name.length > 20) {
      setNameError('房间名称必须为2-20个字符');
      return;
    }

    setSubmitting(true);
    try {
      await createBoardRoom({ name, description });
      closeModal();
      fetchRooms();
    } catch (error) {
      console.error('Failed to create board room:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '16px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
  };

  const createButtonStyle: React.CSSProperties = {
    padding: '12px 28px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#764ba2',
    background: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.2s',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  };

  const cardStyle: React.CSSProperties = {
    width: '300px',
    justifySelf: 'center',
    padding: '24px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 12px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const cardDescStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
    minHeight: '42px',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  };

  const cardMetaStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#888',
    paddingTop: '12px',
    borderTop: '1px solid rgba(0,0,0,0.06)',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'rgba(118, 75, 162, 0.1)',
    color: '#764ba2',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#fff',
    fontSize: '18px',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 20px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '18px',
  };

  const modalOverlayStyle: React.CSSProperties = {
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
    padding: '20px',
  };

  const modalStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  };

  const modalTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 24px 0',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
    marginBottom: '8px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    marginBottom: '16px',
    fontFamily: 'inherit',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: '100px',
  };

  const errorTextStyle: React.CSSProperties = {
    color: '#e91e63',
    fontSize: '13px',
    marginTop: '-12px',
    marginBottom: '12px',
  };

  const modalActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
  };

  const buttonBaseStyle: React.CSSProperties = {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: '#f5f5f5',
    color: '#666',
  };

  const submitButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>创意脑暴工作坊</h1>
          <button
            onClick={openModal}
            style={createButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            + 创建新脑暴室
          </button>
        </div>

        {loading ? (
          <div style={loadingStyle}>加载中...</div>
        ) : rooms.length === 0 ? (
          <div style={emptyStyle}>暂无脑暴室，点击上方按钮创建一个吧！</div>
        ) : (
          <div style={gridStyle}>
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(`/board/${room.id}`)}
                style={cardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
              >
                <h3 style={cardTitleStyle}>{room.name}</h3>
                <p style={cardDescStyle}>
                  {room.description || '暂无描述'}
                </p>
                <div style={cardMetaStyle}>
                  <span>{formatDate(room.createdAt)}</span>
                  <span style={badgeStyle}>
                    💡 {room.creatives?.length || 0} 个创意
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div style={modalOverlayStyle} onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>创建新脑暴室</h2>
            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>房间名称 <span style={{ color: '#e91e63' }}>*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="请输入房间名称（2-20字符）"
                style={{
                  ...inputStyle,
                  borderColor: nameError ? '#e91e63' : '#e0e0e0',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = nameError ? '#e91e63' : '#e0e0e0';
                }}
                maxLength={20}
              />
              {nameError && <div style={errorTextStyle}>{nameError}</div>}

              <label style={labelStyle}>房间描述（可选）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入房间描述..."
                style={textareaStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              />

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={cancelButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eeeeee';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...submitButtonStyle,
                    opacity: submitting ? 0.6 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardList;
