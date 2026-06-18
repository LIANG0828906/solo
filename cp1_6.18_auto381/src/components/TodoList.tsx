import { useMemo } from 'react';
import { ListTodo, Clock, CheckCircle2 } from 'lucide-react';
import {
  useMeetingStore,
  type Todo,
  type Meeting,
} from '@/hooks/useMeetingStore';
import { TodoCard } from './TodoCard';
import { cn } from '@/lib/utils';

interface TodoListProps {
  meetingId?: string;
  className?: string;
}

const groupConfig = [
  {
    status: 'todo' as const,
    label: '待办',
    icon: ListTodo,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    status: 'in-progress' as const,
    label: '进行中',
    icon: Clock,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    status: 'done' as const,
    label: '已完成',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

export function TodoList({ meetingId, className }: TodoListProps) {
  const todos = useMeetingStore(state => state.todos);
  const meetings = useMeetingStore(state => state.meetings);
  const updateTodo = useMeetingStore(state => state.updateTodo);

  const filteredTodos = useMemo(() => {
    return meetingId
      ? todos.filter(t => t.meetingId === meetingId)
      : todos;
  }, [todos, meetingId]);

  const groupedTodos = useMemo(() => {
    return groupConfig.map(group => ({
      ...group,
      todos: filteredTodos
        .filter(t => t.status === group.status)
        .sort((a, b) => a.order - b.order),
    }));
  }, [filteredTodos]);

  const getMeeting = (meetingId: string): Meeting | undefined => {
    return meetings.find(m => m.id === meetingId);
  };

  const handleStatusChange = async (todo: Todo) => {
    const currentIndex = groupConfig.findIndex(g => g.status === todo.status);
    const nextIndex = (currentIndex + 1) % groupConfig.length;
    const nextStatus = groupConfig[nextIndex].status;

    await updateTodo(todo.id, { status: nextStatus });
  };

  const totalCount = filteredTodos.length;

  if (totalCount === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <ListTodo className="w-8 h-8 text-primary" />
        </div>
        <h4 className="text-text font-medium mb-1">暂无待办事项</h4>
        <p className="text-sm text-text-muted">
          在会议笔记中使用 &quot;- [ ] 任务&quot; 格式可自动提取待办
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text">待办列表</h3>
        <span className="text-sm text-text-muted">共 {totalCount} 项</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {groupedTodos.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.status} className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5">
                <div className={cn('p-1.5 rounded-md', group.bgColor)}>
                  <Icon className={cn('w-4 h-4', group.color)} />
                </div>
                <span className="font-medium text-text">{group.label}</span>
                <span className={cn(
                  'ml-auto text-xs font-medium px-2 py-0.5 rounded-full',
                  group.bgColor,
                  group.color
                )}>
                  {group.todos.length}
                </span>
              </div>

              <div className="space-y-2">
                {group.todos.length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-sm bg-background-card rounded-xl border border-dashed border-primary/10">
                    暂无{group.label}事项
                  </div>
                ) : (
                  group.todos.map((todo, index) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      meeting={getMeeting(todo.meetingId)}
                      onStatusChange={() => handleStatusChange(todo)}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
