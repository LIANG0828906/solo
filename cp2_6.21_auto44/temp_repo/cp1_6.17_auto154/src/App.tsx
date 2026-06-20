import React, { useEffect } from 'react'
import MapView from '@/components/MapView'
import Panel from '@/components/Panel'
import StatsPanel from '@/components/StatsPanel'

const App: React.FC = () => {
  useEffect(() => {
    document.title = '摊位管理与客流热力预测'
  }, [])

  return (
    <div
      className="app-container"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#F4F6F7',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
      }}
    >
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .panel-wrapper {
          width: 320px;
          flex-shrink: 0;
          height: 100%;
          overflow: hidden;
          border-right: 1px solid #E5E7EB;
        }

        .map-wrapper {
          flex: 1;
          height: 100%;
          position: relative;
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column !important;
          }

          .panel-wrapper {
            width: 100% !important;
            height: 50vh !important;
            order: 2;
            border-right: none;
            border-top: 1px solid #E5E7EB;
          }

          .map-wrapper {
            width: 100% !important;
            height: 50vh !important;
            order: 1;
          }
        }

        .leaflet-container {
          font-family: "'Inter', sans-serif";
        }
      `}</style>

      <div className="panel-wrapper">
        <Panel />
      </div>
      <div className="map-wrapper">
        <MapView />
      </div>
      <StatsPanel />
    </div>
  )
}

export default App
