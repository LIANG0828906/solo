import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { usePlanStore } from '@/store/usePlanStore';
import { PRESET_COLORS, TASK_TYPES, minutesToTime, snapToSlot } from '@/lib/constants';
import type { TimeBlock, TaskType } from '@/types';
import styles from './PlanEditor.module.css';

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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{isEdit ? '编辑时间块' : '新建时间块'}</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>任务名称</label>
          <input
            className={styles.textInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入任务名称"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>开始时间</label>
          <div className={styles.timeRow}>
            <input
              type="number"
              className={styles.timeInput}
              value={String(startH).padStart(2, '0')}
              onChange={e => updateTime('start', 'h', e.target.value)}
              min={0}
              max={23}
            />
            <span className={styles.timeSep}>:</span>
            <input
              type="number"
              className={styles.timeInput}
              value={String(startM).padStart(2, '0')}
              onChange={e => updateTime('start', 'm', e.target.value)}
              min={0}
              max={59}
              step={15}
            />
            <span className={styles.timeDash}>—</span>
            <input
              type="number"
              className={styles.timeInput}
              value={String(endH).padStart(2, '0')}
              onChange={e => updateTime('end', 'h', e.target.value)}
              min={0}
              max={23}
            />
            <span className={styles.timeSep}>:</span>
            <input
              type="number"
              className={styles.timeInput}
              value={String(endM).padStart(2, '0')}
              onChange={e => updateTime('end', 'm', e.target.value)}
              min={0}
              max={59}
              step={15}
            />
          </div>
          <div className={styles.timeHint}>
            {minutesToTime(snapToSlot(startMin))} — {minutesToTime(snapToSlot(endMin))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>颜色</label>
          <div className={styles.colorRow}>
            {PRESET_COLORS.map(c => (
              <div
                key={c}
                className={`${styles.colorCircle} ${color === c ? styles.colorCircleSelected : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>任务类型</label>
          <select
            className={styles.select}
            value={type}
            onChange={e => setType(e.target.value as TaskType)}
          >
            {TASK_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>备注</label>
          <textarea
            className={styles.textarea}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="添加备注..."
          />
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSave}>
            {isEdit ? '保存修改' : '创建时间块'}
          </button>
          {isEdit && onDelete && (
            <button className={styles.deleteBtn} onClick={handleDelete}>
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
