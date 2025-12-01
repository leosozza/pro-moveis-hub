import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Building2, X } from "lucide-react";
import { toast } from "sonner";
import { useCompany, useUpdateCompany, useUploadCompanyLogo, useRemoveCompanyLogo } from "@/modules/crm/hooks/useCompany";

const EmpresaConfig = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: company, isLoading } = useCompany();
  const updateCompany = useUpdateCompany();
  const uploadLogo = useUploadCompanyLogo();
  const removeLogo = useRemoveCompanyLogo();

  const [formData, setFormData] = useState({
    name: company?.name || "",
    cnpj: company?.cnpj || "",
    email: company?.email || "",
    phone: company?.phone || "",
    address: company?.address || "",
    margemPadraoChapa: company?.margemPadraoChapa || 40,
    margemPadraoFerragem: company?.margemPadraoFerragem || 30,
    perdaChapaPercentual: company?.perdaChapaPercentual || 10,
  });

  // Update form when company data loads
  useState(() => {
    if (company) {
      setFormData({
        name: company.name,
        cnpj: company.cnpj || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        margemPadraoChapa: company.margemPadraoChapa || 40,
        margemPadraoFerragem: company.margemPadraoFerragem || 30,
        perdaChapaPercentual: company.perdaChapaPercentual || 10,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      await updateCompany.mutateAsync({
        companyId: company.id,
        data: formData,
      });
      toast.success("Dados da empresa atualizados!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar empresa";
      toast.error(errorMessage);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB");
      return;
    }

    try {
      await uploadLogo.mutateAsync({ companyId: company.id, file });
      toast.success("Logo atualizado!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao fazer upload";
      toast.error(errorMessage);
    }
  };

  const handleRemoveLogo = async () => {
    if (!company) return;

    try {
      await removeLogo.mutateAsync(company.id);
      toast.success("Logo removido!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao remover logo";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações da Empresa</h1>
        <p className="text-muted-foreground">Personalize os dados e logo da sua marcenaria</p>
      </div>

      <div className="space-y-6">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Logo da Empresa</CardTitle>
            <CardDescription>Faça upload do logo da sua marcenaria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={company?.logoUrl || undefined} />
                <AvatarFallback>
                  <Building2 className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                >
                  {uploadLogo.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Logo
                </Button>
                {company?.logoUrl && (
                  <Button
                    variant="ghost"
                    onClick={handleRemoveLogo}
                    disabled={removeLogo.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Empresa</CardTitle>
            <CardDescription>Informações básicas da marcenaria</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Empresa *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              <div>
                <Label>Endereço</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="border-t pt-4 mt-6">
                <h3 className="font-medium mb-4">Configurações de Precificação</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Margem Padrão Chapa (%)</Label>
                    <Input
                      type="number"
                      value={formData.margemPadraoChapa}
                      onChange={(e) => setFormData({ ...formData, margemPadraoChapa: parseFloat(e.target.value) })}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>Margem Padrão Ferragem (%)</Label>
                    <Input
                      type="number"
                      value={formData.margemPadraoFerragem}
                      onChange={(e) => setFormData({ ...formData, margemPadraoFerragem: parseFloat(e.target.value) })}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>Perda de Chapa (%)</Label>
                    <Input
                      type="number"
                      value={formData.perdaChapaPercentual}
                      onChange={(e) => setFormData({ ...formData, perdaChapaPercentual: parseFloat(e.target.value) })}
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateCompany.isPending}>
                  {updateCompany.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmpresaConfig;
