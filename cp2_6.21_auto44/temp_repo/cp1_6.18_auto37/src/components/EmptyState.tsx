interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = '暂无匹配的活动' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <span className="text-6xl mb-4">🎨</span>
      <p className="text-purple-border font-body text-sm">{message}</p>
    </div>
  );
}
