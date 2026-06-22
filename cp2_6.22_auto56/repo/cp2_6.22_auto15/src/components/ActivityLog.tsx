import { useEffect } from 'react';
import { Activity } from 'lucide-react';
import useKanbanStore from '../store/useKanbanStore';
import socket from '../utils/socket';

export default function ActivityLog() {
  const activities = useKanbanStore((s) => s.activities);
  const addActivity = useKanbanStore((s) => s.addActivity);

  useEffect(() => {
    let mounted = true;

    fetch('/api/activities')
      .then((res) => res.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          useKanbanStore.setState({ activities: data });
        }
      })
      .catch(() => {});

    const handleNewActivity = (activity: {
      id: string;
      user: string;
      action: string;
      taskTitle: string;
      timestamp: string;
    }) => {
      addActivity(activity);
    };

    socket.on('activity:new', handleNewActivity);

    return () => {
      mounted = false;
      socket.off('activity:new', handleNewActivity);
    };
  }, [addActivity]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-[#3498db]" />
        <h2 className="font-bold text-[#2c3e50] text-sm">活动日志</h2>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {activities.map((entry) => (
          <div
            key={entry.id}
            className="px-2 py-2 border-b border-gray-50 last:border-0"
          >
            <div className="text-sm text-[#2c3e50]">
              <span className="font-medium">{entry.user}</span>{' '}
              <span className="text-gray-500">{entry.action}</span>{' '}
              <span className="font-medium">{entry.taskTitle}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {new Date(entry.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-xs text-gray-400 px-2 py-2">
            暂无活动记录
          </div>
        )}
      </div>
    </div>
  );
}
