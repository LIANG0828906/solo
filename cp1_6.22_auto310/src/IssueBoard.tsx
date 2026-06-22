import { useState, useMemo, useCallback } from 'react';
import { MessageSquare, Calendar, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import type { Issue, LabelName } from './types';

interface Props {
  issues: Issue[];
  searchQuery: string;
  labelFilters: LabelName[];
}

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return iso.split('T')[0];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderMarkdown(md: string, searchQuery: string): React.ReactNode {
  const lines = md.split('\n');
  const nodes: React.ReactNode[] = [];
  let inCode = false;
  let codeBuffer: string[] = [];
  let codeId = 0;

  const highlight = (text: string): React.ReactNode => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((p, i) =>
      regex.test(p) ? (
        <mark
          key={i}
          style={{
            background: '#f1c40f',
            color: '#000',
            padding: '0 2px',
            borderRadius: 2,
          }}
        >
          {p}
        </mark>
      ) : (
        p
      )
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeBuffer = [];
      } else {
        const codeText = codeBuffer.join('\n');
        nodes.push(
          <pre
            key={`code-${codeId++}`}
            style={{
              margin: '10px 0',
              padding: '12px 14px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 6,
              overflowX: 'auto',
              fontSize: 12,
              lineHeight: 1.6,
              color: '#dcdcdc',
              border: '1px solid var(--border)',
            }}
          >
            <code>{highlight(codeText)}</code>
          </pre>
        );
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      nodes.push(<div key={`br-${i}`} style={{ height: 8 }} />);
      continue;
    }

    if (/^###\s+/.test(line)) {
      nodes.push(
        <h3 key={i} style={{ fontSize: 14, fontWeight: 600, margin: '14px 0 8px', color: 'var(--text-primary)' }}>
          {highlight(line.replace(/^###\s+/, ''))}
        </h3>
      );
      continue;
    }
    if (/^##\s+/.test(line)) {
      nodes.push(
        <h2 key={i} style={{ fontSize: 15, fontWeight: 700, margin: '16px 0 10px', color: 'var(--text-primary)' }}>
          {highlight(line.replace(/^##\s+/, ''))}
        </h2>
      );
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0', paddingLeft: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>{line.match(/^\s*(\d+)/)?.[1]}.</span>
          <span style={{ flex: 1 }}>{renderInline(line.replace(/^\s*\d+\.\s+/, ''), highlight)}</span>
        </div>
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0', paddingLeft: 8 }}>
          <span style={{ color: 'var(--accent)' }}>•</span>
          <span style={{ flex: 1 }}>{renderInline(line.replace(/^\s*[-*]\s+/, ''), highlight)}</span>
        </div>
      );
      continue;
    }
    nodes.push(
      <p key={i} style={{ margin: '6px 0', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
        {renderInline(line, highlight)}
      </p>
    );
  }
  if (inCode) {
    nodes.push(
      <pre
        key={`code-tail`}
        style={{
          margin: '10px 0',
          padding: '12px 14px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 6,
          overflowX: 'auto',
          fontSize: 12,
          color: '#dcdcdc',
        }}
      >
        <code>{highlight(codeBuffer.join('\n'))}</code>
      </pre>
    );
  }
  return nodes;
}

function renderInline(text: string, hl: (s: string) => React.ReactNode): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const boldRegex = /\*\*([^*]+)\*\*/;
  const italicRegex = /(?<!\*)\*([^*\n]+)\*(?!\*)/;
  const codeRegex = /`([^`]+)`/;

  while (remaining.length) {
    const matches = [
      { type: 'bold', regex: boldRegex },
      { type: 'italic', regex: italicRegex },
      { type: 'code', regex: codeRegex },
    ]
      .map((m) => ({ ...m, match: remaining.match(m.regex) }))
      .filter((m) => m.match) as { type: string; regex: RegExp; match: RegExpMatchArray }[];

    if (!matches.length) {
      tokens.push(hl(remaining));
      break;
    }
    matches.sort((a, b) => (a.match!.index || 0) - (b.match!.index || 0));
    const first = matches[0];
    const idx = first.match!.index || 0;
    if (idx > 0) tokens.push(hl(remaining.slice(0, idx)));
    const content = first.match![1];
    if (first.type === 'bold') {
      tokens.push(
        <strong key={key++} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {hl(content)}
        </strong>
      );
    } else if (first.type === 'italic') {
      tokens.push(
        <em key={key++} style={{ fontStyle: 'italic' }}>
          {hl(content)}
        </em>
      );
    } else {
      tokens.push(
        <code
          key={key++}
          style={{
            padding: '1px 5px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 3,
            fontSize: 12,
            color: '#e8c07d',
          }}
        >
          {hl(content)}
        </code>
      );
    }
    remaining = remaining.slice(idx + first.match![0].length);
  }
  return tokens;
}

function IssueCard({
  issue,
  searchQuery,
}: {
  issue: Issue;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const highlightTitle = useCallback(
    (text: string) => {
      if (!searchQuery.trim()) return text;
      const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
      const parts = text.split(regex);
      return parts.map((p, i) =>
        regex.test(p) ? (
          <mark
            key={i}
            style={{
              background: '#f1c40f',
              color: '#000',
              padding: '0 2px',
              borderRadius: 2,
            }}
          >
            {p}
          </mark>
        ) : (
          p
        )
      );
    },
    [searchQuery]
  );

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 10,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          padding: 18,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'transform 0.1s',
        }}
        onMouseDown={(e) => {
          if (e.button === 0) e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                #{issue.number}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: issue.isOpen ? 'rgba(46,204,113,0.15)' : 'rgba(149,165,166,0.15)',
                  color: issue.isOpen ? '#2ecc71' : '#95a5a6',
                }}
              >
                {issue.isOpen ? '开放' : '已关闭'}
              </span>
            </div>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                marginBottom: 10,
              }}
            >
              {highlightTitle(issue.title)}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {issue.labels.map((lb) => (
                <span
                  key={lb.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 9px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 500,
                    background: lb.color + '22',
                    color: lb.color,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: lb.color,
                    }}
                  />
                  {searchQuery &&
                  lb.name.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                    <mark
                      style={{
                        background: '#f1c40f',
                        color: '#000',
                        padding: '0 2px',
                        borderRadius: 2,
                      }}
                    >
                      {lb.name}
                    </mark>
                  ) : (
                    lb.name
                  )}
                </span>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={12} />
                {formatDate(issue.createdAt)}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <MessageSquare size={12} />
                {issue.commentsCount} 条评论
              </span>
            </div>
          </div>
          <div
            style={{
              color: 'var(--text-muted)',
              transition: 'transform 0.25s ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
              marginTop: 4,
            }}
          >
            <ChevronDown size={18} />
          </div>
        </div>
      </div>
      <div
        style={{
          maxHeight: expanded ? 2000 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
        }}
      >
        <div
          style={{
            padding: '0 18px 18px',
            margin: '0 18px 18px',
            borderTop: '1px solid var(--border)',
            paddingTop: 16,
          }}
        >
          {renderMarkdown(issue.description, searchQuery)}
        </div>
      </div>
    </div>
  );
}

export default function IssueBoard({ issues, searchQuery, labelFilters }: Props) {
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return issues
      .filter((i) => i.isOpen)
      .filter((i) => {
        if (labelFilters.length === 0) return true;
        return i.labels.some((lb) => labelFilters.includes(lb.name));
      })
      .filter((i) => {
        if (!q) return true;
        return (
          i.title.toLowerCase().includes(q) ||
          i.labels.some((lb) => lb.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [issues, searchQuery, labelFilters]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          开放 Issue <span style={{ color: 'var(--text-muted)' }}>({filtered.length})</span>
        </h2>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            borderRadius: 10,
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          {searchQuery || labelFilters.length
            ? '没有匹配的 Issue，尝试修改搜索条件'
            : '暂无开放 Issue'}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visible.map((issue) => (
              <IssueCard key={issue.id} issue={issue} searchQuery={searchQuery} />
            ))}
          </div>

          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button
                onClick={() => setPage((p) => p + 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 22px',
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Loader size={14} />
                加载更多（还剩 {filtered.length - visible.length}）
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
