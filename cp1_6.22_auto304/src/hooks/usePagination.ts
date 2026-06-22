import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const shouldPaginate = totalItems > 100;

  const currentItems = useMemo(() => {
    if (!shouldPaginate) return items;
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, currentPage, pageSize, shouldPaginate]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    currentItems,
    currentPage,
    totalPages,
    totalItems,
    shouldPaginate,
    goToPage,
    nextPage,
    prevPage,
  };
}
