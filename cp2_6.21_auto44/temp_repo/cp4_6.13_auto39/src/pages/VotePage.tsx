import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Send } from "lucide-react";
import { useWorkshopStore, getParticipantId, type IdeaCategory } from "@/store/workshop";

interface ShuffledIdea {
  id: string;
  title: string;
  summary: string;
  category: IdeaCategory;
  originalIndex: number;
}

const categoryClass: Record<IdeaCategory, string> = {
  tech: "category-tech",
  design: "category-design",
  operation: "category-operation",
  other: "category-other",
};

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function VotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchIdeas, ideas, submitVotes, voteResults, fetchWorkshopDetail, currentWorkshop } = useWorkshopStore();
  const [shuffled, setShuffled] = useState<ShuffledIdea[]>([]);
  const [approved, setApproved] = useState<ShuffledIdea[]>([]);
  const [rejected, setRejected] = useState<ShuffledIdea[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const approveRef = useRef<HTMLDivElement>(null);
  const rejectRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchWorkshopDetail(id);
      fetchIdeas(id);
    }
  }, [id, fetchWorkshopDetail, fetchIdeas]);

  useEffect(() => {
    if (ideas.length > 0 && shuffled.length === 0) {
      const mapped: ShuffledIdea[] = ideas.map((idea, i) => ({
        id: idea.id,
        title: idea.title,
        summary: idea.description.slice(0, 80),
        category: idea.category,
        originalIndex: i,
      }));
      setShuffled(shuffleArray(mapped));
    }
  }, [ideas, shuffled.length]);

  const dragRef = useRef<{
    idea: ShuffledIdea;
    el: HTMLDivElement;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (idea: ShuffledIdea, e: React.PointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      dragRef.current = {
        idea,
        el,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };
      el.style.zIndex = "100";
      el.style.position = "fixed";
      el.style.width = `${rect.width}px`;
      el.style.left = `${e.clientX - (e.clientX - rect.left)}px`;
      el.style.top = `${e.clientY - (e.clientY - rect.top)}px`;
      el.style.transition = "none";
      el.style.transform = "scale(1.05)";
      el.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
    },
    []
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    d.el.style.left = `${e.clientX - d.offsetX}px`;
    d.el.style.top = `${e.clientY - d.offsetY}px`;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      d.el.releasePointerCapture(e.pointerId);

      const x = e.clientX;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const relativeX = x - containerRect.left;
      const halfWidth = containerRect.width / 2;

      d.el.style.transition = "all 0.3s ease";
      d.el.style.transform = "scale(1)";

      if (relativeX < halfWidth * 0.4) {
        setApproved((prev) => [...prev, d.idea]);
        setShuffled((prev) => prev.filter((i) => i.id !== d.idea.id));
      } else if (relativeX > halfWidth * 1.6) {
        setRejected((prev) => [...prev, d.idea]);
        setShuffled((prev) => prev.filter((i) => i.id !== d.idea.id));
      } else {
        d.el.style.position = "";
        d.el.style.left = "";
        d.el.style.top = "";
        d.el.style.width = "";
        d.el.style.zIndex = "";
        d.el.style.transform = "";
        d.el.style.boxShadow = "";
      }

      setTimeout(() => {
        if (d.el) {
          d.el.style.position = "";
          d.el.style.left = "";
          d.el.style.top = "";
          d.el.style.width = "";
          d.el.style.zIndex = "";
          d.el.style.transform = "";
          d.el.style.boxShadow = "";
          d.el.style.transition = "";
        }
      }, 350);

      dragRef.current = null;
    },
    []
  );

  const handleSubmit = async () => {
    if (!id) return;
    const participantId = getParticipantId(id);
    if (!participantId) return;
    setSubmitting(true);
    try {
      const votes = [
        ...approved.map((idea) => ({ ideaId: idea.id, vote: "approve" as const })),
        ...rejected.map((idea) => ({ ideaId: idea.id, vote: "reject" as const })),
      ];
      await submitVotes(id, participantId, votes);
      setShowResults(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentWorkshop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">加载中...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-primary to-primary-dark text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(`/workshop/${id}`)} className="hover:text-white/80">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">投票 - {currentWorkshop.name}</h1>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {showResults ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">投票结果</h2>
            <div className="space-y-3">
              {voteResults
                .sort((a, b) => a.rank - b.rank)
                .map((r) => (
                  <div key={r.ideaId} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary">#{r.rank}</span>
                      <span className="font-medium text-gray-900">{r.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">赞同 {r.approveCount}</span>
                      <span className="text-red-500">反对 {r.rejectCount}</span>
                      <span className="font-bold text-primary">得分 {r.weightedScore.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="flex gap-4 min-h-[70vh]" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
              <div
                ref={approveRef}
                className="w-1/4 border-2 border-dashed border-green-300 rounded-xl p-3 bg-green-50/50 min-h-[200px]"
              >
                <div className="flex items-center gap-2 text-green-600 font-medium mb-3">
                  <CheckCircle size={18} />
                  赞同区
                </div>
                <div className="space-y-2">
                  {approved.map((idea) => (
                    <div key={idea.id} className={`${categoryClass[idea.category]} text-white rounded-lg p-2.5 text-sm animate-breathe`}>
                      <div className="font-medium">{idea.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {shuffled.map((idea) => (
                    <div
                      key={idea.id}
                      onPointerDown={(e) => handlePointerDown(idea, e)}
                      className={`${categoryClass[idea.category]} text-white rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-sm touch-none select-none`}
                    >
                      <div className="font-medium text-sm mb-1 line-clamp-2">{idea.title}</div>
                      <div className="text-xs text-white/70 line-clamp-2">{idea.summary}</div>
                    </div>
                  ))}
                </div>
                {shuffled.length === 0 && approved.length === 0 && rejected.length === 0 && (
                  <div className="text-center py-16 text-gray-400">没有可投票的创意</div>
                )}
              </div>

              <div
                ref={rejectRef}
                className="w-1/4 border-2 border-dashed border-red-300 rounded-xl p-3 bg-red-50/50 min-h-[200px]"
              >
                <div className="flex items-center gap-2 text-red-500 font-medium mb-3">
                  <XCircle size={18} />
                  反对区
                </div>
                <div className="space-y-2">
                  {rejected.map((idea) => (
                    <div key={idea.id} className={`${categoryClass[idea.category]} text-white rounded-lg p-2.5 text-sm animate-breathe opacity-70`}>
                      <div className="font-medium">{idea.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleSubmit}
                disabled={submitting || (approved.length === 0 && rejected.length === 0)}
                className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Send size={16} />
                {submitting ? "提交中..." : "提交投票"}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                已赞同 {approved.length} · 已反对 {rejected.length} · 未投票 {shuffled.length}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
