import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  customer_name: z.string().min(2, "Nome do cliente é obrigatório"),
  customer_phone: z.string().min(10, "Telefone/WhatsApp é obrigatório"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DealFormProps {
  pipelineId: string;
  stageId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DealForm = ({ pipelineId, stageId, onSuccess, onCancel }: DealFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      customer_name: "",
      customer_phone: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado");

      // Criar deal com dados inline do cliente
      const { error } = await supabase
        .from("deals")
        .insert({
          title: data.title,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          description: data.description,
          company_id: profile.company_id,
          pipeline_id: pipelineId,
          stage_id: stageId,
          responsible_id: user.id,
          position: 0,
        });

      if (error) throw error;

      toast({
        title: "Lead criado",
        description: "Lead adicionado com sucesso!",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao criar lead",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Lead *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Cozinha planejada" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente *</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone/WhatsApp *</FormLabel>
              <FormControl>
                <Input placeholder="(00) 00000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Breve</FormLabel>
              <FormControl>
                <Textarea placeholder="O que o cliente deseja..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Lead
          </Button>
        </div>
      </form>
    </Form>
  );
};