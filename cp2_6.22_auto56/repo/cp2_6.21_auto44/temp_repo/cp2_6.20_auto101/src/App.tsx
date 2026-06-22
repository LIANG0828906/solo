import React from 'react'
import NavBar from './NavBar'
import SkillEditor from './SkillEditor'
import ComboPreview from './ComboPreview'
import AttributePanel from './AttributePanel'

const App: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
      }}
    >
      <NavBar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          padding: 24,
          gap: 24,
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        <AttributePanel />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 360,
            }}
          >
            <ComboPreview />
          </div>

          <SkillEditor />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="flex: 1"] {
            padding: 12px !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default App
