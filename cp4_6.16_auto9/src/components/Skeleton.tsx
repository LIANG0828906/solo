import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-card shadow-card overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-cream-100" />
    <div className="p-4 space-y-3">
      <div className="h-5 w-2/3 bg-cream-100 rounded" />
      <div className="h-3 w-1/2 bg-cream-50 rounded" />
      <div className="h-2.5 w-full bg-cream-100 rounded" />
      <div className="flex gap-1.5 pt-1">
        <div className="h-4 w-10 bg-cream-100 rounded-full" />
        <div className="h-4 w-10 bg-cream-100 rounded-full" />
      </div>
    </div>
  </div>
);

export const CommentSkeleton: React.FC = () => (
  <div className="flex gap-3 animate-pulse">
    <div className="w-9 h-9 rounded-full bg-cream-200 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-16 rounded-2xl rounded-tl-md bg-cream-100 border border-cream-200" />
      <div className="h-3 w-12 bg-cream-100 rounded" />
    </div>
  </div>
);

export default CardSkeleton;
