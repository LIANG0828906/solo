import { useState } from 'react'
import { MapPin, UserPlus, User, Phone, X } from 'lucide-react'
import type { Activity, Registration, Equipment, WeatherForecast } from '@/types'

interface ActivityDetailProps {
  activity: Activity | null
  registrations: Registration[]
  equipment: Equipment[]
  weatherForecasts: WeatherForecast[]
  onRegister: () => void
}

export default function ActivityDetail({
  activity,
  registrations,
  equipment,
  weatherForecasts,
  onRegister,
}: ActivityDetailProps) {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  if (!activity) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        <div className="text-center">
          <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">请从左侧选择一个活动</p>
        </div>
      </div>
    )
  }

  const hasRain = weatherForecasts.some(
    (f) => f.date === activity.date && (f.icon === 'rainy' || f.icon === 'stormy')
  )

  const isFull = registrations.length >= activity.maxMembers

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {hasRain && (
        <div
          className="bg-warning-bg text-warning-text px-4 py-2.5 text-sm font-medium flex items-center gap-2 animate-scroll-in-right"
        >
          <span className="shrink-0">⚠️</span>
          预计活动当天有雨，请备好雨具
        </div>
      )}

      <div className="p-5 flex-1" key={activity.id}>
        <div className="animate-slide-in-left">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">{activity.name}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {activity.location}
                </span>
                <span>{activity.date}</span>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <h3 className="text-sm font-semibold text-text-primary mb-2">活动描述</h3>
            <p className="text-sm text-text-secondary leading-relaxed">{activity.description}</p>
          </div>

          {activity.routeImages.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2">路线示意</h3>
              <div className={`grid gap-3 ${activity.routeImages.length === 1 ? 'grid-cols-1' : activity.routeImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {activity.routeImages.map((img, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden aspect-video bg-gray-100">
                    {!imageErrors[idx] ? (
                      <img
                        src={img}
                        alt={`路线图 ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={() => setImageErrors((prev) => ({ ...prev, [idx]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                        <MapPin size={20} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">
                报名成员 ({registrations.length}/{activity.maxMembers})
              </h3>
              {!isFull && (
                <button
                  onClick={onRegister}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-forest text-white text-xs font-medium rounded-lg
                    hover:bg-forest-light transition-colors duration-200
                    active:scale-[0.96] active:translate-y-[1px]"
                >
                  <UserPlus size={14} />
                  报名
                </button>
              )}
              {isFull && (
                <span className="text-xs text-difficulty-hard font-medium">名额已满</span>
              )}
            </div>

            {registrations.length === 0 ? (
              <div className="text-center py-8 text-text-secondary text-sm">
                暂无成员报名
              </div>
            ) : (
              <div className="space-y-2">
                {registrations.map((reg, idx) => (
                  <div
                    key={reg.id}
                    className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg animate-fly-in-right"
                    style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center text-xs font-bold shrink-0">
                      {reg.memberName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">{reg.memberName}</span>
                        <span className="flex items-center gap-0.5 text-[11px] text-text-secondary">
                          <Phone size={10} />
                          {reg.phone}
                        </span>
                      </div>
                      {reg.equipmentIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reg.equipmentIds.map((eid) => {
                            const eq = equipment.find((e) => e.id === eid)
                            return eq ? (
                              <span
                                key={eid}
                                className="text-[10px] px-1.5 py-0.5 bg-earth/10 text-earth-dark rounded"
                              >
                                {eq.name}
                              </span>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
