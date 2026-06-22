import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music,
  Plus,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/utils/api";
import AnimatedNumber from "@/components/AnimatedNumber";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ArtistEvent {
  id: string;
  name: string;
  posterUrl: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

interface AnalyticsData {
  totalSold: number;
  totalRevenue: number;
  tierBreakdown: { name: string; value: number }[];
  dailyTrend: { date: string; sold: number }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: "待审核", color: "text-yellow-400", icon: Clock },
  approved: { label: "已通过", color: "text-green-400", icon: CheckCircle },
  rejected: { label: "已拒绝", color: "text-red-400", icon: XCircle },
};

const PIE_COLORS = ["#6B21A8", "#F97316", "#EC4899"];

type Tab = "events" | "create" | "analytics";

export default function ArtistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("events");
  const [events, setEvents] = useState<ArtistEvent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");

  const [form, setForm] = useState({
    name: "",
    posterUrl: "",
    date: "",
    venue: "",
    artistBio: "",
    tracks: [""],
    tiers: [{ name: "standard", price: 100, total: 200 }],
  });

  useEffect(() => {
    if (user?.role !== "artist") {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchArtistEvents();
  }, []);

  const fetchArtistEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data as ArtistEvent[]);
    } catch { /* ignore */ }
  };

  const handleCreateEvent = async () => {
    try {
      await api.createEvent(form);
      setForm({
        name: "",
        posterUrl: "",
        date: "",
        venue: "",
        artistBio: "",
        tracks: [""],
        tiers: [{ name: "standard", price: 100, total: 200 }],
      });
      fetchArtistEvents();
      setTab("events");
    } catch { /* ignore */ }
  };

  const loadAnalytics = async (eventId: string) => {
    setSelectedEventId(eventId);
    try {
      const data = await api.getAnalytics(eventId);
      setAnalytics(data as AnalyticsData);
    } catch { /* ignore */ }
  };

  const addTrack = () => setForm((f) => ({ ...f, tracks: [...f.tracks, ""] }));
  const removeTrack = (i: number) =>
    setForm((f) => ({ ...f, tracks: f.tracks.filter((_, idx) => idx !== i) }));
  const updateTrack = (i: number, val: string) =>
    setForm((f) => ({
      ...f,
      tracks: f.tracks.map((t, idx) => (idx === i ? val : t)),
    }));

  const addTier = () =>
    setForm((f) => ({
      ...f,
      tiers: [...f.tiers, { name: "standard", price: 100, total: 200 }],
    }));
  const removeTier = (i: number) =>
    setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }));
  const updateTier = (i: number, field: string, val: string | number) =>
    setForm((f) => ({
      ...f,
      tiers: f.tiers.map((t, idx) => (idx === i ? { ...t, [field]: val } : t)),
    }));

  const tabs: { key: Tab; label: string; icon: typeof Music }[] = [
    { key: "events", label: "我的活动", icon: Music },
    { key: "create", label: "创建活动", icon: Plus },
    { key: "analytics", label: "售票统计", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">音乐人后台</h1>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "gradient-bg text-white"
                : "glass text-gray-400 hover:text-white"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "events" && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-12">暂无活动</p>
          ) : (
            events.map((ev) => {
              const status = STATUS_MAP[ev.status] || STATUS_MAP.pending;
              const Icon = status.icon;
              return (
                <div key={ev.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                  <img
                    src={ev.posterUrl}
                    alt={ev.name}
                    className="w-16 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{ev.name}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(ev.date).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-sm ${status.color}`}>
                    <Icon className="w-4 h-4" />
                    {status.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "create" && (
        <div className="glass rounded-2xl p-6 space-y-4 max-w-2xl">
          <input
            placeholder="活动名称"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50"
          />
          <input
            placeholder="海报 URL"
            value={form.posterUrl}
            onChange={(e) => setForm((f) => ({ ...f, posterUrl: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-purple/50"
            />
            <input
              placeholder="场地"
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50"
            />
          </div>
          <textarea
            placeholder="音乐人简介"
            value={form.artistBio}
            onChange={(e) => setForm((f) => ({ ...f, artistBio: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 h-24 resize-none"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">曲目列表</span>
              <button onClick={addTrack} className="text-brand-purple text-sm hover:underline">
                + 添加
              </button>
            </div>
            {form.tracks.map((track, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={track}
                  onChange={(e) => updateTrack(i, e.target.value)}
                  placeholder={`曲目 ${i + 1}`}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-purple/50"
                />
                {form.tracks.length > 1 && (
                  <button onClick={() => removeTrack(i)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">票档设置</span>
              <button onClick={addTier} className="text-brand-purple text-sm hover:underline">
                + 添加
              </button>
            </div>
            {form.tiers.map((tier, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select
                  value={tier.name}
                  onChange={(e) => updateTier(i, "name", e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none"
                >
                  <option value="early">早鸟</option>
                  <option value="standard">普通</option>
                  <option value="vip">VIP</option>
                </select>
                <input
                  type="number"
                  value={tier.price}
                  onChange={(e) => updateTier(i, "price", Number(e.target.value))}
                  placeholder="价格"
                  className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none"
                />
                <input
                  type="number"
                  value={tier.total}
                  onChange={(e) => updateTier(i, "total", Number(e.target.value))}
                  placeholder="总量"
                  className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none"
                />
                {form.tiers.length > 1 && (
                  <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleCreateEvent}
            className="w-full py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity"
          >
            创建活动
          </button>
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-6">
          <select
            value={selectedEventId}
            onChange={(e) => loadAnalytics(e.target.value)}
            className="w-full max-w-sm px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-purple/50"
          >
            <option value="">选择活动</option>
            {events
              .filter((e) => e.status === "approved")
              .map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
          </select>

          {analytics && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-sm text-gray-400 mb-1">已售出</p>
                  <p className="text-3xl font-bold gradient-text">
                    <AnimatedNumber target={analytics.totalSold} />
                  </p>
                </div>
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-sm text-gray-400 mb-1">总收入</p>
                  <p className="text-3xl font-bold gradient-text">
                    <AnimatedNumber target={analytics.totalRevenue} prefix="¥" />
                  </p>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">票档分布</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.tierBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {analytics.tierBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">近7日趋势</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="#999" fontSize={12} />
                    <YAxis stroke="#999" fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sold"
                      stroke="#6B21A8"
                      strokeWidth={2}
                      dot={{ fill: "#F97316", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
