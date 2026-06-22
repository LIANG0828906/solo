import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/utils/api";

interface PendingEvent {
  id: string;
  name: string;
  artistName: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { lastMessage } = useWebSocket();
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === "ticket_update" || data.type === "new_event") {
          loadEvents();
        }
      } catch { /* ignore */ }
    }
  }, [lastMessage]);

  const loadEvents = async () => {
    try {
      const data = await api.getAdminEvents();
      setEvents(data as PendingEvent[]);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    try {
      await api.verifyEvent(id, "approved");
      loadEvents();
    } catch { /* ignore */ }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await api.verifyEvent(rejectId, "rejected", rejectReason);
      setRejectId(null);
      setRejectReason("");
      loadEvents();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">管理员后台</h1>

      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-12">暂无待审核活动</p>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">活动名称</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">音乐人</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">日期</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">状态</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium">{ev.name}</td>
                  <td className="px-4 py-3 text-gray-300">{ev.artistName}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {new Date(ev.date).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        ev.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : ev.status === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {ev.status === "pending"
                        ? "待审核"
                        : ev.status === "approved"
                        ? "已通过"
                        : "已拒绝"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {ev.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(ev.id)}
                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectId(ev.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-md mx-4 space-y-4 animate-slide-up">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-400" />
              拒绝原因
            </h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 h-24 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectId(null);
                  setRejectReason("");
                }}
                className="flex-1 py-2 rounded-xl glass text-gray-300 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2 rounded-xl bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
