import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lightbulb, Vote, CheckSquare, ChevronDown, Copy } from "lucide-react";
import { useWorkshopStore, getParticipantId, type IdeaCategory } from "@/store/workshop";
import IdeaCard from "@/components/IdeaCard";

export default function WorkshopPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorkshop, ideas, fetchWorkshopDetail, fetchIdeas, submitIdea, likeIdea, startVote, loading } =
    useWorkshopStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IdeaCategory>("tech");
  const [remainingLikes, setRemainingLikes] = useState(3);
  const [newIdeaIds, setNewIdeaIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWorkshopDetail(id);
      fetchIdeas(id);
    }
  }, [id, fetchWorkshopDetail, fetchIdeas]);

  const participantId = id ? getParticipantId(id) : null;

  const handleSubmitIdea = async () => {
    if (!title.trim() || !participantId || !id) return;
    setSubmitting(true);
    try {
      await submitIdea(id, { title: title.trim(), description: description.trim(), category, participantId });
      const newIdeas = useWorkshopStore.getState().ideas;
      const newest = newIdeas[newIdeas.length - 1];
      if (newest) {
        setNewIdeaIds((prev) => new Set(prev).add(newest.id));
        setTimeout(() => {
          setNewIdeaIds((prev) => {
            const next = new Set(prev);
            next.delete(newest.id);
            return next;
          });
        }, 700);
      }
      setTitle("");
      setDescription("");
      setCategory("tech");
    } catch (err) {
      alert(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = useCallback(
    async (ideaId: string) => {
      if (!participantId || remainingLikes <= 0) return;
      try {
        const result = await likeIdea(ideaId, participantId);
        setRemainingLikes(result.remainingLikes);
      } catch (err) {
        alert(err instanceof Error ? err.message : "点赞失败");
      }
    },
    [participantId, remainingLikes, likeIdea]
  );

  const handleStartVote = async () => {
    if (!id) return;
    try {
      await startVote(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "发起投票失败");
    }
  };

  if (loading || !currentWorkshop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  const isBrainstorm = currentWorkshop.status === "brainstorm";
  const isVoting = currentWorkshop.status === "voting";
  const isTask = currentWorkshop.status === "task";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-primary to-primary-dark text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="hover:text-white/80">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold">{currentWorkshop.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentWorkshop.inviteCode && (
              <button
                onClick={() => navigator.clipboard.writeText(currentWorkshop.inviteCode)}
                className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1.5 rounded-xl hover:bg-white/30"
              >
                邀请码: {currentWorkshop.inviteCode}
                <Copy size={14} />
              </button>
            )}
            {isVoting && (
              <button onClick={() => navigate(`/workshop/${id}/vote`)} className="btn-accent flex items-center gap-1.5">
                <Vote size={16} />
                去投票
              </button>
            )}
            {isTask && (
              <button onClick={() => navigate(`/workshop/${id}/tasks`)} className="btn-accent flex items-center gap-1.5">
                <CheckSquare size={16} />
                任务看板
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isBrainstorm && (
          <>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb size={18} className="text-accent" />
                提交创意
                <span className="text-xs text-gray-400 font-normal ml-2">剩余点赞: {remainingLikes}/3</span>
              </h2>
              <div className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 40))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="创意标题（最多40字）"
                  maxLength={40}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="创意描述"
                />
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                      className="appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                    >
                      <option value="tech">技术</option>
                      <option value="design">设计</option>
                      <option value="operation">运营</option>
                      <option value="other">其他</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={handleSubmitIdea}
                    disabled={submitting || !title.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "提交中..." : "提交创意"}
                  </button>
                  {currentWorkshop.isCreator && (
                    <button onClick={handleStartVote} className="btn-accent ml-auto">
                      发起投票
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="masonry">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  isNew={newIdeaIds.has(idea.id)}
                  onLike={() => handleLike(idea.id)}
                  remainingLikes={remainingLikes}
                />
              ))}
            </div>
            {ideas.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Lightbulb size={48} className="mx-auto mb-3 opacity-50" />
                <p>还没有创意，快来提交第一个吧</p>
              </div>
            )}
          </>
        )}

        {isVoting && (
          <div className="text-center py-16">
            <Vote size={48} className="mx-auto mb-3 text-accent" />
            <p className="text-gray-600 mb-4">投票阶段已开始</p>
            <button onClick={() => navigate(`/workshop/${id}/vote`)} className="btn-accent">
              进入投票
            </button>
          </div>
        )}

        {isTask && (
          <div className="text-center py-16">
            <CheckSquare size={48} className="mx-auto mb-3 text-primary" />
            <p className="text-gray-600 mb-4">任务已生成</p>
            <button onClick={() => navigate(`/workshop/${id}/tasks`)} className="btn-primary">
              查看任务看板
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
