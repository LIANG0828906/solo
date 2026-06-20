export default function EmptyState({ message = '暂无内容', subMessage }: { message?: string; subMessage?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-illustration">
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="30" width="120" height="90" rx="8" fill="#f0f0f0" stroke="#ddd" strokeWidth="2" />
          <rect x="40" y="30" width="120" height="20" rx="8" fill="#e8e8e8" />
          <circle cx="50" cy="40" r="3" fill="#c0c0c0" />
          <circle cx="60" cy="40" r="3" fill="#c0c0c0" />
          <circle cx="70" cy="40" r="3" fill="#c0c0c0" />
          <rect x="55" y="65" width="90" height="6" rx="3" fill="#e0e0e0" />
          <rect x="55" y="78" width="70" height="6" rx="3" fill="#e0e0e0" />
          <rect x="55" y="91" width="80" height="6" rx="3" fill="#e0e0e0" />
          <path d="M95 105L85 118H105L95 105Z" fill="#c0c0c0" />
          <rect x="88" y="118" width="14" height="4" rx="1" fill="#c0c0c0" />
          <path d="M70 58L60 71M70 58L80 71" stroke="#d0d0d0" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="empty-state-title">{message}</h3>
      {subMessage && <p className="empty-state-sub">{subMessage}</p>}
    </div>
  );
}
