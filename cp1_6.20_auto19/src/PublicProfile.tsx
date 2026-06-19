import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { getPublicProfile } from './api';
import type { AppData, Project } from './types';
import SkillGraph from './SkillGraph';
import Timeline from './Timeline';
import { cn } from './lib/utils';

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getPublicProfile(id);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--color-dark-green)]" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-800">加载失败</h2>
          <p className="text-gray-600">{error || '无法加载该个人资料'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2 bg-[var(--color-dark-green)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const { profile, skills, projects } = data;

  const timelineProjects = projects;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-[900px] mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fadeIn">
          <div className="relative h-32 bg-gradient-to-r from-[var(--color-dark-green)] to-[#2d7a4e]" />

          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-gray-200"
                />
                <div className="text-center sm:text-left pb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-gray-600 mt-1 max-w-md">{profile.bio}</p>
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[var(--color-dark-green)] hover:underline"
                    >
                      <ExternalLink size={16} />
                      <span className="text-sm">{profile.website}</span>
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300',
                  'self-center sm:self-auto',
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[var(--color-amber)] text-white hover:opacity-90 active:scale-95'
                )}
              >
                {copied ? (
                  <>
                    <Check size={18} className="animate-checkmark" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>复制分享链接</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[var(--color-amber)] rounded-full" />
                技能树
              </h2>
              <div className="bg-gray-50 rounded-xl p-4 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
                <SkillGraph skills={skills} editable={false} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[var(--color-amber)] rounded-full" />
                项目时间轴
              </h2>
              <div
                className="bg-gray-50 rounded-xl p-4 animate-slideInLeft"
                style={{ animationDelay: '0.2s' }}
              >
                <Timeline projects={timelineProjects} editable={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
