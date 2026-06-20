import Board from '@/components/Board';
import { useTaskStore } from '@/store/taskStore';

export default function BoardPage() {
  const currentProjectId = useTaskStore((state) => state.currentProjectId);
  const projects = useTaskStore((state) => state.projects);
  const setCurrentProject = useTaskStore((state) => state.setCurrentProject);

  if (!currentProjectId) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        请先选择一个项目
      </div>
    );
  }

  const project = projects.find((p) => p.id === currentProjectId);

  if (!project) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
        项目不存在
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5FA' }}>
      <header
        style={{
          height: 56,
          background: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 20,
        }}
      >
        <button
          onClick={() => setCurrentProject(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#007AFF',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: 6,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F0F0F5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          ← 返回
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#333333' }}>
          {project.name}
        </div>
      </header>
      <Board projectId={currentProjectId} />
    </div>
  );
}
