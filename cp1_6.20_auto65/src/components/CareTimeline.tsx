import { useState } from 'react';
import { CareEvent, Plant, CARE_TYPE_LABELS } from '../types';
import { format } from 'date-fns';
import { plantApi } from '../api';
import { Droplet, Leaf, RefreshCw, Scissors, Trash2 } from './icons';

interface CareTimelineProps {
  events: CareEvent[];
  plantId: string;
  onEventDeleted: (plant: Plant) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  water: <Droplet />,
  fertilize: <Leaf />,
  repot: <RefreshCw />,
  prune: <Scissors />
};

const typeColors: Record<string, string> = {
  water: '#42A5F5',
  fertilize: '#66BB6A',
  repot: '#FFA726',
  prune: '#EF5350'
};

export default function CareTimeline({ events, plantId, onEventDeleted }: CareTimelineProps) {
  const [newEventId, setNewEventId] = useState<string | null>(null);

  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDelete = async (eventId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    try {
      const result = await plantApi.deleteEvent(plantId, eventId);
      onEventDeleted(result.plant);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px 20px' }}>
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-text">还没有照料记录</div>
        <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
          点击上方按钮开始记录吧
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {sortedEvents.map((event, index) => (
        <div 
          key={event.id} 
          className={`timeline-item ${newEventId === event.id ? 'new' : ''}`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div 
            className="timeline-dot"
            style={{ borderColor: typeColors[event.type] || 'var(--primary-color)' }}
          >
            {typeIcons[event.type] || typeIcons.water}
          </div>
          <div className="timeline-content">
            <button 
              className="timeline-delete"
              onClick={() => handleDelete(event.id)}
              title="删除记录"
            >
              <Trash2 />
            </button>
            <div className="timeline-header">
              <span className="timeline-type" style={{ color: typeColors[event.type] }}>
                {CARE_TYPE_LABELS[event.type]}
              </span>
              <span className="timeline-date">
                {format(new Date(event.date), 'yyyy年MM月dd日 HH:mm')}
              </span>
            </div>
            {event.note && (
              <p className="timeline-note">{event.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
