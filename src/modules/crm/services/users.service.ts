/**
 * Users Service
 * Encapsulates all Supabase operations for user management.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type UserRole = 'admin' | 'projetista' | 'vendedor' | 'pos_venda' | 'montador' | 'assistencia';

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  companyId: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface InviteUserInput {
  email: string;
  fullName: string;
  roles: UserRole[];
}

export const usersService = {
  /**
   * List all users in the company
   */
  async listCompanyUsers(): Promise<UserProfile[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    // Get all profiles from company
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', profile.company_id);

    if (profilesError) throw profilesError;

    // Get roles for all users
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', profiles?.map(p => p.id) || []);

    if (rolesError) throw rolesError;

    // Get emails from auth.users (using admin API would be ideal, but we'll work with what we have)
    const usersMap = new Map<string, UserProfile>();

    profiles?.forEach(p => {
      const userRoles = roles?.filter(r => r.user_id === p.id).map(r => r.role as UserRole) || [];
      usersMap.set(p.id, {
        id: p.id,
        fullName: p.full_name,
        phone: p.phone,
        avatarUrl: p.avatar_url,
        companyId: p.company_id,
        roles: userRoles,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      });
    });

    return Array.from(usersMap.values());
  },

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map(r => r.role as UserRole);
  },

  /**
   * Update user roles
   */
  async updateUserRoles(userId: string, roles: UserRole[]): Promise<void> {
    // Delete existing roles
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // Insert new roles
    if (roles.length > 0) {
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(roles.map(role => ({ user_id: userId, role })));

      if (insertError) throw insertError;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { fullName?: string; phone?: string }): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single();

    return !error && !!data;
  },
};
