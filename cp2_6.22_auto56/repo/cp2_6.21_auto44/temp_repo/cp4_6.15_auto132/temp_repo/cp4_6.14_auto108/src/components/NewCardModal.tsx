import { useState, useEffect } from 'react';
import { CATEGORIES } from '../types';
import { useCardStore } from '../store/useCardStore';

interface NewCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewCardModal = ({ isOpen, onClose }: NewCardModalProps) => {
  const [closing, setClosing] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createCard = useCardStore((s) => s.createCard);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setQuestion('');
      setAnswer('');
      setCategory('');
      setDifficulty(3);
      setErrors({});
    }
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!question.trim()) newErrors.question = '请输入问题';
    if (!answer.trim()) newErrors.answer = '请输入答案';
    if (!category) newErrors.category = '请选择类别';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createCard({
        question: question.trim(),
        answer: answer.trim(),
        category,
        difficulty,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  if (!isOpen && !closing) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`modal-content ${closing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">新建卡片</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">问题 *</label>
            <textarea
              className="form-textarea"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="输入问题内容..."
              rows={3}
              style={{ lineHeight: 1.5 }}
            />
            {errors.question && (
              <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                {errors.question}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">答案 *</label>
            <textarea
              className="form-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="输入答案内容..."
              rows={3}
              style={{ lineHeight: 1.5 }}
            />
            {errors.answer && (
              <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                {errors.answer}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">类别 *</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">请选择类别</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                {errors.category}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">难度: {difficulty}</label>
            <div className="form-slider-container">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="form-slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    ((difficulty - 1) / 4) * 100
                  }%, #e2e8f0 ${((difficulty - 1) / 4) * 100}%, #e2e8f0 100%)`,
                }}
              />
              <div className="difficulty-labels">
                <span>简单</span>
                <span>困难</span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
            >
              取消
            </button>
            <button type="submit" className="btn-submit">
              创建卡片
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCardModal;
