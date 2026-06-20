import { Play, Pause, RotateCcw, Plus, Minus, Clock } from 'lucide-react';
import { useTimerStore } from '../timer/timerStore';
import { formatDuration, formatHours } from '@/utils/time';
import { useEffect } from 'react';

interface TimerProps {
  taskId: string;
  taskTitle?: string;
  onManualSubmit?: (hours: number) => void;
}

export default function Timer({ taskId }: TimerProps) {
  const {
    taskId: currentTaskId,
    elapsedSeconds,
    isRunning,
    lastToast,
    setTask,
    start,
    pause,
    reset,
    submitTime,
    manualAddHours,
  } = useTimerStore();

  useEffect(() => {
    if (taskId !== currentTaskId) {
      setTask(taskId);
    }
  }, [taskId, currentTaskId, setTask]);

  const handleManualAdd = async (hours: number) => {
    manualAddHours(hours);
  };

  return (
    <div className="glass-card rounded-xl p-5 relative">
      {lastToast && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-sm px-4 py-1.5 rounded-full shadow-lg z-10">
          {lastToast}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-700">工时计时器</h3>
      </div>

      <div className="text-center mb-5">
        <div
          className="monospace text-5xl font-bold mb-3"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatDuration(elapsedSeconds)}
        </div>
        <p className="text-xs text-gray-400">当前计时</p>
      </div>

      <div className="flex justify-center gap-3 mb-5">
        <button
          onClick={reset}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          title="重置"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={isRunning ? pause : start}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
          style={{ backgroundColor: isRunning ? '#EF5350' : '#42A5F5' }}
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>
        <button
          onClick={() => submitTime()}
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          title="提交"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500 mb-2 text-center">手动添加工时（0.5小时增量）</p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleManualAdd(0.5)}
            className="flex-1 py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            0.5h
          </button>
          <button
            onClick={() => handleManualAdd(1)}
            className="flex-1 py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            1h
          </button>
          <button
            onClick={() => handleManualAdd(2)}
            className="flex-1 py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            2h
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            本次计时约 {formatHours(Math.round((elapsedSeconds / 3600) * 100) / 100)}</p>
        </div>
      )}
    </div>
  );
}
