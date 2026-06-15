import React from 'react';
import { ClubMember } from '../types';

interface MemberAvatarsProps {
  members: ClubMember[];
  totalCount: number;
  maxShow?: number;
}

export function MemberAvatars({ members, totalCount, maxShow = 8 }: MemberAvatarsProps) {
  const displayMembers = members.slice(0, maxShow);
  const remaining = totalCount - displayMembers.length;

  return (
    <div className="flex -space-x-2">
      {displayMembers.map((member, index) => (
        <img
          key={member.id}
          src={member.avatar}
          alt={member.nickname}
          title={member.nickname}
          className="w-8 h-8 rounded-full border-2 border-white object-cover"
          style={{ zIndex: displayMembers.length - index }}
        />
      ))}
      {remaining > 0 && (
        <div
          className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-xs font-medium text-amber-800"
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
