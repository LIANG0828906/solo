import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Photo, Story, formatDate, parseMarkdown, getWeatherIcon } from './utils';

interface StoryPageProps {
  story: Story;
  photos: Photo[];
  currentPage: number;
  onPageChange: (page: number) => void;
  isPreview?: boolean;
  onDescriptionChange?: (photoId: string, content: string) => void;
}

const StoryPage: React.FC<StoryPageProps> = ({
  story,
  photos,
  currentPage,
  onPageChange,
  isPreview = false,
  onDescriptionChange
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  
  const sortedPhotos = [...photos].sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime());
  const totalPages = sortedPhotos.length;
  const isCoverPage = currentPage === 0;
  const isLastPage = currentPage === totalPages;
  
  const currentPhoto = !isCoverPage ? sortedPhotos[currentPage - 1] : null;
  const currentPageData = currentPhoto
    ? story.pages.find(p => p.photoId === currentPhoto.id)
    : null;
  
  const getDateRange = () => {
    if (sortedPhotos.length === 0) return '';
    
    const start = sortedPhotos[0].takenAt;
    const end = sortedPhotos[sortedPhotos.length - 1].takenAt;
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(start);
    }
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };
  
  const handlePageChange = (direction: 'next' | 'prev') => {
    if (isFlipping) return;
    
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    
    if (newPage < 0 || newPage > totalPages) return;
    
    setFlipDirection(direction);
    setIsFlipping(true);
    
    setTimeout(() => {
      onPageChange(newPage);
      setIsFlipping(false);
    }, 400);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentPhoto && onDescriptionChange) {
      onDescriptionChange(currentPhoto.id, e.target.value);
    }
  };
  
  const getImageStyle = (photo: Photo): React.CSSProperties => {
    const isLandscape = photo.width >= photo.height;
    const aspectRatio = isLandscape ? '16/9' : '3/4';
    const maxHeight = '400px';
    
    return {
      width: '100%',
      maxHeight,
      aspectRatio,
      objectFit: 'cover',
      borderRadius: '12px 12px 0 0',
      display: 'block'
    };
  };
  
  const pageVariants = {
    enter: (direction: 'next' | 'prev') => ({
      rotateY: direction === 'next' ? 90 : -90,
      opacity: 0,
      transition: { duration: 0 }
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeInOut' }
    },
    exit: (direction: 'next' | 'prev') => ({
      rotateY: direction === 'next' ? -90 : 90,
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeInOut' }
    })
  };
  
  const renderCoverPage = () => (
    <div style={styles.coverContainer}>
      <div
        style={{
          ...styles.coverBackground,
          background: `linear-gradient(135deg, ${story.coverColors[0]} 0%, ${story.coverColors[1]} 100%)`
        }}
      />
      <div style={styles.coverContent}>
        <h1 style={styles.coverTitle}>{story.title}</h1>
        <div style={styles.coverDateRange}>{getDateRange()}</div>
        <div style={styles.weatherContainer}>
          <span style={styles.weatherIcon}>{getWeatherIcon(story.weather)}</span>
          <span style={styles.weatherText}>
            {story.weather === 'sunny' && '晴天'}
            {story.weather === 'cloudy' && '多云'}
            {story.weather === 'rainy' && '雨天'}
          </span>
        </div>
      </div>
    </div>
  );
  
  const renderContentPage = () => {
    if (!currentPhoto) return null;
    
    return (
      <div style={styles.contentContainer}>
        <img
          src={currentPhoto.url}
          alt="Story image"
          style={getImageStyle(currentPhoto)}
        />
        <div style={styles.textContent}>
          <div style={styles.metaRow}>
            <span style={styles.metaDate}>{formatDate(currentPhoto.takenAt)}</span>
            {currentPhoto.locationName && (
              <span style={styles.metaLocation}>📍 {currentPhoto.locationName}</span>
            )}
          </div>
          
          {isPreview ? (
            <div
              style={styles.description}
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(currentPageData?.content || currentPhoto.description || '')
              }}
            />
          ) : (
            <textarea
              value={currentPageData?.content || currentPhoto.description || ''}
              onChange={handleDescriptionChange}
              placeholder="写下这张照片背后的故事..."
              style={styles.descriptionEditor}
            />
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div style={styles.wrapper}>
      <div style={styles.pageContainer}>
        <AnimatePresence mode="wait" custom={flipDirection}>
          <motion.div
            key={currentPage}
            custom={flipDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{
              ...styles.page,
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            {isCoverPage ? renderCoverPage() : renderContentPage()}
          </motion.div>
        </AnimatePresence>
        
        {currentPage > 0 && (
          <button
            onClick={() => handlePageChange('prev')}
            disabled={isFlipping || currentPage === 0}
            style={{
              ...styles.navButton,
              left: '16px'
            }}
            aria-label="上一页"
          >
            <ChevronLeft size={20} color="white" />
          </button>
        )}
        
        {currentPage < totalPages && (
          <button
            onClick={() => handlePageChange('next')}
            disabled={isFlipping || isLastPage}
            style={{
              ...styles.navButton,
              right: '16px'
            }}
            aria-label="下一页"
          >
            <ChevronRight size={20} color="white" />
          </button>
        )}
      </div>
      
      <div style={styles.pageIndicator}>
        <span style={styles.pageIndicatorText}>
          {currentPage + 1} / {totalPages + 1}
        </span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  pageContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '1100px',
    perspective: '1000px'
  },
  page: {
    width: '100%',
    minHeight: '500px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden'
  },
  coverContainer: {
    position: 'relative',
    width: '100%',
    height: '500px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  coverBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  coverContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '40px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  coverTitle: {
    fontSize: '48px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '16px',
    textShadow: '0.2px 0.2px 2px rgba(0, 0, 0, 0.3)'
  },
  coverDateRange: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '20px'
  },
  weatherContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  weatherIcon: {
    fontSize: '28px'
  },
  weatherText: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  contentContainer: {
    width: '100%'
  },
  textContent: {
    background: 'rgba(255, 255, 255, 0.85)',
    padding: '24px',
    borderRadius: '0 0 12px 12px'
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#666'
  },
  metaDate: {
    fontStyle: 'italic'
  },
  metaLocation: {
    fontWeight: '500'
  },
  description: {
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#333',
    minHeight: '100px'
  },
  descriptionEditor: {
    width: '100%',
    minHeight: '120px',
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#333',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    padding: '12px',
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#4A90D9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(74, 144, 217, 0.4)',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'all 0.2s ease',
    border: 'none'
  },
  pageIndicator: {
    marginTop: '16px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  pageIndicatorText: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500'
  }
};

export default StoryPage;
