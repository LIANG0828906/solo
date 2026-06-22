import { MemberData, EventData, RelationData } from '../services/api';

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
  fullName: string;
  birthYear: number;
  deathYear?: number | null;
  gender?: string | null;
  role?: string | null;
  eventCount: number;
}

export interface GraphEdge {
  id: string;
  fromId: string;
  toId: string;
  type: string;
  controlX?: number | null;
  controlY?: number | null;
  points: { x: number; y: number }[];
}

export interface TimelineNode {
  id: string;
  x: number;
  y: number;
  year: number;
  eventType: string;
  color: string;
  name: string;
  description?: string | null;
  memberId: string;
  memberName: string;
  lifeProgress: number;
}

export const EVENT_TYPE_COLORS: Record<string, string> = {
  出生: '#27AE60',
  入学: '#3498DB',
  工作: '#2980B9',
  结婚: '#E74C3C',
  生育: '#9B59B6',
  获奖: '#F39C12',
  逝世: '#7F8C8D',
  其他: '#8E44AD',
};

export const GENDER_COLORS: Record<string, string> = {
  男: '#4A90D9',
  女: '#E67E86',
};

export const DEFAULT_GENDER_COLOR = '#95A5A6';

export function getGenderColor(gender?: string | null): string {
  if (!gender) return DEFAULT_GENDER_COLOR;
  return GENDER_COLORS[gender] || DEFAULT_GENDER_COLOR;
}

export function getEventColor(eventType: string): string {
  return EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS['其他'];
}

export function getNameAbbreviation(name: string): string {
  if (!name) return '';
  const chars = name.replace(/\s/g, '');
  if (chars.length <= 2) return chars;
  return chars.slice(0, 2);
}

export function calculateNodeRadius(eventCount: number): number {
  const minRadius = 20;
  const maxRadius = 45;
  const baseEvents = 3;
  const additionalEvents = Math.max(0, eventCount - baseEvents);
  const growthFactor = Math.min(additionalEvents * 2, maxRadius - minRadius);
  return minRadius + growthFactor;
}

export function calculateLifeProgress(
  birthYear: number,
  deathYear: number | null | undefined,
  eventYear: number
): number {
  const endYear = deathYear || 2024;
  const lifespan = endYear - birthYear;
  if (lifespan <= 0) return 0.5;
  const progress = (eventYear - birthYear) / lifespan;
  return Math.max(0, Math.min(1, progress));
}

export function transformMembersToGraphNodes(
  members: MemberData[],
  events: EventData[],
  containerWidth: number,
  containerHeight: number
): GraphNode[] {
  const eventCounts: Record<string, number> = {};
  events.forEach((e) => {
    eventCounts[e.member_id] = (eventCounts[e.member_id] || 0) + 1;
  });

  const cols = Math.ceil(Math.sqrt(members.length));
  const rows = Math.ceil(members.length / cols);
  const padding = 100;
  const spacingX = Math.max(120, (containerWidth - padding * 2) / Math.max(1, cols - 1 || 1));
  const spacingY = Math.max(120, (containerHeight - padding * 2) / Math.max(1, rows - 1 || 1));

  return members.map((member, index) => {
    let x = member.x;
    let y = member.y;
    if (x === undefined || x === null || y === undefined || y === null || x === 0 || y === 0) {
      const col = index % cols;
      const row = Math.floor(index / cols);
      x = padding + col * spacingX;
      y = padding + row * spacingY;
    }

    const eventCount = eventCounts[member.id] || 0;

    return {
      id: member.id,
      x,
      y,
      radius: calculateNodeRadius(eventCount),
      color: getGenderColor(member.gender),
      label: getNameAbbreviation(member.name),
      fullName: member.name,
      birthYear: member.birth_year,
      deathYear: member.death_year,
      gender: member.gender,
      role: member.role,
      eventCount,
    };
  });
}

export function transformRelationsToEdges(
  relations: RelationData[],
  nodes: GraphNode[]
): GraphEdge[] {
  const nodeMap: Record<string, GraphNode> = {};
  nodes.forEach((n) => {
    nodeMap[n.id] = n;
  });

  return relations.map((rel) => {
    const fromNode = nodeMap[rel.from_member_id];
    const toNode = nodeMap[rel.to_member_id];

    if (!fromNode || !toNode) {
      return {
        id: rel.id,
        fromId: rel.from_member_id,
        toId: rel.to_member_id,
        type: rel.relation_type,
        controlX: rel.control_x,
        controlY: rel.control_y,
        points: [],
      };
    }

    let controlX = rel.control_x;
    let controlY = rel.control_y;

    if (controlX === undefined || controlX === null || controlY === undefined || controlY === null) {
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        const offsetX = (-dy / len) * 30;
        const offsetY = (dx / len) * 30;
        controlX = midX + offsetX;
        controlY = midY + offsetY;
      } else {
        controlX = midX;
        controlY = midY;
      }
    }

    return {
      id: rel.id,
      fromId: rel.from_member_id,
      toId: rel.to_member_id,
      type: rel.relation_type,
      controlX,
      controlY,
      points: [
        { x: fromNode.x, y: fromNode.y },
        { x: controlX, y: controlY },
        { x: toNode.x, y: toNode.y },
      ],
    };
  });
}

export function transformEventsToTimeline(
  events: EventData[],
  members: MemberData[],
  minYear: number,
  maxYear: number,
  containerWidth: number,
  containerHeight: number,
  yearScale: number
): TimelineNode[] {
  const memberMap: Record<string, MemberData> = {};
  members.forEach((m) => {
    memberMap[m.id] = m;
  });

  const paddingLeft = 60;
  const paddingTop = 40;
  const paddingBottom = 40;
  const availableHeight = containerHeight - paddingTop - paddingBottom;

  return events.map((event) => {
    const member = memberMap[event.member_id];
    const lifeProgress = member
      ? calculateLifeProgress(member.birth_year, member.death_year, event.year)
      : 0.5;

    const yearOffset = event.year - minYear;
    const x = paddingLeft + yearOffset * yearScale;
    const y = paddingTop + lifeProgress * availableHeight;

    return {
      id: event.id,
      x,
      y,
      year: event.year,
      eventType: event.event_type,
      color: getEventColor(event.event_type),
      name: event.name,
      description: event.description,
      memberId: event.member_id,
      memberName: member ? member.name : '未知',
      lifeProgress,
    };
  });
}

export function lcm(a: number, b: number): number {
  const gcd = (x: number, y: number): number => {
    if (y === 0) return x;
    return gcd(y, x % y);
  };
  return (a * b) / gcd(a, b);
}

export function generationGapStats(birthYears: number[]): { avg: number; gaps: number[] } {
  const sorted = [...birthYears].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap >= 15 && gap <= 50) {
      gaps.push(gap);
    }
  }
  const avg = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  return { avg: Math.round(avg * 10) / 10, gaps };
}
