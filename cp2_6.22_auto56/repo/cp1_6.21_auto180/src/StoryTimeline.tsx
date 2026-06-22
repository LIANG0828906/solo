import React, { useState } from 'react';
import { GitBranch } from 'lucide-react';
import type { Paragraph } from './types';
import { formatRelativeTime } from './utils';

interface StoryTimelineProps {
  paragraphs: Paragraph[];
  activeBranchId: string;
  username: string;
  isTransitioning: boolean;
  onAddParagraph: (content: string) => void;
  onCreateBranch: (paragraphId: string) => void;
}

const StoryTimeline: React.FC<StoryTimelineProps> = ({
  paragraphs,
  activeBranchId,
  username,
  isTransitioning,
  onAddParagraph,
  onCreateBranch,
}) => {
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddParagraph(newContent.trim());
      setNewContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const branchParagraphs = paragraphs.filter(p => p.branchId === activeBranchId);
  
  const orderedParagraphs: Paragraph[] = [];
  let currentId: string | null = null;
  
  while (true) {
    const next = branchParagraphs.find(p => p.parentParagraphId === currentId);
    if (!next) break;
    orderedParagraphs.push(next);
    currentId = next.id;
  }

  return (
    <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
      <div
        style={{
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div style={{ position: 'relative', paddingLeft: '40px' }}>
          <div
            style={{
              position: 'absolute',
              left: '10px',
              top: '0',
              bottom: '0',
              width: '4px',
              backgroundColor: '#334155',
              borderRadius: '2px',
            }}
          />

          {orderedParagraphs.map((paragraph, index) => (
            <div
              key={paragraph.id}
              style={{
                position: 'relative',
                marginBottom: '16px',
                animation: `slideInLeft 0.4s ease-out ${index * 0.1}s both`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '-34px',
                  top: '20px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  border: '3px solid #0F172A',
                  zIndex: 1,
                }}
              />

              <div
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  position: 'relative',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      color: '#60A5FA',
                      fontWeight: 600,
                      fontSize: '14px',
                    }}
                  >
                    {paragraph.author}
                  </span>
                  <button
                    onClick={() => onCreateBranch(paragraph.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s ease, color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#334155';
                      e.currentTarget.style.color = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }}
                    title="从此处分叉"
                  >
                    <GitBranch size={16} />
                    <span style={{ fontSize: '12px' }}>分叉</span>
                  </button>
                </div>

                <p
                  style={{
                    color: '#E2E8F0',
                    fontSize: '15px',
                    lineHeight: 1.7,
                    marginBottom: '12px',
                    maxHeight: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {paragraph.content.length > 150
                    ? paragraph.content.substring(0, 150) + '...'
                    : paragraph.content}
                </p>

                <span
                  style={{
                    color: '#64748B',
                    fontSize: '12px',
                  }}
                >
                  {formatRelativeTime(paragraph.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '24px', paddingLeft: '40px' }}>
          <div
            style={{
              backgroundColor: '#1E293B',
              borderRadius: '12px',
              padding: '16px',
              border: '2px solid transparent',
              transition: 'border-color 0.2s ease',
            }}
          >
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={`以${username}的身份续写故事...`}
              style={{
                width: '100%',
                minHeight: '80px',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#E2E8F0',
                fontSize: '15px',
                lineHeight: 1.6,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              maxLength={500}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '12px',
              }}
            >
              <span
                style={{
                  color: '#64748B',
                  fontSize: '12px',
                }}
              >
                {newContent.length}/500
              </span>
              <button
                type="submit"
                disabled={!newContent.trim() || isSubmitting}
                style={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: newContent.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                  opacity: newContent.trim() && !isSubmitting ? 1 : 0.5,
                  transition: 'background-color 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (newContent.trim() && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isSubmitting ? '提交中...' : '续写'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default StoryTimeline;
