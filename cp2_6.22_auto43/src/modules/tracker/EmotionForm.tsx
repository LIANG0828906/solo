import React, { useState, useCallback, useEffect } from 'react';
import type { EmotionType, EmotionRecord } from '../shared/types';
import { 
  emotionConfigs, 
  availableTags, 
  validateInput, 
  submitRecord,
  getNoteWarningLevel
} from './TrackerModule';
import EmotionCard from './EmotionCard';
import './EmotionForm.css';

interface EmotionFormProps {
  onSubmitSuccess: (record: EmotionRecord) => void;
}

const EmotionForm: React.FC<EmotionFormProps> = ({ onSubmitSuccess }) => {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const validation = validateInput(selectedEmotion, selectedTags, note);
    setErrors(validation.errors);
  }, [selectedEmotion, selectedTags, note]);

  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    setSelectedEmotion(emotion);
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tag];
    });
  }, []);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 200) {
      setNote(value);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmotion || isSubmitting) return;
    
    const validation = validateInput(selectedEmotion, selectedTags, note);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setIsFlipped(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const record = await submitRecord(selectedEmotion, selectedTags, note);
      setShowSuccess(true);
      
      setTimeout(() => {
        onSubmitSuccess(record);
        setSelectedEmotion(null);
        setSelectedTags([]);
        setNote('');
        setIsFlipped(false);
        setShowSuccess(false);
      }, 800);
    } catch (err) {
      console.error('提交失败:', err);
      setErrors(['提交失败，请重试']);
      setIsFlipped(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEmotion, selectedTags, note, isSubmitting, onSubmitSuccess]);

  const emotions = Object.entries(emotionConfigs) as [EmotionType, typeof emotionConfigs[EmotionType]][];
  const noteWarning = getNoteWarningLevel(note);

  return (
    <form className="emotion-form" onSubmit={handleSubmit}>
      <h2 className="form-title">
        <span className="title-icon">✨</span>
        记录此刻心情
      </h2>

      <div className={`card-container ${isFlipped ? 'flipped' : ''}`}>
        <div className="card-front">
          <div className="emotion-grid">
            {emotions.map(([type, config]) => (
              <button
                key={type}
                type="button"
                className={`emotion-button ${selectedEmotion === type ? 'selected' : ''}`}
                onClick={() => handleEmotionSelect(type)}
                style={{ '--emotion-color': config.color } as React.CSSProperties}
              >
                <span className="emotion-emoji">{config.emoji}</span>
                <span className="emotion-label">{config.label}</span>
              </button>
            ))}
          </div>

          <div className="tags-section">
            <label className="section-label">
              选择标签（1-3个）
              {selectedTags.length > 0 && (
                <span className="tag-counter">已选 {selectedTags.length}/3</span>
              )}
            </label>
            <div className="tags-grid">
              {availableTags.map(tag => {
                const isSelected = selectedTags.includes(tag);
                const isDisabled = !isSelected && selectedTags.length >= 3;
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-button ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                    disabled={isDisabled}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="note-section">
            <label className="section-label">
              文字备注
              <span className={`note-counter ${noteWarning}`}>{note.length}/200</span>
            </label>
            <textarea
              className={`note-input ${noteWarning === 'danger' ? 'over-limit' : ''}`}
              value={note}
              onChange={handleNoteChange}
              placeholder="记录一下此刻的想法..."
              maxLength={200}
              rows={3}
            />
            {noteWarning === 'warning' && (
              <p className="note-warning">即将达到字数上限</p>
            )}
            {noteWarning === 'danger' && (
              <p className="note-danger">已超过200字限制</p>
            )}
          </div>

          {errors.length > 0 && (
            <div className="errors-container">
              {errors.map((error, index) => (
                <p key={index} className="error-text">{error}</p>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={!selectedEmotion || selectedTags.length === 0 || isSubmitting}
          >
            {isSubmitting ? '保存中...' : '保存记录'}
          </button>
        </div>

        <div className="card-back">
          {showSuccess && selectedEmotion && (
            <div className="success-content">
              <span className="success-emoji">{emotionConfigs[selectedEmotion].emoji}</span>
              <p className="success-text">记录成功！</p>
            </div>
          )}
        </div>
      </div>

      <EmotionCard />
    </form>
  );
};

export default EmotionForm;
