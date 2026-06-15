import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useGalleryStore } from '@/store/useGalleryStore';
import GalleryCard from './GalleryCard';

export default function Gallery() {
  const { posts, loadPosts } = useGalleryStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q)
    );
  }, [posts, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 px-3.5 py-2 text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-110 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <span className="text-sm font-semibold">编辑器</span>
          </Link>

          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            广场
          </h1>

          <div className="ml-auto relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="搜索标题或作者..."
              className="w-64 rounded-2xl border border-white/60 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 shadow-sm backdrop-blur-md transition-all duration-200 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {filteredPosts.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="max-w-sm text-center text-base text-gray-600">
              还没有作品，去编辑器创作你的第一张海报吧
            </p>
            <Link
              to="/"
              className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 active:scale-95"
            >
              开始创作
            </Link>
          </div>
        ) : (
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [column-fill:_balance]">
            {filteredPosts.map((post) => (
              <div key={post.id} className="break-inside-avoid">
                <GalleryCard
                  post={post}
                  onClick={() => navigate(`/post/${post.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
