import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, SmilePlus, Frown, Meh, Smile } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '@/shared/store';
import type { Task, EmojiVote } from '@/shared/types';

function EmojiButton({ emoji, active, onClick }: { emoji: EmojiVote; active: boolean; onClick: () => void }) {
  const config = {
    happy: { icon: <Smile size={16} />, color: 'text-green-500', bg: 'bg-green-50', activeBg: 'bg-green-100 ring-2 ring-green-300' },
    neutral: { icon: <Meh size={16} />, color: 'text-yellow-500', bg: 'bg-yellow-50', activeBg: 'bg-yellow-100 ring-2 ring-yellow-300' },
    sad: { icon: <Frown size={16} />, color: 'text-red-400', bg: 'bg-red-50', activeBg: 'bg-red-100 ring-2 ring-red-300' },
  }[emoji];

  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all ${active ? config.activeBg : config.bg} ${config.color} hover:scale-110`}
    >
      {config.icon}
    </button>
  );
}

function VoteChart({ taskId, votes }: { taskId: string; votes: EmojiVote[] }) {
  const taskVotes = votes.filter((v) => v.taskId === taskId);
  const data = [
    { name: '😊', count: taskVotes.filter((v) => v === 'happy').length || 0, color: '#4ade80' },
    { name: '😐', count: taskVotes.filter((v) => v === 'neutral').length || 0, color: '#facc15' },
    { name: '😢', count: taskVotes.filter((v) => v === 'sad').length || 0, color: '#f87171' },
  ];

  if (taskVotes.length === 0) return null;

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={8}>
          <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, 'dataMax + 1']} />
          <Tooltip
            contentStyle={{ fontSize: 10, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [`${value}票`, '']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function RetroPanel() {
  const tasks = useStore((s) => s.tasks);
  const votes = useStore((s) => s.votes);
  const comments = useStore((s) => s.comments);
  const teamMembers = useStore((s) => s.teamMembers);
  const currentMemberId = useStore((s) => s.currentMemberId);
  const addComment = useStore((s) => s.addComment);
  const setVotes = useStore((s) => s.setVotes);

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [localVotes, setLocalVotes] = useState<Record<string, EmojiVote>>({});

  useEffect(() => {
    fetch('/api/votes?sprintId=s1')
      .then((r) => r.json())
      .then(setVotes)
      .catch(() => {});
  }, [setVotes]);

  const doneTasks = tasks
    .filter((t) => t.lane === 'done')
    .sort((a, b) => a.order - b.order);

  const handleAddComment = useCallback(async (taskId: string, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, author: teamMembers.find((m) => m.id === currentMemberId)?.name || 'Anonymous', content: content.trim() }),
      });
      const comment = await res.json();
      addComment(comment);
      setCommentInputs((prev) => ({ ...prev, [taskId]: '' }));
    } catch {}
  }, [teamMembers, currentMemberId, addComment]);

  const handleVote = useCallback(async (taskId: string, emoji: EmojiVote) => {
    setLocalVotes((prev) => ({ ...prev, [taskId]: emoji }));
    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, voter: teamMembers.find((m) => m.id === currentMemberId)?.name || 'Anonymous', emoji }),
      });
      const res = await fetch('/api/votes?sprintId=s1');
      const updatedVotes = await res.json();
      setVotes(updatedVotes);
    } catch {}
  }, [teamMembers, currentMemberId, setVotes]);

  const voteEmojis = votes.map((v) => v.emoji);

  return (
    <div className="h-full overflow-y-auto px-2">
      <div className="max-w-2xl mx-auto py-4">
        <h3 className="font-display font-bold text-macaron-dark text-sm mb-6 text-center">
          🎯 冲刺回顾
        </h3>

        {doneTasks.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-12">
            暂无已完成的任务，完成冲刺后这里将展示回顾时间轴
          </div>
        )}

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-macaron-purple via-macaron-mint to-macaron-pink" />

          {doneTasks.map((task, idx) => {
            const taskComments = comments.filter((c) => c.taskId === task.id);
            const assignee = teamMembers.find((m) => m.id === task.assignee);

            return (
              <div
                key={task.id}
                className="relative pl-16 pb-8 animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute left-4 top-1 w-5 h-5 rounded-full bg-white border-2 border-macaron-mint shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-macaron-mint" />
                </div>

                <div className="bg-white/60 backdrop-blur-glass rounded-card p-4 shadow-card border border-white/40">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-display font-bold text-macaron-dark text-sm">{task.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                      {assignee && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                          {assignee.avatar} {assignee.name}
                        </span>
                      )}
                    </div>
                    <VoteChart taskId={task.id} votes={voteEmojis} />
                  </div>

                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100/60">
                    <span className="text-[10px] text-gray-400">情绪投票：</span>
                    <EmojiButton emoji="happy" active={localVotes[task.id] === 'happy'} onClick={() => handleVote(task.id, 'happy')} />
                    <EmojiButton emoji="neutral" active={localVotes[task.id] === 'neutral'} onClick={() => handleVote(task.id, 'neutral')} />
                    <EmojiButton emoji="sad" active={localVotes[task.id] === 'sad'} onClick={() => handleVote(task.id, 'sad')} />
                  </div>

                  {taskComments.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {taskComments.map((c) => (
                        <div key={c.id} className="text-xs text-gray-500 bg-white/50 rounded-lg px-2.5 py-1.5">
                          <span className="font-semibold text-macaron-dark">{c.author}</span>：{c.content}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <input
                      value={commentInputs[task.id] || ''}
                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [task.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(task.id, commentInputs[task.id] || ''); }}
                      placeholder="添加评论..."
                      className="flex-1 text-xs bg-white/50 border border-gray-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-macaron-mint placeholder:text-gray-300"
                    />
                    <button
                      onClick={() => handleAddComment(task.id, commentInputs[task.id] || '')}
                      className="p-1.5 text-gray-400 hover:text-macaron-mint transition-colors"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
