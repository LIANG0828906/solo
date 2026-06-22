import { useState } from 'react';
import { KNOWLEDGE_TAGS, QUESTION_TYPE_LABELS, type GenerateRequest } from '@/utils/api';
import { useRipple } from '@/hooks/useRipple';
import { Sparkles } from 'lucide-react';

type QuestionType = 'choice' | 'multi_choice' | 'fill_blank' | 'true_false';

interface ConfigPanelProps {
  onGenerate: (config: GenerateRequest) => void;
  isGenerating: boolean;
}

export default function ConfigPanel({ onGenerate, isGenerating }: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<QuestionType>('choice');
  const [difficulty, setDifficulty] = useState(3);
  const [count, setCount] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const generateRipple = useRipple('generate-btn');

  const tabs: QuestionType[] = ['choice', 'multi_choice', 'fill_blank', 'true_false'];

  const toggleTag = (tag: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerate = (e: React.MouseEvent<HTMLButtonElement>) => {
    generateRipple.onClick(e);
    onGenerate({
      question_type: activeTab,
      difficulty,
      count,
      knowledge_tags: selectedTags,
    });
  };

  const handleTabClick = (tab: QuestionType) => {
    setActiveTab(tab);
  };

  return (
    <div className="config-panel">
      <div className="config-header">
        <Sparkles size={20} className="config-icon" />
        <h2 className="config-title">题目生成</h2>
      </div>

      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ripple-container ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            {QUESTION_TYPE_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="config-section">
        <label className="config-label">
          难度等级: <span className="config-value">{difficulty}</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="difficulty-slider"
        />
        <div className="slider-labels">
          <span>简单</span>
          <span>困难</span>
        </div>
      </div>

      <div className="config-section">
        <label className="config-label">
          题目数量: <span className="config-value">{count}</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="difficulty-slider"
        />
        <div className="slider-labels">
          <span>1题</span>
          <span>10题</span>
        </div>
      </div>

      <div className="config-section">
        <label className="config-label">知识点标签</label>
        <div className="tag-grid">
          {KNOWLEDGE_TAGS.map((tag) => (
            <button
              key={tag}
              className={`tag-btn ripple-container ${selectedTags.includes(tag) ? 'tag-selected' : ''}`}
              onClick={(e) => toggleTag(tag, e)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <button
        className="generate-btn ripple-container"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <span className="generating-content">
            <span className="spinner" />
            生成中...
          </span>
        ) : (
          <span className="generating-content">
            <Sparkles size={18} />
            开始生成
          </span>
        )}
        {generateRipple.rippleElements}
      </button>
    </div>
  );
}
