/**
 * useUsers Hook
 * Custom hook for user management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, type UserRole } from '../services/users.service';

/**
 * Fetch all company users
 */
export function useCompanyUsers() {
  return useQuery({
    queryKey: ['company_users'],
    queryFn: () => usersService.listCompanyUsers(),
  });
}

/**
 * Fetch user roles
 */
export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ['user_roles', userId],
    queryFn: () => usersService.getUserRoles(userId!),
    enabled: !!userId,
  });
}

/**
 * Update user roles
 */
export function useUpdateUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: UserRole[] }) =>
      usersService.updateUserRoles(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_users'] });
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
    },
  });
}

/**
 * Update user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { fullName?: string; phone?: string } }) =>
      usersService.updateProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_users'] });
    },
  });
}

/**
 * Check if current user is admin
 */
export function useIsAdmin() {
  return useQuery({
    queryKey: ['is_admin'],
    queryFn: () => usersService.isAdmin(),
  });
}
