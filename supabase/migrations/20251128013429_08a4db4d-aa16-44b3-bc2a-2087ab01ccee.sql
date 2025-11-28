-- Criar bucket para arquivos do projeto
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao storage
CREATE POLICY "Usuários podem fazer upload de arquivos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Usuários podem ver arquivos da empresa"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Usuários podem deletar arquivos da empresa"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies WHERE id = get_user_company_id(auth.uid())
  )
);