import { useState } from 'react';
import { Question } from '../shared/types';
import './QuestionPanel.css';

interface QuestionPanelProps {
  onPublish: (question: Question) => void;
  isActive: boolean;
}

function QuestionPanel({ onPublish, isActive }: QuestionPanelProps) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [duration, setDuration] = useState(20);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    if (options.some((opt) => !opt.trim())) return;

    const question: Question = {
      id: Date.now().toString(),
      title: title.trim(),
      options: options.map((opt) => opt.trim()),
      correctIndex,
      duration,
      createdAt: Date.now(),
    };

    onPublish(question);
    
    setTitle('');
    setOptions(['', '', '', '']);
    setCorrectIndex(0);
    setDuration(20);
  };

  return (
    <div className="question-panel">
      <h2 className="panel-title">创建题目</h2>
      
      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-group">
          <label className="form-label">题目内容</label>
          <textarea
            className="form-textarea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入题目内容..."
            rows={3}
            disabled={isActive}
          />
        </div>

        <div className="form-group">
          <label className="form-label">选项设置</label>
          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-item">
                <div
                  className={`option-radio ${
                    index === correctIndex ? 'selected' : ''
                  }`}
                  onClick={() => !isActive && setCorrectIndex(index)}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <input
                  type="text"
                  className="option-input"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                  disabled={isActive}
                />
                {index === correctIndex && (
                  <span className="correct-badge">✓ 正确</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">倒计时时长（秒）</label>
          <div className="duration-selector">
            {[10, 20, 30, 60].map((sec) => (
              <button
                key={sec}
                type="button"
                className={`duration-btn ${duration === sec ? 'active' : ''}`}
                onClick={() => !isActive && setDuration(sec)}
                disabled={isActive}
              >
                {sec}秒
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="publish-btn"
          disabled={isActive || !title.trim() || options.some((opt) => !opt.trim())}
        >
          {isActive ? '答题进行中...' : '发布题目'}
        </button>
      </form>

      <div className="tip-box">
        <p className="tip-title">💡 使用提示</p>
        <ul className="tip-list">
          <li>点击选项左侧的字母可设置正确答案</li>
          <li>发布题目后将自动开始倒计时</li>
          <li>学生在倒计时结束前可提交答案</li>
        </ul>
      </div>
    </div>
  );
}

export default QuestionPanel;
