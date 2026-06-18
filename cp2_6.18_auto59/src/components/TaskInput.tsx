import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { useDayBriefStore } from '@/store';
import type { Priority, EstimatedMinutes } from '@/types';
import styles from '@/styles/TaskInput.module.css';

export default function TaskInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('P1');
  const [estimatedMinutes, setEstimatedMinutes] = useState<EstimatedMinutes>(30);
  const addTask = useDayBriefStore((s) => s.addTask);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isOverLimit = content.length > 50;
  const canSubmit = content.trim().length > 0 && !isOverLimit;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addTask({
      content: content.trim(),
      priority,
      status: 'todo',
      estimatedMinutes,
    });
    setContent('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.inputWrapper}>
      <div className={styles.mainInputRow}>
        <input
          ref={inputRef}
          type="text"
          className={styles.inputField}
          placeholder="输入新任务..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={styles.addBtn}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          添加
        </button>
      </div>
      <div className={styles.optionsRow}>
        <div className={styles.optionGroup}>
          <span className={styles.optionLabel}>优先级:</span>
          <div className={styles.priorityBtns}>
            {(['P0', 'P1', 'P2'] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.priorityBtn} ${styles[`priorityBtn${p}`]} ${
                  priority === p ? styles.priorityBtnActive : ''
                }`}
                onClick={() => setPriority(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.optionGroup}>
          <span className={styles.optionLabel}>工时:</span>
          <select
            className={styles.timeSelect}
            value={estimatedMinutes}
            onChange={(e) =>
              setEstimatedMinutes(Number(e.target.value) as EstimatedMinutes)
            }
          >
            <option value={15}>15分钟</option>
            <option value={30}>30分钟</option>
            <option value={45}>45分钟</option>
            <option value={60}>60分钟</option>
          </select>
        </div>
        <span
          className={`${styles.charCount} ${
            isOverLimit ? styles.charCountWarning : ''
          }`}
        >
          {content.length}/50
        </span>
        <span className={styles.shortcutHint}>Ctrl+Shift+T 聚焦输入</span>
      </div>
    </div>
  );
}
