import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDebounce } from './useDebounce';

interface SearchResult<T> {
  results: T[];
  matchedIndices: number[];
  isSearching: boolean;
}

interface UseSearchOptions<T> {
  items: T[];
  searchFn: (item: T, keyword: string) => boolean;
  delay?: number;
}

export function useSearch<T>(options: UseSearchOptions<T>): SearchResult<T> & {
  keyword: string;
  setKeyword: (keyword: string) => void;
} {
  const { items, searchFn, delay = 150 } = options;

  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const searchFrameRef = useRef<number | null>(null);

  const debouncedKeyword = useDebounce(keyword, delay);

  const performSearch = useCallback(
    (searchKeyword: string) => {
      if (searchFrameRef.current) {
        cancelAnimationFrame(searchFrameRef.current);
      }

      setIsSearching(true);

      searchFrameRef.current = requestAnimationFrame(() => {
        if (!searchKeyword.trim()) {
          setMatchedIndices([]);
          setIsSearching(false);
          return;
        }

        const indices: number[] = [];
        const lowerKeyword = searchKeyword.toLowerCase();

        for (let i = 0; i < items.length; i++) {
          if (searchFn(items[i], lowerKeyword)) {
            indices.push(i);
          }
        }

        setMatchedIndices(indices);
        setIsSearching(false);
      });
    },
    [items, searchFn]
  );

  useEffect(() => {
    performSearch(debouncedKeyword);
  }, [debouncedKeyword, performSearch]);

  useEffect(() => {
    return () => {
      if (searchFrameRef.current) {
        cancelAnimationFrame(searchFrameRef.current);
      }
    };
  }, []);

  const results = useMemo(() => {
    return matchedIndices.map((index) => items[index]);
  }, [items, matchedIndices]);

  return {
    keyword,
    setKeyword,
    results,
    matchedIndices,
    isSearching,
  };
}
