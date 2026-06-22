import { useState, useEffect, useRef, useCallback } from 'react';
import type { Poem, Collection, Comment } from '../types';
import { useStore } from '../store';
import { collectionApi, portfolioApi, poemApi } from '../utils/api';
import { playClickSound, playSaveSound } from '../utils/audio';
import {
  BookOpen,
  Plus,
  Heart,
  MessageSquare,
  Send,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { v4 } from 'uuid';

interface TimelinePoem extends Poem {
  year: number;
}

function groupByYear(poems: Poem[]): Map<number, TimelinePoem[]> {
  const map = new Map<number, TimelinePoem[]>();
  poems
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach((p) => {
      const year = new Date(p.createdAt).getFullYear();
      const entry: TimelinePoem = { ...p, year };
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(entry);
    });
  return map;
}

function CollectionCard({ collection, onClick }: { collection: Collection; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="scroll-paper rounded-lg p-4 cursor-pointer line-hover-float ink-brush-shadow border border-rice-300 hover:border-bark-200 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-4 h-4 text-bark-300" />
        <h3 className="font-serif text-ink-500 text-base font-semibold truncate">
          {collection.name}
        </h3>
      </div>
      <p className="text-ink-200 text-sm mb-2 line-clamp-2">{collection.description}</p>
      <div className="flex items-center justify-between text-xs text-ink-100">
        <span>{collection.poemCount} 首</span>
        <span>{new Date(collection.createdAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  );
}

function NewCollectionForm({ onSubmit, onCancel }: { onSubmit: (name: string, description: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim(), description.trim());
    setName('');
    setDescription('');
  };

  return (
    <div className="scroll-paper rounded-lg p-4 border border-bark-200 ink-brush-shadow">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="诗集名称"
        className="w-full mb-2 px-3 py-2 bg-rice-50 border border-rice-300 rounded text-ink-500 placeholder:text-ink-100 font-serif focus:outline-none focus:border-bark-300"
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="诗集简介（可选）"
        rows={2}
        className="w-full mb-2 px-3 py-2 bg-rice-50 border border-rice-300 rounded text-ink-500 placeholder:text-ink-100 font-serif resize-none focus:outline-none focus:border-bark-300"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="px-3 py-1.5 bg-bark-300 text-rice-50 rounded text-sm font-serif hover:bg-bark-400 transition-colors"
        >
          创建
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 bg-rice-300 text-ink-300 rounded text-sm font-serif hover:bg-rice-400 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}

function YearSeparator({ year }: { year: number }) {
  return (
    <div className="flex items-center my-8">
      <div className="flex-1 h-px bg-bark-200" />
      <span className="px-4 font-serif text-bark-400 text-lg font-bold select-none">{year}</span>
      <div className="flex-1 h-px bg-bark-200" />
    </div>
  );
}

function PoemTimelineCard({
  poem,
  index,
  onExpand,
}: {
  poem: TimelinePoem;
  index: number;
  onExpand: (id: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const preview = poem.lines.slice(0, 2).map((l) => l.text).join(' / ');

  return (
    <div
      ref={cardRef}
      className={`relative flex items-start gap-4 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="hidden md:flex flex-col items-center flex-shrink-0 w-6">
        <div className="w-3 h-3 rounded-full bg-bark-300 border-2 border-rice-200 z-10" />
      </div>

      <div
        onClick={() => onExpand(poem.id)}
        className="flex-1 scroll-paper rounded-lg p-4 cursor-pointer line-hover-float ink-brush-shadow border border-rice-300 hover:border-bark-200 transition-all group"
      >
        <h4 className="font-serif text-ink-500 text-base font-semibold mb-1 group-hover:text-bark-400 transition-colors">
          {poem.title}
        </h4>
        <p className="text-ink-200 text-sm mb-3 truncate">{preview}</p>
        <div className="flex items-center gap-4 text-xs text-ink-100">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(poem.createdAt).toLocaleDateString('zh-CN')}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {poem.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {poem.commentCount}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-ink-100 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

function ExpandedPoemCard({
  poem,
  onClose,
}: {
  poem: TimelinePoem;
  onClose: () => void;
}) {
  const { currentUser, comments, addComment } = useStore();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(poem.likeCount);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>([]);

  useEffect(() => {
    const poemComments = comments.filter((c) => c.poemId === poem.id);
    setLocalComments(poemComments);
    portfolioApi.getComments(poem.id).then((res) => {
      const fetched = res.data as Comment[];
      setLocalComments(fetched);
    }).catch(() => {});
  }, [poem.id, comments]);

  const handleLike = async () => {
    playClickSound();
    if (!liked) {
      try {
        await poemApi.like(poem.id);
        setLiked(true);
        setLikeCount((c) => c + 1);
      } catch {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    playSaveSound();
    const newComment: Comment = {
      id: v4(),
      poemId: poem.id,
      userId: currentUser.id,
      userName: currentUser.name,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    addComment(newComment);
    setLocalComments((prev) => [...prev, newComment]);
    setCommentText('');
    try {
      await portfolioApi.addComment(poem.id, {
        userId: currentUser.id,
        content: newComment.content,
      });
    } catch {
      // optimistic
    }
  };

  return (
    <div className="relative scroll-paper rounded-lg p-6 ink-brush-shadow border border-bark-200 animate-fade-in-up">
      <button
        onClick={() => { playClickSound(); onClose(); }}
        className="absolute top-3 right-3 p-1 text-ink-100 hover:text-ink-300 transition-colors"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      <h3 className="font-serif text-ink-500 text-xl font-bold mb-4 pr-8">{poem.title}</h3>

      <div className="space-y-1.5 mb-4">
        {poem.lines.map((line) => (
          <p key={line.id} className="font-serif text-ink-400 text-base leading-relaxed">
            {line.text}
          </p>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-ink-200 mb-4 pb-4 border-b border-rice-300">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(poem.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-serif transition-colors ${
            liked
              ? 'bg-red-50 text-red-500 border border-red-200'
              : 'bg-rice-100 text-ink-200 border border-rice-300 hover:border-red-200 hover:text-red-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-red-500' : ''}`} />
          {likeCount}
        </button>
        <span className="flex items-center gap-1.5 text-sm text-ink-200">
          <MessageSquare className="w-4 h-4" />
          {localComments.length}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {localComments.map((c) => (
          <div key={c.id} className="bg-rice-100 rounded-lg p-3 border border-rice-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-serif text-bark-400 font-medium">{c.userName}</span>
              <span className="text-xs text-ink-100">
                {new Date(c.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <p className="text-sm text-ink-300 font-serif">{c.content}</p>
          </div>
        ))}
        {localComments.length === 0 && (
          <p className="text-sm text-ink-100 font-serif text-center py-2">暂无评论</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="写下你的评论…"
          className="flex-1 px-3 py-2 bg-rice-50 border border-rice-300 rounded text-ink-500 placeholder:text-ink-100 font-serif text-sm focus:outline-none focus:border-bark-300"
          onKeyDown={(e) => { if (e.key === 'Enter') handleComment(); }}
        />
        <button
          onClick={handleComment}
          disabled={!commentText.trim()}
          className="p-2 rounded bg-bark-300 text-rice-50 hover:bg-bark-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { collections, poems, currentUser, setCollections, addCollection, setPoems } = useStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [expandedPoemId, setExpandedPoemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [collectionsRes, timelineRes] = await Promise.all([
          collectionApi.list(),
          portfolioApi.getTimeline(currentUser.id),
        ]);
        setCollections(collectionsRes.data as Collection[]);
        setPoems(timelineRes.data as Poem[]);
      } catch {
        // use store defaults
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentUser.id, setCollections, setPoems]);

  const handleCreateCollection = async (name: string, description: string) => {
    playSaveSound();
    const newCollection: Collection = {
      id: v4(),
      userId: currentUser.id,
      name,
      description,
      poemCount: 0,
      createdAt: new Date().toISOString(),
    };
    addCollection(newCollection);
    setShowNewForm(false);
    try {
      await collectionApi.create({ name, description });
    } catch {
      // optimistic
    }
  };

  const handleSelectCollection = (id: string) => {
    playClickSound();
    setSelectedCollectionId((prev) => (prev === id ? null : id));
  };

  const filteredPoems = selectedCollectionId
    ? poems.filter((p) => p.collectionId === selectedCollectionId)
    : poems;

  const yearGroups = groupByYear(filteredPoems);

  const handleExpandPoem = (id: string) => {
    playClickSound();
    setExpandedPoemId((prev) => (prev === id ? null : id));
  };

  const expandedPoem = expandedPoemId
    ? poems.find((p) => p.id === expandedPoemId)
    : null;

  let cardIndex = 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-bark-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-6">
      <aside className="md:w-72 flex-shrink-0">
        <div className="md:sticky md:top-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-ink-500 text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-bark-300" />
              诗集列表
            </h2>
            <button
              onClick={() => { playClickSound(); setShowNewForm(!showNewForm); }}
              className="p-1.5 rounded bg-bark-300 text-rice-50 hover:bg-bark-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 -mx-1 px-1 snap-x snap-mandatory md:snap-none">
            <div
              onClick={() => handleSelectCollection('__all__')}
              className={`snap-start flex-shrink-0 md:flex-shrink scroll-paper rounded-lg p-3 cursor-pointer border transition-colors ${
                selectedCollectionId === null
                  ? 'border-bark-300 bg-bark-50'
                  : 'border-rice-300 hover:border-bark-200'
              }`}
            >
              <h3 className="font-serif text-ink-500 text-sm font-semibold">全部诗作</h3>
              <p className="text-ink-100 text-xs mt-1">{poems.length} 首</p>
            </div>

            {collections.map((c) => (
              <div
                key={c.id}
                className="snap-start flex-shrink-0 w-56 md:w-auto"
              >
                <CollectionCard
                  collection={c}
                  onClick={() => handleSelectCollection(c.id)}
                />
              </div>
            ))}
          </div>

          {showNewForm && (
            <div className="mt-3">
              <NewCollectionForm
                onSubmit={handleCreateCollection}
                onCancel={() => setShowNewForm(false)}
              />
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {expandedPoem && (
          <div className="mb-6">
            <ExpandedPoemCard
              poem={expandedPoem as TimelinePoem}
              onClose={() => setExpandedPoemId(null)}
            />
          </div>
        )}

        <div className="relative">
          <div className="hidden md:block absolute left-3 top-0 bottom-0 w-0.5 bg-bark-100" />

          {yearGroups.size === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-rice-400 mx-auto mb-3" />
              <p className="font-serif text-ink-100 text-lg">暂无诗作</p>
            </div>
          )}

          {Array.from(yearGroups.entries()).map(([year, yearPoems]) => (
            <div key={year}>
              <YearSeparator year={year} />
              <div className="space-y-4 md:pl-10">
                {yearPoems.map((poem) => {
                  if (expandedPoemId === poem.id) return null;
                  const idx = cardIndex++;
                  return (
                    <PoemTimelineCard
                      key={poem.id}
                      poem={poem}
                      index={idx}
                      onExpand={handleExpandPoem}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
