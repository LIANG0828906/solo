import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ScanLine, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { api } from "@/utils/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuthStore } from "@/stores/authStore";

interface CheckinResult {
  success: boolean;
  message?: string;
  ticket?: {
    ticketNo: string;
    eventName: string;
    tier: string;
    holderName: string;
  };
}

const TIER_LABELS: Record<string, string> = {
  early: "早鸟",
  standard: "普通",
  vip: "VIP",
};

export default function ArtistCheckin() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sendMessage } = useWebSocket();
  const [ticketNo, setTicketNo] = useState("");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [loading, setLoading] = useState(false);

  if (user?.role !== "artist") {
    navigate("/login");
  }

  const handleCheckin = async () => {
    if (!ticketNo.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.checkinTicket(ticketNo.trim());
      setResult(data as CheckinResult);
      if ((data as CheckinResult).success) {
        sendMessage({
          type: "checkin",
          eventId,
          ticketNo: ticketNo.trim(),
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "验票失败",
      });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">现场验票</h1>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="relative">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="输入票号"
            value={ticketNo}
            onChange={(e) => setTicketNo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheckin()}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50"
          />
        </div>
        <button
          onClick={handleCheckin}
          disabled={loading || !ticketNo.trim()}
          className="w-full py-3 rounded-xl gradient-bg text-white font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {loading ? "验证中..." : "验票"}
        </button>
      </div>

      {result && (
        <div
          className={`glass rounded-2xl p-6 animate-slide-up ${
            result.success ? "border-green-500/30" : "border-red-500/30"
          }`}
        >
          {result.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">验票成功</span>
              </div>
              {result.ticket && (
                <div className="space-y-1 text-sm text-gray-300">
                  <p>票号：{result.ticket.ticketNo}</p>
                  <p>活动：{result.ticket.eventName}</p>
                  <p>票档：{TIER_LABELS[result.ticket.tier] || result.ticket.tier}</p>
                  <p>持票人：{result.ticket.holderName}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {result.message?.includes("已使用") ? (
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
              <span className="text-red-400 font-semibold">
                {result.message || "验票失败"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
