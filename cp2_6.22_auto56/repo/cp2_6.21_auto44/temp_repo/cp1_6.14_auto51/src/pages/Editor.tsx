import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Send,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Image,
  AtSign,
  List,
  ListOrdered,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import Toast from '@/components/Toast';
import { postsApi, aiApi } from '@/services/api';
import type { Post, Platform, PostStatus } from '@/types';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/types';
import moment from 'moment';

const platforms: Platform[] = ['weibo', 'wechat', 'douyin', 'bilibili'];

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
    >
      {children}
    </button>
  );
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [platform, setPlatform] = useState<Platform>('weibo');
  const [scheduledDate, setScheduledDate] = useState(
    moment().add(1, 'day').format('YYYY-MM-DD')
  );
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const state = location.state as { scheduledAt?: string } | null;
    if (state?.scheduledAt) {
      const dt = moment(state.scheduledAt);
      setScheduledDate(dt.format('YYYY-MM-DD'));
      setScheduledTime(dt.format('HH:mm'));
    }
  }, [location.state]);

  useEffect(() => {
    if (id) {
      loadPost(id);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    try {
      setIsLoading(true);
      const post = await postsApi.getPost(postId);
      setTitle(post.title);
      setContent(post.content);
      setSummary(post.summary);
      setPlatform(post.platform);
      const dt = moment(post.scheduledAt);
      setScheduledDate(dt.format('YYYY-MM-DD'));
      setScheduledTime(dt.format('HH:mm'));
      if (editorRef.current) {
        editorRef.current.innerHTML = post.content;
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertMention = () => {
    const mention = prompt('请输入要@的用户名:');
    if (mention) {
      execCommand('insertText', `@${mention} `);
    }
  };

  const insertImage = () => {
    const url = prompt('请输入图片URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const generateSummary = async () => {
    const plainContent = content.replace(/<[^>]*>/g, '').trim();
    if (!plainContent || plainContent.length === 0) {
      setToast({ message: '请先输入内容', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      setIsGenerating(true);
      const result = await aiApi.generateSummary(plainContent);
      setSummary(result.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setToast({ message: '生成摘要失败，请重试', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const savePost = async (status: PostStatus) => {
    if (!title.trim()) {
      setToast({ message: '请输入标题', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const scheduledAt = moment(`${scheduledDate} ${scheduledTime}`).toISOString();
    const postData = {
      title,
      content,
      summary,
      platform,
      scheduledAt,
      status,
    };

    try {
      if (id) {
        await postsApi.updatePost(id, postData);
      } else {
        await postsApi.createPost(postData);
      }

      setToast({
        message: status === 'draft' ? '草稿已保存' : '已加入发布队列',
        type: 'success',
      });

      setTimeout(() => {
        setToast(null);
        navigate('/calendar');
      }, 1500);
    } catch (error) {
      console.error('Failed to save post:', error);
      setToast({ message: '保存失败，请重试', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const summaryLength = summary.length;
  const isSummaryOverLimit = summaryLength > 100;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? '编辑内容' : '新建内容'}
            </h1>
            <p className="text-gray-500 mt-1">编辑您的内容并设置发布信息</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => savePost('draft')} className="btn btn-secondary gap-2">
              <Save size={16} />
              保存草稿
            </button>
            <button onClick={() => savePost('queued')} className="btn btn-primary gap-2">
              <Send size={16} />
              加入发布队列
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <input
                type="text"
                placeholder="输入一个吸引人的标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-semibold border-none outline-none placeholder:text-gray-400 text-gray-900 pb-4 border-b border-gray-100"
              />

              <div className="flex items-center gap-1 py-3 border-b border-gray-100 flex-wrap">
                <ToolbarButton onClick={() => execCommand('bold')} title="加粗">
                  <Bold size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('italic')} title="斜体">
                  <Italic size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('underline')} title="下划线">
                  <Underline size={16} />
                </ToolbarButton>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="无序列表">
                  <List size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="有序列表">
                  <ListOrdered size={16} />
                </ToolbarButton>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarButton onClick={insertImage} title="插入图片">
                  <Image size={16} />
                </ToolbarButton>
                <ToolbarButton onClick={insertMention} title="@提及">
                  <AtSign size={16} />
                </ToolbarButton>
              </div>

              <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="min-h-[300px] pt-4 outline-none text-gray-700 leading-relaxed"
                style={{ whiteSpace: 'pre-wrap' }}
                suppressContentEditableWarning
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">发布设置</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标平台
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {platforms.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          platform === p
                            ? 'text-white shadow-sm'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                        style={
                          platform === p
                            ? { backgroundColor: PLATFORM_COLORS[p] }
                            : undefined
                        }
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PLATFORM_COLORS[p] }}
                        />
                        {PLATFORM_NAMES[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    发布日期
                  </label>
                  <div className="relative">
                    <CalendarIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    发布时间
                  </label>
                  <div className="relative">
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">内容摘要</h3>
                <button
                  onClick={generateSummary}
                  disabled={isGenerating}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isGenerating
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? '生成中...' : 'AI生成'}
                </button>
              </div>

              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="输入内容摘要，或点击上方按钮由AI自动生成..."
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                {isSummaryOverLimit && (
                  <>
                    <AlertCircle size={14} className="text-red-500" />
                    <span className="text-xs text-red-500">超过100字限制</span>
                  </>
                )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isSummaryOverLimit ? 'text-red-500' : 'text-gray-400'
                  }`}
                >
                  {summaryLength}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
