import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

// Custom hook to use roles for selection
export const usePermissionSelectQuery = () => {
  // Fetch roles for selection
  const fetchPermissionList = async () => {
    const response = await apiFetch('/api/user-management/permissions/select');

    if (!response.ok) {
      toast.error(
        'Something went wrong while loading the records. Please try again.',
        {
          position: 'top-center',
        },
      );
    }

    return response.json();
  };

  return useQuery({
    queryKey: ['user-permission-select'],
    queryFn: fetchPermissionList,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
};
