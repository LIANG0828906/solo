import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Check } from 'lucide-react';
import { searchSongs } from '@/services/apiService';
import { usePlaylistStore } from '@/stores/playlistStore';
import { usePlayerStore } from '@/stores/playerStore';
import { debounce } from '@/utils/throttle';
import type { Song } from '@/services/apiService';

export default function SearchPanel() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [show, setShow] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const { currentPlaylistId, playlists, addSong } = usePlaylistStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = debounce(async (kw: string) => {
    if (!kw.trim()) {
      setResults([]);
      setShow(false);
      return;
    }
    const songs = await searchSongs(kw);
    setResults(songs);
    setShow(true);
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    doSearch(val);
  };

  const handleAdd = async (songId: string) => {
    if (!currentPlaylistId) return;
    setAdding(songId);
    await addSong(currentPlaylistId, songId);
    setTimeout(() => setAdding(null), 300);
  };

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);

  const handleClickOutside = (e: MouseEvent) => {
    const panel = document.querySelector('.search-panel');
    if (panel && !panel.contains(e.target as Node)) {
      setShow(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-panel">
      <div className="search-input-wrap">
        <Search size={16} className="search-icon" />
        <input
          ref={inputRef}
          className="search-input"
          placeholder="搜索歌曲、歌手..."
          value={keyword}
          onChange={handleChange}
          onFocus={() => keyword && results.length > 0 && setShow(true)}
        />
        {keyword && (
          <button className="search-clear" onClick={() => { setKeyword(''); setResults([]); setShow(false); }}>
            <X size={14} />
          </button>
        )}
      </div>

      {show && (
        <div className="search-dropdown fade-in">
          {results.length === 0 ? (
            <div className="search-empty">未找到相关歌曲</div>
          ) : (
            results.map((s) => {
              const isInPlaylist = currentPlaylist?.songs.some((ps) => ps.id === s.id);
              const isAdding = adding === s.id;
              return (
                <div key={s.id} className="search-result-item">
                  <img src={s.cover} alt={s.name} className="search-result-cover" />
                  <div className="search-result-info">
                    <span className="search-result-name">{s.name}</span>
                    <span className="search-result-artist">{s.artist}</span>
                  </div>
                  <button
                    className={`search-add-btn ripple-effect ${isAdding ? 'adding' : ''} ${isInPlaylist ? 'added' : ''}`}
                    onClick={() => !isInPlaylist && handleAdd(s.id)}
                    disabled={!currentPlaylistId || isInPlaylist}
                    title={!currentPlaylistId ? '请先选择歌单' : isInPlaylist ? '已在歌单中' : '添加到当前歌单'}
                  >
                    {isAdding ? <Check size={14} /> : isInPlaylist ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
