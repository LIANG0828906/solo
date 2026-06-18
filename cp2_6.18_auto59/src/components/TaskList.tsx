import { useDayBriefStore } from '../store';
import TaskItem from './TaskItem';
import { ClipboardList } from 'lucide-react';
import styles from '../styles/TaskList.module.css';

export default function TaskList() {
  const tasks = useDayBriefStore((s) => s.tasks);

  const pendingTasks = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => a.order - b.order);

  const completedTasks = tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => a.order - b.order);

  return (
    <div className={styles.listContainer}>
      <div>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>待完成</span>
          <span className={styles.sectionCount}>{pendingTasks.length}</span>
        </div>
        <div className={styles.taskGroup}>
          {pendingTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ClipboardList size={40} style={{ opacity: 0.5 }} />
              </div>
              <div className={styles.emptyText}>还没有待处理任务，快去添加吧！</div>
            </div>
          ) : (
            pendingTasks.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </div>
      </div>

      <div>
        <div className={`${styles.sectionHeader} ${completedTasks.length > 0 ? styles.completedHeader : ''}`}>
          <span className={styles.sectionTitle}>已完成</span>
          <span className={styles.sectionCount}>{completedTasks.length}</span>
        </div>
        <div className={styles.taskGroup}>
          {completedTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
