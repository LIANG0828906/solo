import { Link } from 'react-router-dom';
import { Project } from '../utils/api';

interface Props {
  project: Project;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  in_progress: { label: '进行中', cls: 'in-progress' },
  completed: { label: '已完成', cls: 'completed' },
  paused: { label: '暂停', cls: 'paused' },
};

export default function ProjectCard({ project }: Props) {
  const status = statusMap[project.status] || statusMap.in_progress;
  const rateText =
    project.rate_type === 'hourly'
      ? `¥${project.rate_amount.toFixed(2)}/小时`
      : `¥${project.rate_amount.toLocaleString('zh-CN')} 固定价`;

  const fmtDate = (d: string) => {
    try {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    } catch {
      return d;
    }
  };

  return (
    <Link to={`/projects/${project.id}`} className={`project-card ${status.cls}`}>
      <span className="status-tag">{status.label}</span>
      <div className="project-name">{project.name}</div>
      <div className="project-client">客户：{project.client_name}</div>
      <div className="project-meta">
        <span>
          {fmtDate(project.start_date)} ~ {fmtDate(project.end_date)}
        </span>
      </div>
      <div className="project-rate">{rateText}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} />
      </div>
      <div className="progress-text">进度 {project.progress}%</div>
    </Link>
  );
}
