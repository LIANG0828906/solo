import type { Member, Family } from '@/types';

const CURRENT_MEMBER_KEY = 'auto305_current_member';
const FAMILIES_KEY = 'auto305_families';

export function getCurrentMember(): Member | null {
  try {
    const data = localStorage.getItem(CURRENT_MEMBER_KEY);
    if (!data) return null;
    return JSON.parse(data) as Member;
  } catch {
    return null;
  }
}

export function setCurrentMember(member: Member): void {
  try {
    localStorage.setItem(CURRENT_MEMBER_KEY, JSON.stringify(member));
  } catch (error) {
    console.error('存储当前成员信息失败:', error);
  }
}

export function removeCurrentMember(): void {
  try {
    localStorage.removeItem(CURRENT_MEMBER_KEY);
  } catch (error) {
    console.error('清除当前成员信息失败:', error);
  }
}

export function getJoinedFamilies(): Family[] {
  try {
    const data = localStorage.getItem(FAMILIES_KEY);
    if (!data) return [];
    return JSON.parse(data) as Family[];
  } catch {
    return [];
  }
}

export function setJoinedFamilies(families: Family[]): void {
  try {
    localStorage.setItem(FAMILIES_KEY, JSON.stringify(families));
  } catch (error) {
    console.error('存储家庭列表失败:', error);
  }
}

export function addJoinedFamily(family: Family): void {
  try {
    const families = getJoinedFamilies();
    const existingIndex = families.findIndex((f) => f.id === family.id);
    if (existingIndex >= 0) {
      families[existingIndex] = family;
    } else {
      families.unshift(family);
    }
    setJoinedFamilies(families);
  } catch (error) {
    console.error('添加家庭失败:', error);
  }
}

export function removeJoinedFamily(familyId: string): void {
  try {
    const families = getJoinedFamilies();
    const filtered = families.filter((f) => f.id !== familyId);
    setJoinedFamilies(filtered);
  } catch (error) {
    console.error('移除家庭失败:', error);
  }
}

export function clearAllStorage(): void {
  try {
    localStorage.removeItem(CURRENT_MEMBER_KEY);
    localStorage.removeItem(FAMILIES_KEY);
  } catch (error) {
    console.error('清除存储失败:', error);
  }
}
