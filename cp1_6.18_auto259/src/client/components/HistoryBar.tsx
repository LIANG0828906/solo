import React, { useState } from 'react';
import { History, ChevronUp, ChevronDown, Download, Calendar, X } from 'lucide-react';
import { useAppStore } from '../store';
import type { VoteHistory } from '../types';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

interface HistoryBarProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

export const HistoryBar = ({ socket }: HistoryBarProps) => {
  const { history, isHistoryOpen, toggleHistory, roomId } = useAppStore();
  const currentRoomId = roomId!;
  const [selectedHistory, setSelectedHistory] = useState<VoteHistory | null>(null);

  const handleToggle = () => {
    if (!isHistoryOpen && socket) {
      socket.emit('history:get', { roomId: currentRoomId });
    }
    toggleHistory();
  };

  const handleExport = (item: VoteHistory) => {
    const dataStr = JSON.stringify(item, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vote-${item.roomId}-${new Date(item.endedAt).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-40
          bg-[#1A1A2E] border-t border-white/10
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isHistoryOpen ? 'translate-y-0' : 'translate-y-[calc(100%-56px)]'}
        `}
      >
        <button
          onClick={handleToggle}
          className="
            w-full h-14 px-6
            flex items-center justify-between
            text-white hover:bg-white/5
            transition-colors duration-200
          "
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-[#FF8906]" />
            <span className="font-medium">历史记录</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF8906]/20 text-[#FF8906]">
              {history.length}
            </span>
          </div>
          {isHistoryOpen ? (
            <ChevronDown className="w-5 h-5 text-[#888899]" />
          ) : (
            <ChevronUp className="w-5 h-5 text-[#888899]" />
          )}
        </button>

        <div className="max-h-64 overflow-y-auto px-6 pb-6">
          {history.length === 0 ? (
            <div className="py-8 text-center text-[#555566]">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无历史投票记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="
                    p-4 rounded-xl bg-[#0F0E17] border border-white/5
                    hover:border-[#FF8906]/30 hover:bg-[#16213E]
                    transition-all duration-200 cursor-pointer
                  "
                  onClick={() => setSelectedHistory(item)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#888899]">
                      {formatDate(item.endedAt)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(item);
                      }}
                      className="
                        p-1.5 rounded-lg
                        text-[#888899] hover:text-[#FF8906] hover:bg-[#FF8906]/10
                        transition-all duration-200
                      "
                      title="导出JSON"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-white mb-2">
                    {item.options.length} 个选项 · {item.totalVotes} 票
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.options.slice(0, 3).map((opt, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded bg-white/5 text-[#888899] truncate max-w-[100px]"
                        title={opt.content}
                      >
                        {opt.content.length > 15 ? opt.content.substring(0, 15) + '...' : opt.content}
                      </span>
                    ))}
                    {item.options.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-[#888899]">
                        +{item.options.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedHistory(null)}
        >
          <div
            className="w-full max-w-lg bg-[#1A1A2E] rounded-2xl border border-white/10 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">投票详情</h3>
              <button
                onClick={() => setSelectedHistory(null)}
                className="p-2 rounded-lg text-[#888899] hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#888899]">房间号</span>
                <span className="text-white font-mono">{selectedHistory.roomId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#888899]">开始时间</span>
                <span className="text-white">{formatDate(selectedHistory.startedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#888899]">结束时间</span>
                <span className="text-white">{formatDate(selectedHistory.endedAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#888899]">总票数</span>
                <span className="text-[#FF8906] font-medium">{selectedHistory.totalVotes}</span>
              </div>
            </div>

            <h4 className="text-sm font-medium text-white mb-3">投票结果</h4>
            <div className="space-y-3">
              {selectedHistory.options
                .sort((a, b) => b.votes - a.votes)
                .map((opt, idx) => {
                  const percentage = selectedHistory.totalVotes > 0
                    ? (opt.votes / selectedHistory.totalVotes * 100).toFixed(1)
                    : '0';
                  const maxVotes = Math.max(...selectedHistory.options.map(o => o.votes));
                  const width = maxVotes > 0 ? (opt.votes / maxVotes * 100) : 0;

                  return (
                    <div key={idx} className="relative">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#E0E0E0] truncate flex-1 mr-2" title={opt.content}>
                          {idx + 1}. {opt.content}
                        </span>
                        <span className="text-[#FF8906] font-medium whitespace-nowrap">
                          {opt.votes}票 ({percentage}%)
                        </span>
                      </div>
                      <div className="h-8 rounded-lg bg-[#0F0E17] overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{
                            width: `${Math.max(width, opt.votes > 0 ? 2 : 0)}%`,
                            background: 'linear-gradient(90deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => handleExport(selectedHistory)}
              className="
                w-full mt-6 py-3 rounded-xl
                bg-[#FF8906] text-white font-medium
                hover:bg-[#FF9500] hover:shadow-lg hover:shadow-[#FF8906]/30
                active:scale-98
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              <Download size={18} />
              导出为JSON
            </button>
          </div>
        </div>
      )}
    </>
  );
};
