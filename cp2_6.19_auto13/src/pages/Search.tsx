import { useState } from 'react'
import { Search as SearchIcon, Music } from 'lucide-react'
import { useMusicStore } from '@/store/musicStore'
import { formatTime } from '@/utils/helpers'

export default function Search() {
  const [keyword, setKeyword] = useState('')
  const { searchResults, searchSongs, playSong } = useMusicStore()

  const handleInputChange = (value: string) => {
    setKeyword(value)
    searchSongs(value)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="relative mb-6">
        <SearchIcon
          size={20}
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
            keyword ? 'text-[#00d4ff]' : 'text-white/40'
          }`}
        />
        <input
          type="text"
          value={keyword}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="搜索歌曲、歌手、专辑..."
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/30 outline-none focus:border-[#00d4ff]/50 focus:bg-white/[0.08] transition-colors"
        />
      </div>

      {keyword && searchResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <Music size={48} className="mb-4" />
          <p>没有找到相关歌曲</p>
        </div>
      ) : !keyword ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <SearchIcon size={48} className="mb-4" />
          <p>输入关键词搜索歌曲</p>
        </div>
      ) : (
        <div className="space-y-2">
          {searchResults.map((song) => (
            <div
              key={song.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 cursor-pointer transition-colors"
              onClick={() => playSong(song, searchResults)}
            >
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0"
                style={{ backgroundColor: song.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{song.title}</p>
                <p className="text-sm text-white/50 truncate">{song.artist}</p>
              </div>
              <span className="text-sm text-white/40">{formatTime(song.duration)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
