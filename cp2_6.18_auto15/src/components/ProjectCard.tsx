import type { Project } from '@/types';
import { useTaskStore } from '@/store/taskStore';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getProjectTasks = useTaskStore((state) => state.getProjectTasks);
  const tasks = getProjectTasks(project.id);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const cardStyle: React.CSSProperties = {
    width: 280,
    height: 160,
    background: 'white',
    borderRadius: 12,
    boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.3s',
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0px 8px 20px rgba(0,0,0,0.15)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: '#333333' }}>
          {project.name}
        </h3>
        <p style={{ fontSize: 14, color: '#888888', marginTop: 8, marginBottom: 0 }}>
          共 {totalTasks} 个任务
        </p>
      </div>
      <div>
        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 4,
            background: '#E0E0E0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: '#4CAF50',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <p style={{ fontSize: 13, color: '#666666', marginTop: 8, marginBottom: 0, textAlign: 'right' }}>
          {percentage}% 完成
        </p>
      </div>
    </div>
  );
}
