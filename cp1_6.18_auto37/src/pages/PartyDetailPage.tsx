import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react';
import { usePartyStore } from '@/stores/partyStore';
import JoinModal from '@/components/JoinModal';

export default function PartyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activities } = usePartyStore();
  const [activeTab, setActiveTab] = useState<'materials' | 'participants'>('materials');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const activity = activities.find((a) => a.id === id);

  if (!activity) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-purple-darker font-body text-white">
        <p className="mb-4 text-xl">活动未找到</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-amber-primary px-4 py-2 text-white hover:opacity-90"
        >
          返回首页
        </button>
      </div>
    );
  }

  const hasJoined = activity.participants.some((p) => p.name === '我');
  const isFull = activity.participants.length >= activity.maxParticipants;

  return (
    <div className="min-h-screen bg-purple-darker font-body text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          返回
        </button>

        <div className="rounded-xl border border-purple-border bg-purple-card p-6">
          <div className="mb-4 flex items-start justify-between">
            <h1 className="font-display text-3xl font-bold text-white">{activity.name}</h1>
            <span className="shrink-0 rounded-full bg-amber-primary/20 px-3 py-1 text-sm text-amber-primary">
              {activity.category}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-amber-primary" />
              {activity.date}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-primary" />
              {activity.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-amber-primary" />
              {activity.participants.length}/{activity.maxParticipants}
            </span>
          </div>

          <p className="mb-6 text-gray-300 leading-relaxed">{activity.description}</p>

          {hasJoined ? (
            <button
              disabled
              className="rounded-lg bg-gray-600 px-6 py-2.5 text-gray-300 cursor-not-allowed"
            >
              已报名
            </button>
          ) : isFull ? (
            <div>
              <span className="text-red-400">名额已满</span>
              <button
                disabled
                className="ml-3 rounded-lg bg-gray-600 px-6 py-2.5 text-gray-300 cursor-not-allowed"
              >
                报名参加
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowJoinModal(true)}
              className="rounded-lg bg-gradient-to-r from-amber-primary to-amber-dark px-6 py-2.5 font-medium text-white active:animate-btn-bounce hover:opacity-90 transition-opacity"
            >
              报名参加
            </button>
          )}
        </div>

        <div className="mt-6">
          <div className="relative mb-6 flex border-b border-purple-border">
            {(['materials', 'participants'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'text-amber-primary' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'materials' ? '材料清单' : '参与者'}
              </button>
            ))}
            <div
              className="absolute bottom-0 h-0.5 bg-amber-primary transition-all duration-300"
              style={{
                width: '50%',
                transform: `translateX(${activeTab === 'materials' ? '0' : '100'}%)`,
              }}
            />
          </div>

          {activeTab === 'materials' && (
            <div className="animate-fade-in space-y-4">
              {activity.materials.map((m) => {
                const pct = m.requiredQuantity > 0
                  ? Math.min((m.contributedQuantity / m.requiredQuantity) * 100, 100)
                  : 0;
                return (
                  <div
                    key={m.id}
                    className="rounded-lg border border-purple-border bg-purple-card p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-white">
                        {m.emoji} {m.name}
                      </span>
                      <span className="text-sm text-gray-400">
                        {m.contributedQuantity}/{m.requiredQuantity}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-purple-deep">
                      <div
                        className="h-full rounded-full bg-amber-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="animate-fade-in space-y-4">
              {activity.participants.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-purple-border bg-purple-card p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-border text-2xl">
                      {p.avatar}
                    </div>
                    <span className="font-medium text-white">{p.name}</span>
                  </div>
                  {p.contributedMaterials.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.contributedMaterials.map((cm) => {
                        const mat = activity.materials.find((m) => m.id === cm.materialId);
                        return (
                          <span
                            key={cm.materialId}
                            className="rounded-full bg-purple-deep px-2.5 py-1 text-xs text-gray-300"
                          >
                            {mat?.emoji} {mat?.name} ×{cm.quantity}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <JoinModal open={showJoinModal} activityId={activity.id} onClose={() => setShowJoinModal(false)} />
    </div>
  );
}
