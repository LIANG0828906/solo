import React, { useMemo } from 'react';
import type { Annotation, User } from '../types';

interface CollabPanelProps {
  annotations: Annotation[];
  currentUser: User | null;
  onAnnotationClick: (annotation: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
}

const CollabPanel: React.FC<CollabPanelProps> = ({
  annotations,
  currentUser,
  onAnnotationClick,
  onDeleteAnnotation,
}) => {
  const groupedAnnotations = useMemo(() => {
    const groups: Record<string, Annotation[]> = {};
    annotations.forEach((ann) => {
      if (!groups[ann.userName]) {
        groups[ann.userName] = [];
      }
      const group = groups[ann.userName];
      if (group) {
        group.push(ann);
      }
    });
    return groups;
  }, [annotations]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: Annotation['type']): string => {
    switch (type) {
      case 'comment':
        return '💬';
      case 'highlight':
        return '⭐';
      case 'dynamic':
        return '🎵';
      case 'error':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const getTypeLabel = (type: Annotation['type']): string => {
    switch (type) {
      case 'comment':
        return '批注';
      case 'highlight':
        return '高潮段';
      case 'dynamic':
        return '强弱记号';
      case 'error':
        return '错误提醒';
      default:
        return '标记';
    }
  };

  interface CollabPanelStyles {
    container: React.CSSProperties;
    header: React.CSSProperties;
    timeline: React.CSSProperties;
    userGroup: React.CSSProperties;
    userHeader: React.CSSProperties;
    userColorDot: React.CSSProperties;
    userName: React.CSSProperties;
    annotationItem: React.CSSProperties;
    annotationItemHover: React.CSSProperties;
    annotationHeader: React.CSSProperties;
    annotationType: React.CSSProperties;
    annotationMeasure: React.CSSProperties;
    annotationContent: React.CSSProperties;
    annotationTime: React.CSSProperties;
    deleteBtn: React.CSSProperties;
    deleteBtnVisible: React.CSSProperties;
    timelineLine: React.CSSProperties;
    emptyState: React.CSSProperties;
    emptyIcon: React.CSSProperties;
    emptyText: React.CSSProperties;
  }

  const styles: CollabPanelStyles = {
    container: {
      width: '320px',
      height: '100%',
      backgroundColor: '#F5F0E6',
      borderLeft: '2px solid #4A3728',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      padding: '16px',
      backgroundColor: '#4A3728',
      color: '#F5F0E6',
      fontSize: '18px',
      fontWeight: 'bold',
      borderBottom: '1px solid #3A2718',
    },
    timeline: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px',
    },
    userGroup: {
      marginBottom: '20px',
    },
    userHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
      padding: '6px 10px',
      backgroundColor: 'rgba(74, 55, 40, 0.1)',
      borderRadius: '6px',
    },
    userColorDot: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      flexShrink: 0,
    },
    userName: {
      fontWeight: 'bold',
      color: '#4A3728',
      fontSize: '14px',
    },
    annotationItem: {
      position: 'relative',
      marginLeft: '16px',
      padding: '10px 12px',
      marginBottom: '8px',
      backgroundColor: '#FFF8EC',
      border: '1px solid rgba(74, 55, 40, 0.2)',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    annotationItemHover: {
      transform: 'translateX(4px)',
      boxShadow: '0 2px 8px rgba(74, 55, 40, 0.2)',
    },
    annotationHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '6px',
    },
    annotationType: {
      fontSize: '12px',
      color: '#6B5344',
      fontWeight: '500',
    },
    annotationMeasure: {
      fontSize: '11px',
      color: '#8B7355',
      backgroundColor: 'rgba(255, 215, 0, 0.3)',
      padding: '2px 6px',
      borderRadius: '4px',
    },
    annotationContent: {
      fontSize: '13px',
      color: '#4A3728',
      lineHeight: '1.5',
      wordBreak: 'break-word',
    },
    annotationTime: {
      fontSize: '11px',
      color: '#8B7355',
      marginTop: '6px',
    },
    deleteBtn: {
      position: 'absolute',
      top: '6px',
      right: '6px',
      width: '20px',
      height: '20px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      color: '#8B7355',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0,
      transition: 'opacity 0.2s ease',
    },
    deleteBtnVisible: {
      opacity: 1,
    },
    timelineLine: {
      position: 'absolute',
      left: '22px',
      top: '0',
      bottom: '0',
      width: '2px',
      backgroundColor: 'rgba(74, 55, 40, 0.2)',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#8B7355',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px',
    },
    emptyText: {
      fontSize: '14px',
    },
  };

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  if (annotations.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>协作注释</div>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>
          <div style={styles.emptyText}>暂无注释</div>
          <div style={{ ...styles.emptyText, fontSize: '12px', marginTop: '8px' }}>
            点击乐谱音符添加批注
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>协作注释</div>
      <div style={{ ...styles.timeline, position: 'relative' }}>
        <div style={styles.timelineLine}></div>
        {Object.entries(groupedAnnotations).map(([userName, userAnnotations]) => (
          <div key={userName} style={styles.userGroup}>
            <div style={styles.userHeader}>
              <div
                style={{
                  ...styles.userColorDot,
                  backgroundColor: userAnnotations[0]?.userColor || '#4A3728',
                }}
              ></div>
              <span style={styles.userName}>{userName}</span>
              <span style={{ fontSize: '12px', color: '#8B7355', marginLeft: 'auto' }}>
                {userAnnotations.length}条
              </span>
            </div>
            {userAnnotations
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((annotation) => (
                <div
                  key={annotation.id}
                  style={{
                    ...styles.annotationItem,
                    borderLeftColor: annotation.userColor,
                    borderLeftWidth: '3px',
                    ...(hoveredId === annotation.id ? styles.annotationItemHover : {}),
                  }}
                  onClick={() => onAnnotationClick(annotation)}
                  onMouseEnter={() => setHoveredId(annotation.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {currentUser?.id === annotation.userId && (
                    <button
                      style={{
                        ...styles.deleteBtn,
                        ...(hoveredId === annotation.id ? styles.deleteBtnVisible : {}),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAnnotation(annotation.id);
                      }}
                    >
                      ✕
                    </button>
                  )}
                  <div style={styles.annotationHeader}>
                    <span>{getTypeIcon(annotation.type)}</span>
                    <span style={styles.annotationType}>{getTypeLabel(annotation.type)}</span>
                    <span style={styles.annotationMeasure}>第{annotation.measure}小节</span>
                  </div>
                  <div style={styles.annotationContent}>{annotation.content}</div>
                  <div style={styles.annotationTime}>{formatTime(annotation.timestamp)}</div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollabPanel;
