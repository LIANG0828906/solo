import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, User, Mail, Calendar } from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import type { Work } from "@/types";

interface ReviewModalProps {
  work: Work | null;
  onReview: (id: string, action: "approve" | "reject", reject_reason?: string) => void;
  onClose: () => void;
}

export default function ReviewModal({ work, onReview, onClose }: ReviewModalProps) {
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [displayWork, setDisplayWork] = useState<Work | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (work) {
      setDisplayWork(work);
      setVisible(true);
      setClosing(false);
      setShowRejectInput(false);
      setRejectReason("");
    }
  }, [work]);

  if (!displayWork) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      setDisplayWork(null);
      setShowRejectInput(false);
      setRejectReason("");
      onClose();
    }, 200);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleApprove = () => {
    onReview(displayWork.id, "approve");
    handleClose();
  };

  const handleRejectClick = () => {
    setShowRejectInput(true);
  };

  const handleConfirmReject = () => {
    onReview(displayWork.id, "reject", rejectReason.trim() || undefined);
    handleClose();
  };

  const formattedDate = new Date(displayWork.created_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      onClick={handleOverlayClick}
    >
      <div
        className={`relative w-full max-w-2xl mx-4 ${visible && !closing ? "animate-scaleIn" : "scale-100"}`}
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
              className="w-full max-h-[50vh] object-contain bg-black"
              effect="opacity"
            />
          ) : (
            <video
              src={displayWork.file_url}
              controls
              className="w-full max-h-[50vh] bg-black"
            />
          )}

          <div className="p-6 space-y-4">
            <h2 className="font-display text-xl text-white">{displayWork.title}</h2>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <User size={16} />
                {displayWork.uploader}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail size={16} />
                {displayWork.uploader_email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={16} />
                {formattedDate}
              </span>
            </div>

            {showRejectInput ? (
              <div className="space-y-3">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入拒绝原因..."
                  className="w-full h-24 bg-surface-light border border-surface-border rounded-lg p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-indigo resize-none"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <XCircle size={18} />
                    确认拒绝
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <CheckCircle size={18} />
                  通过
                </button>
                <button
                  onClick={handleRejectClick}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <XCircle size={18} />
                  拒绝
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
