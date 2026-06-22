import type { Project } from '../App';

interface ProjectListProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function ProjectList({
  projects,
  activeProjectId,
  onSelect,
  onDelete,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="project-list" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-dim)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📋</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>暂无项目</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>点击右上角 + 号创建</div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-list">
      {projects.map((project, index) => (
        <div
          key={project.id}
          className={`project-card ${activeProjectId === project.id ? 'active' : ''}`}
          style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}
          onClick={() => onSelect(project.id)}
        >
          <button
            className="delete-btn"
            onClick={(e) => onDelete(project.id, e)}
            title="删除项目"
          >
            ✕
          </button>
          <div className="project-card-name">{project.name}</div>
          <div className="project-card-meta">
            <span>{formatDate(project.createdAt)}</span>
            {project.onlineCount > 0 ? (
              <span className="online-badge">
                <span className="online-dot"></span>
                {project.onlineCount}人在线
              </span>
            ) : (
              <span style={{ color: 'var(--text-dim)' }}>离线</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
