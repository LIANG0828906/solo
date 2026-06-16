import { useNavigate } from 'react-router-dom';
import ProgressRing from './ProgressRing';
import Countdown from './Countdown';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onPledgeClick?: (project: Project) => void;
}

export default function ProjectCard({ project, onPledgeClick }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handlePledgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPledgeClick) {
      onPledgeClick(project);
    } else {
      navigate(`/project/${project.id}`);
    }
  };

  const progress = (project.currentAmount / project.targetAmount) * 100;

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(255, 149, 0, 0.1)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '420px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 149, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 149, 0, 0.1)';
      }}
    >
      <div style={{ position: 'relative', width: '100%', paddingBottom: '60%', overflow: 'hidden' }}>
        <img
          src={project.coverImage}
          alt={project.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 149, 0, 0.9)',
          color: '#FFF',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {progress.toFixed(0)}%
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#333',
          margin: '0 0 12px 0',
          lineHeight: 1.4,
        }}>
          {project.name}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <ProgressRing
            currentAmount={project.currentAmount}
            targetAmount={project.targetAmount}
            size={120}
            strokeWidth={8}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Countdown deadline={project.deadline} size="small" />
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handlePledgeClick}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #FF9500 0%, #FFB74D 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              minHeight: '44px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 149, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
          >
            立即认筹
          </button>
        </div>
      </div>
    </div>
  );
}
