import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  MapPin,
  Clock,
  Users,
  X,
  Edit2,
  Check,
  X as XIcon,
  AlertCircle,
} from 'lucide-react';
import { gigsApi } from '../api';
import type { Gig, GigSchedule } from '../types';
import { cn } from '../lib/utils';

interface GigCardProps {
  gig: Gig;
  onClick: () => void;
  delay: number;
}

function GigCard({ gig, onClick, delay }: GigCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gig.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    animationDelay: `${delay}ms`,
  };

  const confirmedCount = gig.members.filter((m) => m.status === 'confirmed').length;
  const totalMembers = gig.members.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'card-glass rounded-2xl p-5 cursor-pointer',
        'transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#e94560]/10',
        'opacity-0 animate-fade-in-up',
        isDragging && 'cursor-grabbing z-50 shadow-2xl'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-[#e94560] font-medium">
            {format(parseISO(gig.date), 'yyyy年M月d日', { locale: zhCN })}
          </p>
          <p className="text-sm text-gray-400">
            {format(parseISO(gig.date), 'EEEE', { locale: zhCN })}
          </p>
        </div>
        <div className="flex gap-1">
          {gig.members.map((member) => (
            <span
              key={member.id}
              className={cn(
                'status-dot',
                member.status === 'confirmed' && 'status-confirmed',
                member.status === 'pending' && 'status-pending',
                member.status === 'leave' && 'status-leave'
              )}
              title={`${member.name}: ${member.status === 'confirmed' ? '已确认' : member.status === 'pending' ? '待确认' : '请假'}`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{gig.venue}</h3>

      <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
        <MapPin size={14} />
        <span>{gig.city}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users size={14} />
          <span>{confirmedCount}/{totalMembers} 已确认</span>
        </div>
        <div className="text-xs text-[#e94560] font-medium">
          {gig.schedule.performance} 开演
        </div>
      </div>
    </div>
  );
}

interface ScheduleItemProps {
  label: string;
  time: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (time: string) => void;
  onCancel: () => void;
}

function ScheduleItem({ label, time, isEditing, onEdit, onSave, onCancel }: ScheduleItemProps) {
  const [editTime, setEditTime] = useState(time);

  useEffect(() => {
    setEditTime(time);
  }, [time]);

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/10 last:border-0">
      <div className="w-2 h-2 rounded-full bg-[#e94560] flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-gray-400">{label}</p>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
              autoFocus
            />
            <button
              onClick={() => onSave(editTime)}
              className="p-1 text-green-400 hover:bg-white/10 rounded"
            >
              <Check size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-red-400 hover:bg-white/10 rounded"
            >
              <XIcon size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">{time}</p>
            <button
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface GigDetailPanelProps {
  gig: Gig | null;
  onClose: () => void;
  onUpdate: (gig: Gig) => void;
}

function GigDetailPanel({ gig, onClose, onUpdate }: GigDetailPanelProps) {
  const [editingField, setEditingField] = useState<keyof GigSchedule | null>(null);
  const [editedGig, setEditedGig] = useState<Gig | null>(gig);

  useEffect(() => {
    setEditedGig(gig);
  }, [gig]);

  if (!gig || !editedGig) return null;

  const scheduleItems = [
    { key: 'meetingTime' as const, label: '集合时间' },
    { key: 'soundcheck' as const, label: '调音' },
    { key: 'warmup' as const, label: '暖场' },
    { key: 'performance' as const, label: '正式演出' },
    { key: 'endTime' as const, label: '结束' },
  ];

  const handleSaveTime = async (key: keyof GigSchedule, time: string) => {
    const updatedGig = {
      ...editedGig,
      schedule: {
        ...editedGig.schedule,
        [key]: time,
      },
    };
    try {
      const result = await gigsApi.update(gig.id, { schedule: updatedGig.schedule });
      setEditedGig(result);
      onUpdate(result);
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
    setEditingField(null);
  };

  const memberStatusLabels = {
    confirmed: '已确认',
    pending: '待确认',
    leave: '请假',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#16213e] border-l border-white/10 h-full overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-[#16213e] z-10 p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">演出详情</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-[#e94560] font-medium mb-1">
              {format(parseISO(gig.date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
            </p>
            <h3 className="text-2xl font-bold text-white">{gig.venue}</h3>
            <div className="flex items-center gap-2 text-gray-400 mt-2">
              <MapPin size={16} />
              <span>{gig.city}</span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={18} />
              当天日程
            </h4>
            <div className="space-y-1 group">
              {scheduleItems.map((item) => (
                <ScheduleItem
                  key={item.key}
                  label={item.label}
                  time={editedGig.schedule[item.key]}
                  isEditing={editingField === item.key}
                  onEdit={() => setEditingField(item.key)}
                  onSave={(time) => handleSaveTime(item.key, time)}
                  onCancel={() => setEditingField(null)}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={18} />
              成员确认状态
            </h4>
            <div className="space-y-2">
              {editedGig.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                >
                  <span className="text-white">{member.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'status-dot',
                        member.status === 'confirmed' && 'status-confirmed',
                        member.status === 'pending' && 'status-pending',
                        member.status === 'leave' && 'status-leave'
                      )}
                    />
                    <span className="text-sm text-gray-400">
                      {memberStatusLabels[member.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GigBoard() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const data = await gigsApi.getAll();
        setGigs(data);
      } catch (error) {
        console.error('Failed to fetch gigs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = gigs.findIndex((g) => g.id === active.id);
      const newIndex = gigs.findIndex((g) => g.id === over.id);

      const newGigs = arrayMove(gigs, oldIndex, newIndex);
      setGigs(newGigs);

      try {
        await gigsApi.reorder(newGigs.map((g) => g.id));
      } catch (error) {
        console.error('Failed to reorder gigs:', error);
        setGigs(gigs);
      }
    }
  };

  const handleUpdateGig = (updatedGig: Gig) => {
    setGigs(gigs.map((g) => (g.id === updatedGig.id ? updatedGig : g)));
    setSelectedGig(updatedGig);
  };

  const activeGig = activeId ? gigs.find((g) => g.id === activeId) : null;

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 bg-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          演出日程看板
        </h1>
        <p className="text-gray-400">管理和查看所有演出安排</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={gigs.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {gigs.map((gig, index) => (
              <GigCard
                key={gig.id}
                gig={gig}
                onClick={() => setSelectedGig(gig)}
                delay={index * 50}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeGig ? (
            <div className="card-glass rounded-2xl p-5 opacity-80 scale-105 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-[#e94560] font-medium">
                    {format(parseISO(activeGig.date), 'yyyy年M月d日', { locale: zhCN })}
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{activeGig.venue}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin size={14} />
                <span>{activeGig.city}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {gigs.length === 0 && (
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">暂无演出安排</p>
        </div>
      )}

      <GigDetailPanel
        gig={selectedGig}
        onClose={() => setSelectedGig(null)}
        onUpdate={handleUpdateGig}
      />
    </div>
  );
}
