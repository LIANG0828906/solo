import { useEffect, useRef, useCallback } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { NoteCard } from './NoteCard';

export const Timeline = () => {
  const { notes, loading, hasMore, fetchInitialNotes, loadMoreNotes } = useNotesStore();
  const observerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialNotes();
  }, [fetchInitialNotes]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        loadMoreNotes();
      }
    },
    [hasMore, loading, loadMoreNotes]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: scrollContainerRef.current,
      threshold: 0.1,
    });
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [handleObserver, notes.length]);

  return (
    <div
      ref={scrollContainerRef}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(180deg, var(--accent) 0%, var(--card-border) 100%)',
            transform: 'translateX(-50%)',
            borderRadius: '1px',
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px 0',
            position: 'relative',
          }}
        >
          {notes.map((note, index) => (
            <NoteCard key={note.id} note={note} index={index} />
          ))}
        </div>

        <div ref={observerRef} style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gridColumn: '1 / -1' }}>
          {loading && (
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid var(--card-border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 800ms linear infinite',
              }}
            />
          )}
          {!hasMore && notes.length > 0 && (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              已经到底啦 ~
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
