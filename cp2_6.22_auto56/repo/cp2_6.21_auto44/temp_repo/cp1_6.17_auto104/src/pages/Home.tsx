import LightControlPanel from '@/UI/LightControlPanel';
import PerformanceMonitor from '@/UI/PerformanceMonitor';

export default function Home() {
  return (
    <div className="w-full h-full relative">
      <canvas id="scene-canvas" className="absolute inset-0" />
      <PerformanceMonitor />
      <LightControlPanel />
    </div>
  );
}