import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from './store';
import type { Project, ProjectStatus } from './types';
import { statusLabels, statusColors } from './utils';

const COLUMNS: { id: ProjectStatus; title: string; icon: string }[] = [
  { id: 'pending', title: '待确认', icon: '⏳' },
  { id: 'inProgress', title: '进行中', icon: '🎬' },
  { id: 'completed', title: '已完成', icon: '✅' },
];

function DraggableCard({ project, index }: { project: Project; index: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    data: { status: project.status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    animation: `cardFadeIn 0.5s ease ${index * 0.06}s both`,
  };

  const deadline = new Date(project.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = project.status !== 'completed' && daysLeft <= 3;

  return (
    <div
      ref={setNodeRef}
      style={{ ...styles.card, ...style }}
      {...attributes}
      {...listeners}
    >
      <div style={styles.cardInner}>
        <div style={styles.cardPreview}>
          {project.previewImage ? (
            <img src={project.previewImage} alt="" style={styles.previewImg} />
          ) : (
            <div style={styles.previewPlaceholder}>
              <span style={styles.previewIcon}>📷</span>
            </div>
          )}
          <div style={{
            ...styles.statusDot,
            background: statusColors[project.status],
            boxShadow: `0 0 10px ${statusColors[project.status]}50`,
          }} />
        </div>
        <div style={styles.cardContent}>
          <h4 style={styles.cardTitle}>{project.name}</h4>
          <p style={styles.cardClient}>👤 {project.clientName}</p>
          <div style={styles.cardFooter}>
            <span style={{
              ...styles.deadline,
              color: isUrgent ? '#ff6b6b' : '#7a7a95',
            }}>
              📅 {format(deadline, 'MM/dd', { locale: zhCN })}
              {isUrgent && ` · ${daysLeft <= 0 ? '已截止' : `剩${daysLeft}天`}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropColumn({
  column,
  projects,
  activeId,
}: {
  column: { id: ProjectStatus; title: string; icon: string };
  projects: Project[];
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...styles.column,
        ...(isOver ? styles.columnOver : {}),
      }}
    >
      <div style={styles.columnHeader}>
        <div style={styles.columnTitleWrap}>
          <span style={styles.columnIcon}>{column.icon}</span>
          <span style={styles.columnTitle}>{column.title}</span>
          <span style={{
            ...styles.columnCount,
            background: `${statusColors[column.id]}20`,
            color: statusColors[column.id],
          }}>
            {projects.length}
          </span>
        </div>
        <div style={{ ...styles.columnLine, background: statusColors[column.id] }} />
      </div>
      <div style={styles.cardList}>
        {projects.length === 0 ? (
          <div style={{
            ...styles.emptyColumn,
            outline: activeId ? `2px dashed ${statusColors[column.id]}60` : 'none',
          }}>
            <span style={styles.emptyIcon}>📦</span>
            <span style={styles.emptyText}>拖拽项目到此处</span>
          </div>
        ) : (
          projects.map((project, idx) => (
            <DraggableCard key={project.id} project={project} index={idx} />
          ))
        )}
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const projects = useStore((s) => s.projects);
  const updateProjectStatus = useStore((s) => s.updateProjectStatus);
  const addProject = useStore((s) => s.addProject);
  const statusChangeLogs = useStore((s) => s.statusChangeLogs);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const activeProject = activeId ? projects.find((p) => p.id === activeId) : null;
  const lastLog = statusChangeLogs[0];

  const showToast = (msg: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast(msg);
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  };

  const groupedProjects = COLUMNS.reduce((acc, col) => {
    acc[col.id] = projects.filter((p) => p.status === col.id);
    return acc;
  }, {} as Record<ProjectStatus, Project[]>);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeStatus = (active.data.current as { status: ProjectStatus })?.status;
    const overId = String(over.id);
    if (activeStatus && COLUMNS.some((c) => c.id === overId) && activeStatus !== overId) {
      // Visual feedback handled by column's isOver
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const projectId = String(active.id);
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    let newStatus: ProjectStatus;
    const overId = String(over.id);

    if (COLUMNS.some((c) => c.id === overId)) {
      newStatus = overId as ProjectStatus;
    } else {
      const overProject = projects.find((p) => p.id === overId);
      if (!overProject) return;
      newStatus = overProject.status;
    }

    if (project.status !== newStatus) {
      void updateProjectStatus(projectId, newStatus);
      showToast(`「${project.name}」已移至「${statusLabels[newStatus]}」`);
    }
  };

  const handleCreate = () => {
    if (!newName.trim() || !newClient.trim() || !newDeadline) {
      showToast('请填写完整信息');
      return;
    }
    void addProject({
      name: newName.trim(),
      clientName: newClient.trim(),
      deadline: new Date(newDeadline).toISOString(),
      previewImage: '',
      status: 'pending',
    });
    setNewName('');
    setNewClient('');
    setNewDeadline('');
    setShowModal(false);
    showToast('项目创建成功');
  };

  return (
    <div style={styles.container}>
      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>项目看板</h1>
          <p style={styles.subtitle}>拖拽卡片以更新项目状态 · 共 {projects.length} 个项目</p>
        </div>
        <button style={styles.primaryBtn} onClick={() => setShowModal(true)}>
          + 新建项目
        </button>
      </div>

      {lastLog && (
        <div style={styles.statusBanner}>
          <span style={styles.bannerIcon}>📌</span>
          <span style={styles.bannerText}>
            最近更新：「{lastLog.projectName}」从
            <span style={{ color: statusColors[lastLog.fromStatus], margin: '0 6px' }}>
              {statusLabels[lastLog.fromStatus]}
            </span>
            移至
            <span style={{ color: statusColors[lastLog.toStatus], margin: '0 6px' }}>
              {statusLabels[lastLog.toStatus]}
            </span>
            <span style={{ color: '#7a7a95', marginLeft: 8 }}>
              {format(new Date(lastLog.timestamp), 'HH:mm:ss', { locale: zhCN })}
            </span>
          </span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="project-board" style={styles.board}>
          {COLUMNS.map((column) => (
            <DropColumn
              key={column.id}
              column={column}
              projects={groupedProjects[column.id]}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeProject ? (
            <div style={{ ...styles.card, ...styles.draggingCard }}>
              <div style={styles.cardInner}>
                <div style={styles.cardPreview}>
                  {activeProject.previewImage ? (
                    <img src={activeProject.previewImage} alt="" style={styles.previewImg} />
                  ) : (
                    <div style={styles.previewPlaceholder}>
                      <span style={styles.previewIcon}>📷</span>
                    </div>
                  )}
                </div>
                <div style={styles.cardContent}>
                  <h4 style={styles.cardTitle}>{activeProject.name}</h4>
                  <p style={styles.cardClient}>👤 {activeProject.clientName}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>新建项目</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>项目名称 *</label>
              <input
                style={styles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="如：张先生婚纱拍摄"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>客户姓名 *</label>
              <input
                style={styles.input}
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="如：张先生"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>截止日期 *</label>
              <input
                style={styles.input}
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowModal(false)}>
                取消
              </button>
              <button style={styles.primaryBtn} onClick={handleCreate}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    position: 'relative',
  },
  toast: {
    position: 'fixed',
    top: 80,
    right: 28,
    zIndex: 9999,
    background: 'linear-gradient(135deg, #252547, #16213e)',
    color: '#eee',
    padding: '12px 20px',
    borderRadius: 12,
    border: '1px solid #4facfe',
    boxShadow: '0 8px 32px rgba(79, 172, 254, 0.25)',
    fontSize: 14,
    fontWeight: 500,
    animation: 'slideInRight 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#eee',
    marginBottom: 6,
  },
  subtitle: {
    color: '#a0a0b8',
    fontSize: 14,
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)',
  },
  secondaryBtn: {
    background: '#252547',
    color: '#eee',
    padding: '12px 24px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    border: '1px solid #3a3a5c',
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1), rgba(102, 126, 234, 0.08))',
    border: '1px solid rgba(79, 172, 254, 0.25)',
    borderRadius: 14,
    padding: '14px 18px',
    fontSize: 14,
    color: '#c5c5dc',
    animation: 'slideInLeft 0.4s ease',
  },
  bannerIcon: { fontSize: 18 },
  bannerText: { flex: 1 },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
  },
  column: {
    background: '#16213e',
    borderRadius: 18,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    minHeight: 500,
    transition: 'all 0.25s ease',
    border: '1px solid transparent',
  },
  columnOver: {
    background: '#1a2a4a',
    borderColor: 'rgba(79, 172, 254, 0.4)',
    boxShadow: '0 0 30px rgba(79, 172, 254, 0.1)',
  },
  columnHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  columnTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  columnIcon: { fontSize: 18 },
  columnTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#eee',
  },
  columnCount: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 10,
    marginLeft: 'auto',
  },
  columnLine: {
    height: 3,
    borderRadius: 2,
    width: '100%',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flex: 1,
  },
  emptyColumn: {
    padding: '40px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    transition: 'all 0.25s ease',
    color: '#5a5a80',
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 13 },
  card: {
    background: '#252547',
    borderRadius: 14,
    overflow: 'hidden',
    cursor: 'grab',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid #3a3a5c',
    userSelect: 'none',
    touchAction: 'none',
  },
  draggingCard: {
    transform: 'scale(1.08) rotate(-1deg)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 3px rgba(79, 172, 254, 0.3)',
    opacity: 0.92,
    borderColor: 'rgba(79, 172, 254, 0.6)',
    cursor: 'grabbing',
  },
  cardInner: {
    display: 'flex',
    gap: 12,
    padding: 12,
  },
  cardPreview: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #3a3a5c, #2a2a48)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: { fontSize: 24 },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid #252547',
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#eee',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardClient: {
    fontSize: 12,
    color: '#a0a0b8',
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 4,
  },
  deadline: {
    fontSize: 11,
    fontWeight: 500,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: '#252547',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 480,
    border: '1px solid #3a3a5c',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    animation: 'cardFadeIn 0.3s ease',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#eee',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#a0a0b8',
  },
  input: {
    background: '#16213e',
    border: '1px solid #3a3a5c',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#eee',
    fontSize: 14,
    transition: 'border-color 0.2s ease',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
  },
};
