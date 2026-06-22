import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Clock, Users, ChevronRight, Star } from 'lucide-react'
import { fetchSongs } from '@/api'
import type { Song } from '@/types'
import SongCard from '@/components/SongCard'
import Footer from '@/components/Footer'

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
      .finally(() => setLoading(false))
  }, [])

  const latestSongs = [...songs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4)
  const hotSongs = [...songs].sort((a, b) => b.purchaseCount - a.purchaseCount)

  const artistMap = new Map<string, { name: string; count: number; rating: number }>()
  songs.forEach(s => {
    const existing = artistMap.get(s.artist)
    if (existing) {
      existing.count++
      existing.rating = (existing.rating + s.rating) / 2
    } else {
      artistMap.set(s.artist, { name: s.artist, count: 1, rating: s.rating })
    }
  })
  const topArtists = [...artistMap.values()].sort((a, b) => (b.count * b.rating) - (a.count * a.rating)).slice(0, 4)

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-indigo/10 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display font-extrabold text-5xl md:text-6xl mb-4 gradient-text">发现原创音乐</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">独立音乐人的展销平台，上传、展示和售卖你的原创作品</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/marketplace" className="px-6 py-3 rounded-full gradient-bg text-white font-medium btn-press hover:shadow-lg hover:shadow-brand-indigo/30 transition-all duration-300">
              浏览市集
            </Link>
            <Link to="/upload" className="px-6 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-all duration-300 btn-press">
              上传作品
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-violet" />
              <h2 className="font-display font-bold text-2xl text-white">最新上架</h2>
            </div>
            <Link to="/marketplace" className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
              查看更多 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card aspect-square animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestSongs.map((song, i) => (
                <SongCard key={song.id} song={song} index={i} />
              ))}
            </div>
          )}
        </section>

        <div className="h-px bg-gray-700/30 mb-12" />

        <section className="mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-gold" />
              <h2 className="font-display font-bold text-2xl text-white">热门排行</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotSongs.map((song, i) => (
              <Link key={song.id} to={`/song/${song.id}`} className="glass-card p-4 flex items-center gap-4 hover:bg-white/10 transition-all duration-300 group">
                <span className={`font-display font-bold text-2xl w-8 text-center ${i < 3 ? 'text-gold' : 'text-gray-500'}`}>{i + 1}</span>
                <div className="w-12 h-12 rounded-lg vinyl-placeholder flex items-center justify-center flex-shrink-0">
                  {song.coverImage ? <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover rounded-lg" /> : <span className="text-gray-500 text-lg">♪</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-white group-hover:text-brand-violet transition-colors truncate">{song.title}</h3>
                  <p className="text-sm text-gray-400">{song.artist}</p>
                </div>
                <div className="flex items-center gap-1 text-gold">
                  <Star className="w-4 h-4 fill-gold" />
                  <span className="text-sm">{song.rating}</span>
                </div>
                <span className="text-sm text-gray-400">{song.purchaseCount}次购买</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="h-px bg-gray-700/30 mb-12" />

        <section className="mb-12 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-brand-purple" />
              <h2 className="font-display font-bold text-2xl text-white">音乐人推荐</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topArtists.map((artist, i) => (
              <div key={artist.name} className="glass-card p-5 text-center hover:bg-white/10 transition-all duration-300 opacity-0 animate-fade-in-up" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-display font-bold text-xl">{artist.name.charAt(0)}</span>
                </div>
                <h3 className="font-display font-semibold text-white mb-1">{artist.name}</h3>
                <p className="text-sm text-gray-400">{artist.count} 首作品</p>
                <div className="flex items-center justify-center gap-1 mt-2 text-gold">
                  <Star className="w-3 h-3 fill-gold" />
                  <span className="text-xs">{artist.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
