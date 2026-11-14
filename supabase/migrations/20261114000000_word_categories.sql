-- Retire l'ancien système de comptes (remplacé par public.profiles).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.user_profiles;

-- Liste les catégories de mots : une par table publique "mots_anglais_*".
-- Ajouter une nouvelle table de ce nom (colonnes french, english, theme) suffit
-- pour qu'elle apparaisse dans l'application.
create or replace function public.word_categories()
returns table (table_name text, theme text, words bigint)
language plpgsql stable security invoker set search_path = public as $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'mots\_anglais\_%'
    order by c.relname
  loop
    begin
      return query execute format(
        'select %L::text, min(theme)::text, count(*) from public.%I where french is not null and english is not null',
        t.relname, t.relname
      );
    exception when others then
      -- Table illisible ou sans les bonnes colonnes : on l'ignore.
      null;
    end;
  end loop;
end;
$$;

grant execute on function public.word_categories() to anon, authenticated;
