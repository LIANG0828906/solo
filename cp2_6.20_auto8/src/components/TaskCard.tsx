import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { updateTask, addNote, deleteTask } from '../api/tasks';
import type { Task, Priority, Note } from '../types';
import { PRIORITY_COLORS, PRIORITY_LABELS, TAG_COLORS } from '../types';

interface TaskCardProps {
  task: Task;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  isHighlighted: boolean;
  isFiltered: boolean;
}

function TaskCard(props: TaskCardProps) {
  const { task, onTaskUpdate, onDelete, isHighlighted, isFiltered } = props;
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [editedPriority, setEditedPriority] = useState<Priority>(task.priority);
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate || '');
  const [editedAssignee, setEditedAssignee] = useState(task.assignee || '');
  const [editedTags, setEditedTags] = useState(task.tags.join(', '));
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [saving, setSaving] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all ease-out 0.3s',
    opacity: isDragging ? 0.4 : isFiltered ? 0.35 : 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 14,
    borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}`,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  useEffect(() => {
    if (showModal) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowModal(false);
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    setShowModal(true);
    resetForm();
  };

  const resetForm = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description);
    setEditedPriority(task.priority);
    setEditedDueDate(task.dueDate || '');
    setEditedAssignee(task.assignee || '');
    setEditedTags(task.tags.join(', '));
    setEditMode(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tagsArray = editedTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const updates: Partial<Task> = {
        title: editedTitle,
        description: editedDescription,
        priority: editedPriority,
        dueDate: editedDueDate || null,
        assignee: editedAssignee || null,
        tags: tagsArray,
      };

      await updateTask(task.id, updates);
      onTaskUpdate(task.id, updates);
      setEditMode(false);
      toast.success('任务更新成功');
    } catch (error) {
      toast.error('更新失败');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      toast.error('请输入备注内容');
      return;
    }
    if (!noteAuthor.trim()) {
      toast.error('请输入作者名');
      return;
    }
    try {
      const note = await addNote(task.id, newNoteContent.trim(), noteAuthor.trim());
      const noteWithTaskId = { ...note, taskId: task.id } as Note & { taskId: string };
      onTaskUpdate(task.id, {
        notes: [note, ...task.notes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      });
      setNewNoteContent('');
      toast.success('备注添加成功');
    } catch (error) {
      toast.error('添加备注失败');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (confirm('确定删除该任务？')) {
      try {
        await deleteTask(task.id);
        onDelete(task.id);
        setShowModal(false);
        toast.success('任务删除成功');
      } catch (error) {
        toast.error('删除失败');
        console.error(error);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getTagColor = (tag: string): string => {
    return TAG_COLORS[tag] || '#533483';
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={isHighlighted ? 'highlight-flash' : ''}
        onClick={handleCardClick}
        {...attributes}
        {...listeners}
      >
        <div style={cardStyles.title}>{task.title}</div>

        {task.description ? (
          <div
            style={{
              ...cardStyles.description,
              ...(descriptionExpanded ? cardStyles.descriptionExpanded : {}),
            }}
            onClick={(e) => {
              e.stopPropagation();
              setDescriptionExpanded(!descriptionExpanded);
            }}
          >
            {task.description}
            {task.description.length > 40 && (
              <span style={cardStyles.expandToggle}>
                {descriptionExpanded ? '收起' : '展开'}
              </span>
            )}
          </div>
        ) : (
          <div style={cardStyles.description}>
            <span style={cardStyles.descriptionPlaceholder}>暂无描述</span>
          </div>
        )}

        {task.tags.length > 0 && (
          <div style={cardStyles.tags}>
            {task.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  ...cardStyles.tag,
                  backgroundColor: getTagColor(tag),
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={cardStyles.footer}>
          <span
            style={{
              ...cardStyles.priority,
              color: PRIORITY_COLORS[task.priority],
            }}
          >
            {PRIORITY_LABELS[task.priority]}优先
          </span>
          {task.dueDate && (
            <span style={cardStyles.dueDate}>
              📅 {task.dueDate}
            </span>
          )}
          {task.assignee && (
            <span style={cardStyles.assignee}>
              👤 {task.assignee}
            </span>
          )}
        </div>

        {task.notes.length > 0 && (
          <div style={cardStyles.notesCount}>
            💬 {task.notes.length} 条备注
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={modalStyles.overlay}
          onClick={() => setShowModal(false)}
        >
          <div
            ref={modalRef}
            style={modalStyles.container}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalStyles.header}>
              {editMode ? (
                <input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  style={modalStyles.titleInput}
                  placeholder="任务标题"
                />
              ) : (
                <h2 style={modalStyles.title}>{task.title}</h2>
              )}
              <button
                onClick={() => setShowModal(false)}
                style={modalStyles.closeBtn}
              >
                ×
              </button>
            </div>

            <div style={modalStyles.metaRow}>
              <span
                style={{
                  ...modalStyles.priorityBadge,
                  backgroundColor: PRIORITY_COLORS[task.priority] + '30',
                  borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                  color: PRIORITY_COLORS[task.priority],
                }}
              >
                {PRIORITY_LABELS[task.priority]}优先级
              </span>
              {task.dueDate && (
                <span style={modalStyles.metaItem}>📅 截止: {task.dueDate}</span>
              )}
              {task.assignee && (
                <span style={modalStyles.metaItem}>👤 {task.assignee}</span>
              )}
            </div>

            <div style={modalStyles.body}>
              <div style={modalStyles.section}>
                <h3 style={modalStyles.sectionTitle}>描述</h3>
                {editMode ? (
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    style={modalStyles.textarea}
                    placeholder="任务描述..."
                    rows={4}
                  />
                ) : (
                  <p style={modalStyles.description}>
                    {task.description || '暂无描述'}
                  </p>
                )}
              </div>

              {editMode && (
                <>
                  <div style={modalStyles.section}>
                    <h3 style={modalStyles.sectionTitle}>优先级</h3>
                    <div style={modalStyles.priorityOptions}>
                      {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setEditedPriority(p)}
                          style={{
                            ...modalStyles.priorityOption,
                            ...(editedPriority === p
                              ? {
                                  backgroundColor: PRIORITY_COLORS[p] + '30',
                                  borderColor: PRIORITY_COLORS[p],
                                  color: PRIORITY_COLORS[p],
                                }
                              : {}),
                          }}
                        >
                          {PRIORITY_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={modalStyles.section}>
                    <h3 style={modalStyles.sectionTitle}>截止日期</h3>
                    <input
                      type="date"
                      value={editedDueDate}
                      onChange={(e) => setEditedDueDate(e.target.value)}
                      style={modalStyles.input}
                    />
                  </div>

                  <div style={modalStyles.section}>
                    <h3 style={modalStyles.sectionTitle}>分配人</h3>
                    <input
                      type="text"
                      value={editedAssignee}
                      onChange={(e) => setEditedAssignee(e.target.value)}
                      placeholder="分配人姓名"
                      style={modalStyles.input}
                    />
                  </div>

                  <div style={modalStyles.section}>
                    <h3 style={modalStyles.sectionTitle}>标签（用逗号分隔）</h3>
                    <input
                      type="text"
                      value={editedTags}
                      onChange={(e) => setEditedTags(e.target.value)}
                      placeholder="Bug, 功能, 优化"
                      style={modalStyles.input}
                    />
                  </div>
                </>
              )}

              {!editMode && task.tags.length > 0 && (
                <div style={modalStyles.section}>
                  <h3 style={modalStyles.sectionTitle}>标签</h3>
                  <div style={modalStyles.tagsList}>
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          ...modalStyles.tagBadge,
                          backgroundColor: getTagColor(tag),
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={modalStyles.section}>
                <h3 style={modalStyles.sectionTitle}>
                  备注 ({task.notes.length})
                </h3>
                <div style={modalStyles.notesList}>
                  {task.notes.length === 0 ? (
                    <p style={modalStyles.emptyState}>暂无备注</p>
                  ) : (
                    task.notes
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((note) => (
                        <div key={note.id} style={modalStyles.noteItem}>
                          <div style={modalStyles.noteHeader}>
                            <span style={modalStyles.noteAuthor}>
                              {note.author}
                            </span>
                            <span style={modalStyles.noteTime}>
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p style={modalStyles.noteContent}>{note.content}</p>
                        </div>
                      ))
                  )}
                </div>

                <div style={modalStyles.addNote}>
                  <input
                    type="text"
                    value={noteAuthor}
                    onChange={(e) => setNoteAuthor(e.target.value)}
                    placeholder="你的名字"
                    style={{ ...modalStyles.input, marginBottom: 8 }}
                  />
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="添加备注..."
                    style={{ ...modalStyles.textarea, marginBottom: 8 }}
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    style={modalStyles.addNoteBtn}
                  >
                    添加备注
                  </button>
                </div>
              </div>
            </div>

            <div style={modalStyles.footer}>
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={modalStyles.primaryBtn}
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={resetForm}
                    style={modalStyles.secondaryBtn}
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    style={modalStyles.primaryBtn}
                  >
                    编辑
                  </button>
                  <button
                    onClick={handleDelete}
                    style={modalStyles.deleteBtn}
                  >
                    删除任务
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const cardStyles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 10,
    maxHeight: 48,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as any,
    cursor: 'pointer',
    transition: 'max-height ease-out 0.3s',
    userSelect: 'none',
    position: 'relative' as any,
  },
  descriptionExpanded: {
    maxHeight: 'none',
    overflow: 'visible',
    display: 'block',
    WebkitLineClamp: 'unset' as any,
  },
  descriptionPlaceholder: {
    color: 'rgba(160, 160, 176, 0.5)',
    fontStyle: 'italic',
    cursor: 'default',
  },
  expandToggle: {
    display: 'inline-block',
    marginLeft: 6,
    color: '#e94560',
    fontWeight: 500,
    fontSize: 11,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 10,
    color: '#fff',
    fontWeight: 500,
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  priority: {
    fontSize: 12,
    fontWeight: 600,
  },
  dueDate: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  assignee: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  notesCount: {
    marginTop: 8,
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-out',
    padding: 20,
  },
  container: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'scaleIn 0.3s ease-out',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(233,69,96,0.5)',
    borderRadius: 8,
    padding: '8px 12px',
    outline: 'none',
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 24,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  metaRow: {
    padding: '12px 24px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  priorityBadge: {
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  metaItem: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  body: {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  textarea: {
    width: '100%',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  priorityOptions: {
    display: 'flex',
    gap: 8,
  },
  priorityOption: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  tagsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    padding: '4px 12px',
    borderRadius: 20,
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
  },
  notesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  emptyState: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  noteItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteAuthor: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e94560',
  },
  noteTime: {
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  noteContent: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 1.5,
  },
  addNote: {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: 16,
  },
  addNoteBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(90deg, var(--accent-start), var(--accent-end))',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  primaryBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(90deg, var(--accent-start), var(--accent-end))',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  secondaryBtn: {
    padding: '10px 24px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  deleteBtn: {
    padding: '10px 24px',
    backgroundColor: 'rgba(233,69,96,0.2)',
    border: 'none',
    borderRadius: 8,
    color: '#e94560',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
};

export default TaskCard;
