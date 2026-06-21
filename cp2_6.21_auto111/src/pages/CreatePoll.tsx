import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Copy, Check, BarChart3, Vote } from 'lucide-react';
import { usePollStore } from '../store/usePollStore';
import type { Poll } from '../types';

const PRESET_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225', '#E7E9ED', '#8E5EA2', '#3CBA9F', '#FF6B6B'];

interface FormOption {
  text: string;
  color: string;
}

export default function CreatePoll() {
  const { polls, fetchMyPolls, createPoll, deletePoll, loading } = usePollStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<FormOption[]>([
    { text: '', color: PRESET_COLORS[0] },
    { text: '', color: PRESET_COLORS[1] },
  ]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyPolls();
  }, [fetchMyPolls]);

  const loadMore = useCallback(() => {
    if (visibleCount < Math.min(polls.length, 20)) {
      setVisibleCount((prev) => Math.min(prev + 10, Math.min(polls.length, 20)));
    }
  }, [polls.length, visibleCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, polls.length]);

  const addOption = () => {
    if (options.length >= 6) return;
    const nextColor = PRESET_COLORS[options.length % PRESET_COLORS.length];
    setOptions([...options, { text: '', color: nextColor }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: 'text' | 'color', value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || options.some((opt) => !opt.text.trim())) return;
    try {
      const result = await createPoll({
        title: title.trim(),
        description: description.trim(),
        options: options.map((opt) => ({ text: opt.text.trim(), color: opt.color })),
      });
      setShareUrl(result.shareUrl);
      setTitle('');
      setDescription('');
      setOptions([
        { text: '', color: PRESET_COLORS[0] },
        { text: '', color: PRESET_COLORS[1] },
      ]);
    } catch (error) {
      console.error('Failed to create poll:', error);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDelete = async (pollId: string) => {
    const success = await deletePoll(pollId);
    if (success) {
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const visiblePolls = polls.slice(0, visibleCount);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
      <nav
        className="sticky top-0 z-10 flex items-center px-6 md:px-8"
        style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <div className="w-full max-w-screen-xl mx-auto flex items-center gap-3">
          <Vote className="w-6 h-6" style={{ color: '#4a90d9' }} />
          <h1 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>创建投票</h1>
        </div>
      </nav>

      <main className="max-w-screen-xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="grid gap-6 md:gap-8">
          <div
            className="rounded-xl p-4 md:p-6 transition-all duration-200"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1a1a1a' }}>创建新投票</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#333333' }}>
                标题 <span style={{ color: '#e53935' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                  placeholder="请输入投票标题"
                  required
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                  style={{
                    border: '1px solid #d0d0d0',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4a90d9';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d0d0d0';
                  }}
                />
                <div className="text-right text-xs mt-1" style={{ color: '#999999' }}>
                  {title.length}/50
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#333333' }}>
                描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入投票描述（可选）"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border transition-colors resize-none"
                  style={{
                    border: '1px solid #d0d0d0',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4a90d9';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d0d0d0';
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#333333' }}>
                选项 <span style={{ color: '#e53935' }}>*</span>
                </label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="relative flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          placeholder={`选项 ${index + 1}`}
                          required
                          className="flex-1 px-4 py-2.5 rounded-lg border transition-colors"
                          style={{
                            border: '1px solid #d0d0d0',
                            backgroundColor: '#ffffff',
                            outline: 'none',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#4a90d9';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d0d0d0';
                          }}
                        />
                        <div className="relative">
                          <input
                            type="color"
                            value={option.color}
                            onChange={(e) => updateOption(index, 'color', e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                            style={{
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              backgroundColor: 'transparent',
                            }}
                          />
                          <div
                            className="absolute inset-0 rounded-lg pointer-events-none"
                            style={{ backgroundColor: option.color }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 2}
                        className="p-2 rounded-lg transition-all duration-100"
                        style={{
                          color: options.length <= 2 ? '#cccccc' : '#ef4444',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (options.length > 2) {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.filter = 'brightness(1.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.filter = 'brightness(1)';
                        }}
                        onMouseDown={(e) => {
                          if (options.length > 2) {
                            e.currentTarget.style.transform = 'scale(0.96)';
                          }
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        const lastIndex = options.length - 1;
                        if (lastIndex >= 0) {
                          updateOption(lastIndex, 'color', color);
                        }
                      }}
                      className="w-8 h-8 rounded-lg border-2 transition-all duration-100"
                      style={{
                        backgroundColor: color,
                        borderColor: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.96)';
                      }}
                    />
                  ))}
                </div>

                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed transition-all duration-100"
                    style={{
                      borderColor: '#d0d0d0',
                      color: '#666666',
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4a90d9';
                      e.currentTarget.style.color = '#4a90d9';
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#d0d0d0';
                      e.currentTarget.style.color = '#666666';
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.96)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    添加选项
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim() || options.some((opt) => !opt.text.trim())}
                className="w-full py-3 px-6 font-medium text-white rounded-lg transition-all duration-100"
                style={{
                  backgroundColor: loading || !title.trim() || options.some((opt) => !opt.text.trim()) ? '#a0c4e8' : '#4a90d9',
                  borderRadius: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!loading && title.trim() && options.every((opt) => opt.text.trim())) {
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                }}
                onMouseDown={(e) => {
                  if (!loading && title.trim() && options.every((opt) => opt.text.trim())) {
                    e.currentTarget.style.transform = 'scale(0.96)';
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {loading ? '创建中...' : '创建投票'}
              </button>
            </form>

            {shareUrl && (
              <div
                className="mt-6 p-4 rounded-lg"
                style={{ backgroundColor: 'rgba(74, 144, 217, 0.1)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1" style={{ color: '#4a90d9' }}>
                      投票创建成功！
                    </p>
                    <p
                      className="text-sm truncate"
                      style={{ color: '#666666', wordBreak: 'break-all' }}
                    >
                      {shareUrl}
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-100"
                    style={{
                      backgroundColor: copied ? '#22c55e' : '#4a90d9',
                      color: '#ffffff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'brightness(1)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.96)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制链接
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="rounded-xl p-4 md:p-6 transition-all duration-200"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#1a1a1a' }}>
              我的投票
            </h2>
            {visiblePolls.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#999999' }}>
                <Vote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无投票记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visiblePolls.map((poll: Poll) => (
                  <div
                    key={poll.id}
                    className="p-4 rounded-lg border transition-all duration-200"
                    style={{ borderColor: '#e0e0e0' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4a90d9';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 144, 217, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" style={{ color: '#1a1a1a' }}>
                          {poll.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm" style={{ color: '#666666' }}>
                          <span>{formatDate(poll.createdAt)}</span>
                          <span>总票数: {poll.totalVotes}</span>
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: poll.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.2)',
                              color: poll.status === 'active' ? '#22c55e' : '#6b7280',
                            }}
                          >
                            {poll.status === 'active' ? '进行中' : '已关闭'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 rounded-lg transition-all duration-100"
                          style={{ color: '#4a90d9', backgroundColor: 'transparent' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(74, 144, 217, 0.1)';
                            e.currentTarget.style.filter = 'brightness(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.filter = 'brightness(1)';
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.96)';
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <BarChart3 className="w-5 h-5" />
                        </button>
                        {deleteConfirmId === poll.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(poll.id)}
                              className="px-3 py-1.5 rounded text-sm font-medium transition-all duration-100"
                              style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.filter = 'brightness(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.filter = 'brightness(1)';
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.96)';
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 rounded text-sm font-medium transition-all duration-100"
                              style={{ backgroundColor: '#9ca3af', color: '#ffffff' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.filter = 'brightness(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.filter = 'brightness(1)';
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.96)';
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                            <button
                              onClick={() => setDeleteConfirmId(poll.id)}
                              className="p-2 rounded-lg transition-all duration-100"
                              style={{ color: '#ef4444', backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                e.currentTarget.style.filter = 'brightness(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.filter = 'brightness(1)';
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.transform = 'scale(0.96)';
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {visibleCount < Math.min(polls.length, 20) && (
                  <div ref={observerRef} className="h-10" />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 767px) {
          div[style*="padding: 24px"] {
            padding: 16px !important;
          }
        }
        input[type="color"]::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        input[type="color"]::-webkit-color-swatch {
          border: none;
          border-radius: 8px;
        }
        input[type="color"]::-moz-color-swatch {
          border: none;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
