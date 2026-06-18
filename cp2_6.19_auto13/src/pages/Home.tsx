import { useNavigate } from 'react-router-dom'
import { Play, Music } from 'lucide-react'
import { useMusicStore } from '@/store/musicStore'
import { formatTime } from '@/utils/helpers'
import { cn } from '@/lib/utils'
import { Song } from '@/types'

export default function Home() {
  const navigate = useNavigate()
  const { playlists, songs, playSong } = useMusicStore()

  const getPlaylistSongs = (songIds: string[]) =>
    songIds
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => s !== undefined)

  const getPlaylistColors = (songIds: string[]) => {
    const playlistSongs = getPlaylistSongs(songIds)
    return playlistSongs.slice(0, 4).map((s) => s.color)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">推荐歌单</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {playlists.map((playlist) => {
            const colors = getPlaylistColors(playlist.songIds)
            const playlistSongs = getPlaylistSongs(playlist.songIds)
            return (
              <div
                key={playlist.id}
                className="group flex-shrink-0 w-44 cursor-pointer"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-lg transition-transform duration-300 group-hover:-translate-y-2">
                  {colors.length >= 4 ? (
                    <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                      {colors.map((color, i) => (
                        <div key={i} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: playlist.color }}
                    >
                      <Music size={40} className="text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-300">
                    <Play
                      size={40}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 fill-white"
                    />
                  </div>
                </div>
                <p className="text-sm font-medium truncate">{playlist.name}</p>
                <p className="text-xs text-white/50">{playlist.songIds.length} 首歌曲</p>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">热门歌曲</h2>
        <div className="rounded-xl overflow-hidden">
          {songs.slice(0, 20).map((song, index) => (
            <div
              key={song.id}
              className={cn(
                'flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5',
                index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
              )}
              onClick={() => playSong(song, songs)}
            >
              <span
                className={cn(
                  'w-8 text-center text-sm font-bold',
                  index < 3 ? 'text-[#00d4ff]' : 'text-white/40'
                )}
              >
                {index + 1}
              </span>
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0"
                style={{ backgroundColor: song.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{song.title}</p>
                <p className="text-xs text-white/50 truncate">{song.artist}</p>
              </div>
              <span className="text-xs text-white/40">{formatTime(song.duration)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
