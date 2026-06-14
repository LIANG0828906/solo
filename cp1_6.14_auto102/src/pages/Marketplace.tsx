import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { fetchSongs } from '@/api'
import type { Song } from '@/types'
import SongCard from '@/components/SongCard'
import Footer from '@/components/Footer'

const allTags = ['流行', '摇滚', '电子', '民谣', '古风', '氛围', '爵士', '嘻哈']

export default function Marketplace() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
      .finally(() => setLoading(false))
  }, [])

  const filtered = songs.filter(song => {
    const matchesSearch = !searchQuery || song.title.toLowerCase().includes(searchQuery.toLowerCase()) || song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTags = selectedTags.length === 0 || song.tags.some(t => selectedTags.includes(t))
    return matchesSearch && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-white mb-2">作品市集</h1>
          <p className="text-gray-400">发现并购买来自独立音乐人的原创作品</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索作品或音乐人..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-violet/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">筛选：</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 btn-press ${
                selectedTags.includes(tag)
                  ? 'gradient-bg text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card aspect-square animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">没有找到匹配的作品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((song, i) => (
              <div key={song.id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <SongCard song={song} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
