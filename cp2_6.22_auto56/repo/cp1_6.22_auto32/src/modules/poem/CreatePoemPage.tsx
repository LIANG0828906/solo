import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePoem } from './PoemContext';
import { useUser } from '@/modules/user/UserContext';
import { TAGS } from '@/types';
import { ArrowLeft, Check } from 'lucide-react';

const MAX_TITLE_LENGTH = 50;
const MAX_CONTENT_LENGTH = 300;
const MIN_TAGS = 1;
const MAX_TAGS = 3;

export default function CreatePoemPage() {
  const navigate = useNavigate();
  const { currentUser, isLoading: userLoading } = useUser();
  const { createPoem } = usePoem();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser && !userLoading) {
      navigate('/login');
    }
  }, [currentUser, userLoading, navigate]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_TITLE_LENGTH) {
      setTitle(value);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CONTENT_LENGTH) {
      setContent(value);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= MAX_TAGS) {
        return prev;
      }
      return [...prev, tag];
    });
  };

  const canSubmit =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    selectedTags.length >= MIN_TAGS &&
    selectedTags.length <= MAX_TAGS &&
    !submitting &&
    currentUser;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      await createPoem({
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
      });
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/explore');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const contentExceeded = content.length > MAX_CONTENT_LENGTH;

  if (userLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm border-b border-cream-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-brown-400 hover:text-brown-500 transition-colors p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-xl font-bold text-brown-500">创作</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <div className="animate-fly-in-bottom">
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="请输入标题"
              className="w-full bg-transparent border-none outline-none font-serif text-2xl text-brown-500 placeholder:text-brown-300"
            />
            <div className="text-right text-xs text-brown-300 mt-1">
              {title.length}/{MAX_TITLE_LENGTH}
            </div>
          </div>

          <div className={cn('mb-6', shake && 'animate-shake')}>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="写下你的诗句..."
              rows={10}
              className={cn(
                'w-full bg-transparent border-none outline-none font-sans text-base text-brown-500 placeholder:text-brown-300 resize-none leading-relaxed',
                'transition-colors duration-200',
                contentExceeded && 'text-red-500'
              )}
            />
            <div
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                contentExceeded ? 'bg-red-500' : 'bg-cream-200'
              )}
              style={{ width: `${Math.min((content.length / MAX_CONTENT_LENGTH) * 100, 100)}%` }}
            />
            <div
              className={cn(
                'text-right text-xs mt-1 transition-colors duration-200',
                contentExceeded ? 'text-red-500' : 'text-brown-300'
              )}
            >
              {content.length}/{MAX_CONTENT_LENGTH}
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm text-brown-400 mb-3">选择情感标签 ({selectedTags.length}/{MAX_TAGS})</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    disabled={!isSelected && selectedTags.length >= MAX_TAGS}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm transition-all duration-200 flex items-center gap-1',
                      isSelected
                        ? 'bg-primary text-white shadow-md scale-105 animate-bounce-pop'
                        : selectedTags.length >= MAX_TAGS
                        ? 'bg-cream-200 text-brown-200 cursor-not-allowed'
                        : 'bg-cream-200 text-brown-400 hover:bg-cream-300 hover:scale-105'
                    )}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">
              {error}
            </div>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-cream-200 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'w-full py-3 rounded-xl font-medium text-base transition-all duration-200 ripple-effect',
              canSubmit
                ? 'bg-primary text-white hover:bg-primary-hover active:scale-98 shadow-soft'
                : 'bg-cream-200 text-brown-300 cursor-not-allowed'
            )}
          >
            {submitting ? '发布中...' : '发布作品'}
          </button>
        </div>
      </footer>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown-500/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center animate-scale-in shadow-medium">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-serif text-xl font-bold text-brown-500 mb-2">发布成功</h3>
            <p className="text-brown-400 text-sm">正在跳转至探索页...</p>
          </div>
        </div>
      )}
    </div>
  );
}
