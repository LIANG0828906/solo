import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Clock, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useWorkStore } from "@/stores/useWorkStore";
import ReviewModal from "@/components/ReviewModal";
import { loginAdmin, reviewWork, fetchWorks } from "@/api/client";
import type { Work } from "@/types";

type TabKey = "pending" | "published" | "rejected";

const TABS: { key: TabKey; label: string; icon: typeof Clock }[] = [
  { key: "pending", label: "待审核", icon: Clock },
  { key: "published", label: "已发布", icon: CheckCircle2 },
  { key: "rejected", label: "已拒绝", icon: XCircle },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { adminToken, setAdminToken } = useWorkStore();
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [logging, setLogging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewingWork, setReviewingWork] = useState<Work | null>(null);

  const loadWorks = useCallback(async (status: TabKey) => {
    setLoading(true);
    try {
      const list = await fetchWorks({ status });
      setWorks(list);
    } catch {
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminToken) {
      loadWorks(activeTab);
    }
  }, [adminToken, activeTab, loadWorks]);

  const handleLogin = async () => {
    setLoginError("");
    setLogging(true);
    try {
      const { token } = await loginAdmin(password);
      setAdminToken(token);
    } catch {
      setLoginError("登录失败，请检查密码");
    } finally {
      setLogging(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    navigate("/");
  };

  const handleReview = async (
    id: string,
    action: "approve" | "reject",
    reject_reason?: string
  ) => {
    await reviewWork(id, { action, reject_reason });
    setReviewingWork(null);
    loadWorks(activeTab);
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-full max-w-sm mx-4 p-8 bg-surface rounded-card space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-xl font-display text-white">管理员登录</h1>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="请输入管理密码"
              className="w-full px-4 py-3 bg-surface-light border border-surface-border rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo"
            />
            {loginError && (
              <p className="text-red-400 text-sm">{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={logging || !password}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {logging ? "登录中..." : "登录"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-display text-white">审核管理</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white border border-surface-border rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 border-b border-surface-border mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? "text-indigo-400 border-indigo-400"
                  : "text-white/50 border-transparent hover:text-white/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : works.length === 0 ? (
          <div className="text-center py-20 text-white/40 text-sm">
            暂无作品
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {works.map((work) => (
              <div
                key={work.id}
                className="bg-surface-light rounded-card overflow-hidden"
              >
                <div className="relative aspect-square">
                  {work.file_type === "video" ? (
                    <LazyLoadImage
                      src={work.thumbnail_url}
                      alt={work.title}
                      effect="opacity"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <LazyLoadImage
                      src={work.file_url}
                      alt={work.title}
                      effect="opacity"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  <h3 className="text-white text-sm font-medium truncate">
                    {work.title}
                  </h3>
                  <p className="text-white/50 text-xs truncate">
                    {work.uploader}
                  </p>
                  <p className="text-white/30 text-xs">
                    {new Date(work.created_at).toLocaleDateString("zh-CN")}
                  </p>
                  {activeTab === "pending" && (
                    <button
                      onClick={() => setReviewingWork(work)}
                      className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      审核
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ReviewModal
        work={reviewingWork}
        onReview={handleReview}
        onClose={() => setReviewingWork(null)}
      />
    </div>
  );
}
