import { useState, useEffect } from 'react';
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  ArrowLeft,
  Play,
  Square,
  ListTodo,
  Share2,
} from 'lucide-react';
import { useAppStore } from '@/store';
import AgendaItemCard from './AgendaItem';
import CreateMeetingModal from './CreateMeetingModal';
import type { AgendaItem } from '@/types';

interface MeetingViewProps {
  meetingId: string;
  onBack?: () => void;
  onOpenTaskBoard: () => void;
}

export default function MeetingView({ meetingId, onBack, onOpenTaskBoard }: MeetingViewProps) {
  const { getMeeting, updateAgendaOrder, addAgendaItem, meetings, setCreateModalOpen, createModalOpen } = useAppStore();
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isAddingAgenda, setIsAddingAgenda] = useState(false);
  const [newAgendaTitle, setNewAgendaTitle] = useState('');
  const [newAgendaDuration, setNewAgendaDuration] = useState(15);
  const [newAgendaResponsible, setNewAgendaResponsible] = useState('');
  const [meetingStatus, setMeetingStatus] = useState<'upcoming' | 'ongoing' | 'ended'>('upcoming');

  const meeting = getMeeting(meetingId);

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
    if (meeting) {
      setAgendaItems([...meeting.agendaItems].sort((a, b) => a.order - b.order));
      setMeetingStatus(meeting.status);
    }
  }, [meeting]);

  useEffect(() => {
    if (meeting) {
      const sortedItems = [...meeting.agendaItems].sort((a, b) => a.order - b.order);
      const idsMatch = sortedItems.length === agendaItems.length &&
        sortedItems.every((item, i) => item.id === agendaItems[i]?.id);
      if (!idsMatch || JSON.stringify(sortedItems) !== JSON.stringify(agendaItems)) {
        setAgendaItems(sortedItems);
      }
    }
  }, [meetings, meetingId]);

  if (!meeting) {
    return (
      <div className="flex items-center justify-center h-full text-dark-400">
        会议不存在
      </div>
    );
  }

  const totalDuration = agendaItems.reduce((sum, item) => sum + item.duration, 0);
  const resolvedCount = agendaItems.filter((i) => i.status === 'resolved').length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = agendaItems.findIndex((item) => item.id === active.id);
      const newIndex = agendaItems.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(agendaItems, oldIndex, newIndex);
      const reordered = newItems.map((item, index) => ({ ...item, order: index }));
      setAgendaItems(reordered);
      updateAgendaOrder(meetingId, reordered.map((item) => item.id));
    }
  };

  const handleAddAgenda = () => {
    if (!newAgendaTitle.trim()) return;
    addAgendaItem(meetingId, {
      title: newAgendaTitle.trim(),
      responsible: newAgendaResponsible || '待定',
      duration: newAgendaDuration,
      status: 'pending',
      order: agendaItems.length,
    });
    setNewAgendaTitle('');
    setNewAgendaDuration(15);
    setNewAgendaResponsible('');
    setIsAddingAgenda(false);
  };

  const handleStatusToggle = () => {
    if (meetingStatus === 'upcoming') {
      setMeetingStatus('ongoing');
    } else if (meetingStatus === 'ongoing') {
      setMeetingStatus('ended');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/5 transition-all hover:scale-105"
            >
              <ArrowLeft size={20} className="text-dark-300" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-dark-50 truncate">{meeting.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-dark-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar size={16} />
                {meeting.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} />
                {meeting.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={16} />
                {meeting.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={16} />
                {meeting.participants.length} 位参与人
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTaskBoard}
              className="btn-secondary flex items-center gap-2"
            >
              <ListTodo size={16} />
              任务看板
            </button>
            <button
              onClick={handleStatusToggle}
              className={`btn-primary flex items-center gap-2 ${
                meetingStatus === 'ended' ? 'opacity-50' : ''
              }`}
            >
              {meetingStatus === 'upcoming' && <Play size={16} />}
              {meetingStatus === 'ongoing' && <Square size={16} />}
              {meetingStatus === 'ended' && <CheckCircle size={16} />}
              {meetingStatus === 'upcoming' && '开始会议'}
              {meetingStatus === 'ongoing' && '结束会议'}
              {meetingStatus === 'ended' && '已结束'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {meeting.participants.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="avatar-bubble border-2 border-dark-800"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.avatar}
                </div>
              ))}
            </div>
            {meeting.participants.length > 5 && (
              <span className="text-dark-400 text-xs">
                +{meeting.participants.length - 5}
              </span>
            )}
          </div>
          <div className="text-dark-400">
            总时长：<span className="text-dark-200 font-medium">{totalDuration} 分钟</span>
          </div>
          <div className="text-dark-400">
            已完成：<span className="text-green-400 font-medium">{resolvedCount}/{agendaItems.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-100">议程列表</h3>
          <button
            onClick={() => setIsAddingAgenda(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            添加议程
          </button>
        </div>

        {isAddingAgenda && (
          <div className="glass-card rounded-xl p-4 mb-4 animate-slide-down">
            <h4 className="font-medium text-dark-100 mb-3">添加议程项</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-3">
                <label className="block text-sm text-dark-400 mb-1">议程标题</label>
                <input
                  type="text"
                  value={newAgendaTitle}
                  onChange={(e) => setNewAgendaTitle(e.target.value)}
                  placeholder="输入议程标题..."
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">负责人</label>
                <input
                  type="text"
                  value={newAgendaResponsible}
                  onChange={(e) => setNewAgendaResponsible(e.target.value)}
                  placeholder="负责人姓名"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-1">预计时长（分钟）</label>
                <select
                  value={newAgendaDuration}
                  onChange={(e) => setNewAgendaDuration(Number(e.target.value))}
                  className="input-field"
                >
                  {[5, 10, 15, 20, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>{m} 分钟</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddingAgenda(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleAddAgenda}
                disabled={!newAgendaTitle.trim()}
                className="btn-primary disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        )}

        {agendaItems.length === 0 ? (
          <div className="text-center py-16 text-dark-400">
            <ListTodo size={48} className="mx-auto mb-4 opacity-30" />
            <p>暂无议程项</p>
            <p className="text-sm mt-1">点击上方"添加议程"按钮创建第一个议程</p>
          </div>
        ) : (
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
                  <AgendaItemCard
                    key={item.id}
                    item={item}
                    meetingId={meetingId}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {createModalOpen && (
        <CreateMeetingModal
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

function CheckCircle({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
