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
import { Plus, Clock, MapPin, FileText, X, Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { getDayLabel, getDayCount } from '../utils/dateUtils';
import { ActivityItem } from './ActivityItem';
import type { Activity } from '../types';

export const DayPlan = () => {
  const { tripId = '' } = useParams<{ tripId: string }>();
  const { currentTrip, addActivity, updateActivity, reorderActivities, fetchTripById } = useTripStore();
  const { selectedDayIndex, showActivityForm, editingActivityId, setShowActivityForm, setEditingActivityId, setSelectedDayIndex } = useUiStore();
  
  const [formData, setFormData] = useState({
    time: '09:00',
    location: '',
    description: '',
    notes: '',
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  useEffect(() => {
    if (!currentTrip) {
      fetchTripById(tripId);
    }
  }, [tripId, currentTrip, fetchTripById]);
  
  useEffect(() => {
    if (editingActivityId && currentTrip) {
      const activity = currentTrip.activities.find(a => a.id === editingActivityId);
      if (activity) {
        setFormData({
          time: activity.time,
          location: activity.location,
          description: activity.description,
          notes: activity.notes,
        });
      }
    } else {
      setFormData({
        time: '09:00',
        location: '',
        description: '',
        notes: '',
      });
    }
  }, [editingActivityId, currentTrip]);
  
  if (!currentTrip) return null;
  
  const dayCount = getDayCount(currentTrip.startDate, currentTrip.endDate);
  
  const dayActivities = currentTrip.activities
    .filter(a => a.dayIndex === selectedDayIndex)
    .sort((a, b) => a.time.localeCompare(b.time));
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = dayActivities.findIndex(a => a.id === active.id);
      const newIndex = dayActivities.findIndex(a => a.id === over.id);
      
      const newActivities = arrayMove(dayActivities, oldIndex, newIndex);
      const activityIds = newActivities.map(a => a.id);
      
      await reorderActivities(tripId, activityIds, selectedDayIndex);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location || !formData.description) {
      alert('请填写地点和活动描述');
      return;
    }
    
    if (editingActivityId) {
      await updateActivity(tripId, editingActivityId, {
        ...formData,
      });
    } else {
      await addActivity(tripId, {
        ...formData,
        dayIndex: selectedDayIndex,
      });
    }
    
    setShowActivityForm(false);
    setEditingActivityId(null);
    setFormData({ time: '09:00', location: '', description: '', notes: '' });
  };
  
  const handleCloseForm = () => {
    setShowActivityForm(false);
    setEditingActivityId(null);
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 custom-scrollbar">
        {Array.from({ length: dayCount }).map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedDayIndex(index)}
            className={`flex-shrink-0 px-5 py-3 rounded-2xl font-medium transition-all duration-200 ${
              selectedDayIndex === index
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow scale-105'
                : 'bg-white text-warm-600 hover:bg-primary-50 hover:text-primary-600'
            }`}
          >
            {getDayLabel(currentTrip.startDate, index)}
          </button>
        ))}
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-warm-800">
          当日行程 <span className="text-warm-400 font-normal text-base">({dayActivities.length} 个活动)</span>
        </h3>
        <button
          onClick={() => {
            setEditingActivityId(null);
            setShowActivityForm(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          添加活动
        </button>
      </div>
      
      {showActivityForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-warm-800">
                {editingActivityId ? '编辑活动' : '添加活动'}
              </h3>
              <button onClick={handleCloseForm} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">
                    <Clock className="w-4 h-4 inline mr-1" />
                    时间
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="input-label">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    地点
                  </label>
                  <input
                    type="text"
                    placeholder="例如：浅草寺"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="input-label">活动描述</label>
                <input
                  type="text"
                  placeholder="例如：参观东京最古老的寺庙"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="input-label">
                  <FileText className="w-4 h-4 inline mr-1" />
                  备注
                </label>
                <textarea
                  placeholder="添加备注信息..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[100px] resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseForm} className="btn-secondary flex-1">
                  取消
                </button>
                <button type="submit" className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingActivityId ? '保存修改' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {dayActivities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-warm-200 animate-fade-in">
          <div className="text-5xl mb-4">📅</div>
          <h4 className="text-lg font-semibold text-warm-700 mb-2">还没有安排活动</h4>
          <p className="text-warm-500 mb-4">点击上方按钮开始规划这一天的行程</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={dayActivities.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {dayActivities.map((activity: Activity, index: number) => (
                <ActivityItem key={activity.id} activity={activity} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
