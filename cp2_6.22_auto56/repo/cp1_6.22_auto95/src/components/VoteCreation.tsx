import React, { useState } from 'react';
import { createVote } from '@/utils/voteStore';

interface VoteCreationProps {
  onVoteCreated: (voteId: string) => void;
}

const VoteCreation: React.FC<VoteCreationProps> = ({ onVoteCreated }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isMultiChoice, setIsMultiChoice] = useState(false);

  const addOption = () => {
    if (options.length >= 8) return;
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    if (!question.trim()) return;
    if (options.some((o) => !o.trim())) return;
    const vote = createVote(question.trim(), options.map((o) => o.trim()), isMultiChoice);
    onVoteCreated(vote.id);
  };

  const isValid = question.trim() && options.every((o) => o.trim());

  return (
    <div className="vote-creation">
      <h2 className="section-title">创建投票</h2>
      <div className="form-group">
        <label className="form-label">问题</label>
        <input
          type="text"
          className="form-input"
          placeholder="输入你的投票问题..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label">选项（2-8个）</label>
        <div className="options-list">
          {options.map((opt, idx) => (
            <div key={idx} className="option-row">
              <input
                type="text"
                className="form-input option-input"
                placeholder={`选项 ${idx + 1}`}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
              />
              {options.length > 2 && (
                <button className="btn-remove" onClick={() => removeOption(idx)}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className="btn-add-option"
          onClick={addOption}
          disabled={options.length >= 8}
        >
          添加选项 ({options.length}/8)
        </button>
      </div>
      <div className="form-group toggle-group">
        <label className="form-label">投票模式</label>
        <div className="toggle-switch">
          <span className={isMultiChoice ? '' : 'active'}>单选</span>
          <button
            className={`toggle-track ${isMultiChoice ? 'on' : ''}`}
            onClick={() => setIsMultiChoice(!isMultiChoice)}
          >
            <span className="toggle-thumb" />
          </button>
          <span className={isMultiChoice ? 'active' : ''}>多选</span>
        </div>
      </div>
      <button className="btn-primary btn-create" onClick={handleCreate} disabled={!isValid}>
        创建投票
      </button>
    </div>
  );
};

export default VoteCreation;
