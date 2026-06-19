import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useAppStore } from '@/store';
import type { AgendaItem } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CreateMeetingModalProps {
  onClose: () => void;
}

interface AgendaFormItem {
  id: string;
  title: string;
  responsible: string;
  duration: number;
}

export default function CreateMeetingModal({ onClose }: CreateMeetingModalProps) {
  const { createMeeting } = useAppStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [agendaItems, setAgendaItems] = useState<AgendaFormItem[]>([
    { id: '1', title: '', responsible: '', duration: 15 },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const totalDuration = agendaItems.reduce((sum, item) => sum + item.duration, 0);

  const handleAddAgenda = () => {
    setAgendaItems([
      ...agendaItems,
      { id: Date.now().toString(), title: '', responsible: '', duration: 15 },
    ]);
  };

  const handleRemoveAgenda = (id: string) => {
    if (agendaItems.length <= 1) return;
    setAgendaItems(agendaItems.filter((item) => item.id !== id));
  };

  const handleAgendaChange = (id: string, field: keyof AgendaFormItem, value: string | number) => {
    setAgendaItems(
      agendaItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = agendaItems.findIndex((item) => item.id === active.id);
      const newIndex = agendaItems.findIndex((item) => item.id === over.id);
      setAgendaItems(arrayMove(agendaItems, oldIndex, newIndex));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validAgendaItems = agendaItems
      .filter((item) => item.title.trim())
      .map((item, index) => ({
        title: item.title,
        responsible: item.responsible || '待定',
        duration: item.duration,
        status: 'pending' as const,
        order: index,
        description: '',
      }));

    createMeeting({
      title: title.trim(),
      date,
      time,
      location: location || '线上会议',
      participants: [],
      agendaItems: validAgendaItems as Omit<AgendaItem, 'id' | 'comments' | 'votes'>[],
      status: 'upcoming',
    });

    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-xl font-bold text-dark-50">创建新会议</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all hover:scale-105"
          >
            <X size={20} className="text-dark-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                会议标题 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入会议标题..."
                className="input-field"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  日期
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                  时间
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                地点
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="会议室名称或线上链接..."
                className="input-field"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-dark-300">
                议程项
                <span className="text-dark-500 ml-2">
                  (共 {agendaItems.filter((a) => a.title.trim()).length} 项，约 {totalDuration} 分钟)
                </span>
              </label>
              <button
                type="button"
                onClick={handleAddAgenda}
                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors hover:scale-105"
              >
                <Plus size={16} />
                添加
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={agendaItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {agendaItems.map((item, index) => (
                    <SortableAgendaItem
                      key={item.id}
                      item={item}
                      index={index}
                      onChange={handleAgendaChange}
                      onRemove={handleRemoveAgenda}
                      canRemove={agendaItems.length > 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="btn-primary disabled:opacity-50"
          >
            创建会议
          </button>
        </div>
      </div>
    </div>
  );
}

interface SortableAgendaItemProps {
  item: AgendaFormItem;
  index: number;
  onChange: (id: string, field: keyof AgendaFormItem, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function SortableAgendaItem({ item, index, onChange, onRemove, canRemove }: SortableAgendaItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="glass-card rounded-xl p-4 flex items-start gap-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-2.5 cursor-grab active:cursor-grabbing text-dark-400 hover:text-dark-200 transition-colors"
      >
        <GripVertical size={18} />
      </button>

      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary-400 min-w-[20px]">
            #{index + 1}
          </span>
          <input
            type="text"
            value={item.title}
            onChange={(e) => onChange(item.id, 'title', e.target.value)}
            placeholder="议程标题..."
            className="input-field flex-1 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={item.responsible}
            onChange={(e) => onChange(item.id, 'responsible', e.target.value)}
            placeholder="负责人"
            className="input-field py-2 text-sm"
          />
          <select
            value={item.duration}
            onChange={(e) => onChange(item.id, 'duration', Number(e.target.value))}
            className="input-field py-2 text-sm"
          >
            {[5, 10, 15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>{m} 分钟</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={!canRemove}
        className="mt-2 p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-dark-400"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
