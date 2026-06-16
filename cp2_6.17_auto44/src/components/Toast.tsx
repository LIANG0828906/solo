import { useLogStore } from '../store/logStore';

export default function Toast() {
  const toasts = useLogStore((s) => s.toasts);
  const removeToast = useLogStore((s) => s.removeToast);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(51, 51, 51, 0.9)',
            color: '#fff',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            animation: 'toastIn 0.25s ease-out',
            maxWidth: 320,
            wordBreak: 'break-word',
          }}
        >
          {t.message}
          <style>{`
            @keyframes toastIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
}
