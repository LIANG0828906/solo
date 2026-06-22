import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useWorkshopStore } from "@/store/workshop";
import { useNavigate } from "react-router-dom";

export default function JoinWorkshopSection() {
  const { joinWorkshop } = useWorkshopStore();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim() || !participantName.trim()) return;
    setLoading(true);
    try {
      const result = await joinWorkshop(inviteCode.trim(), participantName.trim());
      navigate(`/workshop/${result.workshopId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "加入失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-3">加入工作坊</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          placeholder="你的昵称"
        />
        <div className="flex gap-2 flex-1">
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="6位邀请码"
            maxLength={6}
          />
          <button
            onClick={handleJoin}
            disabled={loading || inviteCode.length !== 6 || !participantName.trim()}
            className="btn-primary flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            加入
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
