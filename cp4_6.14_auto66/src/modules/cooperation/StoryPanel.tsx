import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { StoryParagraph } from '../../types';
import { useStory, MAX_WORDS } from './useStory';

interface StoryPanelProps {
  onStoryboardsChange: (storyboards: any[]) => void;
  onParagraphsChange: (paragraphs: StoryParagraph[]) => void;
  onGeneratingChange: (generating: boolean) => void;
}

export default function StoryPanel({ onStoryboardsChange, onParagraphsChange, onGeneratingChange }: StoryPanelProps) {
  const { paragraphs, currentAuthorIndex, currentRound, isGenerating, addParagraph, storyboards } = useStory();
  const [inputValue, setInputValue] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onStoryboardsChange(storyboards);
  }, [storyboards, onStoryboardsChange]);

  useEffect(() => {
    onParagraphsChange(paragraphs);
  }, [paragraphs, onParagraphsChange]);

  useEffect(() => {
    onGeneratingChange(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [paragraphs.length]);

  const isOverLimit = inputValue.length > MAX_WORDS;
  const wordCount = inputValue.length;

  const handleSubmit = () => {
    if (isOverLimit || inputValue.trim().length === 0 || isGenerating) return;
    addParagraph(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getAuthorColor = (index: number) => {
    return index === 0
      ? { bg: '#e2e8f0', text: '#1e293b', badgeBg: '#e2e8f0', badgeText: '#475569' }
      : { bg: '#3b82f6', text: '#ffffff', badgeBg: '#dbeafe', badgeText: '#1d4ed8' };
  };

  const currentAuthor = getAuthorColor(currentAuthorIndex);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 520,
        background: '#f1f5f9',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>📝 故事接龙协作</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 20,
              background: '#fef3c7',
              color: '#92400e',
              fontWeight: 700,
            }}
          >
            第 {currentRound} 轮
          </span>
          <span
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 20,
              background: currentAuthor.badgeBg,
              color: currentAuthor.badgeText,
              fontWeight: 700,
            }}
          >
            轮到作者 {currentAuthorIndex + 1}
          </span>
        </div>
      </div>

      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {paragraphs.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 14,
              marginTop: 80,
              padding: '24px',
              border: '2px dashed #cbd5e1',
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
            <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 6 }}>开始你的故事接龙</div>
            <div>轮流输入故事段落，AI 自动生成漫画分镜</div>
          </div>
        )}

        {paragraphs.map((p, idx) => {
          const isRight = p.authorIndex === 1;
          const colors = getAuthorColor(p.authorIndex);
          return (
            <div
              key={p.id}
              className="slide-up-animate"
              style={{
                display: 'flex',
                justifyContent: isRight ? 'flex-end' : 'flex-start',
                width: '100%',
                animationDelay: `${idx * 40}ms`,
              }}
            >
              <div
                style={{
                  width: '70%',
                  maxWidth: 600,
                  padding: '14px 18px',
                  borderRadius: isRight ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 14,
                  lineHeight: 1.65,
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    marginBottom: 6,
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>作者 {p.authorIndex + 1}</span>
                  <span>第{idx + 1} 段</span>
                </div>
                {p.content}
              </div>
            </div>
          );
        })}

        {paragraphs.length > 0 && paragraphs.length % 2 === 0 && (
          <div
            style={{
              width: '100%',
              borderTop: '2px dashed #cbd5e1',
              margin: '8px 0',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#f1f5f9',
                padding: '0 10px',
                fontSize: 11,
                color: '#94a3b8',
                fontWeight: 600,
              }}
            >
              第 {Math.floor(paragraphs.length / 2)} 轮结束
            </span>
          </div>
        )}

        {isGenerating && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '10px 16px',
                background: '#ede9fe',
                color: '#7c3aed',
                borderRadius: 16,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="pulse-soft" style={{ display: 'inline-block' }}>⚡</span>
              正在生成分镜...
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: '14px 16px 18px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <div style={{ position: 'relative' }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`作者 ${currentAuthorIndex + 1}，输入你的故事段落（Enter发送，Shift+Enter换行）...`}
            disabled={isGenerating}
            rows={3}
            style={{
              width: '100%',
              resize: 'none',
              padding: '12px 14px',
              paddingBottom: 28,
              border: `1px solid ${isOverLimit ? '#ef4444' : '#cbd5e1'}`,
              borderRadius: 12,
              fontSize: 14,
              lineHeight: 1.55,
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s ease',
              background: isGenerating ? '#f8fafc' : '#ffffff',
              color: '#1e293b',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 14,
              bottom: 8,
              fontSize: 11,
              fontWeight: 600,
              color: isOverLimit ? '#ef4444' : '#94a3b8',
              transition: 'color 0.2s ease',
            }}
          >
            {wordCount}/{MAX_WORDS}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isOverLimit || inputValue.trim().length === 0 || isGenerating}
          className="press-animate"
          style={{
            marginTop: 10,
            width: '100%',
            padding: '11px 16px',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            color: '#ffffff',
            background: isOverLimit || inputValue.trim().length === 0 || isGenerating ? '#cbd5e1' : '#8b5cf6',
            cursor: isOverLimit || inputValue.trim().length === 0 || isGenerating ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease, transform 0.1s ease',
          }}
          onMouseEnter={(e) => {
            if (!isOverLimit && inputValue.trim().length > 0 && !isGenerating) {
              (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOverLimit && inputValue.trim().length > 0 && !isGenerating) {
              (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf6';
            }
          }}
        >
          {isGenerating ? '⌛ 生成中...' : `发送段落 (作者 ${currentAuthorIndex + 1})`}
        </button>
      </div>
    </div>
  );
}
