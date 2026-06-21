import React from 'react';
import { Document } from '../types';
import { formatRelativeTime } from '../types';

interface DocumentCardProps {
  document: Document;
  onClick: (id: string) => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  '技术方案': { bg: 'rgba(99,102,241,0.15)', text: '#818CF8' },
  '会议记录': { bg: 'rgba(34,197,94,0.15)', text: '#4ADE80' },
  '分析报告': { bg: 'rgba(251,146,60,0.15)', text: '#FB923C' },
  '未分类': { bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' }
};

export default function DocumentCard({ document, onClick }: DocumentCardProps) {
  const colors = TYPE_COLORS[document.type] || TYPE_COLORS['未分类'];
  const truncatedTitle = document.title.length > 30
    ? document.title.slice(0, 30) + '...'
    : document.title;

  return (
    <div
      onClick={() => onClick(document.id)}
      style={{
        width: '260px',
        background: '#1E293B',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      }}
    >
      <h3 style={{
        color: '#E2E8F0',
        fontSize: '15px',
        fontWeight: 600,
        marginBottom: '10px',
        lineHeight: 1.4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {truncatedTitle}
      </h3>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '12px'
      }}>
        <span style={{
          padding: '3px 10px',
          borderRadius: '12px',
          background: colors.bg,
          color: colors.text,
          fontSize: '12px',
          fontWeight: 500
        }}>
          {document.type}
        </span>
        <span style={{
          color: '#64748B',
          fontSize: '12px'
        }}>
          {formatRelativeTime(document.updatedAt)}
        </span>
      </div>
    </div>
  );
}
