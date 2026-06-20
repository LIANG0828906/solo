import { useState, useRef, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Song } from '../types'
import { playSongPreview } from '../utils/audioEngine'
import { generateMockSongs } from '../data/mockData'

interface DataInputProps {
  onSongsLoaded: (songs: Song[]) => void
  onNext: () => void
}

export default function DataInput({ onSongsLoaded, onNext }: DataInputProps) {
  const [songs, setSongs] = useState<Song[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [manualSong, setManualSong] = useState({ name: '', artist: '' })
  const [playingId, setPlayingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioStopRef = useRef<{ stop: () => void } | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const mockSongs = generateMockSongs()
      setSongs(mockSongs)
      onSongsLoaded(mockSongs)
    }
  }, [onSongsLoaded])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      parseFile(files[0])
    }
  }, [])

  const parseFile = (file: File) => {
    const validTypes = ['text/plain', 'application/json']
    const validExtensions = ['.txt', '.json']
    const fileName = file.name.toLowerCase()
    
    const isValid = validTypes.includes(file.type) || 
      validExtensions.some(ext => fileName.endsWith(ext))
    
    if (!isValid) {
      alert('请上传 TXT 或 JSON 格式的文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      
      if (fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content)
          const parsedSongs = parseSongData(parsed)
          if (parsedSongs.length > 0) {
            setSongs(parsedSongs)
            onSongsLoaded(parsedSongs)
          }
        } catch {
          alert('JSON 文件格式不正确')
        }
      } else {
        const parsedSongs = parseTxtContent(content)
        if (parsedSongs.length > 0) {
          setSongs(parsedSongs)
          onSongsLoaded(parsedSongs)
        }
      }
    }
    reader.readAsText(file)
  }

  const parseSongData = (data: any): Song[] => {
    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        id: uuidv4(),
        name: item.name || item.title || `歌曲 ${index + 1}`,
        artist: item.artist || '未知艺术家',
        album: item.album || '未知专辑',
        playCount: item.playCount || item.plays || Math.floor(Math.random() * 100) + 10,
        duration: item.duration || 180,
        genres: item.genres || ['Pop'],
        lyrics: item.lyrics || '暂无歌词',
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      }))
    }
    return []
  }

  const parseTxtContent = (content: string): Song[] => {
    const lines = content.split('\n').filter(line => line.trim())
    const parsedSongs: Song[] = []

    lines.forEach((line, index) => {
      const parts = line.split(/[-\t,]/).map(s => s.trim())
      if (parts.length >= 2) {
        parsedSongs.push({
          id: uuidv4(),
          name: parts[0] || `歌曲 ${index + 1}`,
          artist: parts[1] || '未知艺术家',
          album: parts[2] || '未知专辑',
          playCount: Math.floor(Math.random() * 100) + 10,
          duration: 180 + Math.floor(Math.random() * 120),
          genres: ['Pop', 'Rock'].slice(0, 1 + Math.floor(Math.random() * 2)),
          lyrics: '音乐是灵魂的语言 每一个音符都是心跳的节奏',
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        })
      }
    })

    return parsedSongs
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      parseFile(files[0])
    }
  }

  const handleAddSong = () => {
    if (!manualSong.name.trim()) return

    const newSong: Song = {
      id: uuidv4(),
      name: manualSong.name,
      artist: manualSong.artist || '未知艺术家',
      album: '手动添加',
      playCount: Math.floor(Math.random() * 50) + 10,
      duration: 180 + Math.floor(Math.random() * 120),
      genres: ['Pop'],
      lyrics: '音乐是灵魂的语言 每一个音符都是心跳的节奏',
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }

    const newSongs = [...songs, newSong]
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10)
    
    setSongs(newSongs)
    onSongsLoaded(newSongs)
    setManualSong({ name: '', artist: '' })
  }

  const handlePlaySong = (song: Song) => {
    if (audioStopRef.current) {
      audioStopRef.current.stop()
    }

    if (playingId === song.id) {
      setPlayingId(null)
      audioStopRef.current = null
      return
    }

    audioStopRef.current = playSongPreview(song.id)
    setPlayingId(song.id)

    setTimeout(() => {
      setPlayingId(null)
      audioStopRef.current = null
    }, 15000)
  }

  const topSongs = songs.slice(0, 10)

  return (
    <div className="data-input-page">
      <div className="page-content">
        <div className="upload-section">
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">🎵</div>
            <h3>上传歌单数据</h3>
            <p>拖拽 TXT / JSON 文件到此处，或点击选择文件</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,text/plain,application/json"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          <div className="manual-input">
            <h4>或手动添加歌曲</h4>
            <div className="input-row">
              <input
                type="text"
                placeholder="歌曲名"
                value={manualSong.name}
                onChange={(e) => setManualSong({ ...manualSong, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="歌手名"
                value={manualSong.artist}
                onChange={(e) => setManualSong({ ...manualSong, artist: e.target.value })}
              />
              <button className="add-btn" onClick={handleAddSong}>
                添加
              </button>
            </div>
          </div>
        </div>

        {topSongs.length > 0 && (
          <div className="songs-section">
            <h2 className="section-title">
              <span>Top 10 歌曲</span>
              <span className="song-count">{topSongs.length} 首</span>
            </h2>
            
            <div className="songs-masonry">
              {topSongs.map((song, index) => (
                <div
                  key={song.id}
                  className={`song-card ${playingId === song.id ? 'playing' : ''}`}
                  onClick={() => handlePlaySong(song)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="album-color"
                    style={{ background: `linear-gradient(135deg, ${song.color}, ${song.color}88)` }}
                  >
                    <span className="rank">{index + 1}</span>
                  </div>
                  <div className="song-info">
                    <h3 className="song-name">{song.name}</h3>
                    <p className="song-artist">{song.artist}</p>
                    <div className="song-meta">
                      <span>{song.playCount} 次播放</span>
                    </div>
                  </div>
                  <div className="play-indicator">
                    {playingId === song.id ? (
                      <div className="playing-bars">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <span className="play-icon">▶</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="next-btn" onClick={onNext}>
              生成海报
              <span className="btn-arrow">→</span>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .data-input-page {
          min-height: 100vh;
          padding: 20px;
          color: #fff;
        }

        .page-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .upload-section {
          margin-bottom: 40px;
        }

        .upload-zone {
          border: 2px dashed rgba(162, 155, 254, 0.4);
          border-radius: 16px;
          padding: 60px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.03);
        }

        .upload-zone:hover,
        .upload-zone.dragging {
          border-color: #a29bfe;
          background: rgba(108, 92, 231, 0.15);
          transform: scale(1.01);
          box-shadow: 0 0 40px rgba(108, 92, 231, 0.3);
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .upload-zone h3 {
          margin: 0 0 8px;
          font-size: 20px;
          color: #fff;
        }

        .upload-zone p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .manual-input {
          margin-top: 24px;
        }

        .manual-input h4 {
          margin: 0 0 12px;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
        }

        .input-row {
          display: flex;
          gap: 12px;
        }

        .input-row input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
        }

        .input-row input:focus {
          border-color: #6c5ce7;
          background: rgba(108, 92, 231, 0.1);
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.2);
        }

        .input-row input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .add-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: #6c5ce7;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-btn:hover {
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(108, 92, 231, 0.4);
        }

        .add-btn:active {
          transform: scale(0.95);
          box-shadow: 0 2px 10px rgba(108, 92, 231, 0.3);
        }

        .songs-section {
          margin-top: 40px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 0 24px;
          font-size: 24px;
          font-weight: 700;
        }

        .song-count {
          font-size: 14px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
        }

        .songs-masonry {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .song-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: scale(0.8);
          animation: cardAppear 0.5s ease-out forwards;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        @keyframes cardAppear {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .song-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          border-color: rgba(162, 155, 254, 0.3);
        }

        .song-card.playing {
          background: linear-gradient(135deg, rgba(108, 92, 231, 0.3), rgba(162, 155, 254, 0.2));
          border-color: #6c5ce7;
        }

        .album-color {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .rank {
          font-size: 20px;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .song-info {
          flex: 1;
          min-width: 0;
        }

        .song-name {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .song-artist {
          margin: 0 0 4px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .song-meta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        .play-indicator {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .song-card:hover .play-indicator {
          background: #6c5ce7;
        }

        .play-icon {
          font-size: 12px;
          color: #fff;
        }

        .playing-bars {
          display: flex;
          align-items: flex-end;
          gap: 3px;
          height: 16px;
        }

        .playing-bars span {
          width: 3px;
          background: #fff;
          border-radius: 2px;
          animation: playBar 0.8s ease-in-out infinite;
        }

        .playing-bars span:nth-child(1) {
          animation-delay: 0s;
          height: 40%;
        }

        .playing-bars span:nth-child(2) {
          animation-delay: 0.2s;
          height: 70%;
        }

        .playing-bars span:nth-child(3) {
          animation-delay: 0.4s;
          height: 50%;
        }

        @keyframes playBar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }

        .next-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 400px;
          margin: 40px auto 0;
          padding: 18px 32px;
          border: none;
          border-radius: 12px;
          background: #6c5ce7;
          color: #fff;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .next-btn:hover {
          background: linear-gradient(135deg, #6c5ce7, #a29bfe);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(108, 92, 231, 0.5);
        }

        .next-btn:active {
          transform: scale(0.95);
          box-shadow: 0 4px 15px rgba(108, 92, 231, 0.4);
        }

        .btn-arrow {
          transition: transform 0.3s ease;
        }

        .next-btn:hover .btn-arrow {
          transform: translateX(4px);
        }

        @media (max-width: 1024px) {
          .songs-masonry {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .input-row {
            flex-direction: column;
          }

          .songs-masonry {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
