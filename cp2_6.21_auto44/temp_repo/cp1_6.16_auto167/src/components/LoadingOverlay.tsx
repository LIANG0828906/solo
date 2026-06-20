export default function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{ background: 'rgba(26, 26, 46, 0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="loader-spin rounded-full"
          style={{
            width: 48,
            height: 48,
            border: '4px solid rgba(142, 68, 173, 0.2)',
            borderTopColor: '#8E44AD',
          }}
        />
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          正在生成文件...
        </div>
      </div>
    </div>
  );
}
