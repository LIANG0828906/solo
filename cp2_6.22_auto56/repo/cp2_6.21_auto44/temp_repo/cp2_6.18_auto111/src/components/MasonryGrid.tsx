import React, { useMemo } from 'react';
import ActivityCard from './ActivityCard';
import { Search } from 'lucide-react';
import type { Activity } from '@/store/appStore';

interface MasonryGridProps {
  activities: Activity[];
  loading: boolean;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ activities, loading }) => {
  const columns = useMemo(() => {
    const col1: Activity[] = [];
    const col2: Activity[] = [];
    const col3: Activity[] = [];

    activities.forEach((activity, index) => {
      const colIndex = index % 3;
      if (colIndex === 0) col1.push(activity);
      else if (colIndex === 1) col2.push(activity);
      else col3.push(activity);
    });

    return [col1, col2, col3];
  }, [activities]);

  if (loading && activities.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Search className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-lg">未找到相关公告或活动</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-4">
            {column.map((activity, index) => (
              <div
                key={activity.id}
                className="animate-fade-in"
                style={{ animationDelay: `${(colIndex * column.length + index) * 50}ms` }}
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasonryGrid;
