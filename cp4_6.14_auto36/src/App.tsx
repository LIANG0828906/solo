import Canvas from '@/components/Canvas';
import Sidebar from '@/components/Sidebar';
import NodeDetailModal from '@/components/NodeDetailModal';

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#F5F7FA' }}>
      <Sidebar />
      <Canvas />
      <NodeDetailModal />
    </div>
  );
}
