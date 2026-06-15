import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Disc, Users, Calendar, Tag, FileText } from 'lucide-react'
import { fetchSongDetail } from '@/api'
import type { Song } from '@/types'
import { useMusicStore } from '@/stores/musicStore'
import AudioPlayer from '@/components/AudioPlayer'
import PurchaseModal from '@/components/PurchaseModal'
import CollabModal from '@/components/CollabModal'

interface LyricChar {
  char: string
  visible: boolean
}

interface LyricLine {
  chars: LyricChar[]
  visible: boolean
}

export default function SongDetail() {
  const { id } = useParams<{ id: string }>()
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'lyrics' | 'score'>('details')
  const [showPurchase, setShowPurchase] = useState<'digital' | 'cd' | null>(null)
  const [showCollab, setShowCollab] = useState(false)
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const { setCurrentSong, favorites, toggleFavorite } = useMusicStore()
  const typewriterRef = useRef<number>(0)

  useEffect(() => {
    if (!id) return
    fetchSongDetail(id)
      .then((s) => {
        setSong(s)
        setCurrentSong(s)
      })
      .finally(() => setLoading(false))
  }, [id])

  const resetLyrics = useMemo(() => {
    return (lyricsText: string) => {
      const lines = lyricsText.split('\n').filter(l => l.trim())
      const parsed: LyricLine[] = lines.map(line => ({
        chars: line.split('').map(char => ({ char, visible: false })),
        visible: false
      }))
      setLyricLines(parsed)
      setCurrentLineIndex(0)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'lyrics' || !song?.lyrics) return

    resetLyrics(song.lyrics)

    return () => {
      clearInterval(typewriterRef.current)
    }
  }, [activeTab, song, resetLyrics])

  useEffect(() => {
    if (activeTab !== 'lyrics' || lyricLines.length === 0) return

    let lineIdx = 0
    let charIdx = 0

    const typeNext = () => {
      if (lineIdx >= lyricLines.length) {
        clearInterval(typewriterRef.current)
        return
      }

      setLyricLines(prev => {
        const newLines = [...prev]
        const currentLine = { ...newLines[lineIdx] }
        
        if (!currentLine.visible) {
          currentLine.visible = true
          setCurrentLineIndex(lineIdx)
        }

        const newChars = [...currentLine.chars]
        if (charIdx < newChars.length) {
          newChars[charIdx] = { ...newChars[charIdx], visible: true }
          currentLine.chars = newChars
          newLines[lineIdx] = currentLine
          charIdx++
        } else {
          lineIdx++
          charIdx = 0
          if (lineIdx < newLines.length) {
            setCurrentLineIndex(lineIdx)
          }
        }

        return newLines
      })
    }

    typewriterRef.current = window.setInterval(typeNext, 60)

    return () => clearInterval(typewriterRef.current)
  }, [activeTab, lyricLines.length])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-violet border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">作品未找到</p>
          <Link to="/marketplace" className="text-brand-violet hover:underline">返回市集</Link>
        </div>
      </div>
    )
  }

  const isFav = favorites.includes(song.id)

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回市集
        </Link>

        <AudioPlayer />

        <div className="flex items-center gap-3 mb-6">
          {song.tags.map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-full bg-brand-violet/20 text-brand-purple text-xs flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={() => setShowPurchase('digital')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500/20 text-sky-300 font-medium btn-press hover:bg-sky-500/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            数字下载 ¥{song.priceDigital}
          </button>
          <button
            onClick={() => setShowPurchase('cd')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500/20 text-orange-300 font-medium btn-press hover:bg-orange-500/30 transition-colors"
          >
            <Disc className="w-4 h-4" />
            实体CD ¥{song.priceCD}
          </button>
          <button
            onClick={() => setShowCollab(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-violet/20 text-brand-purple font-medium btn-press hover:bg-brand-violet/30 transition-colors"
          >
            <Users className="w-4 h-4" />
            发起合作
          </button>
          <button
            onClick={() => toggleFavorite(song.id)}
            className={`ml-auto px-4 py-2.5 rounded-xl btn-press transition-all duration-300 ${isFav ? 'animate-heart-beat' : ''}`}
          >
            <svg className={`w-6 h-6 transition-all duration-300 ${isFav ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-400'}`} viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
          {(['details', 'lyrics', 'score'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'gradient-bg text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'details' ? '详情' : tab === 'lyrics' ? '歌词' : '乐谱'}
            </button>
          ))}
        </div>

        <div className="glass-card p-6">
          {activeTab === 'details' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-gray-300 leading-relaxed">{song.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>发布于 {new Date(song.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FileText className="w-4 h-4" />
                <span>已售 {song.purchaseCount} 份</span>
              </div>
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="space-y-4 min-h-[200px]">
              {lyricLines.map((line, lineIdx) => (
                <p
                  key={lineIdx}
                  className={`text-lg leading-relaxed transition-all duration-300 ${
                    lineIdx === currentLineIndex
                      ? 'text-gold font-medium'
                      : lineIdx < currentLineIndex
                      ? 'text-gray-300'
                      : 'text-gray-600'
                  }`}
                >
                  {line.chars.map((lc, charIdx) => (
                    <span
                      key={charIdx}
                      className={`inline-block transition-all duration-200 ${
                        lc.visible
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-2'
                      }`}
                    >
                      {lc.char}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          )}

          {activeTab === 'score' && (
            <div className="animate-fade-in">
              {song.scoreFile ? (
                <iframe
                  src={song.scoreFile}
                  className="w-full h-[600px] rounded-lg border-0"
                  title="乐谱预览"
                />
              ) : (
                <p className="text-gray-400 text-center py-8">暂无乐谱</p>
              )}
            </div>
          )}
        </div>
      </div>

      {showPurchase && song && (
        <PurchaseModal
          song={song}
          type={showPurchase}
          onClose={() => setShowPurchase(null)}
        />
      )}

      {showCollab && song && (
        <CollabModal
          song={song}
          onClose={() => setShowCollab(false)}
        />
      )}
    </div>
  )
}
