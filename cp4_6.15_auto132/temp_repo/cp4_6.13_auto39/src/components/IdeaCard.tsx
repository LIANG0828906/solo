import { Heart } from "lucide-react";
import type { IdeaResponse, IdeaCategory } from "@/store/workshop";
import { useState } from "react";

const categoryClass: Record<IdeaCategory, string> = {
  tech: "category-tech",
  design: "category-design",
  operation: "category-operation",
  other: "category-other",
};

const categoryLabel: Record<IdeaCategory, string> = {
  tech: "技术",
  design: "设计",
  operation: "运营",
  other: "其他",
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

const avatarColors = ["#2E86AB", "#8B5CF6", "#10B981", "#F18F01", "#EF4444", "#6B7280"];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function IdeaCard({
  idea,
  isNew,
  onLike,
  remainingLikes,
}: {
  idea: IdeaResponse;
  isNew: boolean;
  onLike: () => void;
  remainingLikes: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (remainingLikes <= 0) return;
    setHeartAnim(true);
    onLike();
    setTimeout(() => setHeartAnim(false), 300);
  };

  return (
    <div
      className={`rounded-xl p-4 text-white cursor-pointer shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ${
        categoryClass[idea.category]
      } ${isNew ? "animate-slide-in-down" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{categoryLabel[idea.category]}</span>
        <span className="text-xs text-white/60">{new Date(idea.createdAt).toLocaleDateString()}</span>
      </div>
      <h3 className="font-semibold text-base mb-2 leading-snug">{idea.title}</h3>
      <p className="text-sm text-white/80 mb-3">
        {expanded ? idea.description : idea.description.slice(0, 200)}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
          >
            {getInitials(idea.participantName)}
          </div>
          <span className="text-sm text-white/80">{idea.participantName}</span>
        </div>
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 text-sm ${remainingLikes <= 0 ? "opacity-50 cursor-not-allowed" : "hover:scale-110 transition-transform"}`}
        >
          <Heart size={16} className={`fill-current ${heartAnim ? "animate-heartbeat" : ""}`} />
          <span>{idea.likes}</span>
        </button>
      </div>
    </div>
  );
}

export { getAvatarColor, getInitials };
