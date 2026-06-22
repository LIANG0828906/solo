import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Filter, Users, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { taskApi, categoryApi } from '@/utils/api';
import TaskCard from '@/components/TaskCard';
import MemberAvatar from '@/components/MemberAvatar';
import type { Task, Category, Member } from '@/types';

export default function KanbanPage() {
  const {
    tasks,
    setTasks,
    members,
    categories,
    setCategories,
    currentMemberId,
    updateTask,
    updateMember,
    isLoading,
    setIsLoading,
  } = useStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [showMemberDropzones, setShowMemberDropzones] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [tasksData, categoriesData] = await Promise.all([
        taskApi.getTasks(),
        categoryApi.getCategories(),
      ]);
      setTasks(tasksData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
      setShowMemberDropzones(true);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    if (overId.startsWith('member-')) {
      return;
    }

    const activeIndex = tasks.findIndex((t) => t.id === activeId);
    const overIndex = tasks.findIndex((t) => t.id === overId);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newTasks = arrayMove(tasks, activeIndex, overIndex);
      setTasks(newTasks);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setShowMemberDropzones(false);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (overId.startsWith('member-')) {
      const memberId = overId.replace('member-', '');
      try {
        const updatedTask = await taskApi.assignTask(activeId, memberId);
        updateTask(updatedTask);
      } catch (error) {
        console.error('Failed to assign task:', error);
        loadData();
      }
      return;
    }

    if (overId.startsWith('category-')) {
      const categoryId = overId.replace('category-', '');
      const task = tasks.find((t) => t.id === activeId);
      if (task) {
        try {
          const updatedTask = await taskApi.updateTask(activeId, {
            category: categoryId,
          });
          updateTask(updatedTask);
        } catch (error) {
          console.error('Failed to update task category:', error);
          loadData();
        }
      }
      return;
    }

    const activeIndex = tasks.findIndex((t) => t.id === activeId);
    const overIndex = tasks.findIndex((t) => t.id === overId);

    if (activeIndex !== overIndex) {
      setTasks(arrayMove(tasks, activeIndex, overIndex));
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await taskApi.completeTask(taskId);
      const result = response as unknown as { task: Task; member: Member };
      updateTask(result.task);
      if (result.member) {
        updateMember(result.member);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const getTasksByCategory = (categoryId: string) => {
    return tasks.filter((task) => {
      const matchesCategory = task.category === categoryId;
      const matchesMember = filterMember ? task.assigneeId === filterMember : true;
      const matchesStatus = activeCategory ? task.status === activeCategory : true;
      return matchesCategory && matchesMember && matchesStatus;
    });
  };

  const getMember = (memberId: string | null) => {
    return members.find((m) => m.id === memberId);
  };

  const getCategory = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-cream to-primary-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                任务看板
              </h1>
              <p className="text-sm text-gray-500">
                共 {tasks.length} 个任务，拖拽卡片可重新分配
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    !activeCategory
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  全部
                </button>
                <button
                  onClick={() => setActiveCategory('pending')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeCategory === 'pending'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  进行中
                </button>
                <button
                  onClick={() => setActiveCategory('completed')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeCategory === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  已完成
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setFilterMember(filterMember ? null : currentMemberId)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    filterMember
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-200'
                      : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                  )}
                >
                  <Users className="h-4 w-4" />
                  我的任务
                </button>
              </div>
            </div>
          </div>

          {showMemberDropzones && (
            <div className="mb-6 flex flex-wrap gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-dashed border-primary-300">
              <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                拖拽到成员头像上分配任务：
              </span>
              {members.map((member) => (
                <div
                  key={`member-${member.id}`}
                  data-droppable-id={`member-${member.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 border-2 border-primary-200 transition-all hover:scale-105 hover:bg-primary-100"
                >
                  <MemberAvatar
                    name={member.name}
                    avatar={member.avatar}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {member.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const categoryTasks = getTasksByCategory(category.id);
              return (
                <div
                  key={category.id}
                  className="bg-warmGray-50/50 rounded-2xl p-4"
                >
                  <div
                    className="flex items-center gap-2 mb-4 pb-3 border-b-2"
                    style={{ borderColor: category.color + '30' }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h2 className="font-semibold text-gray-800">
                      {category.name}
                    </h2>
                    <span className="ml-auto text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">
                      {categoryTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {categoryTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        assignee={getMember(task.assigneeId)}
                        category={getCategory(task.category)}
                        onComplete={handleCompleteTask}
                      />
                    ))}

                    {categoryTasks.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        暂无任务
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <div
              className="opacity-90 rotate-2 scale-105"
              style={{
                width: '300px',
                cursor: 'grabbing',
              }}
            >
              <TaskCard
                task={activeTask}
                assignee={getMember(activeTask.assigneeId)}
                category={getCategory(activeTask.category)}
                className="shadow-[0_20px_60px_rgba(255,140,66,0.4)]"
              />
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
