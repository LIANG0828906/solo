import { useComponentStore } from '@/store/componentStore';
import { renderShape } from '@/utils/shapes';
import { motion } from 'framer-motion';
import type { PoseTemplate } from '@/store/componentStore';

interface PoseCardProps {
  pose: PoseTemplate;
  isActive: boolean;
  onClick: () => void;
}

function PoseCard({ pose, isActive, onClick }: PoseCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center rounded-[10px] bg-white overflow-hidden transition-shadow duration-200 hover:shadow-lg"
      style={{
        width: 120,
        height: 160,
        border: isActive ? '2px solid #FF6B6B' : '2px solid transparent',
        boxShadow: isActive ? '0 0 12px rgba(255,107,107,0.3)' : 'none',
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="flex-1 flex items-center justify-center w-full bg-[#f5f5f5]">
        <span className="text-5xl">{pose.emoji}</span>
      </div>
      <div className="w-full py-2 text-center">
        <span className="text-xs text-[#888]">{pose.name}</span>
      </div>
    </motion.button>
  );
}

export function RightPanel() {
  const poseTemplates = useComponentStore((s) => s.poseTemplates);
  const currentPoseId = useComponentStore((s) => s.currentPoseId);
  const applyPose = useComponentStore((s) => s.applyPose);

  return (
    <div className="w-[240px] max-[1200px]:w-[200px] h-full flex flex-col">
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{
          background: 'rgba(30,30,40,0.5)',
          borderRadius: '12px',
        }}
      >
        <div className="text-white text-sm font-semibold mb-3 px-1">动作 / 表情</div>
        <div className="flex flex-col gap-3 items-center">
          {poseTemplates.map((pose) => (
            <PoseCard
              key={pose.id}
              pose={pose}
              isActive={currentPoseId === pose.id}
              onClick={() => applyPose(pose.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
