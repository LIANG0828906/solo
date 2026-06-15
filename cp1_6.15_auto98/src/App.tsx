import { MediaProvider } from '@/context/MediaContext';
import ControlPanel from '@/components/ControlPanel';
import PreviewArea from '@/components/PreviewArea';
import Timeline from '@/components/Timeline';

export default function App() {
  return (
    <MediaProvider>
      <div className="app-layout">
        <ControlPanel />
        <div className="main-area">
          <PreviewArea />
          <Timeline />
        </div>
      </div>
    </MediaProvider>
  );
}
