import Scene from '@/components/Scene';
import PipelinePanel from '@/components/PipelinePanel';
import { usePipelineStore } from '@/store/pipelineStore';

function App() {
  const { toast, isAddingPipeline } = usePipelineStore();

  return (
    <div className="app-container">
      <PipelinePanel />
      <div className={`scene-container ${isAddingPipeline ? 'adding' : ''}`}>
        <Scene />
        {toast && (
          <div className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
