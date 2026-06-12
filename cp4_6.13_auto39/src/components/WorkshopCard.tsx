import { Users, Lightbulb } from "lucide-react";
import type { WorkshopListItem, WorkshopStatus } from "@/store/workshop";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<WorkshopStatus, { label: string; color: string }> = {
  brainstorm: { label: "头脑风暴", color: "bg-green-100 text-green-700" },
  voting: { label: "投票中", color: "bg-orange-100 text-orange-700" },
  task: { label: "任务执行", color: "bg-blue-100 text-blue-700" },
};

export default function WorkshopCard({ workshop }: { workshop: WorkshopListItem }) {
  const navigate = useNavigate();
  const status = statusConfig[workshop.status];

  return (
    <div
      onClick={() => navigate(`/workshop/${workshop.id}`)}
      className="bg-white rounded-xl p-5 shadow-sm card-hover cursor-pointer border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-1">{workshop.name}</h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ml-2 ${status.color}`}>
          {status.label}
        </span>
      </div>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{workshop.description}</p>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span className="flex items-center gap-1.5">
          <Users size={14} />
          {workshop.currentParticipants}/{workshop.maxParticipants}
        </span>
        <span className="flex items-center gap-1.5 text-category-tech">
          <Lightbulb size={14} />
          创意工作坊
        </span>
      </div>
    </div>
  );
}
