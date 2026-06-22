/**
 * 【组件职责】统一的骨架屏加载组件，包含公告栏卡片骨架、列表骨架、详情页骨架三种形式
 * 【被调用方】Home 首页列表、MatchDetail 详情页、推荐玩家面板（请求/超时时作为 fallback）
 * 【数据流向】父组件根据 loading/error 状态条件渲染 → 本组件通过 CSS 动画呈现呼吸占位效果
 */
import { cn } from '@/lib/utils';

function SkeletonBlock({
  className,
  rounded = 'rounded-md',
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={cn(
        'bg-court-wood/60 animate-skeleton-pulse',
        rounded,
        className,
      )}
    />
  );
}

function PushPinPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-6 h-6 rounded-full bg-court-wood/70 animate-skeleton-pulse shadow-inner',
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="relative w-full rounded-lg border border-court-brownLight/30 bg-court-cream overflow-hidden
                 shadow-[0_2px_8px_rgba(62,39,35,0.1),0_6px_20px_rgba(62,39,35,0.06)]
                 animate-bounce-in"
      style={{ transform: 'rotate(0.3deg)' }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-5 bg-court-wood/50 animate-skeleton-pulse rounded-sm" />

      <div className="absolute -top-3 left-4 animate-pin-drop">
        <PushPinPlaceholder />
      </div>
      <div className="absolute -top-3 right-4 animate-pin-drop">
        <PushPinPlaceholder />
      </div>

      <div className="p-5 pt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="w-12 h-6 rounded-full" />
          <SkeletonBlock className="w-20 h-5" />
        </div>

        <SkeletonBlock className="w-4/5 h-7 rounded-md" />
        <SkeletonBlock className="w-2/3 h-5 rounded-md" />

        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="w-4 h-4 rounded-full" />
            <SkeletonBlock className="w-32 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="w-4 h-4 rounded-full" />
            <SkeletonBlock className="w-40 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="w-4 h-4 rounded-full" />
            <SkeletonBlock className="w-24 h-4" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <SkeletonBlock className="w-20 h-5" />
          <SkeletonBlock className="w-24 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
}

export function SkeletonList({ count = 6 }: SkeletonListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            animationDelay: `${i * 0.08}s`,
            transform: `rotate(${i % 2 === 0 ? 0.3 : -0.4}deg)`,
          }}
        >
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

export function SkeletonMatchDetail() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 sm:p-6 animate-fade-up">
      <div className="relative rounded-2xl border border-court-brownLight/30 bg-court-cream p-6 sm:p-8 overflow-hidden
                      shadow-[0_4px_16px_rgba(62,39,35,0.12),0_12px_36px_rgba(62,39,35,0.08)]">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-40 h-6 bg-court-wood/50 animate-skeleton-pulse rounded-sm" />

        <div className="absolute -top-4 left-8 animate-pin-drop">
          <PushPinPlaceholder className="w-7 h-7" />
        </div>
        <div className="absolute -top-4 right-8 animate-pin-drop">
          <PushPinPlaceholder className="w-7 h-7" />
        </div>

        <div className="pt-4 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <SkeletonBlock className="w-16 h-7 rounded-full" />
            <SkeletonBlock className="w-24 h-6 rounded-full" />
          </div>

          <SkeletonBlock className="w-5/6 h-10 rounded-md" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBlock className="w-5 h-5 rounded-full" />
                <SkeletonBlock className={`w-${i % 2 === 0 ? '40' : '32'} h-5 flex-1`} />
              </div>
            ))}
          </div>

          <div className="pt-3 space-y-2">
            <SkeletonBlock className="w-16 h-4" />
            <SkeletonBlock className="w-full h-4" />
            <SkeletonBlock className="w-5/6 h-4" />
            <SkeletonBlock className="w-4/6 h-4" />
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock
                key={i}
                className={`w-${i % 2 === 0 ? '24' : '20'} h-10 rounded-lg`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-court-brownLight/20 bg-white p-5 shadow-sm">
          <SkeletonBlock className="w-24 h-5 mb-4" />
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-full bg-court-wood/40 animate-skeleton-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  <SkeletonBlock className="w-3 h-3 rounded-sm" />
                  <SkeletonBlock className="w-8 h-3" />
                </div>
                <SkeletonBlock className="w-4 h-4" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-court-brownLight/20 bg-white p-5 shadow-sm space-y-3">
          <SkeletonBlock className="w-20 h-5 mb-2" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-court-cream/40"
            >
              <SkeletonBlock className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="w-28 h-4" />
                <SkeletonBlock className="w-16 h-3" />
              </div>
              <SkeletonBlock className="w-14 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonRecommendList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-court-cream/50 animate-skeleton-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <SkeletonBlock className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-24 h-4" />
              <SkeletonBlock className="w-10 h-4 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-16 h-3" />
              <SkeletonBlock className="w-12 h-3" />
            </div>
          </div>
          <SkeletonBlock className="w-16 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
