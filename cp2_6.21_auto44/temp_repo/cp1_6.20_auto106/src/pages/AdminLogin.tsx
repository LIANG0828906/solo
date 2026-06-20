import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, ArrowRight } from 'lucide-react';

export function AdminLogin() {
  const [eventId, setEventId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventId.trim()) {
      setError('请输入活动ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${eventId.trim()}`);
      if (!response.ok) {
        throw new Error('活动不存在');
      }
      
      navigate(`/admin/event/${eventId.trim()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in flex flex-col">
      <div className="bg-primary text-white py-6 px-4">
        <div className="container mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <h1 className="text-3xl font-bold">签到管理后台</h1>
          <p className="text-white/70 mt-2">请输入活动ID进入签到管理页面</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-center text-primary mb-2">
            活动签到管理
          </h2>
          <p className="text-gray-500 text-center mb-8">
            输入活动ID以管理签到
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                活动ID
              </label>
              <input
                type="text"
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setError('');
                }}
                placeholder="请输入活动ID"
                className={`
                  w-full px-4 py-3 rounded-lg border-2 transition-all
                  focus:outline-none focus:ring-2 focus:ring-primary/30
                  ${error
                    ? 'border-danger focus:border-danger focus:ring-danger/30'
                    : 'border-gray-200 focus:border-primary'
                  }
                `}
              />
              {error && (
                <p className="text-danger text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3.5 px-6 rounded-lg font-semibold text-white
                transition-all duration-200 flex items-center justify-center gap-2
                hover:scale-[1.02] active:scale-[0.98]
                ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-light'
                }
              `}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  进入管理
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">演示活动ID：</p>
            <div className="flex flex-wrap gap-2">
              {['evt-001', 'evt-002', 'evt-003', 'evt-004', 'evt-005'].map((id) => (
                <button
                  key={id}
                  onClick={() => setEventId(id)}
                  className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-primary hover:text-white transition-colors"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
