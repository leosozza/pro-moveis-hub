import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const formSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  customer_id: z.string().min(1, "Selecione um cliente"),
  project_id: z.string().optional(),
  estimated_value: z.string().optional(),
  expected_close_date: z.string().optional(),
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
      customer_id: "",
      project_id: "",
      estimated_value: "",
      expected_close_date: "",
      description: "",
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
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

      const { error } = await supabase
        .from("deals")
        .insert({
          title: data.title,
          customer_id: data.customer_id,
          project_id: data.project_id || null,
          estimated_value: data.estimated_value ? parseFloat(data.estimated_value) : null,
          expected_close_date: data.expected_close_date || null,
          description: data.description,
          company_id: profile.company_id,
          pipeline_id: pipelineId,
          stage_id: stageId,
          responsible_id: user.id,
          position: 0,
        });

      if (error) throw error;

      toast({
        title: "Deal criado",
        description: "Deal adicionado com sucesso!",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao criar deal",
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
              <FormLabel>Título *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do negócio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Projeto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um projeto (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Estimado</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expected_close_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Prevista</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes do negócio" {...field} />
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
            Criar Deal
          </Button>
        </div>
      </form>
    </Form>
  );
};
