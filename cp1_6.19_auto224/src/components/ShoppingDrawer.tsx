import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Plus, Minus, Copy, Link2, Check, Trash2 } from 'lucide-react';
import type { ShoppingItem, ShareData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ShoppingDrawerProps {
  open: boolean;
  recipeName: string;
  items: ShoppingItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onDeleteItem: (id: string) => void;
}

export default function ShoppingDrawer({
  open,
  recipeName,
  items,
  onClose,
  onUpdateQuantity,
  onUpdateNote,
  onDeleteItem,
}: ShoppingDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const shareDataRef = useRef<ShareData | null>(null);

  useEffect(() => {
    if (open) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
      setShareLink('');
    }
  }, [open]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else if (info.offset.y < -50 || info.velocity.y < -500) {
      setIsExpanded(true);
    }
  };

  const generatePlainText = (): string => {
    const lines: string[] = [];
    lines.push(`🛒 购物清单 - ${recipeName}`);
    lines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.name}  ${item.quantity}${item.unit}`);
      if (item.note) lines.push(`   备注: ${item.note}`);
    });
    lines.push('━━━━━━━━━━━━━━━━━━━━');
    return lines.join('\n');
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败', e);
    }
  };

  const handleGenerateLink = () => {
    const shareData: ShareData = {
      id: uuidv4(),
      recipeName,
      createdAt: new Date().toISOString(),
      items,
    };
    shareDataRef.current = shareData;
    const shareStorage = JSON.parse(localStorage.getItem('shareData') || '{}');
    shareStorage[shareData.id] = shareData;
    localStorage.setItem('shareData', JSON.stringify(shareStorage));
    const link = `${window.location.origin}/share/${shareData.id}`;
    setShareLink(link);
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      console.error('复制链接失败', e);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isExpanded ? 0 : 'auto', bottom: 0, top: isExpanded ? 80 : 'auto' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, duration: 0.4 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="glass fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-3xl border-t border-white/50 shadow-2xl"
            style={{ maxHeight: isExpanded ? 'calc(100vh - 80px)' : '60vh' }}
          >
            <div className="flex flex-shrink-0 cursor-grab flex-col items-center pt-3 active:cursor-grabbing">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>

            <div className="flex flex-shrink-0 items-center justify-between px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">购物清单 - {recipeName}</h3>
                <p className="mt-0.5 text-xs text-gray-500">共 {items.length} 项待采购</p>
              </div>
              <button
                onClick={onClose}
                className="ripple flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm font-medium text-gray-500">🎉 您的食材非常齐全</p>
                  <p className="mt-1 text-xs text-gray-400">无需额外采购任何食材</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[var(--text)]">{item.name}</div>
                          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <button
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="ripple flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-12 text-center font-medium text-[var(--text)]">
                              {item.quantity} {item.unit}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="ripple flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="ripple flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-[var(--danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => onUpdateNote(item.id, e.target.value)}
                        placeholder="添加备注（如：选新鲜的、品牌偏好等）"
                        className="mt-3 w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs outline-none transition-colors focus:border-[var(--primary)] focus:bg-white"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 border-t border-white/50 bg-white/50 px-6 py-4 backdrop-blur-sm">
              {shareLink && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm"
                >
                  <Link2 className="h-4 w-4 flex-shrink-0 text-[var(--primary)]" />
                  <span className="flex-1 truncate text-xs text-gray-600">{shareLink}</span>
                  <button
                    onClick={handleCopyLink}
                    className="ripple flex flex-shrink-0 items-center gap-1 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white active:scale-95"
                  >
                    {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {linkCopied ? '已复制' : '复制'}
                  </button>
                </motion.div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleCopyText}
                  className="ripple flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]"
                >
                  {copied ? <Check className="h-4 w-4 text-[var(--primary)]" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已复制' : '复制纯文本'}
                </button>
                <button
                  onClick={handleGenerateLink}
                  className="ripple flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-emerald-500 py-3 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all active:scale-[0.98]"
                >
                  <Link2 className="h-4 w-4" />
                  生成分享链接
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
