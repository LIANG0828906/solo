import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Home,
  FolderKanban,
  Image,
  Clock,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import MaterialGrid from "@/components/MaterialGrid";
import TimelineProgress from "@/components/TimelineProgress";
import CommentSection from "@/components/CommentSection";

interface Stage {
  id: number;
  name: string;
  percent: number;
}

interface Project {
  id: string;
  name: string;
  type: string;
  targetDuration: string;
  stages: Stage[];
}

const mockStages: Stage[] = [
  { id: 1, name: "前期策划", percent: 100 },
  { id: 2, name: "脚本撰写", percent: 100 },
  { id: 3, name: "素材拍摄", percent: 75 },
  { id: 4, name: "后期剪辑", percent: 45 },
  { id: 5, name: "特效包装", percent: 20 },
  { id: 6, name: "审片交付", percent: 0 },
];

const otherProjects = [
  { id: "2", name: "产品发布会直播" },
  { id: "3", name: "Q4营销视频" },
  { id: "4", name: "年会回顾短片" },
];

type TabKey = "material" | "timeline" | "comment";

const tabs = [
  { key: "material" as TabKey, label: "素材管理", icon: Image },
  { key: "timeline" as TabKey, label: "进度时间轴", icon: Clock },
  { key: "comment" as TabKey, label: "协作评论", icon: MessageSquare },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("material");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`/api/projects/${id}`);
        setProject(response.data);
      } catch {
        setProject({
          id: id || "1",
          name: "品牌宣传片制作",
          type: "视频项目",
          targetDuration: "3-5分钟",
          stages: mockStages,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const stages = project?.stages || mockStages;
  const overallProgress = stages.length > 0
    ? Math.round(stages.reduce((acc, s) => acc + s.percent, 0) / stages.length)
    : 0;

  const projectId = id ?? "";

  const renderTabContent = () => {
    switch (activeTab) {
      case "material":
        return <MaterialGrid projectId={projectId} />;
      case "timeline":
        return <TimelineProgress projectId={projectId} />;
      case "comment":
        return <CommentSection projectId={projectId} />;
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
      <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* 左侧导航栏 - 桌面端 */}
      <aside className="hidden md:flex flex-col w-80 flex-shrink-0" style={{ backgroundColor: "#0F172A" }}>
        <div className="p-5 flex flex-col h-full overflow-y-auto">
          {/* 返回首页按钮 */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回首页</span>
          </button>

          {/* 项目名称 */}
          <h1 className="text-white text-2xl font-bold mb-3">
            {project.name}
          </h1>

          {/* 项目类型和目标时长 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
              {project.type}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              目标时长: {project.targetDuration}
            </span>
          </div>

          {/* 整体完成度 */}
          <div className="mb-6 p-4 rounded-xl bg-slate-800/50">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-slate-400 text-sm">整体完成度</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {overallProgress}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${overallProgress}%`,
                  background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                }}
              />
            </div>
          </div>

          {/* 时间线概览 */}
          <div className="mb-6">
            <h3 className="text-slate-300 text-sm font-medium mb-3">进度概览</h3>
            <div className="space-y-3">
              {stages.map((stage, index) => {
                const ratio = index / (stages.length - 1);
                const r = Math.round(59 + (139 - 59) * ratio);
                const g = Math.round(130 + (92 - 130) * ratio);
                const b = Math.round(246 + (246 - 246) * ratio);
                const progressColor = `rgb(${r}, ${g}, ${b})`;
                return (
                  <div key={stage.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{stage.name}</span>
                      <span className="text-slate-300 font-medium">{stage.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${stage.percent}%`,
                          backgroundColor: progressColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 其它项目快速跳转 */}
          <div className="mt-auto pt-6 border-t border-slate-700">
            <h3 className="text-slate-300 text-sm font-medium mb-3">其它项目</h3>
            <div className="space-y-1">
              {otherProjects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    <span className="text-sm">{p.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="flex-1 flex flex-col min-h-screen" style={{ backgroundColor: "#1E293B" }}>
        {/* 顶部面包屑 + 完成度条 - 桌面端隐藏，因为在移动端显示 */}
        <header className="md:hidden sticky top-0 z-20 p-4 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Home className="w-4 h-4" />
                <ChevronRight className="w-4 h-4" />
                <span>项目详情</span>
              </div>
              <h1 className="text-white text-lg font-semibold truncate">
                {project.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">整体完成度</span>
                <span className="text-white font-medium">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${overallProgress}%`,
                    background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* 顶部面包屑 + 完成度 - 桌面端 */}
        <header className="hidden md:block p-6 pb-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    <span>首页</span>
                  </Link>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-slate-300">{project.name}</span>
                </div>
                <h1 className="text-white text-xl font-semibold">
                  {project.name}
                </h1>
              </div>
            </div>

            {/* 桌面端完成度显示 */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-slate-400 text-sm mb-1">整体完成度</div>
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {overallProgress}%
                </div>
              </div>
              <div className="w-48">
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${overallProgress}%`,
                      background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab 切换 - 桌面端 */}
        <div className="hidden md:flex border-b border-slate-700 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-6 py-4 text-sm font-medium transition-all duration-300 ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 ${
                  activeTab === tab.key ? "opacity-100" : "opacity-0"
                }`}
                style={{ backgroundColor: "#8B5CF6", height: "2px" }}
              />
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div
            className="transition-all duration-300 ease-in-out"
            style={{
              opacity: 1,
              transform: "translateY(0)",
            }}
          >
            {renderTabContent()}
          </div>
        </div>

        {/* 底部 Tab 栏 - 移动端 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-700" style={{ backgroundColor: "#0F172A" }}>
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex-1 flex flex-col items-center justify-center py-3 transition-all duration-300 ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-1 transition-all duration-300 ${
                    isActive ? "scale-110" : ""
                  }`} />
                  <span className="text-xs font-medium">
                    {tab.key === "material" ? "素材" : tab.key === "timeline" ? "进度" : "评论"}
                  </span>
                  <span
                    className={`absolute top-0 left-1/4 right-1/4 h-0.5 transition-all duration-300 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ backgroundColor: "#8B5CF6", height: "2px" }}
                  />
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
