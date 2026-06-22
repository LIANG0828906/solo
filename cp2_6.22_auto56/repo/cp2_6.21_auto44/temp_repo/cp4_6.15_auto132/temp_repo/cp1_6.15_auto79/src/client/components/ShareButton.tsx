import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  projectId: string;
}

export default function ShareButton({ projectId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/project/${projectId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={handleCopy}
        className={cn(
          'nav-icon-btn p-2 rounded-lg text-[var(--text-primary)]',
          'hover:bg-white/10 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-white/20'
        )}
        title="分享链接"
      >
        <Link2 className="w-5 h-5" />
      </button>

      {copied && (
        <div className="absolute left-full ml-2 flex items-center gap-1.5 pointer-events-none">
          <div className="check-pop">
            <Check className="w-4 h-4 text-green-400" />
          </div>
          <span
            className="text-sm text-green-400 font-medium"
            style={{
              animation: 'fadeInContent 0.2s ease-out both',
            }}
          >
            已复制
          </span>
        </div>
      )}
    </div>
  );
}
