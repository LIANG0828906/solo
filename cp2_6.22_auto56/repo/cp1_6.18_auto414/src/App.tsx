import { SceneManager } from '@/modules/scene/SceneManager';
import { UIOverlay } from '@/ui/UIOverlay';

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <SceneManager />
      <UIOverlay />
    </div>
  );
}
