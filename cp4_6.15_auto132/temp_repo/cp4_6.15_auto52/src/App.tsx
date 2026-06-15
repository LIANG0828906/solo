import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from '@/context/LibraryContext';
import Navbar from '@/components/Navbar';
import BookList from '@/components/BookList';
import ReadingPlan from '@/components/ReadingPlan';
import ProgressBoard from '@/components/ProgressBoard';
import BookDetail from '@/components/BookDetail';

type PageType = 'books' | 'plan' | 'board';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('books');
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedBookId } = useLibrary();

  return (
    <div className="app">
      <Navbar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="main-content">
        <div className={`page ${currentPage === 'books' ? 'page-active' : 'page-inactive'}`}>
          {currentPage === 'books' && <BookList />}
        </div>
        <div className={`page ${currentPage === 'plan' ? 'page-active' : 'page-inactive'}`}>
          {currentPage === 'plan' && <ReadingPlan />}
        </div>
        <div className={`page ${currentPage === 'board' ? 'page-active' : 'page-inactive'}`}>
          {currentPage === 'board' && <ProgressBoard />}
        </div>
      </main>
      {selectedBookId && <BookDetail />}
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <AppContent />
    </LibraryProvider>
  );
}
