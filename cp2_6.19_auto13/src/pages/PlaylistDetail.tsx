import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Play,
  Trash2,
  Share2,
  Plus,
  X,
  Music,
  ChevronLeft,
} from 'lucide-react'
import { useMusicStore } from '@/store/musicStore'
import { formatTime } from '@/utils/helpers'
import { cn } from '@/lib/utils'
import { Song } from '@/types'

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    playlists,
    songs,
    playSong,
    removeSongFromPlaylist,
    addSongToPlaylist,
    sharePlaylist,
    createPlaylist,
  } = useMusicStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')
  const [shareToast, setShareToast] = useState(false)

  const playlist = playlists.find((p) => p.id === id)

  const playlistSongs = useMemo(
    () =>
      playlist
        ? playlist.songIds
            .map((sid) => songs.find((s) => s.id === sid))
            .filter((s): s is Song => s !== undefined)
        : [],
    [playlist, songs]
  )

  const coverColors = playlistSongs.slice(0, 4).map((s) => s.color)

  const availableSongs = useMemo(
    () =>
      playlist
        ? songs.filter((s) => !playlist.songIds.includes(s.id))
        : songs,
    [songs, playlist]
  )

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30">
        <Music size={48} className="mb-4" />
        <p>歌单不存在</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-[#00d4ff] hover:underline"
        >
          返回首页
        </button>
      </div>
    )
  }

  const handleShare = async () => {
    const link = sharePlaylist(playlist.id)
    if (link) {
      try {
        await navigator.clipboard.writeText(link)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = link
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    }
  }

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim())
      setNewPlaylistName('')
      setNewPlaylistDesc('')
      setShowCreateModal(false)
    }
  }

  const handleAddSong = (songId: string) => {
    if (id) {
      addSongToPlaylist(id, songId)
    }
  }

  const handleRemoveSong = (songId: string) => {
    if (id) {
      removeSongFromPlaylist(id, songId)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-white/50 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        返回
      </button>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl mx-auto md:mx-0">
          {coverColors.length >= 4 ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
              {coverColors.map((color, i) => (
                <div key={i} style={{ backgroundColor: color }} />
              ))}
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: playlist.color }}
            >
              <Music size={48} className="text-white/50" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center text-center md:text-left">
          <h1 className="text-2xl font-bold mb-2">{playlist.name}</h1>
          <p className="text-white/50 mb-3">{playlist.description}</p>
          <p className="text-sm text-white/30 mb-4">{playlistSongs.length} 首歌曲</p>
          <div className="flex gap-3 justify-center md:justify-start flex-wrap">
            <button
              onClick={() =>
                playlistSongs.length > 0 &&
                playSong(playlistSongs[0], playlistSongs)
              }
              className="flex items-center gap-2 px-5 py-2 bg-[#00d4ff] text-[#0a0e27] rounded-full font-medium text-sm hover:bg-[#00d4ff]/90 transition-colors"
            >
              <Play size={16} fill="currentColor" />
              播放全部
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 transition-colors"
            >
              <Share2 size={16} />
              分享
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 transition-colors"
            >
              <Plus size={16} />
              添加歌曲
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 transition-colors"
            >
              <Music size={16} />
              新建歌单
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-white/5">
        {playlistSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <Music size={40} className="mb-3" />
            <p>歌单暂无歌曲</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-[#00d4ff] hover:underline text-sm"
            >
              添加歌曲
            </button>
          </div>
        ) : (
          playlistSongs.map((song, index) => (
            <div
              key={song.id}
              className={cn(
                'flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5 group',
                index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
              )}
            >
              <span className="w-8 text-center text-sm text-white/30">
                {index + 1}
              </span>
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0 cursor-pointer"
                style={{ backgroundColor: song.color }}
                onClick={() => playSong(song, playlistSongs)}
              />
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => playSong(song, playlistSongs)}
              >
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-white/50 truncate">{song.artist}</p>
              </div>
              <span className="text-xs text-white/40">
                {formatTime(song.duration)}
              </span>
              <button
                onClick={() => handleRemoveSong(song.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {shareToast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#00d4ff] text-[#0a0e27] px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50 animate-fade-in">
          链接已复制到剪贴板
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1333] border border-white/10 rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold">添加歌曲</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {availableSongs.length === 0 ? (
                <p className="text-center text-white/30 py-8">所有歌曲已在歌单中</p>
              ) : (
                availableSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: song.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-white/50 truncate">
                        {song.artist}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddSong(song.id)}
                      className="text-[#00d4ff] hover:text-[#00d4ff]/80 text-sm"
                    >
                      添加
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1333] border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6">
            <h3 className="font-bold mb-4">创建新歌单</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="歌单名称"
              className="w-full px-4 py-2 mb-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-[#00d4ff]/50 transition-colors"
            />
            <textarea
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              placeholder="歌单描述（可选）"
              className="w-full px-4 py-2 mb-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-[#00d4ff]/50 resize-none h-20 transition-colors"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-white/50 hover:text-white text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-[#00d4ff] text-[#0a0e27] rounded-lg font-medium text-sm hover:bg-[#00d4ff]/90 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
