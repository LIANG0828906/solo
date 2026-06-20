import { useEffect, useState } from 'react';
import axios from 'axios';
import { SavedPattern } from '@/types/pattern';
import { usePatternStore } from '@/store/patternStore';
import { Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function PatternGallery() {
  const { savedPatterns, setSavedPatterns, removeSavedPattern, loadPatternParams, isGalleryOpen, toggleGallery } = usePatternStore();
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/patterns');
      setSavedPatterns(response.data.patterns || []);
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/patterns/${id}`);
      removeSavedPattern(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete pattern:', error);
    }
  };

  const handleLoad = (pattern: SavedPattern) => {
    loadPatternParams(pattern);
  };

  if (!isGalleryOpen) {
    return (
      <button
        onClick={toggleGallery}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30
                   bg-[#1a1a2e] border border-b-0 border-gray-700 rounded-t-lg
                   px-6 py-2 text-gray-400 hover:text-indigo-400 hover:border-indigo-400
                   transition-all duration-300 hover:pt-3
                   flex items-center gap-2"
        aria-label="展开图案列表"
      >
        <ChevronUp className="w-4 h-4" />
        <span className="text-sm">图案库 ({savedPatterns.length})</span>
      </button>
    );
  }

  return (
    <div className="h-36 bg-[#1a1a2e]/95 backdrop-blur-sm border-t border-gray-800 
                    flex flex-col shadow-2xl z-20 transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-200">已保存图案</h3>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {savedPatterns.length}
          </span>
        </div>
        <button
          onClick={toggleGallery}
          className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-gray-200
                     transition-colors duration-200"
          aria-label="收起列表"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 custom-scrollbar-x">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        ) : savedPatterns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            暂无保存的图案，点击保存按钮添加
          </div>
        ) : (
          <div className="flex gap-2 h-full">
            {savedPatterns.map((pattern) => (
              <div
                key={pattern.id}
                className="relative flex-shrink-0 group"
              >
                <button
                  onClick={() => handleLoad(pattern)}
                  className="h-20 w-20 rounded-lg overflow-hidden
                             border-2 border-gray-700 hover:border-indigo-500
                             transition-all duration-300 ease-out
                             hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title={`点击加载 - ${new Date(pattern.createdAt).toLocaleString()}`}
                >
                  <img
                    src={pattern.thumbnailUrl}
                    alt="图案缩略图"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(pattern.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6
                             bg-gray-600 hover:bg-red-500
                             rounded-full flex items-center justify-center
                             text-white opacity-0 group-hover:opacity-100
                             transition-all duration-200
                             hover:rotate-12 shadow-md"
                  aria-label="删除图案"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {deleteConfirm === pattern.id && (
                  <div className="absolute inset-0 bg-black/80 rounded-lg
                                  flex flex-col items-center justify-center gap-2
                                  z-10 backdrop-blur-sm">
                    <p className="text-xs text-white">确认删除？</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(pattern.id)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white
                                   text-xs rounded transition-colors"
                      >
                        删除
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white
                                   text-xs rounded transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
