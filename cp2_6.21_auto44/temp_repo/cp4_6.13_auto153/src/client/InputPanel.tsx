import React, { useState } from 'react';

interface InputPanelProps {
  onGenerate: (text: string) => void;
  onClear: () => void;
  isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onGenerate, onClear, isLoading }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const charCount = text.trim().length;
  const isValid = charCount >= 300;
  
  const handleGenerate = () => {
    setError(null);
    
    if (!isValid) {
      setError('请输入至少300字的文本内容');
      return;
    }
    
    onGenerate(text);
  };
  
  const handleClear = () => {
    setText('');
    setError(null);
    onClear();
  };
  
  return (
    <div className="input-panel">
      <div className="input-header">
        <h2>文本输入</h2>
        <span className={`char-count ${isValid ? 'valid' : ''}`}>
          {charCount} / 300 字
        </span>
      </div>
      
      <textarea
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="请在此粘贴或输入文本内容（不少于300字）..."
        disabled={isLoading}
      />
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={isLoading || !isValid}
        >
          {isLoading ? '生成中...' : '生成图谱'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleClear}
          disabled={isLoading}
        >
          清除
        </button>
      </div>
      
      <div className="tips">
        <h3>提示</h3>
        <ul>
          <li>输入包含专业术语、人名、地名等概念的文本效果更佳</li>
          <li>建议输入学术文章、新闻报道等结构化文本</li>
          <li>概念之间有明确关联关系的文本能生成更丰富的图谱</li>
        </ul>
      </div>
    </div>
  );
};