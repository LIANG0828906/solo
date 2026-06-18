import { motion } from 'framer-motion';
import { Users, Star, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../store';
import { PART_COLORS } from '../data/seed';
import { WEEKDAY_NAMES } from '../schedule/utils';

export const MembersPage = () => {
  const members = useStore((s) => s.members);
  const rehearsals = useStore((s) => s.rehearsals);

  const getParticipationCount = (memberId: string) =>
    rehearsals.filter((r) => r.participantIds.includes(memberId)).length;

  const partCounts: Record<string, number> = {};
  for (const m of members) {
    partCounts[m.primaryPart] = (partCounts[m.primaryPart] ?? 0) + 1;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2
          className="text-white font-semibold"
          style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22 }}
        >
          成员管理
        </h2>
        <p className="text-white/50 text-xs mt-1">
          共 {members.length} 位成员 · 活跃排练 {rehearsals.length} 场
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(partCounts).map(([part, count], idx) => (
          <motion.div
            key={part}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="rounded-xl p-4"
            style={{
              backgroundColor: `${PART_COLORS[part as keyof typeof PART_COLORS]}10`,
              border: `1px solid ${PART_COLORS[part as keyof typeof PART_COLORS]}25`,
            }}
          >
            <div
              className="text-[11px] uppercase tracking-wider font-medium mb-1"
              style={{ color: PART_COLORS[part as keyof typeof PART_COLORS] }}
            >
              {part}
            </div>
            <div className="text-white text-2xl font-bold tabular-nums">{count}</div>
            <div className="text-[11px] text-white/40 mt-0.5">人</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((m, idx) => {
          const count = getParticipationCount(m.id);
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -3, boxShadow: '0 14px 30px rgba(0,0,0,0.4)' }}
              className="rounded-2xl p-5 transition-shadow"
              style={{
                backgroundColor: 'rgba(38,50,56,0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: `${PART_COLORS[m.primaryPart]}22`,
                    color: PART_COLORS[m.primaryPart],
                    border: `1px solid ${PART_COLORS[m.primaryPart]}35`,
                  }}
                >
                  {m.name.slice(0, 1)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-white font-semibold text-base truncate"
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {m.name}
                    </h3>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < m.skillLevel ? '#FFD54F' : 'transparent'}
                          style={{
                            color: i < m.skillLevel ? '#FFD54F' : 'rgba(255,255,255,0.15)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{
                        backgroundColor: `${PART_COLORS[m.primaryPart]}18`,
                        color: PART_COLORS[m.primaryPart],
                        border: `1px solid ${PART_COLORS[m.primaryPart]}30`,
                      }}
                    >
                      {m.primaryPart}
                    </span>
                    {m.secondaryPart && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px]"
                        style={{
                          backgroundColor: `${PART_COLORS[m.secondaryPart]}12`,
                          color: PART_COLORS[m.secondaryPart],
                          opacity: 0.8,
                        }}
                      >
                        副 {m.secondaryPart}
                      </span>
                    )}
                    <span className="text-[11px] text-white/45 flex items-center gap-1">
                      <Users size={10} />
                      {count}场排练
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <CalendarIcon size={10} />
                      可用时段
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.availableSlots.length === 0 ? (
                        <span className="text-[11px] text-white/25">未设置</span>
                      ) : (
                        m.availableSlots.map((slot, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px]"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              color: 'rgba(255,255,255,0.6)',
                            }}
                          >
                            {WEEKDAY_NAMES[slot.dayOfWeek]}{' '}
                            {slot.startTime}-{slot.endTime}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
