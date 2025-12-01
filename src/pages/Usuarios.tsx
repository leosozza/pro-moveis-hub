import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserPlus, Mail, Phone, Shield } from "lucide-react";
import { toast } from "sonner";
import { useCompanyUsers, useUpdateUserRoles, useUpdateUserProfile, useIsAdmin } from "@/modules/crm/hooks/useUsers";
import type { UserProfile, UserRole } from "@/modules/crm/services/users.service";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  projetista: 'Projetista',
  vendedor: 'Vendedor',
  pos_venda: 'Pós-Venda',
  montador: 'Montador',
  assistencia: 'Assistência',
};

const ROLE_COLORS: Record<UserRole, "default" | "secondary" | "destructive" | "outline"> = {
  admin: 'destructive',
  projetista: 'default',
  vendedor: 'secondary',
  pos_venda: 'outline',
  montador: 'outline',
  assistencia: 'outline',
};

const Usuarios = () => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editedRoles, setEditedRoles] = useState<UserRole[]>([]);
  const [editedProfile, setEditedProfile] = useState({ fullName: "", phone: "" });

  const { data: users, isLoading } = useCompanyUsers();
  const { data: isAdmin } = useIsAdmin();
  const updateRoles = useUpdateUserRoles();
  const updateProfile = useUpdateUserProfile();

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditedRoles(user.roles);
    setEditedProfile({ fullName: user.fullName, phone: user.phone || "" });
  };

  const handleToggleRole = (role: UserRole) => {
    setEditedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      // Update roles
      await updateRoles.mutateAsync({
        userId: selectedUser.id,
        roles: editedRoles,
      });

      // Update profile if changed
      if (editedProfile.fullName !== selectedUser.fullName || editedProfile.phone !== selectedUser.phone) {
        await updateProfile.mutateAsync({
          userId: selectedUser.id,
          data: editedProfile,
        });
      }

      toast.success("Usuário atualizado!");
      setSelectedUser(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar usuário";
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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie os funcionários da sua marcenaria</p>
        </div>
        <Button disabled={!isAdmin}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      {!isAdmin && (
        <Card className="mb-6 border-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <Shield className="h-5 w-5" />
              <p className="text-sm">Apenas administradores podem gerenciar usuários</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{user.fullName}</CardTitle>
                    <CardDescription className="flex flex-col gap-1 mt-1">
                      {user.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      )}
                      {user.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleEditUser(user)}
                  disabled={!isAdmin}
                >
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.roles.length > 0 ? (
                  user.roles.map(role => (
                    <Badge key={role} variant={ROLE_COLORS[role]}>
                      {ROLE_LABELS[role]}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Sem permissões</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {users?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Nenhum usuário encontrado</CardTitle>
              <CardDescription>
                Comece convidando usuários para sua equipe
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações e permissões do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                value={editedProfile.fullName}
                onChange={(e) => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={editedProfile.phone}
                onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="border-t pt-4">
              <Label className="mb-3 block">Permissões</Label>
              <div className="space-y-2">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={role}
                      checked={editedRoles.includes(role)}
                      onCheckedChange={() => handleToggleRole(role)}
                    />
                    <Label htmlFor={role} className="cursor-pointer">
                      {ROLE_LABELS[role]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateRoles.isPending || updateProfile.isPending}
              >
                {(updateRoles.isPending || updateProfile.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;
