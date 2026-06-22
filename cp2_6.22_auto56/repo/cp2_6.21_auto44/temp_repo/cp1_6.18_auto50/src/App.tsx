import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PetDetail from './pages/PetDetail';
import TaskMatch from './pages/TaskMatch';
import { usePetStore } from './store';
import { useEffect } from 'react';

function App() {
  const fetchPets = usePetStore(s => s.fetchPets);
  const fetchTasks = usePetStore(s => s.fetchTasks);

  useEffect(() => {
    fetchPets();
    fetchTasks();
  }, [fetchPets, fetchTasks]);

  return (
    <HashRouter>
      <div className="min-h-screen bg-base">
        <nav className="sticky top-0 z-50 border-b border-base-border bg-base/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-4">
            <a href="#/" className="text-lg font-semibold text-accent">
              🐾 宠物互助站
            </a>
            <div className="flex gap-6 text-sm">
              <a
                href="#/"
                className="text-text-secondary transition-colors hover:text-accent"
              >
                宠物看板
              </a>
              <a
                href="#/tasks"
                className="text-text-secondary transition-colors hover:text-accent"
              >
                任务匹配
              </a>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pet/:id" element={<PetDetail />} />
          <Route path="/tasks" element={<TaskMatch />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
