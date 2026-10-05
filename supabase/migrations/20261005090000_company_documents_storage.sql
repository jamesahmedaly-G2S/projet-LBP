-- LBP-CLIENT-02 : "Vos documents" (1.3.5), suite à la réponse de Pauline
-- à la question posée par l'utilisateur ("pour les conventions
-- collective un simple lien URL suffit... mais pour les accords et
-- autres il nous faut la possibilité pour l'utilisateur d'importer des
-- docs PDF donc oui un vrai stockage") : premier vrai stockage de
-- fichiers de toute l'application (Studio compris, jamais construit
-- avant ce correctif). Bucket privé (pas de lecture publique par URL
-- devinée -- accords d'entreprise/grilles de salaire sont des documents
-- confidentiels), accès résolu via URL signée à la demande, jamais un
-- chemin public permanent.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-documents', 'company-documents', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

alter table company_documents add column if not exists file_path text;

-- Chemin de stockage : "{company_id}/{category}/{uuid}-{nom}.pdf" -- le
-- premier segment du chemin sert de clé de partition RLS (même principe
-- que company_documents elle-même : lecture admin ou société propre,
-- écriture admin uniquement).
create policy company_documents_storage_select on storage.objects for select
  using (
    bucket_id = 'company-documents'
    and (is_admin() or (storage.foldername(name))[1] = current_company_id()::text)
  );

create policy company_documents_storage_admin_insert on storage.objects for insert
  with check (bucket_id = 'company-documents' and is_admin());

create policy company_documents_storage_admin_update on storage.objects for update
  using (bucket_id = 'company-documents' and is_admin());

create policy company_documents_storage_admin_delete on storage.objects for delete
  using (bucket_id = 'company-documents' and is_admin());
