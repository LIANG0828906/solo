import { useState } from 'react'
import { useStore, GENRE_LABELS, type MusicGenre, type Artist, type Song } from '@/store'
import { parseAudio, formatDuration } from '@/utils/audio'
import { getInitials, exportToJson } from '@/utils/storage'

const containerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: '32px 24px',
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#1E1E1E',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
}

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#EAEAEA',
  marginBottom: '24px',
}

const subTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 500,
  color: '#EAEAEA',
  marginBottom: '16px',
}

const formGroupStyle: React.CSSProperties = {
  marginBottom: '20px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  color: '#CCC',
  marginBottom: '8px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#2A2A2A',
  border: '1px solid #3D3D3D',
  borderRadius: '8px',
  color: '#EAEAEA',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box' as const,
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
  fontFamily: 'inherit',
}

const avatarPreviewStyle = (color: string): React.CSSProperties => ({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '32px',
  fontWeight: 600,
  margin: '0 auto 16px',
})

const genresContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
}

const genreTagStyle = (selected: boolean): React.CSSProperties => ({
  padding: '8px 20px',
  borderRadius: '999px',
  backgroundColor: selected ? '#FF6B6B' : '#3D3D3D',
  color: '#E0E0E0',
  fontSize: '14px',
  cursor: 'pointer',
  border: 'none',
  transition: 'background-color 0.2s ease',
})

const buttonStyle: React.CSSProperties = {
  padding: '12px 32px',
  backgroundColor: '#FF6B6B',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
}

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: 'transparent',
  border: '1px solid #3D3D3D',
  color: '#CCC',
}

const songItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '16px',
  backgroundColor: '#252525',
  borderRadius: '8px',
  marginBottom: '12px',
}

const songCoverStyle = (color: string): React.CSSProperties => ({
  width: '60px',
  height: '60px',
  borderRadius: '8px',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

const musicIconStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  opacity: 0.6,
}

const songInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const songTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 500,
  color: '#EAEAEA',
  marginBottom: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const songNoteStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#888',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const deleteButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#FF4757',
  cursor: 'pointer',
  padding: '8px',
  fontSize: '18px',
}

const uploadAreaStyle: React.CSSProperties = {
  border: '2px dashed #3D3D3D',
  borderRadius: '8px',
  padding: '32px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease',
  marginBottom: '16px',
}

const uploadTextStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '14px',
}

const fileInputStyle: React.CSSProperties = {
  display: 'none',
}

const songFormStyle: React.CSSProperties = {
  backgroundColor: '#252525',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
}

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: '16px',
}

const charCountStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  textAlign: 'right',
  marginTop: '4px',
}

const errorStyle: React.CSSProperties = {
  color: '#FF4757',
  fontSize: '13px',
  marginTop: '8px',
}

const exportButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  width: '100%',
  marginTop: '16px',
}

