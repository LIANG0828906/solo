import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, visible, onClose }: ToastProps) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!show) return null;

  return <div className="toast">{message}</div>;
}
