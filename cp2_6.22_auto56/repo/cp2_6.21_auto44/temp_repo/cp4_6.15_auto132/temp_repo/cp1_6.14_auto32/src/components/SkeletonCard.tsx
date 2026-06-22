export default function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      <div className="aspect-[4/3] w-full bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2.5">
        <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
        <div className="h-5 w-16 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-3 w-12 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="h-3 w-14 rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
