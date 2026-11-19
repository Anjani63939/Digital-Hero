create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  division text not null,
  description text not null default '',
  base_price numeric(10, 2) not null check (base_price >= 0),
  min_width numeric(8, 2) not null default 2,
  max_width numeric(8, 2) not null default 60,
  min_height numeric(8, 2) not null default 2,
  max_height numeric(8, 2) not null default 60,
  materials jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_id text not null references public.products (id),
  name text not null default 'My design',
  artwork jsonb not null default '{}'::jsonb,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.profiles (id),
  customer_name text not null default '',
  customer_email text not null default '',
  product_id text not null references public.products (id),
  product_name text not null,
  division text not null,
  configuration jsonb not null default '{}'::jsonb,
  artwork jsonb not null default '{}'::jsonb,
  quantity integer not null check (quantity > 0),
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null,
  total numeric(10, 2) not null,
  status text not null default 'proof' check (status in ('quote', 'order', 'artwork', 'proof', 'production', 'completed')),
  proof_version integer not null default 1,
  proof_state text not null default 'pending' check (proof_state in ('pending', 'changes_requested', 'approved')),
  approval_log jsonb not null default '[]'::jsonb,
  payment_status text not null default 'pending',
  stripe_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists designs_customer_updated_idx on public.designs (customer_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.designs enable row level security;
alter table public.orders enable row level security;

create policy "Profiles are readable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Products are publicly readable" on public.products for select using (active = true);
create policy "Customers manage their own designs" on public.designs for all using (auth.uid() = customer_id) with check (auth.uid() = customer_id);
create policy "Customers read their own orders" on public.orders for select using (auth.uid() = customer_id);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

insert into public.products (id, name, division, description, base_price, materials)
values
  ('die-cut-labels', 'Die-cut labels', 'Labels & stickers', 'Custom-cut vinyl labels, finished to your shape.', 0.24, '["Matte vinyl", "Gloss vinyl", "Paper"]'),
  ('race-numbers', 'Race numbers', 'Race & event numbers', 'Weatherproof bibs and number panels for race day.', 0.38, '["Waterproof synthetic", "Tyvek"]'),
  ('mtb-boards', 'MTB number boards', 'MTB boards', 'Rugged printed plates for your next start line.', 12.50, '["White PVC", "Brushed aluminium"]'),
  ('custom-stamp', 'Custom stamps', 'Stamps', 'A clean impression, made with your mark.', 18.00, '["Self-inking", "Wood handle"]'),
  ('acrylic-trophy', 'Acrylic trophies', 'Trophies', 'Recognise a big moment with a custom-cut award.', 32.00, '["Clear acrylic", "Frosted acrylic"]'),
  ('laser-cut-sign', 'Laser-cut signs', 'Laser-cut work', 'Precision-cut signage for studios, shops and homes.', 25.00, '["Birch plywood", "Clear acrylic", "Brushed aluminium"]')
on conflict (id) do nothing;
