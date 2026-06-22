import { useStore } from '@/store/useStore';
import type { User } from '@shared/types';

function useCurrentUser(): {
  currentUser: User;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
} {
  const currentUser = useStore((state) => state.currentUser);
  const loading = useStore((state) => state.loading);
  const fetchUsers = useStore((state) => state.fetchUsers);

  const refetchUser = async (): Promise<void> => {
    await fetchUsers();
  };

  return {
    currentUser: currentUser!,
    isLoading: loading.users,
    refetchUser,
  };
}

export default useCurrentUser;
