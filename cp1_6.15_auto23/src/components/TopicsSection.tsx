import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Plus, Send, Clock, User, AtSign, X } from 'lucide-react';
import { api } from '@/api';
import type { Topic, TopicDetail, Member } from '@/types';
import { cn } from '@/lib/utils';

const CURRENT_MEMBER_ID = 'm_1';

function TopicCard({ topic, bookId }: { topic: Topic & { creator: Member }; bookId: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/book/${bookId}/topic/${topic.id}`)}
      className="w-full text-left p-4 rounded-card bg-cream/60 hover:bg-warm-white border border-transparent hover:border-latte/50 hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up"
    >
      <div className="flex items-start gap-3">
        <img src={topic.creator.avatar} alt={topic.creator.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-espresso mb-1 line-clamp-1">{topic.title}</h4>
          <p className="text-xs text-coffee mb-2">发起者：{topic.creator.name}</p>
          <div className="flex items-center gap-4 text-xs text-coffee">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-forest" />
              {topic.repliesCount} 条回复
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(topic.lastReplyAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function TopicList({
  bookId,
  topics,
  onCreate,
  onOpenTopic,
}: {
  bookId: string;
  topics: (Topic & { creator: Member })[];
  onCreate: (title: string) => void;
  onOpenTopic: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  const submit = () => {
    if (!newTitle.trim()) return;
    onCreate(newTitle.trim());
    setNewTitle('');
    setCreating(false);
  };

  return (
    <div className="animate-slide-left">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-xl font-bold text-espresso">讨论话题</h3>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-card bg-forest/10 text-forest font-medium hover:bg-forest/20 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          创建话题
        </button>
      </div>

      {creating && (
        <div className="mb-4 p-4 rounded-card bg-forest/5 border border-forest/20 animate-bubble-in">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="请输入话题标题，如：第一章人物分析..."
            className="w-full px-4 py-2.5 rounded-card border border-latte/60 bg-warm-white text-espresso focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200 mb-3"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setCreating(false); setNewTitle(''); }}
              className="px-4 py-1.5 text-sm rounded-card text-coffee hover:bg-latte/20 transition-colors"
            >
              取消
            </button>
            <button
              onClick={submit}
              disabled={!newTitle.trim()}
              className="px-4 py-1.5 text-sm rounded-card bg-forest text-warm-white hover:bg-forest-light transition-colors disabled:opacity-50"
            >
              创建
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-latte mx-auto mb-3" />
            <p className="text-coffee">暂无话题，发起第一个讨论吧</p>
          </div>
        ) : (
          topics.map(t => (
            <div key={t.id} onClick={() => onOpenTopic(t.id)} className="cursor-pointer">
              <TopicCard topic={t} bookId={bookId} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ChatBubble({
  reply,
  mine,
}: {
  reply: TopicDetail['replyDetails'][number];
  mine: boolean;
}) {
  return (
    <div className={cn('flex gap-3 animate-fade-in-up', mine ? 'flex-row-reverse' : '')}>
      <img src={reply.member.avatar} alt={reply.member.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
      <div className={cn('max-w-[75%]', mine ? 'items-end' : '')}>
        <div className={cn('text-xs text-coffee mb-1 flex items-center gap-2', mine ? 'justify-end' : '')}>
          <span className="font-medium text-espresso">{reply.member.name}</span>
          <span>{new Date(reply.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            mine
              ? 'bg-gradient-to-br from-forest to-forest-light text-warm-white rounded-tr-md'
              : 'bg-warm-white text-espresso shadow-soft rounded-tl-md border border-latte/30'
          )}
        >
          {reply.mentions?.length > 0 && reply.mentions.map(m => (
            <span key={m.id} className="font-medium text-forest mr-1">@{m.name} </span>
          ))}
          {reply.content}
        </div>
      </div>
    </div>
  );
}

function TopicDetailView({
  topicId,
  onBack,
}: {
  topicId: string;
  onBack: () => void;
}) {
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [reply, setReply] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const load = async () => {
      const [data, mbs] = await Promise.all([api.getTopic(topicId), api.getMembers()]);
      setTopic(data);
      setMembers(mbs);
    };
    load();
  }, [topicId]);

  if (!topic) {
    return (
      <div className="animate-slide-right flex items-center justify-center py-20">
        <div className="animate-skeleton-pulse w-32 h-6 rounded-lg" />
      </div>
    );
  }

  const submitReply = async () => {
    if (!reply.trim()) return;
    const r = await api.addReply(topicId, {
      memberId: CURRENT_MEMBER_ID,
      content: reply.trim(),
      mentionIds: mentions,
    });
    setTopic(prev => prev ? {
      ...prev,
      replyDetails: [...prev.replyDetails, r],
      repliesCount: prev.repliesCount + 1,
    } : null);
    setReply('');
    setMentions([]);
  };

  const toggleMention = (mid: string) => {
    setMentions(prev => prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid]);
  };

  return (
    <div className="animate-slide-right flex flex-col h-[600px]">
      <div className="flex items-center gap-3 pb-4 border-b border-latte/30 mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-latte/20 transition-colors text-coffee"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-serif text-xl font-bold text-espresso">{topic.title}</h3>
          <p className="text-xs text-coffee mt-0.5">由 {topic.creator.name} 发起 · {topic.replyDetails.length} 条回复</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-2 py-2">
        {topic.replyDetails.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-latte mx-auto mb-3" />
            <p className="text-coffee">暂无回复，来发表第一条观点吧</p>
          </div>
        ) : (
          topic.replyDetails.map((r, i) => (
            <div key={r.id} style={{ animationDelay: `${i * 30}ms` }}>
              <ChatBubble reply={r} mine={r.memberId === CURRENT_MEMBER_ID} />
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-latte/30 mt-2">
        {mentionOpen && (
          <div className="mb-3 p-3 rounded-card bg-warm-white border border-latte/40 animate-bubble-in">
            <p className="text-xs text-coffee mb-2">选择要 @ 的成员：</p>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMention(m.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all duration-200',
                    mentions.includes(m.id)
                      ? 'bg-forest text-warm-white'
                      : 'bg-cream text-espresso hover:bg-latte/30'
                  )}
                >
                  <img src={m.avatar} alt="" className="w-4 h-4 rounded-full" />
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMentionOpen(o => !o)}
            className={cn(
              'p-2 rounded-full transition-colors duration-200',
              mentionOpen ? 'bg-forest text-warm-white' : 'text-coffee hover:bg-latte/20'
            )}
            title="@成员"
          >
            <AtSign className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitReply())}
            placeholder="输入你的回复..."
            className="flex-1 px-4 py-2.5 rounded-full border border-latte/60 bg-warm-white text-espresso focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/20 transition-all duration-200"
          />
          <button
            onClick={submitReply}
            disabled={!reply.trim()}
            className="p-2.5 rounded-full bg-gradient-to-r from-forest to-forest-light text-warm-white shadow-soft hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TopicsSection({ bookId }: { bookId: string }) {
  const { topicId: urlTopicId } = useParams();
  const location = useLocation();
  const [topics, setTopics] = useState<(Topic & { creator: Member })[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(urlTopicId || null);

  const isTopicView = !!activeTopicId;

  useEffect(() => {
    const load = async () => {
      const data = await api.getBookTopics(bookId);
      setTopics(data);
    };
    load();
  }, [bookId]);

  useEffect(() => {
    setActiveTopicId(urlTopicId || null);
  }, [urlTopicId, location.pathname]);

  const handleCreate = async (title: string) => {
    const t = await api.createTopic(bookId, { title, creatorId: CURRENT_MEMBER_ID });
    setTopics(prev => [t, ...prev]);
  };

  const navigate = useNavigate();

  return (
    <div className="bg-warm-white rounded-card p-6 shadow-soft overflow-hidden" style={{ contain: 'layout paint' }}>
      {isTopicView ? (
        <TopicDetailView
          topicId={activeTopicId!}
          onBack={() => {
            setActiveTopicId(null);
            navigate(`/book/${bookId}`);
          }}
        />
      ) : (
        <TopicList
          bookId={bookId}
          topics={topics}
          onCreate={handleCreate}
          onOpenTopic={id => {
            setActiveTopicId(id);
            navigate(`/book/${bookId}/topic/${id}`);
          }}
        />
      )}
    </div>
  );
}
