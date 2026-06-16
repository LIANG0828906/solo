import { useState, useMemo, useEffect } from 'react';
import { useNoteStore, Note } from '@/store/noteStore';
import { COLORS, SIDEBAR_WIDTH } from '@/utils/constants';
import { Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface TimelineProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (date: number): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

const getDateGroup = (timestamp: number): 'today' | 'yesterday' | 'earlier' => {
  const now = new Date();
  const noteDate = new Date(timestamp);
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const noteDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());
  
  if (noteDay.getTime() === today.getTime()) {
    return 'today';
  } else if (noteDay.getTime() === yesterday.getTime()) {
    return 'yesterday';
  } else {
    return 'earlier';
  }
};

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery);
  
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push(
      <span
        key={index}
        style={{ backgroundColor: 'var(--color-yellow)', color: '#000' }}
      >
        {text.slice(index, index + query.length)}
      </span>
    );
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts;
};

const Timeline = ({ isOpen, onClose }: TimelineProps) => {
  const {
    notes,
    currentNoteId,
    setCurrentNote,
    createNote,
    deleteNote,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
  } = useNoteStore();

  const [searchInput, setSearchInput] = useState('');
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const [animatingNoteId, setAnimatingNoteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 200);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        debouncedSearch === '' ||
        note.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        note.content.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        note.tags.some((tag) => tag.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchesTag = selectedTag === null || note.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [notes, debouncedSearch, selectedTag]);

  const groupedNotes = useMemo(() => {
    const groups: { today: Note[]; yesterday: Note[]; earlier: Note[] } = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    const sortedNotes = [...filteredNotes].sort((a, b) => b.updatedAt - a.updatedAt);

    sortedNotes.forEach((note) => {
      const group = getDateGroup(note.updatedAt);
      groups[group].push(note);
    });

    return groups;
  }, [filteredNotes]);

  const handleNoteClick = (noteId: string) => {
    setAnimatingNoteId(noteId);
    setCurrentNote(n