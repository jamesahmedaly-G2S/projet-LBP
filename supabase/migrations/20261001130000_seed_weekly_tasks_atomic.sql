-- LBP-CLIENT-01 (correctif, 01/10/2026) : le widget "Vos rappels de la
-- semaine" (app/(client)/accueil/AccueilContent.tsx) amorçait les tâches
-- de la semaine avec un "SELECT puis, si vide, INSERT" fait en JS --
-- signalé par l'utilisateur comme dupliqué en usage réel. Cause : ce
-- n'est pas atomique, et le rendu d'un Server Component peut être
-- déclenché plus d'une fois pour une même navigation (pré-chargement de
-- <Link> par Next.js notamment) -- deux rendus quasi simultanés voient
-- chacun "aucune tâche" et insèrent chacun leur lot.
--
-- Fonction dédiée (même pattern que check_and_increment_chat_quota, seule
-- autre fonction du schéma réel de James qui fait un "vérifier puis
-- agir") : verrou consultatif par profil (pg_advisory_xact_lock) pour
-- sérialiser deux appels concurrents sur le même profil_id, puis ré-
-- amorce seulement si toujours vide une fois le verrou obtenu, et renvoie
-- dans tous les cas l'état courant réel des tâches -- jamais un doublon,
-- et jamais une page qui affiche "vide" alors que l'autre appel vient de
-- semer les tâches.
create or replace function seed_weekly_tasks(p_profile_id uuid)
returns setof tasks
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_profile_id <> auth.uid() and not is_admin() then
    raise exception 'forbidden';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_profile_id::text));

  if not exists (select 1 from tasks where profile_id = p_profile_id) then
    insert into tasks (profile_id, title, due_date, note, status)
    select p_profile_id, ce.title, ce.event_date, ce.category, 'todo'::task_status
    from calendar_events ce
    where ce.event_date >= date_trunc('week', current_date)::date
      and ce.event_date <= (date_trunc('week', current_date) + interval '6 days')::date
    order by ce.event_date
    limit 4;
  end if;

  return query
  select * from tasks where profile_id = p_profile_id order by due_date nulls last;
end;
$$;

grant execute on function seed_weekly_tasks(uuid) to authenticated;
