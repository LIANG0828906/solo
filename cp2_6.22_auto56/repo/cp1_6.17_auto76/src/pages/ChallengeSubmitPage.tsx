import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useChallengeStore } from '@/store/challengeStore';
import { useReviewStore } from '@/store/reviewStore';
import { CodeEditor } from '@/components/CodeEditor';

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={`p-${elements.length}`} dangerouslySetInnerHTML={{ __html: currentParagraph.join(' ') }} />
      );
      currentParagraph = [];
    }
  };

  lines.forEach((line, idx) => {
    const processedLine = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    if (processedLine.startsWith('## ')) {
      flushParagraph();
      elements.push(<h2 key={`h2-${idx}`}>{processedLine.slice(3)}</h2>);
    } else if (processedLine.startsWith('- ')) {
      flushParagraph();
      elements.push(<li key={`li-${idx}`} dangerouslySetInnerHTML={{ __html: processedLine.slice(2) }} />);
    } else if (processedLine.trim() === '') {
      flushParagraph();
    } else {
      currentParagraph.push(processedLine);
    }
  });

  flushParagraph();
  return elements;
};

export const ChallengeSubmitPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loadChallenges = useChallengeStore((s) => s.loadChallenges);
  const getChallengeById = useChallengeStore((s) => s.getChallengeById);
  const addSubmission = useReviewStore((s) => s.addSubmission);

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const challenge = id ? getChallengeById(id) : undefined;

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  useEffect(() => {
    if (challenge) {
      setCode(challenge.starterCode);
    }
  }, [challenge]);

  const handleSubmit = async () => {
    if (!id || !code.trim()) return;

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const submissionId = addSubmission(id, code);
    setSubmitting(false);
    navigate(`/challenge/${id}/review?submission=${submissionId}`);
  };

  if (!challenge) {
    return (
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '96px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>挑战不存在</p>
        <Link
          to="/challenges"
          style={{
            color: 'var(--accent-primary)',
            marginTop: 16,
            display: 'inline-block',
          }}
        >
          返回挑战列表
        </Link>
      </div>
    );
  }

  const diffColors: Record<string, { color: string; label: string }> = {
    easy: { color: '#22C55E', label: '简单' },
    medium: { color: '#EAB308', label: '中等' },
    hard: { color: '#EF4444', label: '困难' },
  };

  return (
    <div
      style={{
        backgroundColor: '#1E1B2E',
        minHeight: 'calc(100vh - 64px)',
        paddingTop: 64,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '32px 24px 48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Link
            to="/challenges"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              color: 'var(--text-muted)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <span>←</span>
            返回列表
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 24,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: 32,
            }}
            className="fade-in"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {challenge.title}
              </h1>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: diffColors[challenge.difficulty].color,
                  backgroundColor: `${diffColors[challenge.difficulty].color}1A`,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {diffColors[challenge.difficulty].label}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 24,
              }}
            >
              {challenge.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '3px 10px',
                    borderRadius: 4,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="markdown-content">{renderMarkdown(challenge.description)}</div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginTop: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}
                >
                  示例输入
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                    fontSize: 13,
                    color: '#A5A4B8',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {challenge.exampleInput}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}
                >
                  示例输出
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                    fontSize: 13,
                    color: '#22C55E',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {challenge.exampleOutput}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
            }}
            className="fade-in"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                  }}
                />
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#EAB308',
                  }}
                />
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    marginLeft: 12,
                  }}
                >
                  solution.js
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: submitting ? 'var(--accent-hover)' : 'var(--accent-primary)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                  }
                }}
              >
                {submitting ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#FFFFFF',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    提交中...
                  </>
                ) : (
                  <>
                    <span>提交代码</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
            <CodeEditor value={code} onChange={setCode} height="450px" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
