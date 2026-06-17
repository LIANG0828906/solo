import React, { useState, useEffect } from 'react';
import { usePerfumeStore } from '../stores/perfumeStore';
import { MOOD_OPTIONS } from '../types';
import type { MoodType } from '../types';
import '../styles/SavePerfumeForm.css';

const SavePerfumeForm: React.FC = () => {
  const currentFormula = usePerfumeStore((s) => s.currentFormula);
  const addPerfume = usePerfumeStore((s) => s.addPerfume);

  const [name, setName] = useState('');
  const [mood, setMood] = useState<MoodType>('calm');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [pressing, setPressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!showSuccess) return;
    setSuccessVisible(true);
    const t = window.setTimeout(() => {
      setSuccessVisible(false);
      window.setTimeout(() => setShowSuccess(false), 300);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [showSuccess]);

  const canSave = currentFormula.length > 0 && name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      if (currentFormula.length === 0) setErrorMsg('请先添加至少一种气味');
      else if (!name.trim()) setErrorMsg('请输入香水名称');
      window.setTimeout(() => setErrorMsg(''), 2000);
      return;
    }
    setPressing(true);
    window.setTimeout(() => setPressing(false), 100);
    const ok = addPerfume({ name, mood });
    if (ok) {
      setShowSuccess(true);
      setName('');
      setMood('calm');
      setErrorMsg('');
    }
  };

  return (
    <form className="save-perfume-form" onSubmit={handleSubmit} noValidate>
      <div className="save-form-title">保存你的香水作品</div>

      <div className="save-form-row">
        <label className="save-form-label" htmlFor="perfume-name">香水名称</label>
        <input
          id="perfume-name"
          type="text"
          className="save-form-input"
          placeholder="为它取一个独特的名字..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className="save-form-row">
        <label className="save-form-label" htmlFor="perfume-mood">心情标签</label>
        <div className="save-form-select-wrap">
          <select
            id="perfume-mood"
            className="save-form-select"
            value={mood}
            onChange={(e) => setMood(e.target.value as MoodType)}
          >
            {MOOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            className="save-form-mood-dot"
            style={{
              backgroundColor: MOOD_OPTIONS.find(m => m.value === mood)?.color,
            }}
          />
        </div>
        <div className="save-form-mood-options">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`save-form-mood-chip ${mood === opt.value ? 'active' : ''}`}
              style={{
                backgroundColor: mood === opt.value ? opt.color : opt.color + '33',
                color: mood === opt.value ? '#FFFFFF' : '#333',
              }}
              onClick={() => setMood(opt.value)}
            >
              <span
                className="chip-dot"
                style={{ backgroundColor: opt.color }}
              />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <div className="save-form-error">{errorMsg}</div>}

      <div className="save-form-submit-wrap">
        <button
          type="submit"
          className={`save-form-submit ${pressing ? 'is-pressing' : ''} ${!canSave ? 'is-disabled' : ''}`}
          onMouseDown={() => canSave && setPressing(true)}
          onMouseUp={() => setPressing(false)}
          onMouseLeave={() => setPressing(false)}
          disabled={false}
        >
          <span className="submit-text">保存到香水库</span>
          <span className={`submit-success ${showSuccess ? 'show' : ''} ${successVisible ? 'visible' : ''}`}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            保存成功
          </span>
        </button>
      </div>
    </form>
  );
};

export default SavePerfumeForm;
