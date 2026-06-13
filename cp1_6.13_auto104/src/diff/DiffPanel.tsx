import React from 'react';
import { DiffSegment, ReviewStatus } from '@/types';

interface DiffPanelProps {
  segments: DiffSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string | null) => void;
  onUpdateStatus: (segmentId: string, status: ReviewStatus) => void;
  leftRatio: number;
  dividerPosition: number;
}

const DiffPanel: React.FC<DiffPanelProps> = ({
  segments,
  selectedSegmentId,
  onSelectSegment,
  onUpdateStatus,
  leftRatio,
  dividerPosition
}) => {
  const getHighlightColor = (type: DiffSegment['type'], isSelected: boolean) => {
    let bg = 'transparent';
    switch (type) {
      case 'added': bg = '#E6F7E6'; break;
      case 'removed': bg = '#FFE6E6'; break;
      case 'modified': bg = '#FFF3E0'; break;
      default: bg = '#FFFFFF';
    }
    return isSelected ? bg : bg;
  };

  const getStatusBadge = (status: ReviewStatus) => {
    if (!status) return null;
    const config = {
      accepted: { label: '已采纳', bg: '#52C41A', color: '#fff' },
      rejected: { label: '已拒绝', bg: '#FF4D4F', color: '#fff' },
      pending: { label: '待讨论', bg: '#FA8C16', color: '#fff' }
    };
    const c = config[status];
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        padding: '2px 12px',
        borderRadius: '0 8px 0 8px',
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 600,
        zIndex: 5
      }}>
        {c.label}
      </div>
    );
  };

  const renderStatusButtons = (segment: DiffSegment) => {
    if (segment.type === 'unchanged') return null;

    const buttons: { status: Exclude<ReviewStatus, null>; label: string; color: string; activeBg: string }[] = [
      { status: 'accepted', label: '采纳', color: '#52C41A', activeBg: 'rgba(82, 196, 26, 0.12)' },
      { status: 'rejected', label: '拒绝', color: '#FF4D4F', activeBg: 'rgba(255, 77, 79, 0.12)' },
      { status: 'pending', label: '讨论', color: '#FA8C16', activeBg: 'rgba(250, 140, 22, 0.12)' }
    ];

    return (
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '8px 12px',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255,255,255,0.6)'
      }}>
        {buttons.map(btn => {
          const isActive = segment.status === btn.status;
          return (
            <button
              key={btn.status}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(segment.id, isActive ? null : btn.status);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: `1px solid ${isActive ? btn.color : '#E5E7EB'}`,
                background: isActive ? btn.activeBg : '#FFFFFF',
                color: isActive ? btn.color : '#6B7280',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = btn.activeBg;
                  e.currentTarget.style.color = btn.color;
                  e.currentTarget.style.borderColor = btn.color;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#6B7280';
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }
              }}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    );
  };

  const formatLineRange = (lines: { start: number; end: number }) => {
    if (lines.start === 0 && lines.end === 0) return '';
    if (lines.start === lines.end) return `行 ${lines.start}`;
    return `行 ${lines.start}-${lines.end}`;
  };

  const renderLines = (text: string, lineStart: number) => {
    if (!text) return <div style={{ color: '#9CA3AF', fontStyle: 'italic' }}>(无内容)</div>;
    const lines = text.split('\n');
    return lines.map((line, idx) => (
      <div key={idx} style={{
        display: 'flex',
        minHeight: 22,
        fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
        fontSize: 13
      }}>
        <span style={{
          width: 40,
          padding: '0 8px',
          textAlign: 'right',
          color: '#9CA3AF',
          background: '#FAFAFC',
          borderRight: '1px solid #F0F0F5',
          userSelect: 'none',
          flexShrink: 0
        }}>
          {lineStart + idx}
        </span>
        <span style={{
          flex: 1,
          padding: '0 10px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: '#374151'
        }}>
          {line || '\u00A0'}
        </span>
      </div>
    ));
  };

  const panelStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    gap: 0,
    overflow: 'hidden',
    position: 'relative',
    minWidth: 0
  };

  const columnStyle = (width: string): React.CSSProperties => ({
    width,
    display: 'flex',
    flexDirection: 'column',
    background: '#FFFFFF',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    minWidth: 0
  });

  const columnHeader = (title: string, subtitle: string): React.CSSProperties => ({
    padding: '14px 20px',
    borderBottom: '1px solid #F0F0F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, #FCFCFE 0%, #FFFFFF 100%)'
  });

  if (segments.length === 0) {
    return (
      <div style={panelStyle}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: 16,
          background: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div>请上传或粘贴两份文档以开始校对</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {/* 左侧原版 */}
      <div style={{ ...columnStyle('100%'), width: `${leftRatio}%`, minWidth: 300 }}>
        <div style={columnHeader('原版文档', 'Original')}>
          <span style={{ color: '#6B7280', fontSize: 12 }}>共 {segments.length} 段</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {segments.map((seg) => {
            const isSelected = selectedSegmentId === seg.id;
            const showOriginal = seg.type !== 'added';
            return (
              <div
                key={`orig-${seg.id}`}
                onClick={() => onSelectSegment(seg.id)}
                style={{
                  position: 'relative',
                  cursor: seg.type === 'unchanged' ? 'default' : 'pointer',
                  margin: '6px 10px',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: showOriginal ? getHighlightColor(seg.type, isSelected) : '#FAFAFC',
                  border: isSelected ? '2px solid #4A90D9' : '1px solid transparent',
                  boxShadow: isSelected
                    ? '0 2px 8px rgba(74,144,217,0.3)'
                    : 'none',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: isSelected ? 'shadow-pulse 300ms ease' : undefined
                }}
              >
                {getStatusBadge(seg.status)}
                <div style={{
                  padding: '8px 10px 4px',
                  fontSize: 11,
                  color: '#9CA3AF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 500
                }}>
                  <span>{formatLineRange(seg.originalLines)}</span>
                  {seg.type !== 'unchanged' && (
                    <span style={{
                      color: seg.type === 'removed' ? '#FF4D4F' : seg.type === 'modified' ? '#FA8C16' : '#9CA3AF',
                      fontSize: 10
                    }}>
                      {seg.type === 'removed' ? '● 删除' : seg.type === 'modified' ? '● 修改' : ''}
                    </span>
                  )}
                </div>
                <div>
                  {showOriginal
                    ? renderLines(seg.originalText, seg.originalLines.start)
                    : (
                      <div style={{
                        padding: '16px 20px',
                        color: '#9CA3AF',
                        fontStyle: 'italic',
                        fontSize: 13,
                        textAlign: 'center',
                        borderTop: '1px dashed #E5E7EB'
                      }}>
                        ─ 新增段，原版无此内容 ─
                      </div>
                    )
                  }
                </div>
                {renderStatusButtons(seg)}
              </div>
            );
          })}
        </div>
      </div>

      {/* 中间空白分隔 */}
      <div
        style={{
          width: `${100 - leftRatio * 2}%`,
          minWidth: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'default'
        }}
      >
        <div style={{
          width: 2,
          height: '60%',
          background: 'linear-gradient(180deg, transparent 0%, #D1D5DB 20%, #D1D5DB 80%, transparent 100%)',
          borderRadius: 2
        }} />
      </div>

      {/* 右侧修订版 */}
      <div style={{ ...columnStyle('100%'), width: `${leftRatio}%`, minWidth: 300 }}>
        <div style={columnHeader('修订文档', 'Revised')}>
          <span style={{ color: '#6B7280', fontSize: 12 }}>差异分析结果</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {segments.map((seg) => {
            const isSelected = selectedSegmentId === seg.id;
            const showRevised = seg.type !== 'removed';
            return (
              <div
                key={`rev-${seg.id}`}
                onClick={() => onSelectSegment(seg.id)}
                style={{
                  position: 'relative',
                  cursor: seg.type === 'unchanged' ? 'default' : 'pointer',
                  margin: '6px 10px',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: showRevised ? getHighlightColor(seg.type, isSelected) : '#FAFAFC',
                  border: isSelected ? '2px solid #4A90D9' : '1px solid transparent',
                  boxShadow: isSelected
                    ? '0 2px 8px rgba(74,144,217,0.3)'
                    : 'none',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: isSelected ? 'shadow-pulse 300ms ease' : undefined
                }}
              >
                {getStatusBadge(seg.status)}
                <div style={{
                  padding: '8px 10px 4px',
                  fontSize: 11,
                  color: '#9CA3AF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 500
                }}>
                  <span>{formatLineRange(seg.revisedLines)}</span>
                  {seg.type !== 'unchanged' && (
                    <span style={{
                      color: seg.type === 'added' ? '#52C41A' : seg.type === 'modified' ? '#FA8C16' : '#9CA3AF',
                      fontSize: 10
                    }}>
                      {seg.type === 'added' ? '● 新增' : seg.type === 'modified' ? '● 修改' : ''}
                    </span>
                  )}
                </div>
                <div>
                  {showRevised
                    ? renderLines(seg.revisedText, seg.revisedLines.start)
                    : (
                      <div style={{
                        padding: '16px 20px',
                        color: '#9CA3AF',
                        fontStyle: 'italic',
                        fontSize: 13,
                        textAlign: 'center',
                        borderTop: '1px dashed #E5E7EB'
                      }}>
                        ─ 删除段，修订版已移除此内容 ─
                      </div>
                    )
                  }
                </div>
                {renderStatusButtons(seg)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiffPanel;
