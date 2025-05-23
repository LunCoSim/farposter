-- Farpost Game Database Schema
-- Note: JWT secrets are automatically managed by Supabase

-- Create custom types
create type cell_status as enum ('owned', 'extracting', 'ready');
create type resource_type as enum (
  'Lunar Regolith',
  'Iron Ore', 
  'Aluminum',
  'Water Ice',
  'Magnesium',
  'Silicon',
  'Titanium',
  'Rare Earth Elements',
  'Platinum Group Metals',
  'Helium-3'
);

-- Users table (extends Supabase auth.users)
create table public.player_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  level integer not null default 1,
  xp integer not null default 0,
  points integer not null default 1000,
  owned_cells integer not null default 3,
  max_cells integer not null default 3,
  active_booster text,
  booster_end_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Game cells table
create table public.game_cells (
  id serial primary key,
  player_id uuid references public.player_profiles(id) on delete cascade,
  cell_index integer not null,
  status cell_status not null default 'owned',
  resource_type resource_type,
  extraction_start_time timestamp with time zone,
  extraction_end_time timestamp with time zone,
  is_ready boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(player_id, cell_index)
);

-- Player resources inventory
create table public.player_resources (
  id serial primary key,
  player_id uuid references public.player_profiles(id) on delete cascade,
  resource_type resource_type not null,
  amount integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(player_id, resource_type)
);

-- Player expeditions inventory
create table public.player_expeditions (
  id serial primary key,
  player_id uuid references public.player_profiles(id) on delete cascade,
  expedition_type resource_type not null,
  amount integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(player_id, expedition_type)
);

-- Player boosters inventory
create table public.player_boosters (
  id serial primary key,
  player_id uuid references public.player_profiles(id) on delete cascade,
  booster_type text not null,
  amount integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(player_id, booster_type)
);

-- Game sessions for analytics
create table public.game_sessions (
  id serial primary key,
  player_id uuid references public.player_profiles(id) on delete cascade,
  session_start timestamp with time zone default timezone('utc'::text, now()) not null,
  session_end timestamp with time zone,
  actions_taken integer default 0,
  xp_gained integer default 0,
  points_spent integer default 0
);

-- Enable Row Level Security
alter table public.player_profiles enable row level security;
alter table public.game_cells enable row level security;
alter table public.player_resources enable row level security;
alter table public.player_expeditions enable row level security;
alter table public.player_boosters enable row level security;
alter table public.game_sessions enable row level security;

-- Create policies
create policy "Users can view own profile" on public.player_profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.player_profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.player_profiles
  for insert with check (auth.uid() = id);

create policy "Users can view own cells" on public.game_cells
  for all using (auth.uid() = player_id);

create policy "Users can view own resources" on public.player_resources
  for all using (auth.uid() = player_id);

create policy "Users can view own expeditions" on public.player_expeditions
  for all using (auth.uid() = player_id);

create policy "Users can view own boosters" on public.player_boosters
  for all using (auth.uid() = player_id);

create policy "Users can view own sessions" on public.game_sessions
  for all using (auth.uid() = player_id);

-- Create functions for automatic updates
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.player_profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  
  -- Initialize starting cells (3 owned cells at positions 7, 8, 9)
  insert into public.game_cells (player_id, cell_index, status)
  values 
    (new.id, 7, 'owned'),
    (new.id, 8, 'owned'), 
    (new.id, 9, 'owned');
    
  -- Initialize resource inventory
  insert into public.player_resources (player_id, resource_type, amount)
  select new.id, unnest(enum_range(NULL::resource_type)), 0;
  
  -- Initialize expedition inventory  
  insert into public.player_expeditions (player_id, expedition_type, amount)
  select new.id, unnest(enum_range(NULL::resource_type)), 0;
  
  -- Initialize booster inventory
  insert into public.player_boosters (player_id, booster_type, amount)
  values 
    (new.id, 'Basic Booster', 0),
    (new.id, 'Advanced Booster', 0),
    (new.id, 'Elite Booster', 0),
    (new.id, 'Master Booster', 0),
    (new.id, 'Ultimate Booster', 0);

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at before update on public.player_profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.game_cells
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.player_resources
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.player_expeditions
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.player_boosters
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index idx_game_cells_player_id on public.game_cells(player_id);
create index idx_player_resources_player_id on public.player_resources(player_id);
create index idx_player_expeditions_player_id on public.player_expeditions(player_id);
create index idx_player_boosters_player_id on public.player_boosters(player_id);
create index idx_game_sessions_player_id on public.game_sessions(player_id); 