import { MdClose } from 'react-icons/md';
import { cn } from '@/lib/utils';
import {
  PIPELINE_COLORS,
  PIPELINE_NAMES,
  STATUS_NAMES,
  type PipelineType,
  type PipelineStatus,
} from '@/Data/undergroundData';

export interface PipelineDetailData {
  id: string;
  type: PipelineType;
  name: string;
  material: string;
  installYear?: number;
  installedYear?: number;
  totalLength: number;
  lastInspection: string;
  lastInspectionDate?: string;
  status: PipelineStatus;
}

interface PipelineDetailProps {
  pipeline: PipelineDetailData | null;
  onClose: () => void;
}

const STATUS_COLORS: Record<PipelineStatus, string> = {
  normal: '#10B981',
  repair: '#F59E0B',
  abandoned: '#EF4444',
};

export default function PipelineDetail({ pipeline, onClose }: PipelineDetailProps) {
  if (!pipeline) return null;

  const installYear = pipeline.installYear ?? pipeline.installedYear;
  const lastInspectionDate = pipeline.lastInspectionDate ?? pipeline.lastInspection;
  const typeColor = PIPELINE_COLORS[pipeline.type];
  const typeName = PIPELINE_NAMES[pipeline.type];
  const statusColor = STATUS_COLORS[pipeline.status];
  const statusName = STATUS_NAMES[pipeline.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#1a1a2e',
          opacity: 0.85,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        className="relative h-full overflow-y-auto"
        style={{
          width: '360px',
          backgroundColor: '#0f0c29',
          padding: '24px',
          animation: 'slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white transition-colors hover:text-gray-300"
          style={{ fontSize: '24px' }}
        >
          <MdClose />
        </button>

        <div className="mb-6 pr-10">
          <h2
            className="mb-2 font-bold text-white"
            style={{ fontSize: '22px' }}
          >
            {pipeline.name}
          </h2>
          <span
            className="inline-block rounded px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: typeColor }}
          >
            {typeName}
          </span>
        </div>

        <div className="flex flex-col" style={{ gap: '10px' }}>
          <DetailCard label="管线类型" value={typeName} />
          <DetailCard label="材质" value={pipeline.material} />
          <DetailCard label="安装年份" value={installYear ? `${installYear}年` : '-'} />
          <DetailCard label="全长" value={`${pipeline.totalLength.toFixed(2)} 米`} />
          <DetailCard label="最近检修日期" value={lastInspectionDate} />
          <DetailCard
            label="管线状态"
            value={
              <span
                className="inline-block font-medium text-white"
                style={{
                  backgroundColor: statusColor,
                  borderRadius: '6px',
                  padding: '4px 10px',
                }}
              >
                {statusName}
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}

interface DetailCardProps {
  label: string;
  value: React.ReactNode;
}

function DetailCard({ label, value }: DetailCardProps) {
  return (
    <div
      className={cn(
        'text-white transition-all duration-200',
        'hover:scale-[1.02]'
      )}
      style={{
        borderRadius: '10px',
        padding: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#4A90D9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }}
    >
      <div className="mb-1 text-xs text-gray-400">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
