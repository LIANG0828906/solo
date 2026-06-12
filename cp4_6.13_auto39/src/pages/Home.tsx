import { useEffect, useState } from "react";
import { Plus, Lightbulb } from "lucide-react";
import { useWorkshopStore } from "@/store/workshop";
import WorkshopCard from "@/components/WorkshopCard";
import CreateWorkshopModal from "@/components/CreateWorkshopModal";
import JoinWorkshopSection from "@/components/JoinWorkshopSection";

export default function Home() {
  const { workshops, fetchWorkshops } = useWorkshopStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-primary to-primary-dark text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb size={24} />
            <span className="text-xl font-bold">创意工作坊</span>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-accent flex items-center gap-1.5">
            <Plus size={18} />
            创建工作坊
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <JoinWorkshopSection />

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">工作坊列表</h2>
          {workshops.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Lightbulb size={48} className="mx-auto mb-3 opacity-50" />
              <p>还没有工作坊，快来创建一个吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workshops.map((w) => (
                <WorkshopCard key={w.id} workshop={w} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateWorkshopModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
