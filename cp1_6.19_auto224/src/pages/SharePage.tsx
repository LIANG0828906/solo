import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowLeft, ShoppingCart, Calendar, AlertCircle } from 'lucide-react';
import type { ShareData } from '@/types';

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    try {
      const shareStorage = JSON.parse(localStorage.getItem('shareData') || '{}');
      const data = shareStorage[id];
      if (data) {
        setShareData(data);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
  }, [id]);

  const generatePlainText = (): string => {
    if (!shareData) return '';
    const lines: string[] = [];
    lines.push(`🛒 购物清单 - ${shareData.recipeName}`);
    lines.push(`创建时间: ${new Date(shareData.createdAt).toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    shareData.items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.name}  ${item.quantity}${item.unit}`);
      if (item.note) lines.push(`   备注: ${item.note}`);
    });
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败', e);
    }
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-[var(--danger)]" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-[var(--text)]">链接不存在</h1>
          <p className="mb-8 text-sm text-gray-500">该分享链接已失效或不存在，请联系分享人获取最新链接</p>
          <button
            onClick={() => navigate('/')}
            className="ripple inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-green-200 hover:bg-[#43A047] active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </button>
        </motion.div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-[600px]"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 text-center"
        >
          <h1 className="mb-2 text-3xl font-black text-[var(--primary)]">购物清单分享</h1>
          <p className="text-sm text-gray-500">只读视图 · 可查看和复制清单内容</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="overflow-hidden rounded-3xl bg-white shadow-xl"
        >
          <div className="h-2 bg-gradient-to-r from-green-400 via-[var(--primary)] to-emerald-500" />

          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <ShoppingCart className="h-5 w-5 text-[var(--secondary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)]">{shareData.recipeName}</h2>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(shareData.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 rounded-full bg-green-50 px-3 py-1.5">
                <span className="text-xs font-bold text-[var(--primary)]">{shareData.items.length} 项</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {shareData.items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-gray-500">🎉 无需采购任何食材</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shareData.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-start justify-between gap-4 rounded-2xl bg-gray-50 p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-[var(--text)]">{item.name}</span>
                      </div>
                      {item.note && (
                        <p className="mt-2 pl-8 text-xs text-gray-500">💬 {item.note}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-gray-700 shadow-sm">
                      {item.quantity} {item.unit}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-gray-50 p-6">
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="ripple flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </button>
              <button
                onClick={handleCopy}
                className="ripple flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-3 text-sm font-semibold text-white shadow-md shadow-green-200 transition-colors hover:bg-[#43A047] active:scale-[0.98]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? '已复制' : '复制清单文本'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
