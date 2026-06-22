interface NotificationProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
}

function Notification({ message, type = 'info' }: NotificationProps) {
  const bgColors = {
    info: 'bg-deep-blue',
    success: 'bg-success-green',
    warning: 'bg-warning-orange',
    danger: 'bg-danger-red',
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-in">
      <div
        className={`
          ${bgColors[type]}
          px-6 py-3 rounded-xl shadow-2xl
          text-white font-semibold
          animate-shake
        `}
      >
        {message}
      </div>
    </div>
  );
}

export default Notification;
