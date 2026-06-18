import TicketForm from './components/TicketForm';
import TicketBoard from './components/TicketBoard';

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        padding: '32px',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '24px',
          marginTop: 0,
        }}
      >
        RefundFlow - 售后退款工单管理
      </h1>
      <div
        style={{
          display: 'flex',
          gap: '24px',
          height: 'calc(100vh - 120px)',
          minHeight: '600px',
        }}
      >
        <div
          style={{
            width: '420px',
            flexShrink: 0,
          }}
        >
          <TicketForm />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <TicketBoard />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="display: flex"][style*="gap: 24px"] {
            flex-direction: column !important;
            height: auto !important;
          }
          div[style*="width: 420px"] {
            width: 100% !important;
          }
          div[style*="flex: 1"] {
            width: 100% !important;
            min-height: 400px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
