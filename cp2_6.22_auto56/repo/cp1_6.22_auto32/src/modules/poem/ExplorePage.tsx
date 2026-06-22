import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePoem } from './PoemContext';
import { useUser } from '@/modules/user/UserContext';
import PoemCard from '@/components/PoemCard';
import PoemDetailModal from '@/components/PoemDetailModal';
import { TAGS, type Poem } from '@/types';

export default function ExplorePage() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { poems, loading, error, sort, selectedTag, setSort, setSelectedTag, fetchPoems, likePoem, addComment, getPoemDetail } = usePoem();
  const [key, setKey] = useState(0);
  const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPoems();
  }, [fetchPoems]);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [selectedTag, sort]);

  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag);
  };

  const handleSortChange = (newSort: 'hot' | 'latest') => {
    setSort(newSort);
  };

  const handlePoemClick = useCallback(async (poem: Poem) => {
    const detail = await getPoemDetail(poem.id);
    if (detail) {
      setSelectedPoem(detail);
      setIsModalOpen(true);
    }
  }, [getPoemDetail]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedPoem(null);
    }, 300);
  };

  const handleLike = useCallback((poemId: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    likePoem(poemId);
    
    setSelectedPoem((prev) => {
      if (!prev) return null;
      const liked = !prev.liked;
      return {
        ...prev,
        liked,
        likes: liked ? prev.likes + 1 : prev.likes - 1,
      };
    });
  }, [currentUser, likePoem, navigate]);

  const handleAddComment = useCallback(async (poemId: string, content: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const newComment = await addComment(poemId, content);
    
    setSelectedPoem((prev) => {
      if (!prev) return null;
      const comments = Array.isArray(prev.comments) ? prev.comments : [];
      return {
        ...prev,
        comments: [newComment, ...comments],
      };
    });
  }, [currentUser, addComment, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-serif text-2xl font-bold text-brown-500">探索</h1>
            <button
              onClick={() => navigate('/create')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-soft ripple-effect"
            >
              创作
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleTagClick(null)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-200',
                selectedTag === null
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-cream-200 text-brown-400 hover:bg-cream-300'
              )}
            >
              全部
            </button>
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-200',
                  selectedTag === tag
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-cream-200 text-brown-400 hover:bg-cream-300'
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-3">
            <button
              onClick={() => handleSortChange('hot')}
              className={cn(
                'text-sm font-medium transition-colors',
                sort === 'hot' ? 'text-primary' : 'text-brown-300 hover:text-brown-400'
              )}
            >
              热度
            </button>
            <button
              onClick={() => handleSortChange('latest')}
              className={cn(
                'text-sm font-medium transition-colors',
                sort === 'latest' ? 'text-primary' : 'text-brown-300 hover:text-brown-400'
              )}
            >
              最新
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-brown-400">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {poems.map((poem, index) => (
              <PoemCard 
                key={poem.id} 
                poem={poem} 
                index={index}
                onClick={() => handlePoemClick(poem)}
              />
            ))}
          </div>
        )}

        {!loading && !error && poems.length === 0 && (
          <div className="text-center py-12 text-brown-300">
            <p className="text-lg">暂无作品</p>
            <p className="text-sm mt-2">快来发布第一首诗吧</p>
          </div>
        )}
      </div>

      <PoemDetailModal
        poem={selectedPoem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLike={handleLike}
        onAddComment={handleAddComment}
      />
    </div>
  );
}
