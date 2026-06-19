import { useState, useEffect, useCallback } from 'react';
import { Share2 } from 'lucide-react';

const ShareButton: React.FC = () => {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastEntering, setToastEntering] = useState(false);

  const generateShareLink = () => {
    const hex = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return `https://gallery.app/s/${hex}`;
  };

  const showToast = useCallback(() => {
    setToastVisible(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToastEntering(true);
      });
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastEntering(false);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 2000);
    return () => clearTimeout(timer);
  }, [toastVisible, hideToast]);

  const handleTransitionEnd = () => {
    if (!toastEntering) {
      setToastVisible(false);
    }
  };

  const handleClick = async () => {
    const link = generateShareLink();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showToast();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#C4A882] hover:bg-[#B09370] text-white rounded-xl px-4 py-2 transition duration-300 ease-out"
      >
        <Share2 className="w-4 h-4" />
        分享
      </button>

      {toastVisible && (
        <div
          onTransitionEnd={handleTransitionEnd}
          style={{
            transitionTimingFunction: toastEntering
              ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
              : 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#5C524A] text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-400 ${
            toastEntering
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
          }`}
        >
          已复制到剪贴板
        </div>
      )}
    </>
  );
};

export default ShareButton;
