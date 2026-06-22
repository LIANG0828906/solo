import { useState, useEffect, useCallback } from 'react';
import { Play, Square, Plus, X, ChevronDown } from 'lucide-react';
import { useTimerStore } from '@/store/useTimerStore';
import { formatDuration } from '@/utils/timeUtils';
import { startTask, stopTask } from '@/api/taskApi';
import { getClients } from '@/api/clientApi';
import type { Client } from '../../shared/types';

interface TaskTimerProps {
  onTaskComplete?: () => void;
}

export default function TaskTimer({ onTaskComplete }: TaskTimerProps) {
  const { isRunning, currentTask, clientId, displayTime, startTimer, stopTimer, tick, initFromStorage } = useTimerStore();
  const [taskName, setTaskName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    loadClients();
    initFromStorage();
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    if (isRunning) {
      interval = window.setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tick]);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (e) {
      console.error('加载客户失败:', e);
    }
  };

  const handleStart = useCallback(async () => {
    if (!taskName.trim()) {
      alert('请输入任务名称');
      return;
    }
    try {
      await startTask(taskName, selectedClientId);
      startTimer(taskName, selectedClientId);
    } catch (e) {
      console.error('启动任务失败:', e);
      startTimer(taskName, selectedClientId);
    }
  }, [taskName, selectedClientId, startTimer]);

  const handleStop = useCallback(async () => {
    try {
      await stopTask();
    } catch (e) {
      console.error('停止任务失败:', e);
    }
    stopTimer();
    setTaskName('');
    setSelectedClientId(null);
    onTaskComplete?.();
  }, [stopTimer, onTaskComplete]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] p-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-gray-500 text-sm font-medium mb-2">当前任务</h2>
        <h3 className="text-xl font-semibold text-gray-800 mb-6 min-h-7">
          {isRunning || currentTask ? currentTask : '准备开始新任务'}
        </h3>
        
        <div 
          className={`
            font-mono text-6xl font-bold tracking-tight
            ${isRunning ? 'animate-breathe' : ''}
          `}
          style={{ color: '#1E293B' }}
        >
          {formatDuration(Math.floor(displayTime))}
        </div>

        {isRunning && selectedClient && (
          <div className="mt-4 text-sm text-gray-500">
            客户: {selectedClient.name}
          </div>
        )}
      </div>

      {!isRunning && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任务名称
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="请输入任务名称..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                       focus:border-primary-500 transition-all"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              客户 (可选)
            </label>
            <button
              type="button"
              onClick={() => setShowClientDropdown(!showClientDropdown)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                       text-left flex items-center justify-between
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                       focus:border-primary-500 transition-all bg-white"
            >
              <span className={selectedClient ? 'text-gray-800' : 'text-gray-400'}>
                {selectedClient ? selectedClient.name : '选择客户...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showClientDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showClientDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 
                            rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId(null);
                    setShowClientDropdown(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  不选择客户
                </button>
                {clients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setShowClientDropdown(false);
                    }}
                    className={`
                      w-full px-4 py-2.5 text-left transition-colors
                      ${selectedClientId === client.id 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    {client.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!isRunning ? (
          <button
            onClick={handleStart}
            style={{ backgroundColor: '#6366F1' }}
            className="
              flex-1 py-3.5 px-6 rounded-xl text-white font-semibold
              flex items-center justify-center gap-2
              transition-all duration-200
              hover:opacity-90 active:scale-[0.95]
            "
          >
            <Play className="w-5 h-5" />
            开始
          </button>
        ) : (
          <button
            onClick={handleStop}
            style={{ backgroundColor: '#10B981' }}
            className="
              flex-1 py-3.5 px-6 rounded-xl text-white font-semibold
              flex items-center justify-center gap-2
              transition-all duration-200
              hover:opacity-90 active:scale-[0.95]
            "
          >
            <Square className="w-5 h-5" />
            进行中
          </button>
        )}

        {!isRunning && (
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="
              py-3.5 px-4 rounded-xl border-2 border-gray-200 
              text-gray-600 font-medium
              flex items-center gap-2
              transition-all duration-200
              hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50
              active:scale-[0.95]
            "
          >
            {showManualForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            补录
          </button>
        )}
      </div>

      {showManualForm && (
        <ManualEntryForm 
          clients={clients}
          onClose={() => setShowManualForm(false)}
          onSuccess={() => {
            setShowManualForm(false);
            onTaskComplete?.();
          }}
        />
      )}
    </div>
  );
}

interface ManualEntryFormProps {
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
}

function ManualEntryForm({ clients, onClose, onSuccess }: ManualEntryFormProps) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) {
      alert('请填写完整信息');
      return;
    }

    setSubmitting(true);
    try {
      const { createTask } = await import('@/api/taskApi');
      await createTask({
        name,
        clientId: clientId || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      onSuccess();
    } catch (e) {
      console.error('创建任务失败:', e);
      alert('创建任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100 animate-slide-up">
      <h4 className="font-semibold text-gray-800 mb-4">手动补录</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            任务名称 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="任务名称"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                     focus:border-primary-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            客户
          </label>
          <select
            value={clientId || ''}
            onChange={(e) => setClientId(e.target.value || null)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                     focus:border-primary-500 transition-all bg-white"
          >
            <option value="">不选择客户</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              开始时间 *
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                       focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结束时间 *
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20 
                       focus:border-primary-500 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 
                     text-gray-600 font-medium transition-all
                     hover:bg-gray-50 active:scale-[0.95]"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: '#6366F1' }}
            className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium
                     transition-all hover:opacity-90 active:scale-[0.95]
                     disabled:opacity-50"
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
