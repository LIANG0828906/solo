import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { findBacklinks, getTagColor } from '@/utils/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Edit3, Trash2, Link2, Clock } from 'lucide-react';

export default function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cards = useStore((s) => s.cards);
  const deleteCard = useStore((s) => s.deleteCard);

  const card = useMemo(() => cards.find((c) => c.id === id), [cards, id]);

  const backlinks = useMemo(() => {
    if (!id) return [];
    return findBacklinks(id);
  }, [id, cards]);

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brown/60">
        <p className="text-lg font-medium">卡片不存在</p>
        <Link to="/" className="mt-3 text-sm text-olive hover:text-olive-light transition-colors">
          返回首页
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm('确定要删除这张卡片吗？')) {
      deleteCard(card.id);
      navigate('/');
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-brown hover:text-olive transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/card/${card.id}/edit`}
            className="flex items-center gap-1.5 text-sm text-olive hover:text-olive-light transition-colors px-3 py-1.5 rounded-lg hover:bg-beige-dark"
          >
            <Edit3 size={14} />
            编辑
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-sm text-red-500/70 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      </div>

      <article className="bg-white rounded-xl shadow-sm border border-beige-deeper/50 p-8 mb-6">
        <h1 className="font-serif text-2xl font-bold text-olive mb-4 leading-snug">
          {card.title}
        </h1>

        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-beige-deeper/50">
          <div className="flex flex-wrap gap-1.5">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: getTagColor(tag) }}
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="flex items-center gap-1 text-xs text-brown/40 ml-auto">
            <Clock size={12} />
            {new Date(card.updatedAt).toLocaleString('zh-CN')}
          </span>
        </div>

        <div className="markdown-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.content}</ReactMarkdown>
        </div>
      </article>

      {backlinks.length > 0 && (
        <section className="bg-beige-dark rounded-xl border border-beige-deeper/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={16} className="text-olive" />
            <h3 className="font-serif text-sm font-bold text-olive">双向链接</h3>
            <span className="text-xs text-brown/50">({backlinks.length})</span>
          </div>

          <div className="space-y-2">
            {backlinks.map((linked) => (
              <Link
                key={linked.id}
                to={`/card/${linked.id}`}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-beige-deeper/30 hover:border-olive/30 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-olive group-hover:text-olive-light transition-colors truncate">
                    {linked.title}
                  </h4>
                  <p className="text-xs text-brown/50 line-clamp-1 mt-0.5">
                    {linked.content.replace(/[#*_`>\[\]()\-]/g, '').slice(0, 80)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 flex-shrink-0">
                  {linked.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                      style={{ backgroundColor: getTagColor(tag) }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <ArrowLeft size={14} className="text-brown/30 -rotate-45 group-hover:text-olive transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
