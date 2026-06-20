import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Target, Flame, SortAsc, SortDesc, X, Check, Bell } from 'lucide-react';
import { habitApi } from '../../services/api';
import type { Habit, CreateHabitPayload } from './types';

type SortType = 'createdAt' | 'completionRate';
type SortOrder = 'asc' | 'desc';

const frequencyLabels: Record<string, string> = {
  daily: '每天',
  weekly: '每周',
  custom: '自定义',
};

export default function HabitList() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [formData, setFormData] = useState<CreateHabitPayload>({
    name: '',
    frequency: 'daily',
    targetCount: 1,
    reminderTimes: [],
  });
  const [newReminder, setNewReminder] = useState('09:00');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    setLoading(true);
    try {
      const data = await habitApi.getHabits();
      setHabits(data);
    } catch (error) {
      console.error('加载习惯失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedHabits = [...habits].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'createdAt') {
      return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return multiplier * (a.completionRate - b.completionRate);
  });

  const handleSort = (type: SortType) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const openCreateModal = () => {
    setEditingHabit(null);
    setFormData({
      name: '',
      frequency: 'daily',
      targetCount: 1,
      reminderTimes: [],
    });
    setShowModal(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      frequency: habit.frequency,
      targetCount: habit.targetCount,
      reminderTimes: [...habit.reminderTimes],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingHabit) {
        await habitApi.updateHabit(editingHabit.id, formData);
      } else {
        await habitApi.createHabit(formData);
      }
      setShowModal(false);
      loadHabits();
    } catch (error) {
      console.error('保存习惯失败:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个习惯吗？')) return;
    try {
      await habitApi.deleteHabit(id);
      loadHabits();
    } catch (error) {
      console.error('删除习惯失败:', error);
    }
  };

  const addReminder = () => {
    if (newReminder && !formData.reminderTimes.includes(newReminder)) {
      setFormData({
        ...formData,
        reminderTimes: [...formData.reminderTimes, newReminder].sort(),
      });
    }
  };

  const removeReminder = (time: string) => {
    setFormData({
      ...formData,
      reminderTimes: formData.reminderTimes.filter(t => t !== time),
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">我的习惯</h1>
          <p className="text-text-secondary text-sm mt-1">共 {habits.length} 个习惯</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-bg-card rounded-lg px-3 py-2 backdrop-blur-sm">
            <button
              onClick={() => handleSort('createdAt')}
              className={`p-1.5 rounded transition-colors ${
                sortBy === 'createdAt' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
              title="按创建时间排序"
            >
              {sortBy === 'createdAt' && sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
            </button>
            <span className="text-xs text-text-muted">|</span>
            <button
              onClick={() => handleSort('completionRate')}
              className={`p-1.5 rounded transition-colors ${
                sortBy === 'completionRate' ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
              title="按完成率排序"
            >
              {sortBy === 'completionRate' && sortOrder === 'desc' ? <SortDesc size={18} /> : <SortAsc size={18} />}
            </button>
          </div>
          
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ease-out hover:shadow-lg hover:shadow-accent/30 active:scale-95"
          >
            <Plus size={18} />
            <span>新建习惯</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-bg-card rounded-xl p-5 backdrop-blur-sm animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-white/5 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : sortedHabits.length === 0 ? (
        <div className="text-center py-16 bg-bg-card rounded-2xl backdrop-blur-sm">
          <Target size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary mb-4">还没有创建任何习惯</p>
          <button
            onClick={openCreateModal}
            className="text-accent hover:text-accent-hover font-medium"
          >
            创建第一个习惯
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedHabits.map((habit, index) => (
            <div
              key={habit.id}
              className="bg-bg-card rounded-xl p-5 backdrop-blur-sm border border-white/5 hover:border-accent/30 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-accent/10 group animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-text-primary">{habit.name}</h3>
                    {habit.streak > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
                        <Flame size={12} />
                        {habit.streak}天
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <Clock size={14} />
                      {frequencyLabels[habit.frequency]}
                      {habit.frequency !== 'daily' && ` · ${habit.targetCount}次`}
                    </span>
                    
                    <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <Target size={14} />
                      目标 {habit.targetCount} 次/周期
                    </span>
                    
                    {habit.reminderTimes.length > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-text-secondary">
                        <Bell size={14} />
                        {habit.reminderTimes.length} 个提醒
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-text-muted">完成率</span>
                      <span className="text-text-primary font-medium">{Math.round(habit.completionRate * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${habit.completionRate * 100}%`,
                          background: habit.completionRate >= 0.7 
                            ? 'linear-gradient(90deg, #00d26a, #00e07c)'
                            : habit.completionRate >= 0.4 
                            ? 'linear-gradient(90deg, #ffd93d, #ffed4a)'
                            : 'linear-gradient(90deg, #ff6b6b, #ff8787)',
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => openEditModal(habit)}
                    className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">
                {editingHabit ? '编辑习惯' : '新建习惯'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  习惯名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：每天阅读30分钟"
                  className="w-full bg-bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  目标频率
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'custom'] as const).map(freq => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setFormData({ ...formData, frequency: freq })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.frequency === freq
                          ? 'bg-accent text-white'
                          : 'bg-bg-card text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      {frequencyLabels[freq]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  目标次数
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.targetCount}
                  onChange={e => setFormData({ ...formData, targetCount: parseInt(e.target.value) || 1 })}
                  className="w-full bg-bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  提醒时间
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="time"
                    value={newReminder}
                    onChange={e => setNewReminder(e.target.value)}
                    className="flex-1 bg-bg-card border border-white/10 rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addReminder}
                    className="px-4 py-2.5 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                {formData.reminderTimes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.reminderTimes.map(time => (
                      <span
                        key={time}
                        className="flex items-center gap-1 bg-accent/20 text-accent px-3 py-1 rounded-full text-sm"
                      >
                        {time}
                        <button
                          type="button"
                          onClick={() => removeReminder(time)}
                          className="hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-bg-card text-text-secondary rounded-lg hover:bg-white/10 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-all font-medium hover:shadow-lg hover:shadow-accent/30"
                >
                  <Check size={18} />
                  {editingHabit ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
