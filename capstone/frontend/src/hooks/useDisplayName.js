import { useAuth } from '../context/AuthContext';

const useDisplayName = (fallback = 'User') => {
  const { user } = useAuth();

  if (user?.first_name?.trim()) {
    return `${user.first_name} ${user.last_name || ''}`.trim();
  }
  return user?.username || fallback;
};

export default useDisplayName;
