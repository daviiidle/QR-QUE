-- ============ RLS ============
alter table shops                   enable row level security;
alter table shop_users              enable row level security;
alter table categories              enable row level security;
alter table products                enable row level security;
alter table modifier_groups         enable row level security;
alter table modifier_options        enable row level security;
alter table product_modifier_groups enable row level security;
alter table orders                  enable row level security;
alter table order_items             enable row level security;
alter table order_item_modifiers    enable row level security;

create or replace function is_shop_member(p_shop uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists(
      select 1 from shop_users
      where shop_id = p_shop and user_id = auth.uid()
    );
$$;

create or replace function is_shop_owner(p_shop uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists(
      select 1 from shop_users
      where shop_id = p_shop and user_id = auth.uid() and role = 'owner'
    );
$$;

-- --- shops ---
drop policy if exists "shops public read" on shops;
create policy "shops public read" on shops for select using (is_active);

drop policy if exists "shops owner update" on shops;
create policy "shops owner update" on shops for update
  using (is_shop_owner(id)) with check (is_shop_owner(id));

-- --- shop_users ---
drop policy if exists "members see their rows" on shop_users;
create policy "members see their rows" on shop_users for select
  using (user_id = auth.uid() or is_shop_owner(shop_id));

drop policy if exists "owner manages staff" on shop_users;
create policy "owner manages staff" on shop_users for all
  using (is_shop_owner(shop_id)) with check (is_shop_owner(shop_id));

-- --- categories ---
drop policy if exists "categories public read" on categories;
create policy "categories public read" on categories for select using (is_active);

drop policy if exists "categories admin write" on categories;
create policy "categories admin write" on categories for all
  using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

-- --- products ---
drop policy if exists "products public read" on products;
create policy "products public read" on products for select using (is_active);

drop policy if exists "products admin write" on products;
create policy "products admin write" on products for all
  using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

-- --- modifier_groups ---
drop policy if exists "mod groups public read" on modifier_groups;
create policy "mod groups public read" on modifier_groups for select using (true);

drop policy if exists "mod groups admin write" on modifier_groups;
create policy "mod groups admin write" on modifier_groups for all
  using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

-- --- modifier_options ---
drop policy if exists "mod options public read" on modifier_options;
create policy "mod options public read" on modifier_options for select using (is_active);

drop policy if exists "mod options admin write" on modifier_options;
create policy "mod options admin write" on modifier_options for all
  using (exists(select 1 from modifier_groups g where g.id = group_id and is_shop_member(g.shop_id)))
  with check (exists(select 1 from modifier_groups g where g.id = group_id and is_shop_member(g.shop_id)));

-- --- product_modifier_groups ---
drop policy if exists "pmg public read" on product_modifier_groups;
create policy "pmg public read" on product_modifier_groups for select using (true);

drop policy if exists "pmg admin write" on product_modifier_groups;
create policy "pmg admin write" on product_modifier_groups for all
  using (exists(select 1 from products p where p.id = product_id and is_shop_member(p.shop_id)))
  with check (exists(select 1 from products p where p.id = product_id and is_shop_member(p.shop_id)));

-- --- orders ---
-- Writes via service role only. Staff can read/update their shop's orders.
drop policy if exists "staff read orders" on orders;
create policy "staff read orders" on orders for select using (is_shop_member(shop_id));

drop policy if exists "staff update orders" on orders;
create policy "staff update orders" on orders for update
  using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

drop policy if exists "staff read order items" on order_items;
create policy "staff read order items" on order_items for select using (
  exists(select 1 from orders o where o.id = order_id and is_shop_member(o.shop_id))
);

drop policy if exists "staff read order mods" on order_item_modifiers;
create policy "staff read order mods" on order_item_modifiers for select using (
  exists(select 1 from order_items oi join orders o on o.id = oi.order_id
         where oi.id = order_item_id and is_shop_member(o.shop_id))
);
