import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 400);
    }, 1600);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`${exiting ? "toast-exit" : "toast-enter"} px-6 py-3 rounded-xl shadow-lg text-white font-medium`}
        style={{ background: "linear-gradient(135deg, #ff7043, #f4511e)" }}
      >
        {message}
      </div>
    </div>
  );
}
