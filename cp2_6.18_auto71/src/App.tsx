import TicketForm from './components/TicketForm'
import TicketBoard from './components/TicketBoard'

export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        padding: '32px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          #app-layout {
            flex-direction: column !important;
          }
          #form-panel {
            width: 100% !important;
          }
        }
      `}</style>
      <div
        id="app-layout"
        style={{
          display: 'flex',
          gap: '24px',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          id="form-panel"
          style={{
            width: '420px',
            flexShrink: 0,
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            alignSelf: 'flex-start',
            height: 'fit-content',
            position: 'sticky',
            top: '32px',
          }}
        >
          <TicketForm />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TicketBoard />
        </div>
      </div>
    </div>
  )
}
