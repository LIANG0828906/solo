import { useEffect, useState } from "react";
import { Ticket as TicketIcon, Clock } from "lucide-react";
import QRCode from "qrcode";

interface TicketItem {
  id: string;
  ticketNo: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  tier: string;
  posterUrl: string;
  status: "valid" | "used" | "expired";
}

const TIER_LABELS: Record<string, string> = {
  early: "早鸟",
  standard: "普通",
  vip: "VIP",
};

export default function TicketPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTickets(data);
          const map: Record<string, string> = {};
          for (const t of data) {
            try {
              map[t.id] = await QRCode.toDataURL(`${t.ticketNo}:${t.eventId}`, {
                width: 120,
                margin: 1,
                color: { dark: "#6B21A8", light: "#ffffff" },
              });
            } catch {
              map[t.id] = "";
            }
          }
          setQrMap(map);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
  }, []);

  const isExpired = (date: string) => new Date(date) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-32 animate-fade-in">
        <TicketIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">暂无票券</p>
        <p className="text-gray-600 text-sm mt-1">快去发现精彩活动吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">我的票夹</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets.map((ticket) => {
          const expired = isExpired(ticket.eventDate) || ticket.status === "expired";
          return (
            <div
              key={ticket.id}
              className={`glass rounded-2xl overflow-hidden transition-all ${
                expired ? "grayscale opacity-60" : ""
              }`}
            >
              <div className="flex">
                <img
                  src={ticket.posterUrl}
                  alt={ticket.eventName}
                  className="w-24 h-32 object-cover shrink-0"
                />
                <div className="p-4 flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{ticket.eventName}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.eventDate).toLocaleDateString("zh-CN")}
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs gradient-bg text-white">
                    {TIER_LABELS[ticket.tier] || ticket.tier}
                  </span>
                  {expired && (
                    <span className="inline-block mt-2 ml-2 px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                      已过期
                    </span>
                  )}
                </div>
              </div>
              {qrMap[ticket.id] && !expired && (
                <div className="p-4 border-t border-white/5 flex justify-center">
                  <img src={qrMap[ticket.id]} alt="QR" className="w-28 h-28" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
