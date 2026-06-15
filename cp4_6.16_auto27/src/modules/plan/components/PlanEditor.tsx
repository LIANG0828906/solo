import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { usePlanStore } from '@/store/usePlanStore';
import { PRESET_COLORS, TASK_TYPES, minutesToTime, snapToSlot } from '@/lib/constants';
import type { TimeBlock, TaskType } from '@/types';

interface PlanEditorProps {
  visible: boolean;
  block: TimeBlock | null;
  startTime?: number;
  endTime?: number;
  onSave: (block: Partial<TimeBlock> & { startTime: number; endTime: number }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

function findAvailableLane(blocks: TimeBlock[], start: number, end: number, excludeId?: string): number {
  const occupied = new Set<number>();
  for (const b of blocks) {
    if (excludeId && b.id === excludeId) continue;
    if (b.startTime < end && b.endTime > start) {
      occupied.add(b.lane);
    }
  }
  for (let lane = 0; lane < 3; lane++) {
    if (!occupied.has(lane)) return lane;
  }
  return 0;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    width: 400,
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    background: '#16213e',
    borderRadius: 2,
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(6px)',
    padding: 24,
    color: '#eee',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: '#aaa',
    marginBottom: 6,
  },
  textInput: {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '8px 12px',
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 2,
    color: '#eee',
    fontSize: 14,
    outline: 'none',
  },
  timeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 56,
    padding: '8px 6px',
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 2,
    color: '#eee',
    fontSize: 14,
    textAlign: 'center' as const,
    outline: 'none',
    MozAppearance: 'textfield' as const,
  },
  timeSep: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 600,
  },
  timeDash: {
    color: '#aaa',
    fontSize: 14,
    margin: '0 4px',
  },
  colorRow: {
    display: 'flex',
    gap: 12,
  },
  colorCircle: (selected: boolean, color: string) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: color,
    border: selected ? '2px solid #fff' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  }),
  select: {
    width: '100%',
    padding: '8px 12px',
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 2,
    color: '#eee',
    fontSize: 14,
    outline: 'none',
    appearance: 'none' as const,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '8px 12px',
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 2,
    color: '#eee',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 64,
  },
  footer: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
  },
  saveBtn: {
    flex: 1,
    padding: '10px 0',
    background: '#e94560',
    border: 'none',
    borderRadius: 2,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid #e94560',
    borderRadius: 2,
    color: '#e94560',
    fontSize: 14,
    cursor: 'pointer',
  },
};

export default function PlanEditor({ visible, block, startTime, endTime, onSave, onDelete, onClose }: PlanEditorProps) {
  const existingBlocks = usePlanStore(s => s.blocks);

  const isEdit = block !== null;

  const [title, setTitle] = useState('');
  const [startMin, setStartMin] = useState(0);
  const [endMin, setEndMin] = useState(60);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [type, setType] = useState<TaskType>('work');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (isEdit && block) {
      setTitle(block.title);
      setStartMin(block.startTime);
      setEndMin(block.endTime);
      setColor(block.color);
      setType(block.type);
      setNote(block.note);
    } else {
      setTitle('');
      setStartMin(snapToSlot(startTime ?? 540));
      setEndMin(snapToSlot(endTime ?? 600));
      setColor(PRESET_COLORS[0]);
      setType('work');
      setNote('');
    }
  }, [visible, isEdit, block, startTime, endTime]);

  const handleSave = useCallback(() => {
    const s = snapToSlot(startMin);
    const e = snapToSlot(endMin);
    if (e <= s) return;
    const lane = findAvailableLane(existingBlocks, s, e, isEdit && block ? block.id : undefined);
    const result: Partial<TimeBlock> & { startTime: number; endTime: number } = {
      title,
      startTime: s,
      endTime: e,
      color,
      type,
      note,
      lane,
    };
    if (isEdit && block) {
      result.id = block.id;
    }
    onSave(result);
  }, [title, startMin, endMin, color, type, note, isEdit, block, existingBlocks, onSave]);

  const handleDelete = useCallback(() => {
    if (isEdit && block && onDelete) {
      onDelete(block.id);
    }
  }, [isEdit, block, onDelete]);

  if (!visible) return null;

  const startH = Math.floor(startMin / 60);
  const startM = startMin % 60;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;

  const updateTime = (field: 'start' | 'end', unit: 'h' | 'm', val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    if (field === 'start') {
      if (unit === 'h') setStartMin(snapToSlot(Math.min(num, 23) * 60 + (startMin % 60)));
      else setStartMin(snapToSlot(Math.floor(startMin / 60) * 60 + Math.min(num, 59)));
    } else {
      if (unit === 'h') setEndMin(snapToSlot(Math.min(num, 23) * 60 + (endMin % 60)));
      else setEndMin(snapToSlot(Math.floor(endMin / 60) * 60 + Math.min(num, 59)));
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>{isEdit ? '编辑时间块' : '新建时间块'}</span>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>任务名称</label>
          <input
            style={styles.textInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入任务名称"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>开始时间</label>
          <div style={styles.timeRow}>
            <input
              type="number"
              style={styles.timeInput}
              value={String(startH).padStart(2, '0')}
              onChange={e => updateTime('start', 'h', e.target.value)}
              min={0}
              max={23}
            />
            <span style={styles.timeSep}>:</span>
            <input
              type="number"
              style={styles.timeInput}
              value={String(startM).padStart(2, '0')}
              onChange={e => updateTime('start', 'm', e.target.value)}
              min={0}
              max={59}
              step={15}
            />
            <span style={styles.timeDash}>—</span>
            <input
              type="number"
              style={styles.timeInput}
              value={String(endH).padStart(2, '0')}
              onChange={e => updateTime('end', 'h', e.target.value)}
              min={0}
              max={23}
            />
            <span style={styles.timeSep}>:</span>
            <input
              type="number"
              style={styles.timeInput}
              value={String(endM).padStart(2, '0')}
              onChange={e => updateTime('end', 'm', e.target.value)}
              min={0}
              max={59}
              step={15}
            />
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            {minutesToTime(snapToSlot(startMin))} — {minutesToTime(snapToSlot(endMin))}
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>颜色</label>
          <div style={styles.colorRow}>
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                style={styles.colorCircle(color === c, c)}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>任务类型</label>
          <select
            style={styles.select}
            value={type}
            onChange={e => setType(e.target.value as TaskType)}
          >
            {TASK_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>备注</label>
          <textarea
            style={styles.textarea}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="添加备注..."
          />
        </div>

        <div style={styles.footer}>
          <button style={styles.saveBtn} onClick={handleSave}>
            {isEdit ? '保存修改' : '创建时间块'}
          </button>
          {isEdit && onDelete && (
            <button style={styles.deleteBtn} onClick={handleDelete}>
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
