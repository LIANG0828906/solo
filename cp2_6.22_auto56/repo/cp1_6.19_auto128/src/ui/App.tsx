import React, { useState, useCallback } from 'react'
import { FiPlus, FiDownload, FiShare2, FiMusic, FiLayers } from 'react-icons/fi'
import { AppProvider, useApp } from './AppContext'
import TrackCard from './TrackCard'
import MixerPanel from './MixerPanel'
import PlaybackBar from './PlaybackBar'
import PianoRoll from './PianoRoll'
import ExportModal from './ExportModal'
import { INSTRUMENT_NAMES, INSTRUMENT_COLORS } from '../domain/melody'
import type { InstrumentType, Note } from '../eventBus'

import './App.css'

const INSTRUMENTS: InstrumentType[] = ['piano', 'guitar', 'bass', 'drums', 'strings', 'synth']

const AppContent: React.FC = () => {
  const { tracks, addTrack, editorOpen, editingTrackId, updateNotes, closeEditor, reorderTracks } = useApp()
  const [showInstrumentMenu, setShowInstrumentMenu] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleAddTrack = useCallback((instrument: InstrumentType) => {
    addTrack(instrument)
    setShowInstrumentMenu(false)
  }, [addTrack])

  const handleExport = () => {
    if (tracks.length === 0) {
      alert('请先添加音轨！')
      return
    }
    setShowExportModal(true)
  }

  const handleShare = async () => {
    const shareId = Math.random().toString(36).substring(2, 10)
    const shareLink = `https://melodymix.app/share/${shareId}`
    try {
      await navigator.clipboard.writeText(shareLink)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    } catch (e) {
      alert('分享链接: ' + shareLink)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...tracks.map(t => t.id)]
      const [removed] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(dragOverIndex, 0, removed)
      reorderTracks(newOrder)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const editingTrack = tracks.find(t => t.id === editingTrackId)

  const handleSaveNotes = (notes: Note[]) => {
    if (editingTrackId) {
      updateNotes(editingTrackId, notes)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <FiMusic />
            <h1>Melody Mix</h1>
          </div>
          <span className="tagline">旋律混音沙盒</span>
        </div>

        <div className="header-right">
          <div className="add-track-wrapper">
            <button 
              className="btn btn-primary add-track-btn"
              onClick={() => setShowInstrumentMenu(!showInstrumentMenu)}
              disabled={tracks.length >= 6}
            >
              <FiPlus />
              添加音轨
            </button>
            
            {showInstrumentMenu && (
              <div className="instrument-menu">
                <div className="menu-title">选择乐器</div>
                <div className="instrument-grid">
                  {INSTRUMENTS.map(inst => (
                    <button
                      key={inst}
                      className="instrument-option"
                      onClick={() => handleAddTrack(inst)}
                      style={{ '--inst-color': INSTRUMENT_COLORS[inst] } as React.CSSProperties}
                    >
                      <div 
                        className="instrument-icon"
                        style={{ backgroundColor: INSTRUMENT_COLORS[inst] }}
                      >
                        <FiMusic />
                      </div>
                      <span>{INSTRUMENT_NAMES[inst]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={tracks.length === 0}
          >
            <FiDownload />
            导出
          </button>

          <button 
            className="btn btn-secondary"
            onClick={handleShare}
            disabled={tracks.length === 0}
          >
            <FiShare2 />
            分享
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="tracks-section">
          <div className="section-header">
            <h2>
              <FiLayers />
              音轨列表
            </h2>
            <span className="track-count">{tracks.length} / 6</span>
          </div>

          <div className="tracks-container">
            {tracks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiMusic />
                </div>
                <h3>还没有音轨</h3>
                <p>点击上方"添加音轨"按钮开始创作</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowInstrumentMenu(true)}
                >
                  <FiPlus /> 创建第一个音轨
                </button>
              </div>
            ) : (
              <div className="tracks-grid">
                {tracks.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    index={index}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mixer-section">
          <MixerPanel />
        </section>
      </main>

      <PlaybackBar />

      {editorOpen && editingTrack && (
        <PianoRoll
          notes={editingTrack.notes}
          onClose={closeEditor}
          onSave={handleSaveNotes}
        />
      )}

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      {showShareToast && (
        <div className="share-toast">
          <span>✓ 分享链接已复制到剪贴板</span>
        </div>
      )}
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
