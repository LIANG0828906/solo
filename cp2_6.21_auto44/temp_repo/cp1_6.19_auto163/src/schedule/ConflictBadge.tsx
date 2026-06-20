import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { useStore } from '../store';

interface Props {
  rehearsalId: string;
}

export const ConflictBadge = ({ rehearsalId }: Props) => {
  const conflicts = useStore((s) => s.rehearsals.find((r) => r.id === rehearsalId)?.conflicts ?? []);
  const members = useStore((s) => s.members);

  const conflictNames = useMemo(() => {
    const ids = Array.from(new Set(conflicts.map((c) => c.memberId)));
    return ids
      .map((id) => members.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join('、');
  }, [conflicts, members]);

  if (conflicts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute inset-y-0 left-0 w-1 rounded-l-md overflow-hidden"
      aria-label="排练时间冲突"
    >
      <motion.div
        animate={{
          opacity: [1, 0.35, 1],
        }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0"
        style={{ backgroundColor: '#E53935' }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full"
        title={`冲突人员: ${conflictNames}`}
      >
        <AlertTriangle
          size={14}
          style={{ color: '#E53935', filter: 'drop-shadow(0 0 4px rgba(229,57,53,0.6))' }}
        />
      </motion.div>
    </motion.div>
  );
};
