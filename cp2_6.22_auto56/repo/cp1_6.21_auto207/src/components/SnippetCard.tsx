import React, { useState, useMemo } from 'react';
import { Camera, AlignLeft, Layers, Trash2 } from 'lucide-react';
import type { Snippet, ContentType } from '../types';
import { useCollection } from '../contexts/CollectionContext';
import TagChip from './TagChip';
import { formatRelativeTime } from '../utils/time';
import { htmlToMarkdown } from '../utils/html';

const typeIconConfig: Record<ContentType, { icon: React.ReactNode; color: string }> = {
  image: { icon: <Camera size={14} />, color: '#3B82F6' },
  text: { icon: <AlignLeft size={14} />, color: '#10B981' },
  mixed: { icon: <Layers size={14} />, color: '#8B5CF6' },
};

interface Props {
  snippet: Snippet;
  index: number;
}

const SnippetCard: React.FC<Props> = ({ snippet, index }) => {
  const { deleteSnippet, showToast } = useCollection();
  const [mdCopied, setMdCopied] = useState(false);
  const [htmlCopied, setHtmlCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const cfg = typeIconConfig[snippet.contentType];

  const displayTags = useMemo(() => {
    const shown = snippet.tags.slice(0, 3);
    const rest = snippet.tags.length - shown.length;
    return { shown, rest };
  }, [snippet.tags]);

  const previewText = useMemo(() => {
    const text = snippet.plainText || '';
    return text.length > 40 ? text.slice(0, 40) + '...' : text;
  }, [snippet.plainText]);

  const copyToClipboard = async (text: string, type: 'md' | 'html') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'md') {
        setMdCopied(true);
        setTimeout(() => setMdCopied(false), 1500);
      } else {
        setHtmlCopied(true);
        setTimeout(() => setHtmlCopied(false), 1500);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('复制失败', 'error');
    }
  };

  const handleCopyMd = () => {
    const md = htmlToMarkdown(snippet.html, snippet.contentType, snippet.title);
    copyToClipboard(md, 'md');
  };

  const handleCopyHtml = () => {
    copyToClipboard(snippet.html, 'html');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const ok = await deleteSnippet(snippet.id);
    if (ok) {
      showToast('已删除');
    } else {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        opacity: isDeleting ? 0 : 1,
        transform: isDeleting ? 'scale(0.95)' : 'translateY(0)',
        height: '100%',
        animation: `cardIn 0.4s ease ${Math.min(index * 0.05, 0.4)}s both`,
      }}
      className="card-hover"
    >
      <button
        onClick={handleDelete}
        className="prevent-selection"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: '#FEE2E2',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease',
          zIndex: 2,
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FECACA')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FEE2E2')}
      >
        <Trash2 size={15} />
      </button>

      <div style={{ paddingRight: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              backgroundColor: cfg.color + '15',
              color: cfg.color,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {cfg.icon}
          </span>
          <span
            style={{
              fontSize: 12,
              color: '#9CA3AF',
              marginLeft: 'auto',
            }}
          >
            {formatRelativeTime(snippet.createdAt)}
          </span>
        </div>

        <h3
          title={snippet.title}
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
          }}
        >
          {snippet.title}
        </h3>

        <p
          style={{
            fontSize: 13,
            color: '#6B7280',
            lineHeight: 1.55,
            marginBottom: 12,
            flex: 1,
            minHeight: 40,
          }}
        >
          {previewText || '(无预览文字)'}
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 14,
            minHeight: 24,
          }}
        >
          {displayTags.shown.map((t) => (
            <TagChip key={t} label={t} size="sm" />
          ))}
          {displayTags.rest > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                backgroundColor: '#F3F4F6',
                color: '#6B7280',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 8,
              }}
            >
              +{displayTags.rest}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          borderTop: '1px solid #E5E7EB',
          paddingTop: 12,
        }}
        className="prevent-selection"
      >
        <button
          onClick={handleCopyMd}
          style={{
            flex: 1,
            height: 32,
            minWidth: 0,
            backgroundColor: mdCopied ? '#10B981' : '#FFFFFF',
            color: mdCopied ? '#FFFFFF' : '#374151',
            border: `1px solid ${mdCopied ? '#10B981' : '#D1D5DB'}`,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 8px',
          }}
          onMouseEnter={(e) => {
            if (!mdCopied) (e.currentTarget as HTMLButtonElement).style.borderColor = '#3B82F6';
          }}
          onMouseLeave={(e) => {
            if (!mdCopied) (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
          }}
        >
          {mdCopied ? '已复制' : '复制 MD'}
        </button>
        <button
          onClick={handleCopyHtml}
          style={{
            flex: 1,
            height: 32,
            minWidth: 0,
            backgroundColor: htmlCopied ? '#10B981' : '#FFFFFF',
            color: htmlCopied ? '#FFFFFF' : '#374151',
            border: `1px solid ${htmlCopied ? '#10B981' : '#D1D5DB'}`,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 0.2s ease',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            padding: '0 8px',
          }}
          onMouseEnter={(e) => {
            if (!htmlCopied) (e.currentTarget as HTMLButtonElement).style.borderColor = '#3B82F6';
          }}
          onMouseLeave={(e) => {
            if (!htmlCopied) (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
          }}
        >
          {htmlCopied ? '已复制' : '复制 HTML'}
        </button>
      </div>
    </div>
  );
};

export default SnippetCard;
