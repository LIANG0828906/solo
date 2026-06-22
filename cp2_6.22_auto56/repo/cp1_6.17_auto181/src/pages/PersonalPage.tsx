import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAppStore } from '../store';
import Loading from '../components/Loading';
import type { Stroke } from '../CalligraphyEngine';
import { CalligraphyEngine } from '../CalligraphyEngine';
import { useNavigate } from 'react-router-dom';

function PersonalPage() {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorks = async () => {
      try {
        const response = await axios.get('/api/works', {
          params: { userId: user.id, limit: 100 }
        });
        setWorks(response.data.works);
      } catch (error) {
        console.error('加载作品失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorks();
  }, [user.id]);

  const togglePrivacy = async (workId: string, currentPublic: boolean) => {
    try {
      await axios.put(`/api/works/${workId}`, {
        isPublic: !currentPublic
      });
      
      setWorks(prev => prev.map(w => 
        w.id === workId ? { ...w, isPublic: !currentPublic } : w
      ));
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  const publicCount = works.filter(w => w.isPublic).length;
  const privateCount = works.filter(w => !w.isPublic).length;

  if (loading) {
    return (
      <div className="personal-page">
        <Loading />
      </div>
    );
  }

  return (
    <div className="personal-page">
      <div className="personal-header">
        <h1 className="personal-title">{user.name} 的作品</h1>
        <div className="personal-stats">
          <div className="stat-item">
            <div className="stat-number">{works.length}</div>
            <div className="stat-label">总作品</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{publicCount}</div>
            <div className="stat-label">公开</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{privateCount}</div>
            <div className="stat-label">私有</div>
          </div>
        </div>
      </div>

      <div className="waterfall-container">
        {works.map(work => (
          <WaterfallItem 
            key={work.id} 
            work={work} 
            onToggle={togglePrivacy}
            onClick={() => navigate(`/critique/${work.id}`)}
          />
        ))}
      </div>

      {works.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <p style={{ fontSize: '18px', marginBottom: '16px' }}>还没有作品</p>
          <button
            onClick={() => navigate('/create')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#8B4513',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            开始创作
          </button>
        </div>
      )}
    </div>
  );
}

interface WaterfallItemProps {
  work: {
    id: string;
    strokes: Stroke[];
    width: number;
    height: number;
    title?: string;
    isPublic: boolean;
    createdAt: string;
  };
  onToggle: (id: string, isPublic: boolean) => void;
  onClick: () => void;
}

function WaterfallItem({ work, onToggle, onClick }: WaterfallItemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !work.strokes) return;

    const columnWidth = 240;
    const scale = columnWidth / work.width;
    const height = work.height * scale;
    
    canvas.width = columnWidth;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    CalligraphyEngine.renderToCanvas(canvas, work.strokes);
  }, [work]);

  return (
    <div className="waterfall-item">
      <div className="waterfall-thumbnail" onClick={onClick} style={{ cursor: 'pointer' }}>
        <canvas ref={canvasRef} />
      </div>
      <div className="waterfall-info">
        <div className="waterfall-title">{work.title || '未命名作品'}</div>
        <div className="waterfall-footer">
          <span style={{ fontSize: '12px', color: '#999' }}>
            {new Date(work.createdAt).toLocaleDateString('zh-CN')}
          </span>
          <div 
            className={`toggle-switch ${work.isPublic ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(work.id, work.isPublic);
            }}
            title={work.isPublic ? '公开作品' : '私有作品'}
          >
            <div className="toggle-thumb" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalPage;
