import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MemberInfo {
  memberId: string;
  memberName: string;
}

interface Family {
  familyId: string;
  familyName: string;
}

interface FamilyContextType {
  memberInfo: MemberInfo | null;
  families: Family[];
  setMemberInfo: (info: MemberInfo | null) => void;
  setFamilies: (families: Family[]) => void;
  updateMemberName: (name: string) => void;
  addFamily: (family: Family) => void;
  removeFamily: (familyId: string) => void;
  clearAll: () => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

const STORAGE_KEY_MEMBER = 'family_member_info';
const STORAGE_KEY_FAMILIES = 'family_families';

interface FamilyProviderProps {
  children: ReactNode;
}

export function FamilyProvider({ children }: FamilyProviderProps) {
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);

  useEffect(() => {
    const storedMember = localStorage.getItem(STORAGE_KEY_MEMBER);
    const storedFamilies = localStorage.getItem(STORAGE_KEY_FAMILIES);

    if (storedMember) {
      try {
        setMemberInfo(JSON.parse(storedMember));
      } catch {
        console.error('Failed to parse member info from localStorage');
      }
    }

    if (storedFamilies) {
      try {
        setFamilies(JSON.parse(storedFamilies));
      } catch {
        console.error('Failed to parse families from localStorage');
      }
    }
  }, []);

  useEffect(() => {
    if (memberInfo) {
      localStorage.setItem(STORAGE_KEY_MEMBER, JSON.stringify(memberInfo));
    } else {
      localStorage.removeItem(STORAGE_KEY_MEMBER);
    }
  }, [memberInfo]);

  useEffect(() => {
    if (families.length > 0) {
      localStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(families));
    } else {
      localStorage.removeItem(STORAGE_KEY_FAMILIES);
    }
  }, [families]);

  const updateMemberName = (name: string) => {
    setMemberInfo(prev => prev ? { ...prev, memberName: name } : null);
  };

  const addFamily = (family: Family) => {
    setFamilies(prev => {
      if (prev.some(f => f.familyId === family.familyId)) {
        return prev;
      }
      return [...prev, family];
    });
  };

  const removeFamily = (familyId: string) => {
    setFamilies(prev => prev.filter(f => f.familyId !== familyId));
  };

  const clearAll = () => {
    setMemberInfo(null);
    setFamilies([]);
  };

  return (
    <FamilyContext.Provider
      value={{
        memberInfo,
        families,
        setMemberInfo,
        setFamilies,
        updateMemberName,
        addFamily,
        removeFamily,
        clearAll,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
