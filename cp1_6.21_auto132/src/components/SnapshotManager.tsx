import React, { useState } from 'react';
import axios from 'axios';
import { useApp, createSnapshot, setSnapshotToURL } from '../context/AppContext';

export default function SnapshotManager() {
  const { state, dispatch } = useApp();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snapshots, setSnapshots] = useState<Array<{ id: string; name: string; createdAt: number }>>([]);
  const [showSavedList, setShowSavedList] = useState(false);

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  };

  const handleSaveSnapshot = async () => {
    setSaving(true);
    try {
      const snapshot = createSnapshot(state.components, state.theme);
      const name = prompt('请输入快照名称:', `快照 ${new Date().toLocaleString()}`);
      if (!name) {
        setSaving(false);
        return;
      }
      await axios.post('/api/snapshots', { ...snapshot, name });
      dispatch({ type: 'SHOW_NOTIFICATION', payload: '快照已保存' });
      loadSnapshots();
    } catch (e) {
      dispatch({ type: 'SHOW_NOTIFICATION', payload: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  const loadSnapshots = async () => {
    try {
      const res = await axios.get('/api/snapshots');
      setSnapshots(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadSnapshot = async (id: string) => {
    try {
      const res = await axios.get(`/api/snapshots/${id}`);
      const data = res.data;
      dispatch({
        type: 'LOAD_SNAPSHOT',
        payload: { components: data.components, theme: data.theme },
      });
      dispatch({ type: 'SHOW_NOTIFICATION', payload: '快照已加载' });
      setShowSavedList(false);
    } catch (e) {
      dispatch({ type: 'SHOW_NOTIFICATION', payload: '加载失败' });
    }
  };

  const handleGenerateShare = () => {
    const snapshot = createSnapshot(state.components, state.theme);
    const url = setSnapshotToURL(snapshot);
    setShareUrl(url);
    setShowShareModal(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDark = state.theme === 'dark';
  const bgClass = isDark ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-slate-200';
  const textClass = isDark ? 'text-slate-200' : 'text-slate-700';
  const subTextClass = isDark ? 'text-slate-400' : 'text-slate-500';
  const hoverBg = isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100';
  const modalBg = isDark ? 'bg-slate-800' : 'bg-white';

  return (
    <>
      <header
        className={`sticky top-0 z-20 h-16 flex items-center justify-between px-4 md:px-6 border-b ${bgClass} transition-colors duration-500`}
      >
        <div className="flex items-center gap-3 md:pl-16 md:pl-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
            </svg>
          </div>
          <div>
            <h1 className={`text-lg font-bold ${textClass}`}>UI组件沙盒</h1>
            <p className={`text-xs ${subTextClass} hidden sm:block`}>实时预览 · 配置分享</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowSavedList(!showSavedList);
              if (!showSavedList) loadSnapshots();
            }}
            className={`hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${hoverBg} ${textClass}`}
            title="已保存快照"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>快照库</span>
          </button>

          <button
            onClick={handleSaveSnapshot}
            disabled={saving || state.components.length === 0}
            className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {saving ? '保存中' : '保存快照'}
          </button>

          <button
            onClick={handleGenerateShare}
            disabled={state.components.length === 0}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span className="hidden sm:inline">分享</span>
          </button>

          <button
            onClick={toggleTheme}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDark ? 'bg-slate-700 text-yellow-300' : 'bg-slate-100 text-slate-700'
            } hover:scale-105`}
            title={isDark ? '切换浅色模式' : '切换深色模式'}
          >
            {isDark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className={`${modalBg} rounded-2xl p-6 w-full max-w-lg shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-bold mb-2 ${textClass}`}>分享链接</h3>
            <p className={`text-sm mb-4 ${subTextClass}`}>将此链接发送给他人即可恢复相同的组件配置</p>
            <div className={`flex gap-2 p-2 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-slate-100'} mb-4`}>
              <input
                readOnly
                value={shareUrl}
                className={`flex-1 bg-transparent outline-none text-xs ${textClass}`}
              />
              <button
                onClick={handleCopy}
                className={`px-3 h-8 rounded-md text-sm font-medium transition-colors ${
                  copied ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full h-10 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {showSavedList && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowSavedList(false)}
        >
          <div
            className={`absolute top-20 right-4 md:right-8 w-80 max-w-[90vw] ${modalBg} rounded-2xl shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <h3 className={`text-base font-bold ${textClass}`}>已保存的快照</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {snapshots.length === 0 ? (
                <div className={`p-8 text-center ${subTextClass}`}>
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <p className="text-sm">暂无保存的快照</p>
                </div>
              ) : (
                <ul className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                  {snapshots.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => handleLoadSnapshot(s.id)}
                        className={`w-full text-left p-4 hover:bg-slate-100 ${isDark ? 'hover:bg-slate-700/50' : ''} transition-colors`}
                      >
                        <div className={`text-sm font-medium ${textClass}`}>{(s as any).name || '未命名快照'}</div>
                        <div className={`text-xs mt-1 ${subTextClass}`}>
                          {new Date(s.createdAt).toLocaleString()}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {state.notification && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            state.notification.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
          }`}
        >
          <div className="h-16 bg-emerald-500 flex items-center justify-center text-white font-medium shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {state.notification.message}
          </div>
        </div>
      )}
    </>
  );
}
