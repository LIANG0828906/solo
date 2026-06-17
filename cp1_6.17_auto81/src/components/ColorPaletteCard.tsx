import { useState, useRef, useEffect } from 'react';
import { Heart, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { usePaletteStore } from '../store/usePaletteStore';
import { getRelativeTime } from '../utils/colorUtils';
import type { Palette } from '../types';
import './ColorPaletteCard.css';

interface ColorPaletteCardProps {
  palette: Palette;
  index: number;
  isFiltered: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ColorPaletteCard({
  palette,
  index,
  isFiltered,
  onClick,
  onEdit,
  onDelete,
}: ColorPaletteCardProps) {
  const { currentUser, toggleVote } = usePaletteStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [voting, setVoting] = useState(false);
  const [relativeTime, setRelativeTime] = useState(getRelativeTime(palette.createdAt));
  const menuRef = useRef<HTMLDivElement>(null);

  const hasVoted = palette.voterIds.includes(currentUser.id);

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(getRelativeTime(palette.createdAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [palette.createdAt]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVoting(true);
    toggleVote(palette.id);
    setTimeout(() => setVoting(false), 200);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete();
  };

  return (
    <div
      className={`palette-card ${isFiltered ? 'filtered' : ''}`}
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      <button
        className={`vote-button ${hasVoted ? 'voted' : ''} ${voting ? 'voting' : ''}`}
        onClick={handleVote}
        aria-label={hasVoted ? '取消投票' : '投票'}
      >
        <Heart size={18} fill={hasVoted ? '#E74C3C' : 'none'} />
        <span className="vote-count">{palette.votes}</span>
      </button>

      <div className="menu-container" ref={menuRef}>
        <button className="menu-button" onClick={handleMenuClick} aria-label="菜单">
          <MoreVertical size={18} />
        </button>
        {menuOpen && (
          <div className="dropdown-menu">
            <button className="menu-item" onClick={handleEdit}>
              <Edit2 size={16} />
              <span>编辑</span>
            </button>
            <button className="menu-item delete" onClick={handleDelete}>
              <Trash2 size={16} />
              <span>删除</span>
            </button>
          </div>
        )}
      </div>

      <h3 className="palette-name">{palette.name}</h3>

      <div className="color-swatches">
        {palette.colors.map((color, i) => (
          <div
            key={i}
            className="color-swatch"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      <div className="card-footer">
        <span className="author">{palette.author}</span>
        <span className="time">{relativeTime}</span>
      </div>
    </div>
  );
}
