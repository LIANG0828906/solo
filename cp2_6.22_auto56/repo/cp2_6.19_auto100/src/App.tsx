import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Timer as TimerIcon, BarChart3, ListTodo, Sparkles } from 'lucide-react';
import Timer from '@/components/Timer';
import Timeline from '@/components/Timeline';
import Stats from '@/components/Stats';
import TaskForm from '@/components/TaskForm';
import { getTodayRecords, PomodoroRecord } from '@/utils/storage';
import { useStore } from '@/store';

function App() {
  const { todayPomodoros, setTodayPomodoros, isBreak } = useStore();
  const [taskAlert, setTaskAlert] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const records: PomodoroRecord[] = await getTodayRecords();
      setTodayPomodoros(records);
      setLoaded(true);
    })();
  }, [setTodayPomodoros]);

  const handleTaskMissing = () => {
    setTaskAlert(true);
    setTimeout(() => setTaskAlert(false), 2500);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen w-full py-6 px-4 sm:px-6 lg:px-8">
              <header className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <TimerIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                      番茄效率看板
                      <Sparkles size={16} className="text-yellow-300" />
                    </h1>
                    <p className="text-xs text-slate-400">专注工作 · 高效生活</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass">
                    <ListTodo size={13} className="text-indigo-300" />
                    {todayPomodoros.length} 个番茄钟
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass">
                    <BarChart3 size={13} className="text-emerald-300" />
                    {todayPomodoros.length * 25} 分钟专注
                  </span>
                </div>
              </header>

              {!loaded ? (
                <div className="flex items-center justify-center h-[60vh] text-slate-400">
                  <div className="animate-pulse flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-3 h-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-2">正在加载...</span>
                  </div>
                </div>
              ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                  <div className="flex flex-col gap-6 min-w-0">
                    <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6 items-start">
                      <div className="flex justify-center">
                        <Timer onTaskMissing={handleTaskMissing} />
                      </div>
                      <div className={!isBreak ? '' : 'opacity-60 pointer-events-none'}>
                        <TaskForm showAlert={taskAlert} />
                      </div>
                    </div>

                    <Timeline records={todayPomodoros} />
                  </div>

                  <div className="lg:sticky lg:top-6 h-fit">
                    <Stats records={todayPomodoros} />
                  </div>
                </div>
              )}

              <footer className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 text-center text-xs text-slate-500">
                采用番茄工作法 · 数据存储于本地浏览器 · {new Date().getFullYear()}
              </footer>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
