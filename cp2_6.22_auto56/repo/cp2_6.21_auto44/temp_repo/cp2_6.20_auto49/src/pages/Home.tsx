import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useNoteStore } from '@/store/noteStore';
import NoteCard from '@/components/NoteCard';
import type { Tag } from '@/types';

const tagCategories: { id: Tag['category'] | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'tech', label: '科技' },
  { id: 'life', label: '生活' },
  { id: 'study', label: '学习' },
];

export default function Home() {
  const navigate = useNavigate();
  const { notes, fetchNotes, loading } = useNoteStore();
  const [selectedCategory, setSelectedCategory] = useState<Tag['category'] | 'all'>('all');

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = selectedCategory === 'all'
    ? notes
    : notes.filter((note) => note.tags.some((tag) => tag.category === selectedCategory));

  return (
    <div className="min-h-screen p-6 md:p-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Leaf className="text-garden-teal" size={36} />
          <h1 className="font-sans font-bold text-4xl md:text-5xl text-gray-800">数字花园</h1>
        </div>
        <p className="font-serif text-gray-500 text-lg">探索你的知识网络</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {tagCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-garden-teal text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">加载中...</div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-garden-warm flex items-center justify-center">
            <Leaf className="text-garden-teal/50" size={40} />
          </div>
          <h3 className="font-sans font-medium text-gray-700 mb-2">还没有笔记</h3>
          <p className="font-serif text-gray-500">点击右下角 + 按钮创建你的第一篇笔记</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => navigate(`/editor/${note.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
