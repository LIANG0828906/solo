import { GripVertical, Clock, MapPin, Edit3, Trash2, FileText } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Activity } from '../types';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { useParams } from 'react-router-dom';

interface ActivityItemProps {
  activity: Activity;
  index: number;
}

export const ActivityItem = ({ activity, index }: ActivityItemProps) => {
  const { tripId = '' } = useParams<{ tripId: string }>();
  const { deleteActivity } = useTripStore();
  const { setEditingActivityId, setShowActivityForm } = useUiStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };
  
  const handleEdit = () => {
    setEditingActivityId(activity.id);
    setShowActivityForm(true);
  };
  
  const handleDelete = () => {
    if (window.confirm('确定要删除这个活动吗？')) {
      deleteActivity(tripId, activity.id);
    }
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-2xl p-4 shadow-sm border border-warm-100 hover:shadow-md transition-all duration-200 animate-fade-in-up stagger-${Math.min(index + 1, 8)} ${
        isDragging ? 'shadow-xl scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 w-8 h-8 flex items-center justify-center rounded-lg text-warm-300 hover:text-primary-500 hover:bg-primary-50 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 text-accent-600 rounded-full text-sm font-medium">
              <Clock className="w-3.5 h-3.5" />
              {activity.time}
            </span>
            
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium truncate">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{activity.location}</span>
            </span>
          </div>
          
          <p className="text-warm-800 font-medium mb-2">{activity.description}</p>
          
          {activity.notes && (
            <div className="flex items-start gap-2 text-warm-500 text-sm bg-warm-50 rounded-xl p-3">
              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="italic">{activity.notes}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="btn-icon text-warm-400 hover:text-primary-500"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="btn-icon text-warm-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
