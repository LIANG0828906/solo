import type { Task } from '@/types';
import { Clock, Star } from 'lucide-react';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onApply?: (task: Task) => void;
}

export default function TaskCard({ task, onApply }: TaskCardProps) {
  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'open':
        return { text: '开放中', color: 'bg-green-500' };
      case 'applied':
        return { text: '已申请', color: 'bg-yellow-500' };
      case 'completed':
        return { text: '已完成', color: 'bg-gray-500' };
      default:
        return { text: '未知', color: 'bg-gray-500' };
    }
  };

  const status = getStatusLabel(task.status);

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApply?.(task);
  };

  return (
    <div className="task-card bg-[#16213e] border border-[#2a2a4e] rounded-xl p-5 relative break-inside-avoid mb-3">
      <div className={`absolute top-3 right-3 ${status.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
        {status.text}
      </div>

      <h3 className="text-white font-bold text-lg mb-2 pr-16">{task.title}</h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{task.description}</p>

      <div className="mb-4">
        <p className="text-gray-500 text-xs mb-2">悬赏技能要求：</p>
        <div className="flex flex-wrap gap-2">
          {task.requiredSkills.slice(0, 3).map((skill) => (
            <span
              key={skill.id}
              className="bg-[#1a1a2e] text-[#e8a838] text-xs px-2 py-1 rounded-md border border-[#2a2a4e] flex items-center gap-1"
            >
              <Star className="w-3 h-3 fill-current" />
              {skill.name}
            </span>
          ))}
          {task.requiredSkills.length > 3 && (
            <span className="text-gray-500 text-xs flex items-center">
              +{task.requiredSkills.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <Clock className="w-4 h-4" />
          <span>预计 {task.estimatedHours} 小时</span>
        </div>

        {task.status === 'open' && (
          <button
            onClick={handleApply}
            className="bg-[#e8a838] text-[#16213e] font-semibold px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform duration-200 btn-shine"
          >
            申请交换
          </button>
        )}
      </div>
    </div>
  );
}
