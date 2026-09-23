-- =============================================================================
-- Reintroduit handle_new_user() (trigger de creation automatique du profil
-- a l'inscription) et is_editor(), absents du script baseline importe en
-- 20260923121802 -- regression identifiee par rapport a l'ancienne
-- migration DATA-02 (voir docs/adr/0004-baseline-schema-reel...).
-- Adapte aux noms de colonnes anglais de la baseline (full_name existe
-- toujours sur profiles, inchange).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. handle_new_user() -- creation automatique du profil a l'inscription
-- -----------------------------------------------------------------------------
-- full_name est NOT NULL sur profiles ; a l'inscription on ne l'a pas
-- toujours (depend de ce que le client passe dans les metadata du signup).
-- On retombe sur la partie locale de l'email plutot que de rendre la
-- colonne nullable, pour garder une valeur toujours exploitable en UI.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, company_id, full_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'company_id', '')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. is_editor() -- alias de is_admin()
-- -----------------------------------------------------------------------------
-- Le vocabulaire "editor" vient de l'annexe 5.4 du cahier des charges
-- (modele de roles a 3 valeurs, non retenu -- decision Note de cadrage
-- p.13, user_role reduit a 2 valeurs admin/client). Conservee comme
-- fonction distincte uniquement pour satisfaire litteralement le critere
-- d'acceptation du ticket DATA-02 ("is_editor() retourne vrai uniquement
-- pour les roles editor/admin") ; is_editor() et is_admin() sont
-- strictement equivalents tant qu'un role editor distinct n'est pas
-- (re)introduit.
create or replace function is_editor()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select is_admin();
$$;
