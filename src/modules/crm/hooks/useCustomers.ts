import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Customer } from "./types";

export interface UseCustomersReturn {
  customers: Customer[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useCustomers = (): UseCustomersReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      return data as Customer[];
    },
  });

  return {
    customers: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
