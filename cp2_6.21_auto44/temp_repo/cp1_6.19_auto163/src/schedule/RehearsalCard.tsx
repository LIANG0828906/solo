import { memo } from 'react';
import { motion } from 'framer-motion';
import { Users, Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Rehearsal } from '../types';
import { ConflictBadge } from './ConflictBadge';
import { formatRange } from './utils';

interface Props {
  rehearsal: Rehearsal;
  onClick?: () => void;
}

export const RehearsalCard = memo(function RehearsalCard({ rehearsal, onClick }: Props) {
  const hasConflict = rehearsal.conflicts.length > 0;

  return (
    <Link to={`/rehearsal/${rehearsal.id}`} onClick={onClick}>
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.4)' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative overflow-hidden"
        style={{
          width: 180,
          height: 120,
          borderRadius: 8,
          backgroundColor: '#2E2E2E',
          color: '#FFFFFF',
          padding: 12,
          boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
          border: hasConflict ? '1px solid rgba(229,57,53,0.35)' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {hasConflict && <ConflictBadge rehearsalId={rehearsal.id} />}

        <div className={`flex flex-col h-full ${hasConflict ? 'pl-2' : ''}`}>
          <h4
            className="font-semibold truncate text-sm"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {rehearsal.title}
          </h4>

          <div className="mt-1 text-[11px] opacity-80">
            {formatRange(rehearsal.startTime, rehearsal.durationMinutes)}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-[11px] opacity-75">
            <Users size={12} style={{ color: '#FFD54F' }} />
            <span>{rehearsal.participantIds.length}人</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] opacity-75 mt-1">
            <Music2 size={12} style={{ color: '#FFD54F' }} />
            <span>{rehearsal.pieceIds.length}首曲目</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
});
