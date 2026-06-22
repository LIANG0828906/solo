import { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, Copy, MoreVertical, Edit3, Trash2, FolderInput, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import useVaultStore from '@/store/VaultStore';
import type { VaultEntry, Category } from '@/modules/storage/DataStore';

function maskUsername(username: string): string {
  if (username.length > 2) {
    return username.slice(0, 2) + '***' + (username.slice(-1) || '');
  }
  return '***';
}

const CATEGORY_OPTIONS: { id: Category; name: string }[] = [
  { id: 'social', name: '社交' },
  { id: 'finance', name: '金融' },
  { id: 'work', name: '工作' },
  { id: 'other', name: '其他' },
];

interface VaultEntryCardProps {
  entry: VaultEntry;
}

export default function VaultEntryCard({ entry }: VaultEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCategorySub, setShowCategorySub] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const setEditingEntry = useVaultStore((s) => s.setEditingEntry);
  const openAddPanel = useVaultStore((s) => s.openAddPanel);
  const deleteEntry = useVaultStore((s) => s.deleteEntry);
  const updateEntry = useVaultStore((s) => s.updateEntry);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setShowCategorySub(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  function handleEdit() {
    setEditingEntry(entry);
    openAddPanel();
    setMenuOpen(false);
  }

  function handleDelete() {
    deleteEntry(entry.id);
    setMenuOpen(false);
    setConfirmDelete(false);
  }

  async function handleMoveCategory(cat: Category) {
    await updateEntry({ ...entry, category: cat });
    setMenuOpen(false);
    setShowCategorySub(false);
  }

  return (
    <div
      className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 backdrop-blur-[12px] cursor-pointer transition-all duration-300 hover:border-[rgba(255,255,255,0.2)]"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Lock className="w-4 h-4 text-green-400 shrink-0" />
          <span className="text-white font-semibold text-sm truncate">{entry.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-gray-400 text-xs">{maskUsername(entry.username)}</span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '500px' : '0px' }}
      >
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.1)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-gray-500 text-xs">用户名</span>
              <p className="text-white text-sm">{entry.username}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(entry.username, 'username');
              }}
              className="text-gray-500 hover:text-[#38bdf8] transition-colors ml-2 shrink-0"
            >
              {copiedField === 'username' ? (
                <span className="text-[#38bdf8] text-xs">已复制</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-gray-500 text-xs">密码</span>
              <p className="text-white text-sm font-mono">{showPassword ? entry.password : '••••••••'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPassword(!showPassword);
                }}
                className="text-gray-500 hover:text-[#38bdf8] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(entry.password, 'password');
                }}
                className="text-gray-500 hover:text-[#38bdf8] transition-colors"
              >
                {copiedField === 'password' ? (
                  <span className="text-[#38bdf8] text-xs">已复制</span>
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {entry.notes && (
            <div>
              <span className="text-gray-500 text-xs">备注</span>
              <p className="text-white text-sm whitespace-pre-wrap">{entry.notes}</p>
            </div>
          )}

          <div>
            <span className="text-gray-500 text-xs">创建时间</span>
            <p className="text-white text-sm">{format(new Date(entry.createdAt), 'yyyy-MM-dd HH:mm')}</p>
          </div>

          <div className="flex justify-end relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
                setConfirmDelete(false);
                setShowCategorySub(false);
              }}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1 bg-[rgba(15,23,42,0.95)] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden shadow-xl z-10 min-w-[140px]">
                {confirmDelete ? (
                  <div className="px-4 py-2.5">
                    <p className="text-red-400 text-xs mb-2">确定永久删除此条目？</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                      >
                        确认
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(false);
                        }}
                        className="px-2 py-1 text-xs text-gray-400 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : showCategorySub ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCategorySub(false);
                      }}
                      className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.1)] transition-colors flex items-center gap-2 text-left"
                    >
                      ← 返回
                    </button>
                    {CATEGORY_OPTIONS.filter((c) => c.id !== entry.category).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCategory(cat.id);
                        }}
                        className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.1)] transition-colors flex items-center gap-2 text-left"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}
                      className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.1)] transition-colors flex items-center gap-2 text-left"
                    >
                      <Edit3 className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCategorySub(true);
                      }}
                      className="w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-[rgba(255,255,255,0.1)] transition-colors flex items-center gap-2 text-left"
                    >
                      <FolderInput className="w-4 h-4" />
                      移动分类
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                      }}
                      className="w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[rgba(255,255,255,0.1)] transition-colors flex items-center gap-2 text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
