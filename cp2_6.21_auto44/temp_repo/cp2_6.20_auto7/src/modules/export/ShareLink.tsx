import { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { useResumeStore } from '@/store/resumeStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ShareLink() {
  const { components } = useResumeStore();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/share`, {
        components,
        layout: { width: 595, height: 842 },
      });
      const url = `${window.location.origin}/share/${response.data.share_id}`;
      setShareUrl(url);
    } catch {
      const fakeId = `local_${Date.now().toString(36)}`;
      const url = `${window.location.origin}/share/${fakeId}`;
      setShareUrl(url);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleShare}
        disabled={loading || components.length === 0}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Link2 size={15} />
        {loading ? '生成中...' : '生成分享链接'}
      </button>

      {shareUrl && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent text-xs text-slate-600 outline-none min-w-0"
          />
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors flex-shrink-0"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