const musicNoteSVG = (
  <svg style={musicIconStyle} viewBox="0 0 24 24" fill="none" stroke="#EAEAEA" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

export function PortfolioForm() {
  const { artists, songs, createArtist, updateArtist, addSong, deleteSong, getSongsByArtist, exportData, importData } = useStore()
  const [currentArtist, setCurrentArtist] = useState<Artist | null>(artists[0] || null)
  const [name, setName] = useState(currentArtist?.name || '')
  const [bio, setBio] = useState(currentArtist?.bio || '')
  const [genres, setGenres] = useState<MusicGenre[]>(currentArtist?.genres || [])
  const [showSongForm, setShowSongForm] = useState(false)
  const [songTitle, setSongTitle] = useState('')
  const [songNote, setSongNote] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const artistSongs = currentArtist ? getSongsByArtist(currentArtist.id) : []

  const toggleGenre = (genre: MusicGenre) => {
    if (genres.includes(genre)) {
      setGenres(genres.filter((g) => g !== genre))
    } else if (genres.length < 3) {
      setGenres([...genres, genre])
    }
  }

  const handleSaveArtist = () => {
    setError('')
    if (!name.trim()) {
      setError('请输入艺人名')
      return
    }
    if (genres.length === 0) {
      setError('请选择至少一个音乐风格')
      return
    }
    if (bio.length > 100) {
      setError('个人简介不能超过100字')
      return
    }

    if (currentArtist) {
      updateArtist(currentArtist.id, { name: name.trim(), bio: bio.trim(), genres })
    } else {
      const artist = createArtist({ name: name.trim(), bio: bio.trim(), genres })
      setCurrentArtist(artist)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.includes('audio/mpeg') && !file.name.endsWith('.mp3')) {
        setError('请上传MP3格式的音频文件')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过10MB')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleAddSong = async () => {
    setError('')
    if (!currentArtist) {
      setError('请先保存艺人档案')
      return
    }
    if (!songTitle.trim()) {
      setError('请输入歌曲标题')
      return
    }
    if (!selectedFile) {
      setError('请选择音频文件')
      return
    }
    if (artistSongs.length >= 5) {
      setError('最多只能上传5首歌曲')
      return
    }

    try {
      setIsUploading(true)
      const { duration, audioData } = await parseAudio(selectedFile)
      addSong({
        artistId: currentArtist.id,
        title: songTitle.trim(),
        note: songNote.trim(),
        duration,
        audioData,
      })
      setSongTitle('')
      setSongNote('')
      setSelectedFile(null)
      setShowSongForm(false)
    } catch (err) {
      setError('音频解析失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleExport = () => {
    const state = useStore.getState()
    exportToJson(state)
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>我的作品集</h1>

      <div style={sectionStyle}>
        <h2 style={subTitleStyle}>艺人档案</h2>
        <div style={avatarPreviewStyle(currentArtist?.avatarColor || '#FF6B6B')}>
          {getInitials(name || '?')}
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>艺人名</label>
          <input
            type="text"
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入你的艺名"
            maxLength={50}
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>个人简介（最多100字）</label>
          <textarea
            style={textareaStyle}
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 100))}
            placeholder="介绍一下你自己..."
          />
          <div style={charCountStyle}>{bio.length}/100</div>
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>音乐风格（选择1-3个）</label>
          <div style={genresContainerStyle}>
            {Object.entries(GENRE_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                style={genreTagStyle(genres.includes(key as MusicGenre))}
                onClick={() => toggleGenre(key as MusicGenre)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <button style={buttonStyle} onClick={handleSaveArtist}>
          {currentArtist ? '更新档案' : '创建档案'}
        </button>

        <button style={exportButtonStyle} onClick={handleExport}>
          导出全部数据为JSON
        </button>
      </div>

      {currentArtist && (
        <div style={sectionStyle}>
          <h2 style={subTitleStyle}>歌曲管理（{artistSongs.length}/5）</h2>

          {artistSongs.map((song) => (
            <SongItem key={song.id} song={song} onDelete={() => deleteSong(song.id)} />
          ))}

          {showSongForm ? (
            <div style={songFormStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>歌曲标题</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="输入歌曲标题"
                  maxLength={100}
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>备注（可选）</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={songNote}
                  onChange={(e) => setSongNote(e.target.value)}
                  placeholder="歌曲的创作背景或想说的话..."
                  maxLength={200}
                />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>音频文件（MP3，最大10MB）</label>
                <label style={uploadAreaStyle}>
                  <input
                    type="file"
                    accept=".mp3,audio/mpeg"
                    style={fileInputStyle}
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <div>
                      <p style={{ color: '#FF6B6B', marginBottom: '4px' }}>✓ 已选择文件</p>
                      <p style={uploadTextStyle}>{selectedFile.name}</p>
                    </div>
                  ) : (
                    <p style={uploadTextStyle}>点击选择MP3文件</p>
                  )}
                </label>
              </div>
              {error && <p style={errorStyle}>{error}</p>}
              <div style={buttonGroupStyle}>
                <button style={buttonStyle} onClick={handleAddSong} disabled={isUploading}>
                  {isUploading ? '上传中...' : '添加歌曲'}
                </button>
                <button
                  style={secondaryButtonStyle}
                  onClick={() => {
                    setShowSongForm(false)
                    setError('')
                    setSelectedFile(null)
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            artistSongs.length < 5 && (
              <button
                style={{ ...buttonStyle, width: '100%' }}
                onClick={() => setShowSongForm(true)}
              >
                + 上传新歌曲
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

function SongItem({ song, onDelete }: { song: Song; onDelete: () => void }) {
  return (
    <div style={songItemStyle}>
      <div style={songCoverStyle(song.coverColor)}>
        {musicNoteSVG}
      </div>
      <div style={songInfoStyle}>
        <h4 style={songTitleStyle}>{song.title}</h4>
        <p style={songNoteStyle}>
          {song.note || '无备注'} · {formatDuration(song.duration)} · 播放 {song.playCount} 次
        </p>
      </div>
      <button style={deleteButtonStyle} onClick={onDelete}>×</button>
    </div>
  )
}
