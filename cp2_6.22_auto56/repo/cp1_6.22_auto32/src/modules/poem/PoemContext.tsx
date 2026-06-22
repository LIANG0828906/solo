import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api } from '@/utils/api';
import type { Poem, Comment } from '@/types';

type SortType = 'hot' | 'latest';

interface PoemContextType {
  poems: Poem[];
  loading: boolean;
  error: string | null;
  sort: SortType;
  selectedTag: string | null;
  setSort: (sort: SortType) => void;
  setSelectedTag: (tag: string | null) => void;
  fetchPoems: () => Promise<void>;
  createPoem: (data: { title: string; content: string; tags: string[] }) => Promise<Poem>;
  likePoem: (id: string) => Promise<void>;
  addComment: (id: string, content: string) => Promise<Comment>;
  getPoemDetail: (id: string) => Promise<Poem | null>;
}

const PoemContext = createContext<PoemContextType | undefined>(undefined);

export function PoemProvider({ children }: { children: ReactNode }) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>('hot');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const fetchPoems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { sort?: string; tag?: string } = { sort };
      if (selectedTag) {
        params.tag = selectedTag;
      }
      const data = await api.poems.getList(params) as Poem[];
      setPoems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取作品列表失败');
    } finally {
      setLoading(false);
    }
  }, [sort, selectedTag]);

  const createPoem = useCallback(async (data: { title: string; content: string; tags: string[] }) => {
    const newPoem = await api.poems.create(data) as Poem;
    setPoems((prev) => [newPoem, ...prev]);
    return newPoem;
  }, []);

  const likePoem = useCallback(async (id: string) => {
    await api.poems.like(id);
    setPoems((prev) =>
      prev.map((poem) =>
        poem.id === id
          ? {
              ...poem,
              liked: !poem.liked,
              likes: poem.liked ? poem.likes - 1 : poem.likes + 1,
            }
          : poem
      )
    );
  }, []);

  const addComment = useCallback(async (id: string, content: string) => {
    const newComment = await api.poems.addComment(id, content) as Comment;
    setPoems((prev) =>
      prev.map((poem) =>
        poem.id === id
          ? {
              ...poem,
              comments:
                typeof poem.comments === 'number'
                  ? poem.comments + 1
                  : [...poem.comments, newComment],
            }
          : poem
      )
    );
    return newComment;
  }, []);

  const getPoemDetail = useCallback(async (id: string) => {
    try {
      const poem = await api.poems.getDetail(id) as Poem;
      setPoems((prev) => {
        const index = prev.findIndex((p) => p.id === id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = poem;
          return updated;
        }
        return [poem, ...prev];
      });
      return poem;
    } catch {
      return null;
    }
  }, []);

  return (
    <PoemContext.Provider
      value={{
        poems,
        loading,
        error,
        sort,
        selectedTag,
        setSort,
        setSelectedTag,
        fetchPoems,
        createPoem,
        likePoem,
        addComment,
        getPoemDetail,
      }}
    >
      {children}
    </PoemContext.Provider>
  );
}

export function usePoem() {
  const context = useContext(PoemContext);
  if (context === undefined) {
    throw new Error('usePoem must be used within a PoemProvider');
  }
  return context;
}
