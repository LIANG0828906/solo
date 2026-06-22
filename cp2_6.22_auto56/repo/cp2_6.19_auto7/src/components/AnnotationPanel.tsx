import React from 'react';
import { AnnotationType } from '../utils/annotationManager';

interface AnnotationPanelProps {
  currentTool: AnnotationType;
  currentColor: string;
  onToolChange: (tool: AnnotationType) => void;
  onColorChange: (color: string) => void;
}

const tools: { type: AnnotationType; icon: string; label: string }[] = [
  { type: 'pen', icon: '✏️', label: '自由画笔' },
  { type: 'rect', icon: '⬜', label: '矩形框' },
  { type: 'text', icon: '📝', label: '文本框' },
  { type: 'highlight', icon: '🖍️', label: '高亮' },
];

const colors = [
  '#607d8b',
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffeb3b',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#9e9e9e',
  '#000000',
];

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  currentTool,
  currentColor,
  onToolChange,
  onColorChange,
}) => {
  return (
    <div style={styles.panel}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>标注工具</h3>
        <div style={styles.toolGrid}>
          {tools.map((tool) => (
            <button
              key={tool.type}
              style={{
                ...styles.toolButton,
                ...(currentTool === tool.type ? styles.toolButtonActive : {}),
              }}
              onClick={() => onToolChange(tool.type)}
              title={tool.label}
            >
              <span
                style={{
                  ...styles.toolIcon,
                  color: currentTool === tool.type ? '#1565c0' : '#607d8b',
                }}
              >
                {tool.icon}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>颜色选择</h3>
        <div style={styles.colorGrid}>
          {colors.map((color) => (
            <button
              key={color}
              style={{
                ...styles.colorButton,
                backgroundColor: color,
                ...(currentColor === color ? styles.colorButtonActive : {}),
              }}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>操作提示</h3>
        <div style={styles.tips}>
          <p style={styles.tipItem}>• 按住鼠标拖拽绘制标注</p>
          <p style={styles.tipItem}>• 单击标注可选中编辑</p>
          <p style={styles.tipItem}>• 双击标注可删除</p>
          <p style={styles.tipItem}>• 右键标注添加批注</p>
          <p style={styles.tipItem}>• 滚轮上下滚动翻页</p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: '16px',
    height: '100%',
    overflowY: 'auto',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '12px',
  },
  toolGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  toolButton: {
    width: '56px',
    height: '56px',
    border: '2px solid transparent',
    borderRadius: '12px',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease-out',
  },
  toolButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1565c0',
    transform: 'scale(1.05)',
  },
  toolIcon: {
    fontSize: '24px',
    transition: 'color 0.15s ease-out',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
  },
  colorButton: {
    width: '40px',
    height: '40px',
    border: '2px solid transparent',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.15s ease-out',
  },
  colorButtonActive: {
    borderColor: '#1565c0',
    transform: 'scale(1.15)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  tips: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '12px',
  },
  tipItem: {
    fontSize: '12px',
    color: '#666',
    lineHeight: '1.8',
    margin: 0,
  },
};

export default AnnotationPanel;
