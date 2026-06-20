import React from 'react';
import { Users, Calendar, ChevronRight } from 'lucide-react';
import type { Class } from '@/types';

interface ClassCardProps {
  classItem: Class;
  onClick: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({ classItem, onClick }) => {
  return (
    <div
      className="class-card bg-bg-panel rounded-xl shadow-card p-5 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-text-primary">{classItem.name}</h3>
        <ChevronRight size={20} className="text-text-secondary" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Users size={16} className="text-brand" />
          <span>学生人数：</span>
          <span className="font-medium text-text-primary">{classItem.studentCount}</span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Calendar size={16} className="text-brand" />
          <span>上次批改：</span>
          <span className="font-medium text-text-primary">
            {classItem.lastGradedDate || '尚未批改'}
          </span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">点击进入批改</span>
          <div className="w-2 h-2 rounded-full bg-positive" />
        </div>
      </div>
    </div>
  );
};
