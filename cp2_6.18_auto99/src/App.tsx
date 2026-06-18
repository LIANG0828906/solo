import { AudioUploader } from './components/AudioUploader';
import { Visualizer } from './components/Visualizer';

export default function App() {
  return (
    <div className="app-container">
      <div className="visualizer-wrapper">
        <Visualizer />
        <AudioUploader />
      </div>
    </div>
  );
}
