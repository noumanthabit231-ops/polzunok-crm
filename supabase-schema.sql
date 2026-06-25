-- =============================================
-- Ползунок.CRM — Supabase схема
-- =============================================

-- 1. Таблица заведений
create table if not exists public.establishments (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  created_at timestamptz default now()
);

-- 2. Таблица платежей (подписок)
create table if not exists public.payments (
  id                uuid default gen_random_uuid() primary key,
  establishment_id  uuid not null references public.establishments(id) on delete cascade,
  amount            numeric(12, 2) not null,
  start_date        date not null,
  end_date          date not null,
  created_at        timestamptz default now()
);

-- 3. Индексы
create index if not exists idx_payments_establishment_id on public.payments(establishment_id);
create index if not exists idx_payments_dates on public.payments(start_date, end_date);

-- 4. RLS (Row Level Security) — отключаем для простоты
alter table public.establishments enable row level security;
alter table public.payments enable row level security;

-- Политики: разрешаем всё для анонимных пользователей (можно заменить на auth позже)
create policy "Allow all on establishments"
  on public.establishments for all
  using (true)
  with check (true);

create policy "Allow all on payments"
  on public.payments for all
  using (true)
  with check (true);
