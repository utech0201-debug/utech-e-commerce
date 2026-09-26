create table if not exists public.marketplace_flash_sales (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text not null default '' check (char_length(description) <= 300),
  status text not null default 'pending' check (status in ('draft','pending','approved','paused','rejected','expired')),
  placement text not null default 'homepage' check (placement in ('homepage','store','both')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_flash_sales_time_check check (ends_at > starts_at)
);

create table if not exists public.marketplace_flash_sale_items (
  id uuid primary key default gen_random_uuid(),
  flash_sale_id uuid not null references public.marketplace_flash_sales(id) on delete cascade,
  product_id uuid not null references public.seller_products(id) on delete cascade,
  original_price numeric not null check (original_price >= 0),
  sale_price numeric not null check (sale_price >= 0 and sale_price < original_price),
  inventory_limit integer check (inventory_limit is null or inventory_limit > 0),
  sold_count integer not null default 0 check (sold_count >= 0),
  created_at timestamptz not null default now(),
  unique (flash_sale_id, product_id)
);

create index if not exists marketplace_flash_sales_active_idx
  on public.marketplace_flash_sales(status, starts_at, ends_at);
create index if not exists marketplace_flash_sales_seller_idx
  on public.marketplace_flash_sales(seller_id, created_at desc);
create index if not exists marketplace_flash_sale_items_sale_idx
  on public.marketplace_flash_sale_items(flash_sale_id);
create index if not exists marketplace_flash_sale_items_product_idx
  on public.marketplace_flash_sale_items(product_id);

create or replace function public.set_marketplace_flash_sale_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists marketplace_flash_sales_updated_at on public.marketplace_flash_sales;
create trigger marketplace_flash_sales_updated_at
before update on public.marketplace_flash_sales
for each row execute function public.set_marketplace_flash_sale_updated_at();

alter table public.marketplace_flash_sales enable row level security;
alter table public.marketplace_flash_sale_items enable row level security;

revoke all on table public.marketplace_flash_sales from anon, authenticated;
revoke all on table public.marketplace_flash_sale_items from anon, authenticated;
grant select on table public.marketplace_flash_sales to anon, authenticated;
grant select on table public.marketplace_flash_sale_items to anon, authenticated;

drop policy if exists "Public can view active flash sales" on public.marketplace_flash_sales;
create policy "Public can view active flash sales"
on public.marketplace_flash_sales for select to anon, authenticated
using (status = 'approved' and starts_at <= now() and ends_at > now());

drop policy if exists "Sellers can view their flash sales" on public.marketplace_flash_sales;
create policy "Sellers can view their flash sales"
on public.marketplace_flash_sales for select to authenticated
using (seller_id in (select s.id from public.sellers s where s.user_id = (select auth.uid())));

drop policy if exists "Public can view active flash sale items" on public.marketplace_flash_sale_items;
create policy "Public can view active flash sale items"
on public.marketplace_flash_sale_items for select to anon, authenticated
using (exists (
  select 1 from public.marketplace_flash_sales fs
  where fs.id = flash_sale_id and fs.status = 'approved'
    and fs.starts_at <= now() and fs.ends_at > now()
));

drop policy if exists "Sellers can view their flash sale items" on public.marketplace_flash_sale_items;
create policy "Sellers can view their flash sale items"
on public.marketplace_flash_sale_items for select to authenticated
using (exists (
  select 1
  from public.marketplace_flash_sales fs
  join public.sellers s on s.id = fs.seller_id
  where fs.id = flash_sale_id and s.user_id = (select auth.uid())
));