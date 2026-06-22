import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface EditorPanelProps {
  onGenerate: (text: string) => void;
  initialText?: string;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ onGenerate, initialText = '' }) => {
  const [text, setText] = useState(initialText);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      onGenerate(text);
      setIsGenerating(false);
    }, 100);
  };

  const panelStyle: React.CSSProperties = {
    width: '30%',
    minWidth: '280px',
    height: '100%',
    backgroundColor: '#F5F5F5',
    boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    boxSizing: 'border-box',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    margin: '0 0 16px 0',
  };

  const descStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    width: '100%',
    padding: '16px',
    fontSize: '14px',
    lineHeight: 1.6,
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    resize: 'none',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const buttonStyle: React.CSSProperties = {
    marginTop: '16px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#FFFFFF',
    backgroundColor: '#1976D2',
    border: 'none',
    borderRadius: '8px',
    cursor: isGenerating ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: isGenerating ? 0.7 : 1,
    transition: 'all 0.2s ease',
  };

  return (
    <div style={panelStyle}>
      <h2 style={titleStyle}>📝 笔记编辑</h2>
      <p style={descStyle}>
        粘贴或输入你的笔记内容，支持 Markdown 格式。点击下方按钮，系统将自动提取关键概念并生成知识卡片墙。
      </p>
      <textarea
        style={textareaStyle}
        placeholder="在这里输入或粘贴你的笔记内容...

例如：
人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。机器学习是人工智能的核心，是使计算机具有智能的根本途径。深度学习是机器学习的一个分支，它基于神经网络进行表征学习。自然语言处理是人工智能的重要应用领域，研究人与计算机之间用自然语言进行有效通信的各种理论和方法。"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === 'Enter') {
            handleGenerate();
          }
        }}
      />
      <button
        style={buttonStyle}
        onClick={handleGenerate}
        disabled={isGenerating || !text.trim()}
        onMouseEnter={(e) => {
          if (!isGenerating && text.trim()) {
            e.currentTarget.style.backgroundColor = '#1565C0';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1976D2';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Sparkles size={18} />
        {isGenerating ? '生成中...' : '生成知识卡片'}
      </button>
      <p style={{ fontSize: '11px', color: '#999', marginTop: '8px', textAlign: 'center' }}>
        提示：按 Ctrl + Enter 快速生成
      </p>
    </div>
  );
};

export default EditorPanel;
