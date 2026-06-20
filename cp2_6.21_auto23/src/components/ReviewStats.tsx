import { usePetStore } from '@/store/petStore';
import StarRating from './StarRating';

export default function ReviewStats() {
  const { getReviewStats, appointments, pets, services, getAppointmentReview } = usePetStore();
  const stats = getReviewStats();

  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name ?? '未知';
  const getPetName = (id: string) => pets.find((p) => p.id === id)?.name ?? '未知';
  const getPetAvatar = (id: string) => pets.find((p) => p.id === id)?.avatar ?? '🐾';

  const completedWithoutReview = appointments.filter(
    (a) => a.status === 'completed' && !getAppointmentReview(a.id)
  );

  return (
    <div className="rounded-xl border border-[#e0d6c8] bg-white p-5">
      <h3 className="mb-4 text-base font-bold text-[#3e3228]">📊 服务统计</h3>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#fef9f2] p-3 text-center">
          <div className="text-2xl font-extrabold text-[#4caf50]">{stats.totalServices}</div>
          <div className="text-xs text-[#a09488]">总服务次数</div>
        </div>
        <div className="rounded-lg bg-[#fef9f2] p-3 text-center">
          <div className="text-2xl font-extrabold text-[#4caf50]">{stats.averageRating}</div>
          <div className="text-xs text-[#a09488]">平均评分</div>
        </div>
      </div>

      {stats.recentReviews.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-[#3e3228]">最近评价</h4>
          <div className="space-y-2">
            {stats.recentReviews.map((review) => {
              const apt = appointments.find((a) => a.id === review.appointmentId);
              const petId = apt?.petId ?? '';
              return (
                <div key={review.id} className="rounded-lg bg-[#fef9f2] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#3e3228]">
                      {getPetAvatar(petId)} {getPetName(petId)}
                      {apt && ` · ${getServiceName(apt.serviceId)}`}
                    </span>
                    <StarRating value={review.rating} size={14} readOnly />
                  </div>
                  <p className="mt-1 text-xs text-[#7a6e62] line-clamp-2">{review.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedWithoutReview.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-[#3e3228]">待评价服务</h4>
          <div className="space-y-2">
            {completedWithoutReview.slice(0, 3).map((apt) => (
              <div key={apt.id} className="flex items-center justify-between rounded-lg bg-[#e8f5e9] p-2">
                <div className="text-xs">
                  <span className="font-semibold text-[#3e3228]">
                    {getPetAvatar(apt.petId)} {getPetName(apt.petId)}
                  </span>
                  <span className="text-[#7a6e62]"> · {getServiceName(apt.serviceId)}</span>
                </div>
                <span className="text-xs text-[#4caf50]">去评价 →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.totalServices === 0 && (
        <p className="text-center text-sm text-[#a09488]">暂无服务记录</p>
      )}
    </div>
  );
}
