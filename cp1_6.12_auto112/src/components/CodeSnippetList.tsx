import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Code2 } from 'lucide-react';
import type { CodeSnippet, Language } from '../types';

interface CodeSnippetListProps {
  snippets: CodeSnippet[];
  loading?: boolean;
}

const languageColors: Record<string, string> = {
  javascript: '#F7DF1E',
  typescript: '#3178C6',
  python: '#3776AB',
  java: '#ED8B00',
  cpp: '#00599C',
  go: '#00ADD8',
  rust: '#DEA584',
  php: '#777BB4',
  ruby: '#CC342D',
  swift: '#FA7343'
};

const languageNames: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  go: 'Go',
  rust: 'Rust',
  php: 'PHP',
  ruby: 'Ruby',
  swift: 'Swift'
};

const SnippetCard: React.FC<{ snippet: CodeSnippet }> = ({ snippet }) => {
  const navigate = useNavigate();
  const firstLine = snippet.code.split('\n')[0] || '// 空代码片段';
  const langColor = languageColors[snippet.language] || '#888';

  return (
    <div
      onClick={() => navigate(`/snippet/${snippet.id}`)}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-out',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: langColor,
          color: ['javascript', 'python', 'java', 'cpp', 'ruby', 'swift'].includes(snippet.language) ? '#fff' : '#fff'
        }}
      >
        {languageNames[snippet.language] || snippet.language}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
        <Heart size={14} fill={snippet.likedByMe ? 'var(--accent-red)' : 'none'} color={snippet.likedByMe ? 'var(--accent-red)' : 'currentColor'} />
        <span>{snippet.likes}</span>
      </div>
    </div>

      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 1,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {snippet.title}
      </h3>

      <div style={{
        backgroundColor: '#2D2D2D',
        borderRadius: 'var(--radius-sm)',
        padding: '12px',
        overflow: 'hidden',
        flex: 1
      }}>
        <code style={{
          fontFamily: '"Fira Code", "Consolas", monospace',
          fontSize: '13px',
          color: '#D4D4D4',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block'
        }}>
          {firstLine}
        </code>
      </div>

      {snippet.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {snippet.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                padding: '3px 10px',
                backgroundColor: 'var(--tag-bg)',
                color: 'var(--tag-text)',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '2px solid #B0B0B0',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <img
            src={snippet.author.avatar}
            alt={snippet.author.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {snippet.author.name}
        </span>
        <span style={{ fontSize: '12px', color: '#B0B0B0', marginLeft: 'auto' }}>
          {new Date(snippet.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </div>
  );
};

const CodeSnippetList: React.FC<CodeSnippetListProps> = ({ snippets, loading = false }) => {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px',
        padding: '0 24px'
      }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              height: '240px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (snippets.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        color: 'var(--text-secondary)'
      }}>
        <Code2 size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <p style={{ fontSize: '16px' }}>暂无代码片段</p>
        <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
          快来分享你的第一个代码片段吧！
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      padding: '0 24px'
    }}>
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} />
      ))}
    </div>
  );
};

export default CodeSnippetList;
