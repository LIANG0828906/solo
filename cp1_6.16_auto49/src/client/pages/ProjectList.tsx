import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/ProjectCard';
import type { Project } from '../types';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects?status=approved');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '16px',
        color: '#999',
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '60px 20px',
        background: 'linear-gradient(135deg, #FFF8F1 0%, #FFE0B2 100%)',
        borderRadius: '16px',
        margin: '0 20px 40px 20px',
      }}>
        <h1 style={{
          fontSize: '36px',
          color: '#FF9500',
          margin: '0 0 12px 0',
          fontWeight: 700,
        }}>
          文创众筹平台
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: 0,
        }}>
          发现优质文创项目，支持创作者的梦想
        </p>
        <button
          onClick={() => navigate('/admin')}
          style={{
            marginTop: '24px',
            padding: '10px 24px',
            background: 'transparent',
            color: '#FF9500',
            border: '2px solid #FF9500',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minHeight: '44px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FF9500';
            e.currentTarget.style.color = '#FFF';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#FF9500';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
        >
          进入管理后台
        </button>
      </div>

      <div style={{ padding: '0 20px 40px 20px' }}>
        <h2 style={{
          fontSize: '24px',
          color: '#333',
          margin: '0 0 24px 0',
          fontWeight: 600,
        }}>
          正在众筹
        </h2>

        {projects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <p>暂无项目，敬请期待</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}>
            {projects.map((project, index) => (
              <div
                key={project.id}
                style={{
                  animation: `fadeIn 0.5s ease ${index * 0.1}s both`,
                }}
              >
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
