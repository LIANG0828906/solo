import { Music } from 'lucide-react';

interface LoadingMaskProps {
  visible: boolean;
}

export function LoadingMask({ visible }: LoadingMaskProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 backdrop-blur-md transition-all duration-500">
      <div className="flex flex-col items-center gap-6 animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
            <Music className="w-10 h-10 text-white animate-spin-slow" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold gradient-text">TrackTales</h2>
          <p className="text-sm text-text-secondary mt-2">正在加载音乐记忆...</p>
        </div>
      </div>
    </div>
  );
}
