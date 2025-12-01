/**
 * useCompany Hook
 * Custom hook for company management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, type UpdateCompanyInput } from '../services/company.service';

/**
 * Fetch current user's company
 */
export function useCompany() {
  return useQuery({
    queryKey: ['company'],
    queryFn: () => companyService.getCurrent(),
  });
}

/**
 * Update company information
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: UpdateCompanyInput }) =>
      companyService.update(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
}

/**
 * Upload company logo
 */
export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: string; file: File }) =>
      companyService.uploadLogo(companyId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
}

/**
 * Remove company logo
 */
export function useRemoveCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (companyId: string) => companyService.removeLogo(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
    },
  });
}
