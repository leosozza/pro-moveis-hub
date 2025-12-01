/**
 * Company Service
 * Encapsulates all Supabase operations for companies.
 */

import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';

export interface Company {
  id: string;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  margemPadraoChapa?: number | null;
  margemPadraoFerragem?: number | null;
  perdaChapaPercentual?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyInput {
  name?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  margemPadraoChapa?: number;
  margemPadraoFerragem?: number;
  perdaChapaPercentual?: number;
}

export const companyService = {
  /**
   * Get current user's company
   */
  async getCurrent(): Promise<Company | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    if (error) throw error;

    return data ? {
      id: data.id,
      name: data.name,
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      address: data.address,
      logoUrl: data.logo_url,
      margemPadraoChapa: data.margem_padrao_chapa,
      margemPadraoFerragem: data.margem_padrao_ferragem,
      perdaChapaPercentual: data.perda_chapa_percentual,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } : null;
  },

  /**
   * Update company information
   */
  async update(companyId: string, input: UpdateCompanyInput): Promise<Company> {
    const updateData: TablesUpdate<'companies'> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.cnpj !== undefined) updateData.cnpj = input.cnpj;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.margemPadraoChapa !== undefined) updateData.margem_padrao_chapa = input.margemPadraoChapa;
    if (input.margemPadraoFerragem !== undefined) updateData.margem_padrao_ferragem = input.margemPadraoFerragem;
    if (input.perdaChapaPercentual !== undefined) updateData.perda_chapa_percentual = input.perdaChapaPercentual;

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      address: data.address,
      logoUrl: data.logo_url,
      margemPadraoChapa: data.margem_padrao_chapa,
      margemPadraoFerragem: data.margem_padrao_ferragem,
      perdaChapaPercentual: data.perda_chapa_percentual,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Upload company logo
   */
  async uploadLogo(companyId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/logo.${fileExt}`;

    // Delete old logo if exists
    await supabase.storage
      .from('project-files')
      .remove([fileName]);

    // Upload new logo
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileName);

    // Update company with logo URL
    const { error: updateError } = await supabase
      .from('companies')
      .update({ logo_url: publicUrl })
      .eq('id', companyId);

    if (updateError) throw updateError;

    return publicUrl;
  },

  /**
   * Remove company logo
   */
  async removeLogo(companyId: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .update({ logo_url: null })
      .eq('id', companyId);

    if (error) throw error;
  },
};
