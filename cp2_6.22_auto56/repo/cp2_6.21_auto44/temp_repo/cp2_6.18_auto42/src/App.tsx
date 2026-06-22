import { Editor } from '@/components/Editor';
import { Preview } from '@/components/Preview';
import { HistoryPanel } from '@/components/HistoryPanel';
import { useCardStore } from '@/store';

function Toast() {
  const { toast } = useCardStore();
  if (!toast.visible) return null;
  return <div className="toast">{toast.message}</div>;
}

function App() {
  return (
    <div className="app-container">
      <Editor />
      <Preview />
      <HistoryPanel />
      <Toast />
    </div>
  );
}

export default App;
