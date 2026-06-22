import { Brick, BrickType, BRICK_COLORS } from '../store/useAppStore';

interface PropertyPanelProps {
  selectedBricks: Brick[];
  brickTypes: BrickType[];
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

export default function PropertyPanel({ selectedBricks, brickTypes, onColorChange, onDelete }: PropertyPanelProps) {
  const hasSelection = selectedBricks.length > 0;
  const singleSelection = selectedBricks.length === 1;
  const brick = selectedBricks[0];
  const brickType = brick ? brickTypes.find(t => t.id === brick.type) : null;

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>属性面板</h3>

      {!hasSelection ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>选择一个积木块查看属性</p>
        </div>
      ) : (
        <div style={styles.content}>
          {singleSelection && brick && brickType && (
            <>
              <div style={styles.section}>
                <span style={styles.label}>类型</span>
                <span style={styles.value}>{brickType.name}</span>
              </div>

              <div style={styles.section}>
                <span style={styles.label}>位置</span>
                <div style={styles.positionRow}>
                  <div style={styles.positionItem}>
                    <span style={styles.posLabel}>X</span>
                    <span style={styles.posValue}>{brick.position.x.toFixed(1)}</span>
                  </div>
                  <div style={styles.positionItem}>
                    <span style={styles.posLabel}>Y</span>
                    <span style={styles.posValue}>{brick.position.y.toFixed(1)}</span>
                  </div>
                  <div style={styles.positionItem}>
                    <span style={styles.posLabel}>Z</span>
                    <span style={styles.posValue}>{brick.position.z.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div style={styles.section}>
                <span style={styles.label}>颜色</span>
                <div style={styles.colorOptions}>
                  {BRICK_COLORS.map((color) => (
                    <button
                      key={color}
                      style={{
                        ...styles.colorBtn,
                        backgroundColor: color,
                        border: brick.color === color ? '2px solid #fff' : '2px solid transparent',
                      }}
                      onClick={() => onColorChange(color)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {!singleSelection && (
            <div style={styles.multiInfo}>
              <p style={styles.multiText}>已选中 {selectedBricks.length} 个积木块</p>
            </div>
          )}

          <button style={styles.deleteBtn} onClick={onDelete}>
            {singleSelection ? '删除积木' : '删除选中积木'}
          </button>
        </div>
      )}

      {hasSelection && (
        <div style={styles.shortcuts}>
          <span style={styles.shortcutTitle}>快捷键</span>
          <div style={styles.shortcutItem}>
            <kbd style={styles.key}>←</kbd><kbd style={styles.key}>→</kbd>
            <span style={styles.shortcutDesc}>左右移动</span>
          </div>
          <div style={styles.shortcutItem}>
            <kbd style={styles.key}>↑</kbd><kbd style={styles.key}>↓</kbd>
            <span style={styles.shortcutDesc}>前后移动</span>
          </div>
          <div style={styles.shortcutItem}>
            <kbd style={styles.key}>Delete</kbd>
            <span style={styles.shortcutDesc}>删除</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 280,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flexShrink: 0,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 500,
  },
  value: {
    color: '#F8FAFC',
    fontSize: 14,
  },
  positionRow: {
    display: 'flex',
    gap: 8,
  },
  positionItem: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: '6px 8px',
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  posLabel: {
    color: '#64748B',
    fontSize: 10,
  },
  posValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: 600,
  },
  colorOptions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  colorBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s ease-out',
    padding: 0,
  },
  deleteBtn: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'background-color 0.2s ease-out',
    marginTop: 8,
  },
  multiInfo: {
    padding: '12px 0',
  },
  multiText: {
    color: '#E2E8F0',
    fontSize: 13,
    margin: 0,
  },
  shortcuts: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTop: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  shortcutTitle: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 4,
  },
  shortcutItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  key: {
    backgroundColor: '#334155',
    color: '#E2E8F0',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  shortcutDesc: {
    color: '#94A3B8',
    fontSize: 11,
  },
};
