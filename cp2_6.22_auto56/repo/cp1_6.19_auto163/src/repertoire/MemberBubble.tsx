import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Sparkles } from 'lucide-react';
import { useStore, useRecommendations } from '../store';
import type { MemberRecommendation } from '../types';

interface Props {
  rehearsalId: string;
}

export const MemberBubble = ({ rehearsalId }: Props) => {
  const recommendations = useRecommendations(rehearsalId);
  const members = useStore((s) => s.members);
  const addParticipant = useStore((s) => s.addParticipant);
  const { participantIds } =
    useStore((s) => s.rehearsals.find((r) => r.id === rehearsalId)) ?? { participantIds: [] };

  const available = recommendations.filter(
    (r) => !participantIds.includes(r.memberId),
  );

  if (available.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4 pointer-events-none">
      <div className="flex items-end flex-wrap gap-3 justify-center pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {available.map((rec: MemberRecommendation, idx) => {
            const member = members.find((m) => m.id === rec.memberId);
            if (!member) return null;
            return (
              <motion.button
                key={rec.memberId}
                layout
                initial={{ opacity: 0, y: 80, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.8 }}
                whileHover={{ y: -6, scale: 1.05, boxShadow: '0 12px 30px rgba(61,90,254,0.45)' }}
                whileTap={{ scale: 0.96 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => addParticipant(rehearsalId, rec.memberId)}
                className="group relative pl-3 pr-4 py-2.5 rounded-full backdrop-blur-xl text-left flex items-center gap-2.5"
                style={{
                  backgroundColor: 'rgba(61,90,254,0.45)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 8px 24px rgba(61,90,254,0.3)',
                }}
                title={`推荐理由：${rec.reason}`}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    flexShrink: 0,
                  }}
                >
                  <span className="text-xs font-semibold">
                    {member.name.slice(0, 1)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium leading-none">
                      {member.name}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, rotate: -45 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: idx * 0.08 + 0.25, type: 'spring' }}
                    >
                      <Sparkles size={12} style={{ color: '#FFD54F' }} />
                    </motion.span>
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5 leading-none">
                    {rec.voicePart} · Lv.{member.skillLevel}
                  </div>
                </div>

                <motion.div
                  whileHover={{ rotate: 90, x: 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="ml-1 p-1 rounded-full bg-white/20 opacity-80 group-hover:opacity-100 transition-opacity"
                >
                  <UserPlus size={13} />
                </motion.div>

                <div
                  className="absolute -top-1 -right-1 rounded-full text-[10px] font-bold px-1.5 py-0.5"
                  style={{
                    backgroundColor: '#FFD54F',
                    color: '#1A237E',
                  }}
                >
                  {Math.round(rec.score * 100)}%
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <div className="text-center mt-2">
        <span className="text-[11px] text-white/40">
          <Sparkles size={10} className="inline mr-1 -mt-0.5" style={{ color: '#FFD54F' }} />
          智能推荐 · 点击气泡一键添加成员
        </span>
      </div>
    </div>
  );
};
