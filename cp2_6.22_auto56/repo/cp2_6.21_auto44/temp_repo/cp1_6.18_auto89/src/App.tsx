import React from 'react'
import NoteBoard from './components/NoteBoard'
import FilterPanel from './components/FilterPanel'
import { useNoteStore } from './stores/noteStore'

const App: React.FC = () => {
  const addNote = useNoteStore((s) => s.addNote)

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#F9F6F0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #F9F6F0;
        }

        @media (max-width: 768px) {
          .main-layout {
            flex-direction: column !important;
          }
          .filter-panel-wrapper {
            width: 100% !important;
            min-width: unset !important;
          }
        }
      `}</style>

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: '#FFFFFF',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#333',
            letterSpacing: 1,
          }}
        >
          🎵 律动便签
        </h1>
        <button
          onClick={addNote}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: 10,
            backgroundColor: '#FF6B6B',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 8px rgba(255,107,107,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FF8C8C'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FF6B6B'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
        >
          + 新建便签
        </button>
      </header>

      <div
        className="main-layout"
        style={{
          display: 'flex',
          gap: 20,
          padding: 20,
          flex: 1,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <NoteBoard />
        </div>
        <div className="filter-panel-wrapper">
          <FilterPanel />
        </div>
      </div>
    </div>
  )
}

export default App
