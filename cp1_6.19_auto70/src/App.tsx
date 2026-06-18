import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineBookOpen } from 'react-icons/hi';
import { useExcerpts } from './hooks/useExcerpts';
import { useAnnotations } from './hooks/useAnnotations';
import { useLinkage } from './hooks/useLinkage';
import { SearchBar } from './components/SearchBar';
import { TagCloud } from './components/TagCloud';
import { ExcerptCard } from './components/ExcerptCard';
import { DetailSidebar } from './components/DetailSidebar';
import { AddExcerptModal } from './components/AddExcerptModal';
import { ImageLightbox } from './components/ImageLightbox';
import type { Excerpt, SortOption } from './types';
import './index.css';

function Home() {
  const {
    excerpts,
    isLoading,
    deletingId,
    addExcerpt,
    updateExcerpt,
    deleteExcerpt,
    addImage,
    removeImage,
    sortExcerpts,
    filterByTag,
    searchExcerpts,
  } = useExcerpts();

  const annotationsHook = useAnnotations(excerpts, updateExcerpt);
  const { tagFrequencies, maxTagFrequency, getRelatedExcerpts } = useLinkage(excerpts);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [selectedExcerpt, setSelectedExcerpt] = useState<Excerpt | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExcerpt, setEditingExcerpt] = useState<Excerpt | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const processedExcerpts = useMemo(() => {
    let result = [...excerpts];
    result = searchExcerpts(result, searchQuery);
    result = filterByTag(result, selectedTag);
    result = sortExcerpts(result, sortOption);
    return result;
  }, [excerpts, searchQuery, selectedTag, sortOption, searchExcerpts, filterByTag, sortExcerpts]);

  const relatedExcerpts = useMemo(() => {
    if (!selectedExcerpt) return [];
    return getRelatedExcerpts(selectedExcerpt, 50);
  }, [selectedExcerpt, getRelatedExcerpts]);

  const handleCardClick = useCallback((excerpt: Excerpt) => {
    setSelectedExcerpt(excerpt);
    setIsSidebarOpen(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    annotationsHook.flushAll();
    setIsSidebarOpen(false);
    setTimeout(() => {
      setSelectedExcerpt(null);
    }, 400);
  }, [annotationsHook]);

  const handleEditExcerpt = useCallback(() => {
    if (selectedExcerpt) {
      setEditingExcerpt(selectedExcerpt);
      setIsModalOpen(true);
    }
  }, [selectedExcerpt]);

  const handleDeleteExcerpt = useCallback(() => {
    if (selectedExcerpt) {
      deleteExcerpt(selectedExcerpt.id);
      handleCloseSidebar();
    }
  }, [selectedExcerpt, deleteExcerpt, handleCloseSidebar]);

  const handleAnnotationChange = useCallback(
    (annotation: string) => {
      if (selectedExcerpt) {
        annotationsHook.setAnnotation(selectedExcerpt.id, annotation);
      }
    },
    [selectedExcerpt, annotationsHook]
  );

  const handleAddImage = useCallback(
    (url: string) => {
      if (selectedExcerpt) {
        addImage(selectedExcerpt.id, url);
      }
    },
    [selectedExcerpt, addImage]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      if (selectedExcerpt) {
        removeImage(selectedExcerpt.id, index);
      }
    },
    [selectedExcerpt, removeImage]
  );

  const handleImageClick = useCallback((url: string) => {
    setLightboxImage(url);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxImage(null);
  }, []);

  const handleRelatedClick = useCallback((excerpt: Excerpt) => {
    annotationsHook.flushAll();
    setSelectedExcerpt(excerpt);
  }, [annotationsHook]);

  const handleModalSubmit = useCallback(
    (data: {
      bookTitle: string;
      author: string;
      content: string;
      annotation: string;
      category: any;
    }) => {
      if (editingExcerpt) {
        updateExcerpt(editingExcerpt.id, data);
        if (selectedExcerpt?.id === editingExcerpt.id) {
          const updated = excerpts.find((e) => e.id === editingExcerpt.id);
          if (updated) setSelectedExcerpt({ ...updated, ...data });
        }
      } else {
        addExcerpt(data);
      }
      setEditingExcerpt(null);
    },
    [editingExcerpt, addExcerpt, updateExcerpt, selectedExcerpt, excerpts]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingExcerpt(null);
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setEditingExcerpt(null);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (selectedExcerpt) {
      const latest = excerpts.find((e) => e.id === selectedExcerpt.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedExcerpt)) {
        setSelectedExcerpt(latest);
      }
    }
  }, [excerpts, selectedExcerpt]);

  const BookIcon = () => (
    <svg
      className="empty-state__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h6" />
      <path d="M9 11h4" />
    </svg>
  );

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
            padding: '10px 16px',
          },
        }}
      />

      <nav className="navbar">
        <div className="navbar__logo">书摘阁</div>
        <div className="navbar__search">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <div className="navbar__actions">
          <select
            className="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="newest">最新添加</option>
            <option value="oldest">最早添加</option>
            <option value="title">按书名排序</option>
          </select>
        </div>
      </nav>

      <main className="main-content">
        <div className="tag-cloud-section">
          <div className="tag-cloud-section__title">
            <HiOutlineBookOpen style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
            主题标签
          </div>
          <TagCloud
            tags={tagFrequencies}
            maxCount={maxTagFrequency}
            selectedTag={selectedTag}
            onSelect={setSelectedTag}
          />
        </div>

        {!isLoading && processedExcerpts.length === 0 ? (
          <div className="empty-state">
            <BookIcon />
            <p className="empty-state__text">
              {searchQuery || selectedTag ? '未找到匹配摘录' : '暂无书摘，点击右下角按钮开始添加'}
            </p>
          </div>
        ) : (
          <div className="masonry">
            {processedExcerpts.map((excerpt) => (
              <div key={excerpt.id} className="masonry__item">
                <ExcerptCard
                  excerpt={excerpt}
                  onClick={() => handleCardClick(excerpt)}
                  isDeleting={deletingId === excerpt.id}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <button className="fab" onClick={handleOpenAddModal} aria-label="添加书摘">
        <HiOutlinePlus size={28} />
      </button>

      <DetailSidebar
        excerpt={selectedExcerpt}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onEdit={handleEditExcerpt}
        onDelete={handleDeleteExcerpt}
        onAnnotationChange={handleAnnotationChange}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
        onImageClick={handleImageClick}
        relatedExcerpts={relatedExcerpts}
        onRelatedClick={handleRelatedClick}
        isDeleting={deletingId === selectedExcerpt?.id}
      />

      <AddExcerptModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        editingExcerpt={editingExcerpt}
      />

      <ImageLightbox imageUrl={lightboxImage} onClose={handleCloseLightbox} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
