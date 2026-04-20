-- ============ EXTENSIONS ============
create extension if not exists pgcrypto;

-- ============ ENUMS ============
do $$ begin
  create type user_role as enum ('owner','staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending_payment','received','making','ready','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type selection_type as enum ('single','multi');
exception when duplicate_object then null; end $$;

-- ============ TENANTS ============
create table if not exists shops (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  timezone          text not null default 'Australia/Sydney',
  currency          text not null default 'AUD',
  tax_rate_bps      int  not null default 0,
  stripe_account_id text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create table if not exists shop_users (
  shop_id    uuid not null references shops(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       user_role not null,
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);
create index if not exists shop_users_user_idx on shop_users(user_id);

-- ============ MENU ============
create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references shops(id) on delete cascade,
  name       text not null,
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists categories_shop_sort_idx on categories(shop_id, sort_order);

create table if not exists products (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references shops(id) on delete cascade,
  category_id      uuid references categories(id) on delete set null,
  name             text not null,
  description      text,
  base_price_cents int  not null check (base_price_cents >= 0),
  image_url        text,
  is_active        boolean not null default true,
  sort_order       int  not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists products_shop_cat_idx on products(shop_id, category_id, sort_order);

create table if not exists modifier_groups (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  name           text not null,
  selection_type selection_type not null,
  min_select     int  not null default 0,
  max_select     int  not null default 1,
  is_required    boolean not null default false,
  sort_order     int  not null default 0,
  check (min_select >= 0 and max_select >= min_select)
);
create index if not exists modifier_groups_shop_idx on modifier_groups(shop_id);

create table if not exists modifier_options (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references modifier_groups(id) on delete cascade,
  name              text not null,
  price_delta_cents int  not null default 0,
  is_active         boolean not null default true,
  sort_order        int  not null default 0
);
create index if not exists modifier_options_group_idx on modifier_options(group_id, sort_order);

create table if not exists product_modifier_groups (
  product_id        uuid not null references products(id) on delete cascade,
  modifier_group_id uuid not null references modifier_groups(id) on delete cascade,
  sort_order        int not null default 0,
  primary key (product_id, modifier_group_id)
);

-- ============ ORDERS ============
create table if not exists orders (
  id                       uuid primary key default gen_random_uuid(),
  shop_id                  uuid not null references shops(id) on delete restrict,
  short_code               text unique not null,
  order_number             int  not null,
  status                   order_status not null default 'pending_payment',
  customer_name            text not null,
  customer_phone           text,
  subtotal_cents           int not null,
  tax_cents                int not null default 0,
  tip_cents                int not null default 0,
  total_cents              int not null,
  stripe_session_id        text unique,
  stripe_payment_intent_id text,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists orders_shop_created_idx on orders(shop_id, created_at desc);
create index if not exists orders_shop_open_idx on orders(shop_id, status)
  where status not in ('completed','cancelled');
create unique index if not exists orders_shop_num_idx on orders(shop_id, order_number);

create table if not exists order_items (
  id                         uuid primary key default gen_random_uuid(),
  order_id                   uuid not null references orders(id) on delete cascade,
  product_id                 uuid references products(id) on delete set null,
  product_name_snapshot      text not null,
  base_price_cents_snapshot  int  not null,
  quantity                   int  not null check (quantity > 0),
  line_total_cents           int  not null,
  notes                      text
);
create index if not exists order_items_order_idx on order_items(order_id);

create table if not exists order_item_modifiers (
  id                   uuid primary key default gen_random_uuid(),
  order_item_id        uuid not null references order_items(id) on delete cascade,
  modifier_group_name  text not null,
  modifier_option_name text not null,
  price_delta_cents    int  not null
);
create index if not exists order_item_mods_item_idx on order_item_modifiers(order_item_id);

-- ============ TRIGGERS + FUNCTIONS ============
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at := now(); return new; end;
$$ language plpgsql;

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders
  for each row execute procedure set_updated_at();

create or replace function next_order_number(p_shop uuid) returns int as $$
declare n int;
begin
  select coalesce(max(order_number), 0) + 1 into n
    from orders where shop_id = p_shop;
  return n;
end;
$$ language plpgsql;

-- ============ REALTIME ============
alter publication supabase_realtime add table orders;
