import { useState } from 'react';
import { CareTask, TaskStatus } from '@/types';
import { usePetStore } from '@/store';
import ConfirmDialog from '@/components/ConfirmDialog';
import { PawPrint, Clock, Users } from 'lucide-react';

interface TaskListProps {
  tasks: CareTask[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const { appliedTasks, applyCare } = usePetStore();
  const [confirmTaskId, setConfirmTaskId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="text-text-secondary text-sm py-8 text-center">
        暂无匹配的任务
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => {
          const isApplied = appliedTasks.has(task.id) || task.status !== TaskStatus.Open;

          return (
            <div
              key={task.id}
              className="bg-base-card border border-base-border rounded-2xl p-5 transition-all hover:border-accent/30"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <PawPrint size={20} className="text-accent" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary">
                      {task.petName}
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">
                      <Clock size={12} className="inline" />
                      {task.startDate} ~ {task.endDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-text-secondary">
                    {task.durationHours}小时
                  </span>
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <Users size={12} />
                    {task.applicantCount}人申请
                  </span>
                  {isApplied ? (
                    <button
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-base-hover text-text-secondary cursor-not-allowed"
                      disabled
                    >
                      {task.status === TaskStatus.Pending ? '待确认' : '已申请'}
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-accent text-base font-semibold hover:bg-accent/90 transition-colors cursor-pointer"
                      onClick={() => setConfirmTaskId(task.id)}
                    >
                      申请照料
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={confirmTaskId !== null}
        onConfirm={() => {
          applyCare(confirmTaskId!);
          setConfirmTaskId(null);
        }}
        onCancel={() => setConfirmTaskId(null)}
        message="确认申请照料此宠物吗？"
      />
    </>
  );
}
