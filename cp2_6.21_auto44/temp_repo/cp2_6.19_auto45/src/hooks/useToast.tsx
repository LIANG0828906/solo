import { create } from 'zustand';

interface ToastState {
  message: string;
  visible: boolean;
  show: (msg: string) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set) => ({
  message: '',
  visible: false,
  show: (msg: string) => {
    if (timer) clearTimeout(timer);
    set({ message: msg, visible: true });
    timer = setTimeout(() => set({ visible: false }), 2000);
  },
  hide: () => set({ visible: false }),
}));

export function ToastContainer() {
  const { visible, message } = useToast();
  return (
    <div className={`ff-toast ${visible ? 'ff-toast--show' : ''}`}>
      <span>{message}</span>
    </div>
  );
}
