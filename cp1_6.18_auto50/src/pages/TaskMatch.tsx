import { useState, useEffect } from 'react';
import { usePetStore } from '@/store';
import { TaskFilter as TaskFilterType } from '@/types';
import TaskFilterComponent from '@/components/TaskFilter';
import TaskList from '@/components/TaskList';
import { Search } from 'lucide-react';

export default function TaskMatch() {
  const { taskList, fetchTasks, isLoading } = usePetStore();
  const [filters, setFilters] = useState<TaskFilterType>({});

  const handleSearch = () => {
    fetchTasks(filters);
  };

  useEffect(() => {
    fetchTasks({});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Search size={22} className="text-accent" />
        <h1 className="text-2xl font-bold text-text-primary">任务匹配</h1>
      </div>
      <p className="text-sm text-text-secondary mb-6">寻找需要临时照料的宠物</p>

      <TaskFilterComponent
        filters={filters}
        onFilterChange={(f) => { setFilters(f); }}
      />

      <button
        className="mt-4 mb-6 px-6 py-2.5 bg-accent text-base font-semibold rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2"
        onClick={handleSearch}
      >
        <Search size={16} />
        搜索任务
      </button>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-base-card rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <TaskList tasks={taskList} />
      )}
    </div>
  );
}
