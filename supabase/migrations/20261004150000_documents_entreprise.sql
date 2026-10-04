-- LBP-CLIENT-02 : "Vos documents" (1.3.5, p.9) -- dernier écart
-- structurel du module "Mon entreprise", suite au retour de
-- l'utilisateur ("on corrige de notre côté"). Le vrai prototype
-- (renderDocDetail(), `LBP_V9.9_Studio.html` ~L10309) précise
-- explicitement "Le client consulte, sans pouvoir modifier" -- écriture
-- admin uniquement, lecture client scopée à sa société, même partition
-- que pour l'offre ("le client demande, G2S contrôle"). Pas de vraie
-- infrastructure de stockage de fichiers construite nulle part dans
-- l'appli (Studio compris) : même convention que `articles.pdf_url`
-- (STU-WORKFLOW-07) -- un lien externe en texte, jamais un upload.
create type company_document_category as enum ('cc', 'acc', 'grille', 'charte');

create table company_documents (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies(id) on delete cascade,
  category    company_document_category not null,
  name        text not null,
  meta        text,
  doc_date    date,
  url         text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_company_documents_company on company_documents(company_id, category);

create trigger trg_company_documents_updated_at
  before update on company_documents
  for each row execute function set_updated_at();

alter table company_documents enable row level security;

-- Lecture : admin (toute société) ou client de sa propre société -- même
-- partition que team_members/payroll_org/software_stack.
create policy company_documents_select on company_documents for select
  using (is_admin() or company_id = current_company_id());

-- Écriture : admin uniquement, jamais le client (RLS, pas juste
-- l'absence de bouton côté UI -- "consulte sans pouvoir modifier" tient
-- même si un client inspecte les requêtes réseau).
create policy company_documents_admin_write  on company_documents for insert with check (is_admin());
create policy company_documents_admin_update on company_documents for update using (is_admin());
create policy company_documents_admin_delete on company_documents for delete using (is_admin());
