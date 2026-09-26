create index if not exists marketplace_flash_sales_created_by_idx on public.marketplace_flash_sales(created_by);
create index if not exists marketplace_flash_sales_approved_by_idx on public.marketplace_flash_sales(approved_by);

create or replace function public.set_marketplace_flash_sale_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "Public can view active flash sales" on public.marketplace_flash_sales;
drop policy if exists "Sellers can view their flash sales" on public.marketplace_flash_sales;
drop policy if exists "Public can view active flash sale items" on public.marketplace_flash_sale_items;
drop policy if exists "Sellers can view their flash sale items" on public.marketplace_flash_sale_items;

create policy "Public can view active flash sales"
on public.marketplace_flash_sales for select to anon
using (status = 'approved' and starts_at <= now() and ends_at > now());

create policy "Users can view active or owned flash sales"
on public.marketplace_flash_sales for select to authenticated
using (
  (status = 'approved' and starts_at <= now() and ends_at > now())
  or seller_id in (select s.id from public.sellers s where s.user_id = (select auth.uid()))
);

create policy "Public can view active flash sale items"
on public.marketplace_flash_sale_items for select to anon
using (exists (
  select 1 from public.marketplace_flash_sales fs
  where fs.id = flash_sale_id and fs.status = 'approved'
    and fs.starts_at <= now() and fs.ends_at > now()
));

create policy "Users can view active or owned flash sale items"
on public.marketplace_flash_sale_items for select to authenticated
using (
  exists (
    select 1 from public.marketplace_flash_sales fs
    where fs.id = flash_sale_id
      and (
        (fs.status = 'approved' and fs.starts_at <= now() and fs.ends_at > now())
        or fs.seller_id in (select s.id from public.sellers s where s.user_id = (select auth.uid()))
      )
  )
);