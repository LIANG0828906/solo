import ProjectTimeline from '@/components/ProjectTimeline';

export default function Projects() {
  return (
    <div className="page-fade-enter">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          <i className="fa-solid fa-list-check" style={{ marginRight: 10, color: 'var(--color-secondary-dark)' }}></i>
          我的项目
        </h1>
        <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
          追踪每一件作品从灵感到成品的全过程
        </p>
      </div>
      <ProjectTimeline />
    </div>
  );
}
