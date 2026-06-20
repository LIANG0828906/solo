import type {
  Member,
  Piece,
  Rehearsal,
  MemberRecommendation,
  VoicePart,
} from '../types';

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const computeAvailabilityScore = (rehearsal: Rehearsal, member: Member): number => {
  const date = new Date(rehearsal.date);
  const weekday = date.getDay();
  const rStart = timeToMinutes(rehearsal.startTime);
  const rEnd = rStart + rehearsal.durationMinutes;

  let totalCovered = 0;
  const needCover = rEnd - rStart;

  for (const slot of member.availableSlots) {
    if (slot.dayOfWeek !== weekday) continue;
    const sStart = timeToMinutes(slot.startTime);
    const sEnd = timeToMinutes(slot.endTime);
    const overlapStart = Math.max(rStart, sStart);
    const overlapEnd = Math.min(rEnd, sEnd);
    if (overlapEnd > overlapStart) {
      totalCovered += overlapEnd - overlapStart;
    }
  }

  return needCover > 0 ? Math.min(1, totalCovered / needCover) : 0;
};

const countPartAssigned = (
  rehearsal: Rehearsal,
  members: Member[],
  part: VoicePart,
): number => {
  let count = 0;
  for (const id of rehearsal.participantIds) {
    const m = members.find((x) => x.id === id);
    if (!m) continue;
    if (m.primaryPart === part || m.secondaryPart === part) count++;
  }
  return count;
};

export const generateRecommendations = (
  rehearsal: Rehearsal,
  allMembers: Member[],
  pieces: Piece[],
): MemberRecommendation[] => {
  const requiredParts = new Map<VoicePart, number>();
  for (const p of pieces) {
    for (const part of p.requiredParts) {
      requiredParts.set(part, (requiredParts.get(part) ?? 0) + 1);
    }
  }

  if (requiredParts.size === 0) {
    const defaults: VoicePart[] = ['Soprano', 'Alto', 'Tenor', 'Bass'];
    defaults.forEach((p) => requiredParts.set(p, 1));
  }

  const results: MemberRecommendation[] = [];
  const candidates = allMembers.filter((m) => !rehearsal.participantIds.includes(m.id));

  for (const member of candidates) {
    const partScores: { part: VoicePart; score: number; reason: string }[] = [];
    const tryParts: VoicePart[] = [member.primaryPart];
    if (member.secondaryPart) tryParts.push(member.secondaryPart);

    for (const part of tryParts) {
      const demand = requiredParts.get(part) ?? 0;
      if (demand === 0) continue;

      const assigned = countPartAssigned(rehearsal, allMembers, part);
      const sparsity = demand > 0 ? 1 - assigned / (demand * 2) : 0.5;
      const skill =
        member.skillLevel / 5 * (part === member.primaryPart ? 1.0 : 0.7);
      const avail = computeAvailabilityScore(rehearsal, member);

      if (avail < 0.5) continue;

      const score = sparsity * 0.4 + skill * 0.3 + avail * 0.3;
      const reasons: string[] = [];
      if (part === member.primaryPart) reasons.push('主声部');
      else reasons.push('副声部');
      if (sparsity > 0.6) reasons.push('该声部紧缺');
      if (skill >= 0.7) reasons.push('技能优秀');
      if (avail >= 1) reasons.push('时间完全匹配');
      else if (avail >= 0.8) reasons.push('时间基本匹配');

      partScores.push({
        part,
        score,
        reason: reasons.join(' · '),
      });
    }

    if (partScores.length === 0) continue;
    const best = partScores.sort((a, b) => b.score - a.score)[0];
    results.push({
      memberId: member.id,
      voicePart: best.part,
      score: best.score,
      reason: best.reason,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
};

export const computePieceProgress = (piece: Piece): number => {
  const parts = Object.values(piece.practiceProgress);
  if (parts.length === 0) return 0;
  const total = parts.reduce((sum, r) => sum + r.targetMinutes, 0);
  const done = parts.reduce((sum, r) => sum + r.practicedMinutes, 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
};
