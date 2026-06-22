import { useGeoStore, Annotation } from '@/store/useGeoStore';
import { X, MapPin } from 'lucide-react';

interface InfoOverlayProps {
  activeSliceInfo: {
    axis: 'x' | 'y' | 'z' | null;
    position: number;
    avgDensity: number;
  };
}

export function InfoOverlay({ activeSliceInfo }: InfoOverlayProps) {
  const { cameraState, annotations, removeAnnotation } = useGeoStore();

  return (
    <>
      <div className="absolute top-4 left-4 z-10 bg-[#1e2029]/90 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-[#2a2d3a]">
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2 text-[#6b7280]">
            <MapPin size={14} className="text-[#4ade80]" />
            <span>切片信息</span>
          </div>
          
          {activeSliceInfo.axis ? (
            <>
              <div className="flex justify-between gap-6">
                <span className="text-[#9ca3af]">轴方向</span>
                <span className="text-[#e0e6f0] font-mono uppercase">{activeSliceInfo.axis}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-[#9ca3af]">位置</span>
                <span className="text-[#e0e6f0] font-mono">{activeSliceInfo.position.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-[#9ca3af]">密度均值</span>
                <span className="text-[#4ade80] font-mono">{activeSliceInfo.avgDensity.toFixed(3)}</span>
              </div>
            </>
          ) : (
            <div className="text-[#6b7280] text-xs">拖动滑块查看切片信息</div>
          )}
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-[#1e2029]/90 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-[#2a2d3a]">
        <div className="text-sm space-y-2">
          <div className="text-[#6b7280] text-xs mb-1">相机状态</div>
          <div className="flex justify-between gap-6">
            <span className="text-[#9ca3af]">位置</span>
            <span className="text-[#e0e6f0] font-mono text-xs">
              {cameraState.position.x.toFixed(1)}, {cameraState.position.y.toFixed(1)}, {cameraState.position.z.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-[#9ca3af]">目标</span>
            <span className="text-[#e0e6f0] font-mono text-xs">
              {cameraState.target.x.toFixed(1)}, {cameraState.target.y.toFixed(1)}, {cameraState.target.z.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

interface AnnotationCardProps {
  annotation: Annotation;
  onClose: () => void;
}

export function AnnotationCard({ annotation, onClose }: AnnotationCardProps) {
  const getRockColor = (type: string) => {
    switch (type) {
      case 'sedimentary': return 'text-cyan-400';
      case 'metamorphic': return 'text-yellow-400';
      case 'igneous': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="absolute z-20 bg-[#1e2029] rounded-lg shadow-2xl border border-[#2a2d3a] p-4 min-w-[200px]
      transform -translate-x-1/2 -translate-y-full pointer-events-auto">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-[#6b7280] hover:text-[#e0e6f0] transition-colors"
      >
        <X size={14} />
      </button>
      
      <div className="space-y-2">
        <div className={`text-base font-semibold ${getRockColor(annotation.rockType)}`}>
          {annotation.rockName}
        </div>
        
        <div className="h-px bg-[#2a2d3a] my-2" />
        
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6b7280]">密度值</span>
            <span className="text-[#e0e6f0] font-mono">{annotation.density.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6b7280]">坐标</span>
            <span className="text-[#e0e6f0] font-mono text-xs">
              {annotation.position.x.toFixed(1)}, {annotation.position.y.toFixed(1)}, {annotation.position.z.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1e2029] border-r border-b border-[#2a2d3a] rotate-45" />
    </div>
  );
}

export default InfoOverlay;
