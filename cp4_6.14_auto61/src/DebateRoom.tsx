import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useDebateStore } from './store/debateStore';
import { usePrecisionTimer } from './hooks/usePrecisionTimer';
import { playBeep } from './utils/audio';
import { formatTime, formatTimeRemaining, formatTimestamp } from './utils/time';
import type { Speaker, SubmitArgumentRequest } from './types';

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
  </svg>
);

const SwitchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4" />
    <path d="M3 8l4-4 4 4" />
    <path d="M17 8v12" />
    <path d="M21 16l-4 4-4-4" />
  </svg>
);

const ResetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const TRUNCATE_LENGTH = 50;

export default function DebateRoom() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentDebate,
    arguments: args,
    records,
    fetchDebate,
    fetchArguments,
    fetchRecords,
    submitArgument,
    switchSpeaker,
    resetTimer,
    markTimeUp,
    updateTimer,
    setRemainingTime,
  } = useDebateStore();

  const [displayTime, setDisplayTime] = useState(0);
  const [showBorderFlash, setShowBorderFlash] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [argumentInput, setArgumentInput] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker>('pro');
  const [expandedArgs, setExpandedArgs] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasHandledTimeUp = useRef(false);

  const handleTimerTick = useCallback((remaining: number) => {
    setDisplayTime(remaining);
    setRemainingTime(remaining);
  }, [setRemainingTime]);

  const handleTimerComplete = useCallback(() => {
    if (!hasHandledTimeUp.current) {
      hasHandledTimeUp.current = true;
      playBeep(440, 0.5);
      setShowBorderFlash(true);
      markTimeUp(id);
      setTimeout(() => setShowBorderFlash(false), 1000);
    }
  }, [id, markTimeUp]);

  const initialDuration = currentDebate?.remainingTime ?? 300000;
  
  const timer = usePrecisionTimer({
    duration: initialDuration,
    onTick: handleTimerTick,
    onComplete: handleTimerComplete,
  });

  useEffect(() => {
    fetchDebate(id);
    fetchArguments(id);
    fetchRecords(id);
    
    const interval = setInterval(() => {
      fetchArguments(id);
      fetchRecords(id);
    }, 2000);

    return () => clearInterval(interval);
  }, [id, fetchDebate, fetchArguments, fetchRecords]);

  useEffect(() => {
    if (currentDebate) {
      setDisplayTime(currentDebate.remainingTime);
      timer.reset(currentDebate.remainingTime);
      hasHandledTimeUp.current = false;
    }
  }, [currentDebate?.id, currentDebate?.currentSpeaker, currentDebate, timer]);

  const handleStartPause = async () => {
    if (timer.isRunning) {
      timer.pause();
      await updateTimer(id, false, displayTime, currentDebate?.currentSpeaker);
    } else {
      if (displayTime <= 0) {
        const duration = currentDebate?.currentSpeaker === 'pro' 
          ? (currentDebate?.proDuration ?? 5) * 60 * 1000 
          : (currentDebate?.conDuration ?? 5) * 60 * 1000;
        timer.reset(duration);
        setDisplayTime(duration);
      }
      hasHandledTimeUp.current = false;
      timer.start();
      await updateTimer(id, true, displayTime, currentDebate?.currentSpeaker);
    }
  };

  const handleSwitchSpeaker = async () => {
    timer.pause();
    hasHandledTimeUp.current = false;
    await switchSpeaker(id);
  };

  const handleReset = async () => {
    timer.pause();
    hasHandledTimeUp.current = false;
    await resetTimer(id);
  };

  const handleSubmitArgument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!argumentInput.trim() || !authorName.trim() || isSubmitting) return;
    if (argumentInput.length > 150) return;

    setIsSubmitting(true);
    
    const data: SubmitArgumentRequest = {
      author: authorName.trim(),
      speaker: selectedSpeaker,
      content: argumentInput.trim(),
    };
    
    const result = await submitArgument(id, data);
    
    if (result) {
      setArgumentInput('');
    }
    
    setIsSubmitting(false);
  };

  const toggleArgExpand = (argId: string) => {
    setExpandedArgs((prev) => {
      const next = new Set(prev);
      if (next.has(argId)) {
        next.delete(argId);
      } else {
        next.add(argId);
      }
      return next;
    });
  };

  const getSpeakerLabel = (speaker: Speaker) => {
    if (speaker === 'pro') {
      return { name: currentDebate?.proSpeaker ?? '正方', label: '正方发言', color: 'text-debate-positive' };
    }
    return { name: currentDebate?.conSpeaker ?? '反方', label: '反方发言', color: 'text-debate-negative' };
  };

  const currentSpeakerInfo = getSpeakerLabel(currentDebate?.currentSpeaker ?? 'pro');

  const isSubmitDisabled = !argumentInput.trim() || !authorName.trim() || argumentInput.length > 150 || isSubmitting;

  if (!currentDebate) {
    return (
      <div className="min-h-screen bg-debate-bg-primary flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const isBreathing = timer.isRunning;

  return (
    <div className={`min-h-screen ${isBreathing ? 'animate-breathing' : 'bg-debate-bg-primary'} transition-colors duration-1000`}>
      <div
        className={`fixed top-0 left-0 right-0 h-1 z-50 transition-all duration-200 ${showBorderFlash ? 'bg-debate-negative animate-border-flash-infinite' : 'bg-transparent'}`}
      />

      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="返回"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-debate-primary">{currentDebate.name}</h1>
              <p className="text-sm text-gray-500">
                <span className="text-debate-positive font-medium">{currentDebate.proSpeaker}</span>
                {' vs '}
                <span className="text-debate-negative font-medium">{currentDebate.conSpeaker}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="菜单"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`
            fixed md:sticky top-14 md:top-0 left-0 z-30
            w-80 h-[calc(100vh-3.5rem)] md:h-screen
            bg-white shadow-lg md:shadow-none
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            overflow-y-auto
          `}
        >
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-debate-primary mb-4">论点面板</h2>

            <form onSubmit={handleSubmitArgument} className="space-y-3 mb-4">
              <div>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="你的昵称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSpeaker('pro')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${selectedSpeaker === 'pro' ? 'bg-debate-positive text-white focus:ring-green-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'}`}
                >
                  正方
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSpeaker('con')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${selectedSpeaker === 'con' ? 'bg-debate-negative text-white focus:ring-red-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'}`}
                >
                  反方
                </button>
              </div>

              <div>
                <textarea
                  value={argumentInput}
                  onChange={(e) => setArgumentInput(e.target.value)}
                  placeholder="输入论点（最多150字）"
                  maxLength={150}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${argumentInput.length > 150 ? 'text-red-500' : 'text-gray-400'}`}>
                    {argumentInput.length}/150
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full py-2 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSubmitDisabled ? 'bg-[#9ca3af] cursor-not-allowed' : 'bg-[#2563eb] hover:bg-blue-700 focus:ring-blue-500'}`}
              >
                <Send size={16} />
                {isSubmitting ? '提交中...' : '提交论点'}
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2">
              {args.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无论点，快来提交第一个论点吧
                </div>
              ) : (
                args.map((arg, index) => {
                  const isExpanded = expandedArgs.has(arg.id);
                  const isLong = arg.content.length > TRUNCATE_LENGTH;
                  const displayContent = isExpanded || !isLong ? arg.content : `${arg.content.slice(0, TRUNCATE_LENGTH)}...`;
                  const bgColor = index % 2 === 0 ? 'bg-[#f1f5f9]' : 'bg-white';

                  return (
                    <div
                      key={arg.id}
                      className={`${bgColor} rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-100`}
                      onClick={() => isLong && toggleArgExpand(arg.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${arg.speaker === 'pro' ? 'text-debate-positive' : 'text-debate-negative'}`}>
                          {arg.author}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(arg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{displayContent}</p>
                      {isLong && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-debate-accent">
                          {isExpanded ? (
                            <>
                              收起 <ChevronUp size={12} />
                            </>
                          ) : (
                            <>
                              展开全文 <ChevronDown size={12} />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0">
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="bg-[#1e3a8a] rounded-2xl px-12 py-8 shadow-2xl mb-6">
              <div className="font-mono text-white text-[64px] leading-none tracking-wider tabular-nums">
                {formatTime(displayTime)}
              </div>
            </div>

            <div className="text-center mb-6">
              <div className={`text-2xl font-bold ${currentSpeakerInfo.color} mb-2`}>
                {currentSpeakerInfo.label}
              </div>
              <div className="text-lg text-gray-600">
                当前发言：<span className={`font-medium ${currentSpeakerInfo.color}`}>{currentSpeakerInfo.name}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                剩余时长：{formatTimeRemaining(displayTime)}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={handleStartPause}
                className="w-[44px] h-[44px] rounded-full bg-[#16a34a] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label={timer.isRunning ? '暂停' : '开始'}
              >
                {timer.isRunning ? <PauseIcon /> : <PlayIcon />}
              </button>

              <button
                onClick={handleSwitchSpeaker}
                className="w-[44px] h-[44px] rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="切换发言方"
              >
                <SwitchIcon />
              </button>

              <button
                onClick={handleReset}
                className="w-[44px] h-[44px] rounded-full bg-[#dc2626] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="重置计时"
              >
                <ResetIcon />
              </button>
            </div>
          </div>

          <div className="bg-white mx-4 md:mx-8 rounded-t-2xl shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-debate-primary">辩论记录</h3>
            </div>
            <div className="h-64 overflow-y-auto p-4">
              {records.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  暂无辩论记录
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => {
                    const speakerColor = record.speaker === 'pro' ? 'text-[#2563eb]' : 'text-[#dc2626]';
                    const speakerLabel = record.speaker === 'pro' ? '正方' : '反方';
                    
                    let content = '';
                    switch (record.type) {
                      case 'argument':
                        content = record.content ?? '';
                        break;
                      case 'timer_start':
                        content = `${speakerLabel}开始发言`;
                        break;
                      case 'timer_pause':
                        content = `${speakerLabel}暂停发言`;
                        break;
                      case 'timer_reset':
                        content = `${speakerLabel}重置计时`;
                        break;
                      case 'switch_speaker':
                        content = `切换至${speakerLabel}发言`;
                        break;
                      case 'time_up':
                        content = `${speakerLabel}发言时间到`;
                        break;
                      default:
                        content = record.content ?? '';
                    }

                    return (
                      <div key={record.id} className="text-sm leading-[1.5]">
                        <span className="text-gray-400 mr-2">
                          [{formatTimestamp(record.timestamp)}]
                        </span>
                        <span className={`font-medium ${speakerColor} mr-2`}>
                          {speakerLabel}
                        </span>
                        <span className="text-gray-700">{content}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
