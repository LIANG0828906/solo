import React from 'react';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade_in">
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
        <circle cx="80" cy="80" r="70" fill="#F5E6D3" />
        <path d="M55 65h50l-5 45H60L55 65z" stroke="#8D6E63" strokeWidth="3" fill="none" />
        <path d="M60 55c0-8 8-14 20-14s20 6 20 14" stroke="#D4B896" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M70 75c2-3 6-3 8 0M82 75c2-3 6-3 8 0" stroke="#8D6E63" strokeWidth="2" strokeLinecap="round" />
        <path d="M80 90c-4 0-6 3-6 6h12c0-3-2-6-6-6z" stroke="#8D6E63" strokeWidth="2" fill="none" />
        <path d="M45 75c-5 2-8 8-5 14s10 5 10 5" stroke="#D4B896" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
        <circle cx="100" cy="40" r="4" fill="#FFBF00" opacity="0.6" />
        <circle cx="50" cy="45" r="3" fill="#FFBF00" opacity="0.4" />
        <circle cx="110" cy="55" r="2.5" fill="#FFBF00" opacity="0.3" />
      </svg>
      <h3 className="font-display text-xl text-coffee-700 mb-2">还没有冲煮记录</h3>
      <p className="text-coffee-500 text-sm text-center max-w-xs">
        在右侧表单中记录你的第一次冲煮，开始追踪你的咖啡风味之旅
      </p>
    </div>
  );
}
