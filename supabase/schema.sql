create table if not exists public.schools (
  id text primary key,
  name text not null
);

create table if not exists public.vendors (
  id text primary key,
  school_id text not null references public.schools(id),
  name text not null,
  photo_url text,
  menu_items jsonb not null default '[]'::jsonb
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  school_id text not null references public.schools(id),
  token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, token_hash)
);

create table if not exists public.session_rankings (
  session_id uuid not null references public.sessions(id) on delete cascade,
  school_id text not null references public.schools(id),
  vendor_id text not null references public.vendors(id),
  bucket text not null check (bucket in ('liked', 'fine', 'disliked')),
  within_bucket_rank integer not null,
  computed_score numeric(3,1) not null check (computed_score between 0 and 10),
  primary key (session_id, vendor_id)
);

create table if not exists public.session_favorite_dishes (
  session_id uuid not null references public.sessions(id) on delete cascade,
  school_id text not null references public.schools(id),
  vendor_id text not null references public.vendors(id),
  dish_name text not null,
  primary key (session_id, vendor_id)
);

create index if not exists session_rankings_school_vendor_idx on public.session_rankings (school_id, vendor_id);
create index if not exists session_favorite_school_vendor_idx on public.session_favorite_dishes (school_id, vendor_id);

alter table public.schools enable row level security;
alter table public.vendors enable row level security;
alter table public.sessions enable row level security;
alter table public.session_rankings enable row level security;
alter table public.session_favorite_dishes enable row level security;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.schools to service_role;
grant select, insert, update, delete on table public.vendors to service_role;
grant select, insert, update, delete on table public.sessions to service_role;
grant select, insert, update, delete on table public.session_rankings to service_role;
grant select, insert, update, delete on table public.session_favorite_dishes to service_role;

insert into public.schools (id, name) values ('northwestern', 'Northwestern University')
on conflict (id) do update set name = excluded.name;

insert into public.vendors (id, school_id, name, menu_items) values
  ('mod-pizza', 'northwestern', 'MOD Pizza', '["Create Your Own Pizza", "Mad Dog", "Tristan", "Caspian", "No Name Cake"]'),
  ('buen-dia', 'northwestern', 'Buen Dia', '["Buen Dia Bowl", "Chicken Tacos", "Veggie Tacos", "Chips & Guac", "Horchata"]'),
  ('wildcat-deli', 'northwestern', 'Wildcat Deli', '["Turkey Club", "Italian Sub", "Veggie Wrap", "Chicken Caesar Wrap", "Grilled Cheese"]'),
  ('847-burger', 'northwestern', '847 Burger', '["847 Classic", "Double Burger", "Crispy Chicken Sandwich", "Veggie Burger", "Loaded Fries"]'),
  ('shake-smart', 'northwestern', 'Shake Smart', '["The Classic", "PB Squared", "Acai Bowl", "Green Giant", "Overnight Oats"]'),
  ('frans-cafe', 'northwestern', 'Fran''s Cafe', '["Chicken Tenders", "Quesadilla", "Mozzarella Sticks", "Mac & Cheese", "Fries"]'),
  ('lisas-cafe', 'northwestern', 'Lisa''s Cafe', '["Breakfast Sandwich", "Bagel & Cream Cheese", "Chicken Tenders", "Grilled Cheese", "Iced Coffee"]'),
  ('starbucks', 'northwestern', 'Starbucks', '["Caramel Macchiato", "Pink Drink", "Cold Brew", "Bacon Gouda Sandwich", "Cake Pop"]'),
  ('tech-express', 'northwestern', 'Tech Express', '["Chicken Sandwich", "Caesar Salad", "Turkey Wrap", "Fruit Cup", "Iced Tea"]')
on conflict (id) do update set name = excluded.name, menu_items = excluded.menu_items;
