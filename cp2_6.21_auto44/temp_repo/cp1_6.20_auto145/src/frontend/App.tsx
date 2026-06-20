import React, { useState, useCallback, useEffect } from 'react';
import SearchBar from './components/SearchBar.js';
import Sidebar from './components/Sidebar.js';
import PoemCard from './components/PoemCard.js';
import DetailPanel from './components/DetailPanel.js';
import type { Poem, ImageMatchResult, SearchResponse, DetailResponse, StyleCategory } from '@/shared/types';

type SearchResult = Poem & { thumbnail: ImageMatchResult };

const App: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleCategory>('全部');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [detailPoem, setDetailPoem] = useState<Poem | null>(null);
  const [detailImage, setDetailImage] = useState<ImageMatchResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [listKey, setListKey] = useState(0);
  const [currentKeyword, setCurrentKeyword] = useState('');

  const fetchPoems = useCallback(async (
    keyword: string,
    style: StyleCategory,
    order: 'asc' | 'desc'
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        keyword,
        ...(style !== '全部' && { style }),
        sortOrder: order,
      });
      
      const response = await fetch(`/api/poems/search?${params.toString()}`);
      const data: SearchResponse = await response.json();
      
      setSearchResults(data.poems);
      setTotalCount(data.total);
      setListKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching poems:', error);
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/poems/detail/${id}`);
      const data: DetailResponse = await response.json();
      
      setDetailPoem(data.poem);
      setDetailImage(data.fullImage);
      setIsDetailOpen(true);
    } catch (error) {
      console.error('Error fetching detail:', error);
    }
  }, []);

  const handleSearch = useCallback((keyword: string) => {
    setCurrentKeyword(keyword);
    fetchPoems(keyword, selectedStyle, sortOrder);
  }, [fetchPoems, selectedStyle, sortOrder]);

  const handleStyleChange = useCallback((style: StyleCategory) => {
    setSelectedStyle(style);
    fetchPoems(currentKeyword, style, sortOrder);
  }, [fetchPoems, currentKeyword, sortOrder]);

  const handleSortOrderChange = useCallback((order: 'asc' | 'desc') => {
    setSortOrder(order);
    fetchPoems(currentKeyword, selectedStyle, order);
  }, [fetchPoems, currentKeyword, selectedStyle]);

  const handleCardClick = useCallback((poem: SearchResult) => {
    setSelectedPoemId(poem.id);
    fetchDetail(poem.id);
  }, [fetchDetail]);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedPoemId(null);
    setTimeout(() => {
      setDetailPoem(null);
      setDetailImage(null);
    }, 300);
  }, []);

  useEffect(() => {
    fetchPoems('', '全部', 'asc');
  }, [fetchPoems]);

  return (
    <div className="h-screen w-full flex bg-[#f5f0e8] overflow-hidden">
      <Sidebar
        selectedStyle={selectedStyle}
        onStyleChange={handleStyleChange}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
      />
      
      <main
        className={`flex-1 h-full overflow-y-auto transition-all duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)]`}
        style={{
          marginRight: isDetailOpen ? '50%' : '0',
          willChange: 'margin',
        }}
      >
        <div className="p-8">
          <header className="text-center mb-8">
            <h1 className="font-fangsong text-4xl font-bold text-[#2c2c2c] mb-2">
              古诗词意境配图
            </h1>
            <p className="text-[#5c5c5c] font-kaiti text-lg">
              检索千年诗韵，匹配意境配图
            </p>
          </header>

          <SearchBar onSearch={handleSearch} isLoading={isLoading} />

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[#5c5c5c]">
              {isLoading ? '正在检索...' : `共找到 ${totalCount} 首诗词`}
            </p>
            {(selectedStyle !== '全部' || currentKeyword) && (
              <p className="text-sm text-[#8b6f47]">
                {currentKeyword && `关键词: "${currentKeyword}"`}
                {currentKeyword && selectedStyle !== '全部' && ' · '}
                {selectedStyle !== '全部' && `风格: ${selectedStyle}`}
              </p>
            )}
          </div>

          {searchResults.length > 0 ? (
            <div
              key={listKey}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in"
            >
              {searchResults.map((poem) => (
                <PoemCard
                  key={poem.id}
                  poem={poem}
                  onClick={() => handleCardClick(poem)}
                  isSelected={selectedPoemId === poem.id}
                />
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4 opacity-30">📜</div>
                <p className="text-[#5c5c5c] font-kaiti text-lg">
                  未找到相关诗词，请尝试其他关键词
                </p>
              </div>
            )
          )}
        </div>
      </main>

      <DetailPanel
        poem={detailPoem}
        image={detailImage}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default App;
