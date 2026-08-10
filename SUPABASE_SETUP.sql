-- Prime Creative fresh Supabase setup
-- Run this inside the SQL editor of your NEW Supabase project.

create table if not exists public.cms (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id text primary key,
  status text not null default 'New',
  service text,
  package text,
  name text,
  company text,
  email text,
  phone text,
  meeting text,
  timeline text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id text primary key,
  name text not null,
  url text not null,
  type text,
  created_at timestamptz not null default now()
);

insert into public.cms (key, value)
values
  ('settings', '{
    "brandName": "Prime Creative",
    "whatsapp": "09162902223",
    "email": "primecreative66@gmail.com",
    "domain": "",
    "paystackPublicKey": "",
    "supabaseUrl": "",
    "supabaseAnonKey": ""
  }'::jsonb),
  ('services', '[]'::jsonb),
  ('courses', '[]'::jsonb)
on conflict (key) do nothing;

alter table public.cms enable row level security;
alter table public.bookings enable row level security;
alter table public.uploads enable row level security;

-- API routes use the service role key on the server, so public policies are not required yet.
-- Later, add authenticated admin/student policies when Supabase Auth is fully connected.

insert into storage.buckets (id, name, public)
values ('prime-uploads', 'prime-uploads', true)
on conflict (id) do nothing;
