import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  cpf_cnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  company_id: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

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
