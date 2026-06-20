import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useDayBriefStore } from '../store';
import { generateReportRenderData, generatePlainTextReport } from '../utils/reportGenerator';
import { formatTotalWorkHours, formatEstimatedTime } from '../utils/formatters';
import { Clock, Copy, CheckCircle2 } from 'lucide-react';
import type { Task } from '../types';
import styles from '../styles/ReportPreview.module.css';

const priorityStyles: Record<string, string> = {
  P0: styles.priorityP0,
  P1: styles.priorityP1,
  P2: styles.priorityP2,
};

function TaskItemView({ task, isCompleted }: { task: Task; isCompleted: boolean }) {
  return (
    <li className={styles.taskItem}>
      <span
        className={`${styles.taskBullet} ${
          isCompleted ? styles.taskBulletCompleted : styles.taskBulletPending
        }`}
      />
      <span className={styles.taskContent}>
        <span className={`${styles.taskPriority} ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        {task.content}
        <span className={styles.taskTime}>
          {formatEstimatedTime(task.estimatedMinutes)}
        </span>
      </span>
    </li>
  );
}

export default function ReportPreview() {
  const tasks = useDayBriefStore((s) => s.tasks);
  const templateType = useDayBriefStore((s) => s.templateType);
  const customTemplate = useDayBriefStore((s) => s.customTemplate);
  const draftNotes = useDayBriefStore((s) => s.draftNotes);
  const updateDraftNotes = useDayBriefStore((s) => s.updateDraftNotes);

  const [isCopied, setIsCopied] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [localNotes, setLocalNotes] = useState(draftNotes);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderData = useMemo(
    () =>
      generateReportRenderData({
        tasks,
        templateType,
        customTemplate,
        draftNotes,
      }),
    [tasks, templateType, customTemplate, draftNotes]
  );

  const plainTextReport = useMemo(
    () =>
      generatePlainTextReport({
        tasks,
        templateType,
        customTemplate,
        draftNotes,
      }),
    [tasks, templateType, customTemplate, draftNotes]
  );

  useEffect(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setIsTransitioning(true);
    transitionTimerRef.current = setTimeout(() => {
      setIsTransitioning(false);
      transitionTimerRef.current = null;
    }, 350);
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [templateType]);

  useEffect(() => {
    setLocalNotes(draftNotes);
  }, [draftNotes]);

  const debouncedUpdateNotes = useCallback(
    debounce((value: string) => {
      updateDraftNotes(value);
    }, 150),
    [updateDraftNotes]
  );

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalNotes(value);
    debouncedUpdateNotes(value);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(plainTextReport);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = plainTextReport;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const showWorkHours =
    templateType === 'detailed' ||
    (templateType === 'custom' &&
      customTemplate.sections.find((s) => s.key === 'workHours')?.enabled);

  const showNotes =
    templateType === 'detailed' ||
    (templateType === 'custom' &&
      customTemplate.sections.find((s) => s.key === 'notes')?.enabled);

  return (
    <div
      className={`${styles.previewCard} ${
        isTransitioning ? styles.previewCardFading : ''
      }`}
    >
      <h1 className={styles.reportTitle}>{renderData.title}</h1>
      <p className={styles.reportDate}>{renderData.date}</p>

      {showWorkHours && (
        <div className={styles.section}>
          <span className={styles.workHoursBadge}>
            <Clock size={14} />
            {formatTotalWorkHours(renderData.totalCompletedMinutes)}
          </span>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleIcon} />
          已完成任务
        </h2>
        {renderData.completedTasks.length > 0 ? (
          <ul className={styles.taskList}>
            {renderData.completedTasks.map((task) => (
              <TaskItemView key={task.id} task={task} isCompleted />
            ))}
          </ul>
        ) : (
          <p className={styles.emptyTasks}>暂无已完成任务</p>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleIcon} />
          待完成任务
        </h2>
        {renderData.pendingTasks.length > 0 ? (
          <ul className={styles.taskList}>
            {renderData.pendingTasks.map((task) => (
              <TaskItemView key={task.id} task={task} isCompleted={false} />
            ))}
          </ul>
        ) : (
          <p className={styles.emptyTasks}>暂无待完成任务</p>
        )}
      </div>

      {showNotes && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionTitleIcon} />
            备注
          </h2>
          <textarea
            className={styles.notesTextarea}
            placeholder="写点什么..."
            value={localNotes}
            onChange={handleNotesChange}
          />
        </div>
      )}

      <div className={styles.copySection}>
        <button
          className={`${styles.copyBtn} ${isCopied ? styles.copyBtnCopied : ''}`}
          onClick={handleCopy}
        >
          {isCopied ? (
            <span className={styles.copyFeedback}>
              <CheckCircle2 size={16} />
              已复制
            </span>
          ) : (
            <>
              <Copy size={16} />
              一键复制
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
