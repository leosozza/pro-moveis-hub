// useAssemblyOrders Hook
// React hook for fetching assembly orders

import { useQuery } from '@tanstack/react-query';
import { listAssemblyOrders } from '../services/assembly.service';

export const useAssemblyOrders = () => {
  const query = useQuery({
    queryKey: ['assembly_orders'],
    queryFn: listAssemblyOrders,
  });

  return {
    orders: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
