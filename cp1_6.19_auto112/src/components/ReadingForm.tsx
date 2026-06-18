import { useState, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBook, FiCheck } from 'react-icons/fi';
import { GiBookmark } from 'react-icons/gi';
import { useReadingContext } from '../context/ReadingContext';
import { MoodType, MOOD_CONFIG } from '../types';

type FormErrors = {
  bookName?: string;
  page?: string;
  mood?: string;
  thought?: string;
};

export default function ReadingForm() {
  const { addRecord } = useReadingContext();
  const [bookName, setBookName] = useState('');
  const [page, setPage] = useState('');
  const [mood, setMood] = useState<MoodType | null>(null);
  const [thought, setThought] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimerRef = useRef<number | null>(null);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!bookName.trim()) {
      e.bookName = '请输入书籍名称';
    }
    const pageNum = Number(page);
    if (!page || isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 1 || pageNum > 9999) {
      e.page = '页码需为 1-9999 的整数';
    }
    if (!mood) {
      e.mood = '请选择心情';
    }
    const tLen = thought.trim().length;
    if (tLen < 10) {
      e.thought = '感想至少 10 字';
    } else if (tLen > 200) {
      e.thought = '感想不超过 200 字';
    }
    return e;
  };

  const resetForm = () => {
    setBookName('');
    setPage('');
    setMood(null);
    setThought('');
    setErrors({});
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (!mood) return;

    addRecord({
      bookName: bookName.trim(),
      page: Number(page),
      mood,
      thought: thought.trim(),
    });

    setShowSuccess(true);
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = window.setTimeout(() => {
      setShowSuccess(false);
    }, 500);

    resetForm();
  };

  const moodOptions: MoodType[] = ['happy', 'thinking', 'moved', 'shocked', 'calm'];
  const charCount = thought.length;
  const charWarning = charCount < 10 || charCount > 200;

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="form-title">
        <GiBookmark style={{ color: '#6C63FF' }} />
        <span>记录阅读心情</span>
      </div>

      <div className="form-group">
        <label className="form-label">心情选择</label>
        <div className="mood-selector">
          {moodOptions.map((m) => {
            const cfg = MOOD_CONFIG[m];
            const selected = mood === m;
            return (
              <button
                key={m}
                type="button"
                className={`mood-btn ${selected ? 'selected' : ''}`}
                onClick={() => setMood(m)}
                title={cfg.label}
                style={selected ? { boxShadow: `0 0 20px ${cfg.color}88` } : undefined}
              >
                <span>{cfg.emoji}</span>
              </button>
            );
          })}
        </div>
        {errors.mood && <div className="form-error">{errors.mood}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">书名</label>
          <input
            type="text"
            className="form-input"
            placeholder="例如：三体"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
          />
          {errors.bookName && <div className="form-error">{errors.bookName}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">页码</label>
          <input
            type="number"
            className="form-input"
            placeholder="1-9999"
            min={1}
            max={9999}
            value={page}
            onChange={(e) => setPage(e.target.value)}
          />
          {errors.page && <div className="form-error">{errors.page}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          阅读感想 <span style={{ opacity: 0.5 }}>(10-200字)</span>
        </label>
        <textarea
          className="form-input form-textarea"
          placeholder="记录此刻的心情与思绪..."
          value={thought}
          onChange={(e) => setThought(e.target.value.slice(0, 200))}
        />
        <div className={`char-count ${charWarning ? 'warning' : ''}`}>
          {charCount} / 200
        </div>
        {errors.thought && <div className="form-error">{errors.thought}</div>}
      </div>

      <button type="submit" className="form-submit" disabled={showSuccess}>
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.span
              key="success"
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="success-indicator"
            >
              <FiCheck size={18} />
            </motion.span>
          ) : (
            <motion.span
              key="submit"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <FiBook size={14} />
              <span>记录到星河</span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </form>
  );
}
