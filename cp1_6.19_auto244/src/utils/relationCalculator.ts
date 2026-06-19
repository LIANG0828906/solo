export interface Member {
  id: string;
  name: string;
  gender: '男' | '女';
  birthDate: string;
  spouseId: string | null;
  parentIds: string[];
}

type MemberMap = Map<string, Member>;

function getParents(member: Member, map: MemberMap): Member[] {
  return member.parentIds.map(id => map.get(id)).filter((m): m is Member => m !== undefined);
}

function getChildren(member: Member, map: MemberMap): Member[] {
  const children: Member[] = [];
  map.forEach(m => {
    if (m.parentIds.includes(member.id)) {
      children.push(m);
    }
  });
  return children;
}

function getSiblings(member: Member, map: MemberMap): Member[] {
  if (member.parentIds.length === 0) return [];
  const siblings: Member[] = [];
  map.forEach(m => {
    if (m.id === member.id) return;
    const sharedParent = m.parentIds.some(pid => member.parentIds.includes(pid));
    if (sharedParent) {
      siblings.push(m);
    }
  });
  return siblings;
}

function buildAncestorChain(id: string, map: MemberMap): Map<string, number> {
  const chain = new Map<string, number>();
  const queue: { id: string; depth: number }[] = [{ id, depth: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    chain.set(current.id, current.depth);

    const member = map.get(current.id);
    if (member) {
      for (const pid of member.parentIds) {
        if (!visited.has(pid)) {
          queue.push({ id: pid, depth: current.depth + 1 });
        }
      }
    }
  }
  return chain;
}

function findLCA(
  id1: string,
  id2: string,
  map: MemberMap
): { ancestor: Member | null; depth1: number; depth2: number } {
  if (id1 === id2) {
    const m = map.get(id1) || null;
    return { ancestor: m, depth1: 0, depth2: 0 };
  }

  const chain1 = buildAncestorChain(id1, map);
  const chain2 = buildAncestorChain(id2, map);

  let bestAncestor: Member | null = null;
  let minDepth1 = Infinity;
  let minDepth2 = Infinity;
  let minSum = Infinity;

  chain1.forEach((d1, aid) => {
    const d2 = chain2.get(aid);
    if (d2 !== undefined) {
      const sum = d1 + d2;
      if (sum < minSum || (sum === minSum && Math.abs(d1 - d2) < Math.abs(minDepth1 - minDepth2))) {
        minSum = sum;
        minDepth1 = d1;
        minDepth2 = d2;
        bestAncestor = map.get(aid) || null;
      }
    }
  });

  return { ancestor: bestAncestor, depth1: minDepth1, depth2: minDepth2 };
}

function isOlder(a: Member, b: Member): boolean {
  return new Date(a.birthDate).getTime() < new Date(b.birthDate).getTime();
}

function getPathToAncestor(
  startId: string,
  ancestorId: string,
  map: MemberMap
): Member[] | null {
  if (startId === ancestorId) return [];

  const visited = new Set<string>();
  const queue: { id: string; path: Member[] }[] = [{ id: startId, path: [] }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const member = map.get(current.id);
    if (!member) continue;

    for (const pid of member.parentIds) {
      const newPath = [...current.path, member];
      if (pid === ancestorId) {
        return newPath;
      }
      if (!visited.has(pid)) {
        queue.push({ id: pid, path: newPath });
      }
    }
  }
  return null;
}

function isPaternalSide(ancestor: Member, child: Member, map: MemberMap): boolean {
  if (ancestor.id === child.id) return true;

  const path = getPathToAncestor(child.id, ancestor.id, map);
  if (!path || path.length === 0) return true;

  const firstUp = path[0];
  const firstUpParents = getParents(firstUp, map);
  const father = firstUpParents.find(p => p.gender === '男');

  if (father && path.length >= 2) {
    return path[1].id === father.id;
  }

  return true;
}

function findConnectingParent(
  targetId: string,
  ancestorId: string,
  map: MemberMap
): Member | null {
  const path = getPathToAncestor(targetId, ancestorId, map);
  if (!path || path.length === 0) return null;
  return path[path.length - 1];
}

function getSiblingRank(member: Member, map: MemberMap): number {
  const parents = getParents(member, map);
  if (parents.length === 0) return 0;

  const allSiblings: Member[] = [];
  map.forEach(m => {
    const shared = m.parentIds.some(pid => member.parentIds.includes(pid));
    if (shared) allSiblings.push(m);
  });

  allSiblings.sort((a, b) => {
    const ta = new Date(a.birthDate).getTime();
    const tb = new Date(b.birthDate).getTime();
    return ta - tb;
  });

  return allSiblings.findIndex(s => s.id === member.id);
}

export function calculateRelation(members: Member[], id1: string, id2: string): string {
  if (id1 === id2) return '本人';

  const map: MemberMap = new Map();
  members.forEach(m => map.set(m.id, m));

  const m1 = map.get(id1);
  const m2 = map.get(id2);

  if (!m1 || !m2) return '无亲属关系';

  if (m1.spouseId === m2.id || m2.spouseId === m1.id) {
    return m1.gender === '男' ? '丈夫' : '妻子';
  }

  const { ancestor, depth1, depth2 } = findLCA(id1, id2, map);

  if (!ancestor) {
    if (m1.spouseId === m2.id || m2.spouseId === m1.id) {
      return m1.gender === '男' ? '丈夫' : '妻子';
    }
    return '无亲属关系';
  }

  if (depth1 === 0 && depth2 === 0) return '本人';

  if (depth1 === 0) {
    return getDirectAncestorRelation(m1, m2, depth2, map, ancestor);
  }
  if (depth2 === 0) {
    return getDirectDescendantRelation(m1, m2, depth1, map, ancestor);
  }

  const genDiff = Math.abs(depth1 - depth2);

  if (depth1 === 1 && depth2 === 1) {
    return getSiblingRelation(m1, m2, map);
  }

  if (depth1 === 1 && depth2 === 2) {
    return getNieceNephewRelation(m1, m2, ancestor, map);
  }
  if (depth1 === 2 && depth2 === 1) {
    return getAuntUncleRelation(m1, m2, ancestor, map);
  }

  if (depth1 >= 2 && depth2 >= 2 && genDiff === 0) {
    return getCousinRelation(m1, m2, ancestor, map, depth1);
  }

  if (depth1 >= 1 && depth2 >= 1) {
    return getGenericCousinRelation(m1, m2, depth1, depth2);
  }

  return '无亲属关系';
}

function getDirectAncestorRelation(
  ancestor: Member,
  descendant: Member,
  generations: number,
  map: MemberMap,
  lca: Member
): string {
  if (generations === 1) {
    return ancestor.gender === '男' ? '父亲' : '母亲';
  }

  const descParents = getParents(descendant, map);
  const isPaternal = descParents.some(p => p.gender === '男' && isAncestorOf(ancestor.id, p.id, map));

  if (generations === 2) {
    if (ancestor.gender === '男') {
      return isPaternal ? '祖父' : '外祖父';
    } else {
      return isPaternal ? '祖母' : '外祖母';
    }
  }

  const greatPrefix = '曾'.repeat(generations - 2);
  if (ancestor.gender === '男') {
    return isPaternal ? `${greatPrefix}祖父` : `${greatPrefix}外祖父`;
  } else {
    return isPaternal ? `${greatPrefix}祖母` : `${greatPrefix}外祖母`;
  }
}

function getDirectDescendantRelation(
  descendant: Member,
  ancestor: Member,
  generations: number,
  map: MemberMap,
  lca: Member
): string {
  if (generations === 1) {
    return descendant.gender === '男' ? '儿子' : '女儿';
  }

  const ancChildren = getChildren(ancestor, map);
  const connectingChild = ancChildren.find(c => isAncestorOf(c.id, descendant.id, map));
  const isPaternal = connectingChild ? connectingChild.gender === '男' : true;

  if (generations === 2) {
    if (descendant.gender === '男') {
      return isPaternal ? '孙子' : '外孙子';
    } else {
      return isPaternal ? '孙女' : '外孙女';
    }
  }

  const greatPrefix = '曾'.repeat(generations - 2);
  if (descendant.gender === '男') {
    return isPaternal ? `${greatPrefix}孙子` : `${greatPrefix}外孙子`;
  } else {
    return isPaternal ? `${greatPrefix}孙女` : `${greatPrefix}外孙女`;
  }
}

function isAncestorOf(ancestorId: string, descendantId: string, map: MemberMap): boolean {
  if (ancestorId === descendantId) return true;
  const chain = buildAncestorChain(descendantId, map);
  return chain.has(ancestorId);
}

function getSiblingRelation(m1: Member, m2: Member, map: MemberMap): string {
  const m1Parents = new Set(m1.parentIds);
  const sharedParents = m2.parentIds.filter(pid => m1Parents.has(pid));
  const isFullSibling = sharedParents.length >= 2;
  const older = isOlder(m1, m2);

  if (m1.gender === '男') {
    if (older) return isFullSibling ? '哥哥' : '哥哥';
    return isFullSibling ? '弟弟' : '弟弟';
  } else {
    if (older) return isFullSibling ? '姐姐' : '姐姐';
    return isFullSibling ? '妹妹' : '妹妹';
  }
}

function getAuntUncleRelation(
  auntUncle: Member,
  nieceNephew: Member,
  ancestor: Member,
  map: MemberMap
): string {
  const nnParents = getParents(nieceNephew, map);
  const connectingParent = nnParents.find(p => isAncestorOf(ancestor.id, p.id, map));

  if (!connectingParent) return auntUncle.gender === '男' ? '叔父' : '姨妈';

  const isPaternal = connectingParent.gender === '男';
  const isOlderThanConnecting = isOlder(auntUncle, connectingParent);

  if (auntUncle.gender === '男') {
    if (isPaternal) {
      return isOlderThanConnecting ? '伯父' : '叔父';
    } else {
      return '舅舅';
    }
  } else {
    if (isPaternal) {
      return '姑妈';
    } else {
      return isOlderThanConnecting ? '姨妈' : '姨妈';
    }
  }
}

function getNieceNephewRelation(
  nieceNephew: Member,
  auntUncle: Member,
  ancestor: Member,
  map: MemberMap
): string {
  const auParents = new Set(auntUncle.parentIds);
  const nnParents = getParents(nieceNephew, map);
  const connectingParent = nnParents.find(p => auParents.has(p.id));

  const isPaternal = connectingParent ? connectingParent.gender === '男' : true;

  if (nieceNephew.gender === '男') {
    return isPaternal ? '侄子' : '外甥';
  } else {
    return isPaternal ? '侄女' : '外甥女';
  }
}

function getCousinRelation(
  m1: Member,
  m2: Member,
  ancestor: Member,
  map: MemberMap,
  depth: number
): string {
  const m1Path = getPathToAncestor(m1.id, ancestor.id, map);
  const m2Path = getPathToAncestor(m2.id, ancestor.id, map);

  if (!m1Path || !m2Path || m1Path.length === 0 || m2Path.length === 0) {
    return '无亲属关系';
  }

  const m1FirstUp = m1Path[m1Path.length - 1];
  const m2FirstUp = m2Path[m2Path.length - 1];

  if (depth === 2) {
    const m1FirstUpGender = m1FirstUp.gender;

    const isTang = m1FirstUpGender === '男' && m2FirstUp.gender === '男';

    const older = isOlder(m1, m2);
    const prefix = isTang ? '堂' : '表';

    if (m1.gender === '男') {
      return older ? `${prefix}兄` : `${prefix}弟`;
    } else {
      return older ? `${prefix}姐` : `${prefix}妹`;
    }
  }

  const degree = depth - 1;
  const prefix = degree >= 2 ? `${degree}代` : '';
  const older = isOlder(m1, m2);

  if (m1.gender === '男') {
    return older ? `${prefix}表兄` : `${prefix}表弟`;
  } else {
    return older ? `${prefix}表姐` : `${prefix}表妹`;
  }
}

function getGenericCousinRelation(
  m1: Member,
  m2: Member,
  depth1: number,
  depth2: number
): string {
  const minDepth = Math.min(depth1, depth2);
  const degree = minDepth - 1;
  const removed = Math.abs(depth1 - depth2);

  let degreeStr = '';
  if (degree === 1) degreeStr = '';
  else if (degree === 2) degreeStr = '再';
  else if (degree === 3) degreeStr = '三';
  else degreeStr = `${degree}代`;

  let removedStr = '';
  if (removed === 1) removedStr = ' once removed';
  else if (removed > 1) removedStr = ` ${removed} times removed`;

  const older = isOlder(m1, m2);

  if (depth1 < depth2) {
    if (m1.gender === '男') {
      return older ? `${degreeStr}表伯` : `${degreeStr}表叔`;
    } else {
      return `${degreeStr}表姑`;
    }
  } else if (depth1 > depth2) {
    if (m1.gender === '男') {
      return `${degreeStr}表侄`;
    } else {
      return `${degreeStr}表侄女`;
    }
  }

  if (m1.gender === '男') {
    return older ? `${degreeStr}表兄` : `${degreeStr}表弟`;
  } else {
    return older ? `${degreeStr}表姐` : `${degreeStr}表妹`;
  }
}
