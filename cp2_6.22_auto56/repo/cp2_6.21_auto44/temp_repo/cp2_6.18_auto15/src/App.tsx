import Home from '@/pages/Home';
import Board from '@/pages/Board';
import { useTaskStore } from '@/store/taskStore';

export default function App() {
  const currentProjectId = useTaskStore((state) => state.currentProjectId);

  return currentProjectId ? <Board /> : <Home />;
}
