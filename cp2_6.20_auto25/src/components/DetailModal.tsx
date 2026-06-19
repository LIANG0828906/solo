import { useState, useEffect } from "react";
import { X, User, Calendar } from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import type { Work } from "@/types";

interface DetailModalProps {
  work: Work | null;
  onClose: () => void;
}

export default function DetailModal({ work, onClose }: DetailModalProps) {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [displayWork, setDisplayWork] = useState<Work | null>(null);

  useEffect(() => {
    if (work) {
      setDisplayWork(work);
      setVisible(true);
      setClosing(false);
    }
  }, [work]);

  if (!displayWork) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      setDisplayWork(null);
      onClose();
    }, 300);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const formattedDate = new Date(displayWork.created_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      onClick={handleOverlayClick}
    >
      <div
        className={`relative w-full max-w-4xl mx-4 transition-all duration-300 ${
          visible && !closing
            ? "animate-scaleIn"
            : closing
            ? "scale-95 opacity-0"
            : "scale-100"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors z-10"
        >
          <X size={28} />
        </button>

        <div className="bg-surface rounded-card overflow-hidden">
          {displayWork.file_type === "image" ? (
            <LazyLoadImage
              src={displayWork.file_url}
              alt={displayWork.title}
              className="w-full max-h-[70vh] object-contain bg-black"
              effect="opacity"
            />
          ) : (
            <video
              src={displayWork.file_url}
              controls
              className="w-full max-h-[70vh] bg-black"
            />
          )}

          <div className="p-6 space-y-3">
            <h2 className="font-display text-xl text-white">{displayWork.title}</h2>

            <div className="flex items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <User size={16} />
                {displayWork.uploader}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} />
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
