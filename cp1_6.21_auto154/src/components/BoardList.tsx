import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, User } from 'lucide-react';
import { Board } from '../types';

const BoardList: React.FC = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await axios.get('/api/boards');
      setBoards(response.data);
    } catch (error) {
      console.error('获取白板列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async () => {
    try {
      const response = await axios.post('/api/boards', {
        name: `白板 ${boards.length + 1}`,
      });
      navigate(`/board/${response.data.id}`);
    } catch (error) {
      console.error('创建白板失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          height: '60px',
          backgroundColor: '#1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          墨迹协作
        </h1>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <User size={20} color="#FFFFFF" />
        </div>
      </header>

      <main
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '40px',
          backgroundColor: '#1A1A2E',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <h2
              style={{
                color: '#FFFFFF',
                fontSize: '28px',
                fontWeight: 'bold',
                margin: 0,
              }}
            >
              我的白板
            </h2>
            <button
              onClick={createBoard}
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563EB';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3B82F6';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Plus size={18} />
              创建白板
            </button>
          </div>

          {loading ? (
            <div style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>
              加载中...
            </div>
          ) : boards.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#94A3B8',
              }}
            >
              <p style={{ fontSize: '18px', marginBottom: '16px' }}>
                还没有白板，点击上方按钮创建你的第一个白板吧！
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
              }}
              className="board-grid"
            >
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  style={{
                    width: '320px',
                    height: '200px',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: board.color || '#FEF3C7',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    border: '2px solid transparent',
                    transition: 'all 0.2s ease',
                    animation: 'noteAppear 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.border = '2px solid #3B82F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.border = '2px solid transparent';
                  }}
                >
                  <h3
                    style={{
                      color: '#1E293B',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      margin: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {board.name}
                  </h3>
                  <p
                    style={{
                      color: '#64748B',
                      fontSize: '13px',
                      margin: 0,
                    }}
                  >
                    最后编辑: {formatDate(board.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .board-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .board-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BoardList;
