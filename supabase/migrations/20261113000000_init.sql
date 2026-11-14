-- Memorize : comptes, classement et défis entre amis.
-- À exécuter une fois dans le projet Supabase (SQL Editor) ou via `supabase db push`.

-- Profils publics des joueurs (pseudo et score). Séparés de user_profiles,
-- qui contient l'email et reste privé.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null check (char_length(username) between 3 and 20),
  xp integer not null default 0 check (xp >= 0),
  words_learned integer not null default 0 check (words_learned >= 0),
  streak integer not null default 0 check (streak >= 0),
  updated_at timestamptz not null default now()
);

-- Pseudo unique sans tenir compte des majuscules.
create unique index profiles_username_key on public.profiles (lower(username));
create index profiles_xp_idx on public.profiles (xp desc);

alter table public.profiles enable row level security;

create policy "Les profils sont lisibles par tous"
  on public.profiles for select using (true);

create policy "Chacun modifie son propre profil"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Chacun crée son propre profil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Crée le profil à l'inscription quand un pseudo est fourni. Les comptes créés
-- sans pseudo (autre application, comptes existants) le choisissent dans l'app.
create function public.handle_new_player() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data ->> 'username' is not null then
    insert into public.profiles (id, username)
    values (new.id, new.raw_user_meta_data ->> 'username');
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_player() from public, anon, authenticated;

create trigger on_auth_user_created_player
  after insert on auth.users
  for each row execute function public.handle_new_player();

-- Défis : les deux joueurs répondent aux mêmes mots, le meilleur score gagne.
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles on delete cascade,
  opponent_id uuid not null references public.profiles on delete cascade,
  -- Liste des mots (version française) à traduire.
  words jsonb not null check (jsonb_typeof(words) = 'array'),
  challenger_score integer,
  opponent_score integer,
  created_at timestamptz not null default now(),
  check (challenger_id <> opponent_id)
);

create index challenges_challenger_idx on public.challenges (challenger_id, created_at desc);
create index challenges_opponent_idx on public.challenges (opponent_id, created_at desc);

alter table public.challenges enable row level security;

create policy "Les joueurs voient leurs défis"
  on public.challenges for select
  using (auth.uid() in (challenger_id, opponent_id));

create policy "Chacun lance ses propres défis"
  on public.challenges for insert
  with check (auth.uid() = challenger_id and challenger_score is null and opponent_score is null);

-- Les scores passent par cette fonction : chacun n'enregistre que le sien, une seule fois.
create function public.submit_challenge_score(challenge uuid, score integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if score < 0 or score > 10 then
    raise exception 'Score invalide';
  end if;
  update challenges set challenger_score = score
    where id = challenge and challenger_id = auth.uid() and challenger_score is null;
  update challenges set opponent_score = score
    where id = challenge and opponent_id = auth.uid() and opponent_score is null;
end;
$$;

revoke execute on function public.submit_challenge_score(uuid, integer) from public, anon;
grant execute on function public.submit_challenge_score(uuid, integer) to authenticated;
