-- Sample bubble tea shop for local dev.
-- Run: psql < supabase/seed.sql (after migrations applied)

insert into shops (id, slug, name, timezone, currency, tax_rate_bps, is_active)
values ('11111111-1111-1111-1111-111111111111', 'demo', 'Demo Bubble Tea', 'Australia/Sydney', 'AUD', 1000, true)
on conflict (id) do nothing;

-- Categories
insert into categories (id, shop_id, name, sort_order) values
  ('22222222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Classic Milk Tea', 1),
  ('22222222-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Fruit Tea', 2),
  ('22222222-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Specialty', 3)
on conflict (id) do nothing;

-- Products
insert into products (id, shop_id, category_id, name, description, base_price_cents, image_url, sort_order) values
  ('33333333-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'Classic Milk Tea', 'Black tea, milk, tapioca pearls', 650, '/menu-images/classic-milk-tea.svg', 1),
  ('33333333-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'Taro Milk Tea', 'Creamy taro root and milk', 750, '/menu-images/taro-milk-tea.svg', 2),
  ('33333333-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'Brown Sugar Milk', 'Brown sugar syrup, milk, pearls', 800, '/menu-images/brown-sugar-milk.svg', 3),
  ('33333333-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'Passionfruit Green Tea', 'Passionfruit, green tea', 700, '/menu-images/passionfruit-green-tea.svg', 1),
  ('33333333-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'Mango Green Tea', 'Fresh mango, green tea', 700, '/menu-images/mango-green-tea.svg', 2),
  ('33333333-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000003', 'Matcha Latte', 'Ceremonial matcha, milk', 850, '/menu-images/matcha-latte.svg', 1)
on conflict (id) do nothing;

-- Modifier groups
insert into modifier_groups (id, shop_id, name, selection_type, min_select, max_select, is_required, sort_order) values
  ('44444444-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Size',     'single', 1, 1, true,  1),
  ('44444444-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Sugar',    'single', 1, 1, true,  2),
  ('44444444-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Ice',      'single', 1, 1, true,  3),
  ('44444444-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Milk',     'single', 1, 1, false, 4),
  ('44444444-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Toppings', 'multi',  0, 4, false, 5)
on conflict (id) do nothing;

-- Modifier options
insert into modifier_options (group_id, name, price_delta_cents, sort_order) values
  ('44444444-0000-0000-0000-000000000001', 'Regular', 0,   1),
  ('44444444-0000-0000-0000-000000000001', 'Large',   100, 2),

  ('44444444-0000-0000-0000-000000000002', '0%',   0, 1),
  ('44444444-0000-0000-0000-000000000002', '25%',  0, 2),
  ('44444444-0000-0000-0000-000000000002', '50%',  0, 3),
  ('44444444-0000-0000-0000-000000000002', '75%',  0, 4),
  ('44444444-0000-0000-0000-000000000002', '100%', 0, 5),

  ('44444444-0000-0000-0000-000000000003', 'No ice',   0, 1),
  ('44444444-0000-0000-0000-000000000003', 'Less ice', 0, 2),
  ('44444444-0000-0000-0000-000000000003', 'Regular',  0, 3),
  ('44444444-0000-0000-0000-000000000003', 'Extra ice', 0, 4),

  ('44444444-0000-0000-0000-000000000004', 'Dairy',     0,  1),
  ('44444444-0000-0000-0000-000000000004', 'Oat milk',  80, 2),
  ('44444444-0000-0000-0000-000000000004', 'Soy milk',  50, 3),
  ('44444444-0000-0000-0000-000000000004', 'Almond',    80, 4),

  ('44444444-0000-0000-0000-000000000005', 'Tapioca pearls', 80, 1),
  ('44444444-0000-0000-0000-000000000005', 'Grass jelly',    80, 2),
  ('44444444-0000-0000-0000-000000000005', 'Aloe vera',      80, 3),
  ('44444444-0000-0000-0000-000000000005', 'Lychee jelly',   80, 4),
  ('44444444-0000-0000-0000-000000000005', 'Crystal boba',   80, 5),
  ('44444444-0000-0000-0000-000000000005', 'Pudding',        80, 6)
on conflict do nothing;

-- Attach modifier groups to products
insert into product_modifier_groups (product_id, modifier_group_id, sort_order)
select p.id, g.id, g.sort_order
from products p
cross join modifier_groups g
where p.shop_id = '11111111-1111-1111-1111-111111111111'
  and g.shop_id = '11111111-1111-1111-1111-111111111111'
on conflict do nothing;

-- Sample coffee shop for local dev.
insert into shops (id, slug, name, timezone, currency, tax_rate_bps, is_active)
values ('d2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'coffee-shop', 'Coffee Shop', 'Australia/Sydney', 'AUD', 1000, true)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  timezone = excluded.timezone,
  currency = excluded.currency,
  tax_rate_bps = excluded.tax_rate_bps,
  is_active = excluded.is_active;

insert into categories (id, shop_id, name, sort_order) values
  ('c0ffee00-0000-0000-0000-000000000001', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'Espresso Bar', 1),
  ('c0ffee00-0000-0000-0000-000000000002', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'Cold Coffee', 2),
  ('c0ffee00-0000-0000-0000-000000000003', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'Tea & Chocolate', 3),
  ('c0ffee00-0000-0000-0000-000000000004', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'Bakery', 4)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true;

insert into products (id, shop_id, category_id, name, description, base_price_cents, image_url, sort_order) values
  ('c0ffee10-0000-0000-0000-000000000001', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000001', 'Espresso', 'Single origin espresso shot', 400, null, 1),
  ('c0ffee10-0000-0000-0000-000000000002', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000001', 'Flat White', 'Double espresso with silky steamed milk', 550, null, 2),
  ('c0ffee10-0000-0000-0000-000000000003', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000001', 'Latte', 'Espresso, steamed milk, light foam', 550, null, 3),
  ('c0ffee10-0000-0000-0000-000000000004', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000001', 'Cappuccino', 'Espresso, steamed milk, cocoa dust', 550, null, 4),
  ('c0ffee10-0000-0000-0000-000000000005', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000001', 'Long Black', 'Espresso over hot water', 500, null, 5),
  ('c0ffee10-0000-0000-0000-000000000006', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000002', 'Iced Latte', 'Espresso, cold milk, ice', 650, null, 1),
  ('c0ffee10-0000-0000-0000-000000000007', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000002', 'Cold Brew', 'Slow steeped black coffee over ice', 650, null, 2),
  ('c0ffee10-0000-0000-0000-000000000008', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000003', 'Chai Latte', 'Spiced chai with steamed milk', 600, null, 1),
  ('c0ffee10-0000-0000-0000-000000000009', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000003', 'Hot Chocolate', 'Cocoa, steamed milk, chocolate dust', 600, null, 2),
  ('c0ffee10-0000-0000-0000-000000000010', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000004', 'Butter Croissant', 'Baked daily with cultured butter', 450, null, 1),
  ('c0ffee10-0000-0000-0000-000000000011', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'c0ffee00-0000-0000-0000-000000000004', 'Banana Bread', 'Toasted slice with butter', 500, null, 2)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  base_price_cents = excluded.base_price_cents,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order,
  is_active = true;

-- Local admin auth users and shop ownership.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_anonymous
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '39be818c-f2da-41e3-98cf-e57679d01c3e',
    'authenticated',
    'authenticated',
    'admin@qrque.com',
    crypt('QrQue_Admin2026', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '504f71db-4fac-46b9-b679-bf8e3c4fc9ad',
    'authenticated',
    'authenticated',
    'coffee.admin@qrque.com',
    crypt('Coffee_Admin2026', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f17c0000-0000-4000-8000-000000000101',
    'authenticated',
    'authenticated',
    'fish.admin@qrque.com',
    crypt('Fish_Admin2026', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    false
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  email_change_token_current = '',
  reauthentication_token = '',
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now(),
  is_anonymous = false;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    '39be818c-f2da-41e3-98cf-e57679d01c3e',
    '39be818c-f2da-41e3-98cf-e57679d01c3e',
    '{"sub":"39be818c-f2da-41e3-98cf-e57679d01c3e","email":"admin@qrque.com","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '504f71db-4fac-46b9-b679-bf8e3c4fc9ad',
    '504f71db-4fac-46b9-b679-bf8e3c4fc9ad',
    '{"sub":"504f71db-4fac-46b9-b679-bf8e3c4fc9ad","email":"coffee.admin@qrque.com","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    'f17c0000-0000-4000-8000-000000000101',
    'f17c0000-0000-4000-8000-000000000101',
    '{"sub":"f17c0000-0000-4000-8000-000000000101","email":"fish.admin@qrque.com","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into shop_users (shop_id, user_id, role) values
  ('11111111-1111-1111-1111-111111111111', '39be818c-f2da-41e3-98cf-e57679d01c3e', 'owner'),
  ('d2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', '504f71db-4fac-46b9-b679-bf8e3c4fc9ad', 'owner')
on conflict (shop_id, user_id) do update set
  role = excluded.role;

insert into modifier_groups (id, shop_id, name, selection_type, min_select, max_select, is_required, sort_order) values
  ('c0ffee20-0000-0000-0000-000000000001', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'Size', 'single', 1, 1, true, 1),
  ('c0ffee20-0000-0000-0000-000000000002', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'Milk', 'single', 0, 1, false, 2),
  ('c0ffee20-0000-0000-0000-000000000003', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'Extras', 'multi', 0, 3, false, 3),
  ('c0ffee20-0000-0000-0000-000000000004', 'd2e81b4f-3f96-43c6-9ec1-b1e12b1a0a6a', 'Syrup', 'single', 0, 1, false, 4)
on conflict (id) do update set
  name = excluded.name,
  selection_type = excluded.selection_type,
  min_select = excluded.min_select,
  max_select = excluded.max_select,
  is_required = excluded.is_required,
  sort_order = excluded.sort_order;

insert into modifier_options (id, group_id, name, price_delta_cents, sort_order) values
  ('c0ffee30-0000-0000-0000-000000000001', 'c0ffee20-0000-0000-0000-000000000001', 'Small', 0, 1),
  ('c0ffee30-0000-0000-0000-000000000002', 'c0ffee20-0000-0000-0000-000000000001', 'Regular', 80, 2),
  ('c0ffee30-0000-0000-0000-000000000003', 'c0ffee20-0000-0000-0000-000000000001', 'Large', 150, 3),
  ('c0ffee30-0000-0000-0000-000000000004', 'c0ffee20-0000-0000-0000-000000000002', 'Full cream', 0, 1),
  ('c0ffee30-0000-0000-0000-000000000005', 'c0ffee20-0000-0000-0000-000000000002', 'Skim', 0, 2),
  ('c0ffee30-0000-0000-0000-000000000006', 'c0ffee20-0000-0000-0000-000000000002', 'Oat', 80, 3),
  ('c0ffee30-0000-0000-0000-000000000007', 'c0ffee20-0000-0000-0000-000000000002', 'Almond', 80, 4),
  ('c0ffee30-0000-0000-0000-000000000008', 'c0ffee20-0000-0000-0000-000000000002', 'Soy', 60, 5),
  ('c0ffee30-0000-0000-0000-000000000009', 'c0ffee20-0000-0000-0000-000000000003', 'Extra shot', 100, 1),
  ('c0ffee30-0000-0000-0000-000000000010', 'c0ffee20-0000-0000-0000-000000000003', 'Decaf', 0, 2),
  ('c0ffee30-0000-0000-0000-000000000011', 'c0ffee20-0000-0000-0000-000000000003', 'Whipped cream', 80, 3),
  ('c0ffee30-0000-0000-0000-000000000012', 'c0ffee20-0000-0000-0000-000000000004', 'Vanilla', 70, 1),
  ('c0ffee30-0000-0000-0000-000000000013', 'c0ffee20-0000-0000-0000-000000000004', 'Caramel', 70, 2),
  ('c0ffee30-0000-0000-0000-000000000014', 'c0ffee20-0000-0000-0000-000000000004', 'Hazelnut', 70, 3)
on conflict (id) do update set
  name = excluded.name,
  price_delta_cents = excluded.price_delta_cents,
  sort_order = excluded.sort_order,
  is_active = true;

insert into product_modifier_groups (product_id, modifier_group_id, sort_order) values
  ('c0ffee10-0000-0000-0000-000000000001', 'c0ffee20-0000-0000-0000-000000000003', 1),
  ('c0ffee10-0000-0000-0000-000000000002', 'c0ffee20-0000-0000-0000-000000000001', 1),
  ('c0ffee10-0000-0000-0000-000000000002', 'c0ffee20-0000-0000-0000-000000000002', 2),
  ('c0ffee10-0000-0000-0000-000000000002', 'c0ffee20-0000-0000-0000-000000000003', 3),
  ('c0ffee10-0000-0000-0000-000000000002', 'c0ffee20-0000-0000-0000-000000000004', 4),
  ('c0ffee10-0000-0000-0000-000000000003', 'c0ffee20-0000-0000-0000-000000000001', 1),
  ('c0ffee10-0000-0000-0000-000000000003', 'c0ffee20-0000-0000-0000-000000000002', 2),
  ('c0ffee10-0000-0000-0000-000000000003', 'c0ffee20-0000-0000-0000-000000000003', 3),
  ('c0ffee10-0000-0000-0000-000000000003', 'c0ffee20-0000-0000-0000-000000000004', 4),
  ('c0ffee10-0000-0000-0000-000000000004', 'c0ffee20-0000-0000-0000-000000000001', 1),
  ('c0ffee10-0000-0000-0000-000000000004', 'c0ffee20-0000-0000-0000-000000000002', 2),
  ('c0ffee10-0000-0000-0000-000000000004', 'c0ffee20-0000-0000-0000-000000000003', 3),
  ('c0ffee10-0000-0000-0000-000000000004', 'c0ffee20-0000-0000-0000-000000000004', 4),
  ('c0ffee10-0000-0000-0000-000000000005', 'c0ffee20-0000-0000-0000-000000000001', 1),
  ('c0ffee10-0000-0000-0000-000000000005', 'c0ffee20-0000-0000-0000-000000000003', 2),
  ('c0ffee10-0000-0000-0000-000000000006', 'c0ffee20-0000-0000-0000-000000000001', 1),
  ('c0ffee10-0000-0000-0000-000000000006', 'c0ffee20-0000-0000-0000-000000000002', 2),
  ('c0ffee10-0000-0000-0000-000000000006', 'c0ffee20-0000-0000-0000-000000000003', 3),
  ('c0ffee10-0000-0000-0000-000000000006', 'c0ffee20-0000-0000-0000-000000000004', 4),
  ('c0ffee10-0000-0000-0000-000000000007', 'c0ffee20-0000-0000-0000-000000000001', 1),
  ('c0ffee10-0000-0000-0000-000000000007', 'c0ffee20-0000-0000-0000-000000000003', 2),
  ('c0ffee10-0000-0000-0000-000000000008', 'c0ffee20-0000-0000-0000-000000000001', 1),
  ('c0ffee10-0000-0000-0000-000000000008', 'c0ffee20-0000-0000-0000-000000000002', 2),
  ('c0ffee10-0000-0000-0000-000000000009', 'c0ffee20-0000-0000-0000-000000000001', 1),
  ('c0ffee10-0000-0000-0000-000000000009', 'c0ffee20-0000-0000-0000-000000000002', 2)
on conflict do nothing;

-- Sample fish and chips shop for local dev.
insert into shops (id, slug, name, timezone, currency, tax_rate_bps, is_active)
values ('f17c0000-0000-4000-8000-000000000001', 'derrimut-sea-catch-fish-chips', 'Derrimut Sea Catch Fish & Chips', 'Australia/Sydney', 'AUD', 1000, true)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  timezone = excluded.timezone,
  currency = excluded.currency,
  tax_rate_bps = excluded.tax_rate_bps,
  is_active = excluded.is_active;

insert into categories (id, shop_id, name, sort_order) values
  ('f17c0001-0000-4000-8000-000000000001', 'f17c0000-0000-4000-8000-000000000001', 'Meal Deals', 1),
  ('f17c0001-0000-4000-8000-000000000002', 'f17c0000-0000-4000-8000-000000000001', 'Snacks', 2),
  ('f17c0001-0000-4000-8000-000000000003', 'f17c0000-0000-4000-8000-000000000001', 'Fish', 3),
  ('f17c0001-0000-4000-8000-000000000004', 'f17c0000-0000-4000-8000-000000000001', 'Burgers', 4),
  ('f17c0001-0000-4000-8000-000000000005', 'f17c0000-0000-4000-8000-000000000001', 'Steak Sandwiches', 5),
  ('f17c0001-0000-4000-8000-000000000006', 'f17c0000-0000-4000-8000-000000000001', 'Vegetarian', 6),
  ('f17c0001-0000-4000-8000-000000000007', 'f17c0000-0000-4000-8000-000000000001', 'Rolls', 7),
  ('f17c0001-0000-4000-8000-000000000008', 'f17c0000-0000-4000-8000-000000000001', 'Souvlakis', 8),
  ('f17c0001-0000-4000-8000-000000000009', 'f17c0000-0000-4000-8000-000000000001', 'The Sweet Spot', 9),
  ('f17c0001-0000-4000-8000-000000000010', 'f17c0000-0000-4000-8000-000000000001', 'Beverages', 10),
  ('f17c0001-0000-4000-8000-000000000011', 'f17c0000-0000-4000-8000-000000000001', 'Sauces', 11)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = true;

insert into products (id, shop_id, category_id, name, description, base_price_cents, image_url, sort_order) values
  ('f17c0010-0000-4000-8000-000000000001', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Fisherman''s Basket', 'One battered flake, one chips, two pieces calamari rings and one crumbed prawns.', 3190, null, 1),
  ('f17c0010-0000-4000-8000-000000000002', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Meat Lover''s Basket', 'One hamburger with the lot, chips and can of drink.', 2790, null, 2),
  ('f17c0010-0000-4000-8000-000000000003', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Pack for 2', 'Two pieces of battered flake, two pieces dim sims, two pieces of potato cakes, two pieces of calamari rings and chips for two.', 5990, null, 3),
  ('f17c0010-0000-4000-8000-000000000004', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Pack for 1 - Flake (Australian Gummy)', 'One battered flake, chips and can of drink.', 2790, null, 4),
  ('f17c0010-0000-4000-8000-000000000005', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Hot Dogs In Batter Combo', 'Two hot dogs in batter, chips and can of drink.', 2090, null, 5),
  ('f17c0010-0000-4000-8000-000000000006', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Family Basket', 'Four pieces of battered flake, chips for four, four pieces of potato cakes, four pieces of dim sims and 1.25L drink.', 9990, null, 6),
  ('f17c0010-0000-4000-8000-000000000007', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Kids Basket', 'One fish bite, one potato cake, one dim sim and chips.', 1890, null, 7),
  ('f17c0010-0000-4000-8000-000000000008', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Calamari Pack', 'Ten pieces of calamari rings with chips and can of drink.', 2890, null, 8),
  ('f17c0010-0000-4000-8000-000000000009', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Chicken Nuggets Pack', 'Ten pieces of chicken nuggets with chips and can of drink.', 2790, null, 9),
  ('f17c0010-0000-4000-8000-000000000010', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'The Aussie Crunch Bunch', 'Battered Australian gummy flake, fried dim sim, potato cake, and a generous serving of crispy chips.', 3190, null, 10),
  ('f17c0010-0000-4000-8000-000000000011', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Pack for 1 - Barramundi', 'One battered barramundi, chips and can of drink.', 2990, null, 11),
  ('f17c0010-0000-4000-8000-000000000012', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000001', 'Pack for 1 - Blue Grenadier (Hoki)', 'One battered hoki, chips and can of drink.', 2990, null, 12),
  ('f17c0010-0000-4000-8000-000000000013', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Potato Cake (Moka)', 'Potato cake/scallop/fritter.', 390, null, 1),
  ('f17c0010-0000-4000-8000-000000000014', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Scallop (Yoko)', 'Fresh scallop served as a snack.', 590, null, 2),
  ('f17c0010-0000-4000-8000-000000000015', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Hot Dog in Batter (Homemade)', 'Crispy battered sav, perfect snack to go.', 690, null, 3),
  ('f17c0010-0000-4000-8000-000000000016', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Calamari Ring (Japanese Crumbs)', 'Crispy fried squid rings coated in Japanese-style crumbs.', 390, null, 4),
  ('f17c0010-0000-4000-8000-000000000017', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Chips', 'One serve.', 790, null, 5),
  ('f17c0010-0000-4000-8000-000000000018', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Minimum Chips', 'Minimum serve of hot chips.', 1190, null, 6),
  ('f17c0010-0000-4000-8000-000000000019', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Seafood Stick (Kamaboko)', 'Crispy Japanese-style seafood stick.', 390, null, 7),
  ('f17c0010-0000-4000-8000-000000000020', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Dim Sim (Chien Wah)', 'Steamed dumpling filled with beef and cabbage.', 390, null, 8),
  ('f17c0010-0000-4000-8000-000000000021', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Dim Sim in Batter (Chien Wah)', 'Battered dim sim.', 490, null, 9),
  ('f17c0010-0000-4000-8000-000000000022', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'South Melbourne Dim Sim', 'South Melbourne style dim sim.', 690, null, 10),
  ('f17c0010-0000-4000-8000-000000000023', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000002', 'Spring Roll (Vegetable)', 'Crisp vegetable filling wrapped in a delicate pastry.', 190, null, 11),
  ('f17c0010-0000-4000-8000-000000000024', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000003', 'Flake (Australian Gummy)', 'Battered Australian gummy flake.', 1690, null, 1),
  ('f17c0010-0000-4000-8000-000000000025', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000003', 'Special Flake (Australian Gummy)', 'Special battered Australian gummy flake.', 1890, null, 2),
  ('f17c0010-0000-4000-8000-000000000026', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000003', 'Blue Grenadier (Hoki)', 'Battered blue grenadier hoki.', 1890, null, 3),
  ('f17c0010-0000-4000-8000-000000000027', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000003', 'Barramundi', 'Battered barramundi.', 1890, null, 4),
  ('f17c0010-0000-4000-8000-000000000028', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000004', 'Burger with the Lot', 'Fish and chip shop burger with the lot.', 1690, null, 1),
  ('f17c0010-0000-4000-8000-000000000029', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000004', 'Cheese Burger', 'Classic cheese burger.', 1490, null, 2),
  ('f17c0010-0000-4000-8000-000000000030', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000005', 'Onion Steak Sandwich', 'Steak sandwich with onion.', 1790, null, 1),
  ('f17c0010-0000-4000-8000-000000000031', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000008', 'Chicken Souvlaki', 'Chicken souvlaki.', 1990, null, 1),
  ('f17c0010-0000-4000-8000-000000000032', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000008', 'Lamb Souvlaki', 'Lamb souvlaki.', 1990, null, 2),
  ('f17c0010-0000-4000-8000-000000000033', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000010', 'Soft Drinks 375mL', '375mL can of soft drink.', 450, null, 1),
  ('f17c0010-0000-4000-8000-000000000034', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000010', 'Soft Drinks 1.25L', '1.25L bottle of soft drink.', 790, null, 2),
  ('f17c0010-0000-4000-8000-000000000035', 'f17c0000-0000-4000-8000-000000000001', 'f17c0001-0000-4000-8000-000000000010', 'River P0RT', 'River Port drink.', 750, null, 3)
on conflict (id) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  base_price_cents = excluded.base_price_cents,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order,
  is_active = true;

update products as p
set image_url = v.image_url
from (
  values
    ('Fisherman''s Basket', 'https://tb-static.uber.com/prod/image-proc/processed_images/c492ce605f9b03a5a5bacaface01ad08/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Meat Lover''s Basket', 'https://tb-static.uber.com/prod/image-proc/processed_images/d2caa3678d43f05155b9b23c000b3418/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Pack for 2', 'https://tb-static.uber.com/prod/image-proc/processed_images/d21cf29aaa7584a83fc4eca9de72289d/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('Pack for 1 - Flake (Australian Gummy)', 'https://tb-static.uber.com/prod/image-proc/processed_images/07d4bcae7616e4a88fcdf97ef8273257/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Hot Dogs In Batter Combo', 'https://tb-static.uber.com/prod/image-proc/processed_images/ba396b2d0b60c3989bf88ed3527076b5/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('Family Basket', 'https://tb-static.uber.com/prod/image-proc/processed_images/ce51b141e9dd852c43b0f429270085b3/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Kids Basket', 'https://tb-static.uber.com/prod/image-proc/processed_images/328a6c18bdb2f327387651d39b07973c/7f4ae9ca0446cbc23e71d8d395a98428.jpeg'),
    ('Calamari Pack', 'https://tb-static.uber.com/prod/image-proc/processed_images/4e52ef5839effd1ab4af1d42ffd1965e/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Chicken Nuggets Pack', 'https://tb-static.uber.com/prod/image-proc/processed_images/49fe453773ffb3e560749ef61e8b419c/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('The Aussie Crunch Bunch', 'https://tb-static.uber.com/prod/image-proc/processed_images/510defc82e14f34bd2903284b57f5525/70aa2a4db7f990373ca9c376323e3dea.jpeg'),
    ('Pack for 1 - Barramundi', 'https://tb-static.uber.com/prod/image-proc/processed_images/6b852bce53e6bd1ff6de6b7a6081b643/70aa2a4db7f990373ca9c376323e3dea.jpeg'),
    ('Pack for 1 - Blue Grenadier (Hoki)', 'https://tb-static.uber.com/prod/image-proc/processed_images/6b852bce53e6bd1ff6de6b7a6081b643/70aa2a4db7f990373ca9c376323e3dea.jpeg'),
    ('Potato Cake (Moka)', 'https://tb-static.uber.com/prod/image-proc/processed_images/4e260a284cf091a372917ebc37e65735/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Scallop (Yoko)', 'https://tb-static.uber.com/prod/image-proc/processed_images/7cfe06ab5654511956a598bd38ea9fd3/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Hot Dog in Batter (Homemade)', 'https://tb-static.uber.com/prod/image-proc/processed_images/f86d5ca41037c4e72b74c9ec24f9fc9f/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Calamari Ring (Japanese Crumbs)', 'https://tb-static.uber.com/prod/image-proc/processed_images/c1859bcd9a00e27146f8ba00fb2bcdd6/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Chips', 'https://tb-static.uber.com/prod/image-proc/processed_images/6d06a6efc88310a0bb9e601347ae6d1e/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Minimum Chips', 'https://tb-static.uber.com/prod/image-proc/processed_images/6b1cb4844db1c2944e2a3bb565ecd7b3/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('Seafood Stick (Kamaboko)', 'https://tb-static.uber.com/prod/image-proc/processed_images/b2eda0c2a11f8baa99b8465cd5a6d1fd/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Dim Sim (Chien Wah)', 'https://tb-static.uber.com/prod/image-proc/processed_images/be29b791206d871b00dd416c85373a2a/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Dim Sim in Batter (Chien Wah)', 'https://tb-static.uber.com/prod/image-proc/processed_images/855924ceacca0ab6cbf5b5e37780d442/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('South Melbourne Dim Sim', 'https://tb-static.uber.com/prod/image-proc/processed_images/a8127a187ca97960be6be27b783d3f05/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Spring Roll (Vegetable)', 'https://tb-static.uber.com/prod/image-proc/processed_images/3296e1411315ce144a38f4beefd91f2d/7f4ae9ca0446cbc23e71d8d395a98428.jpeg'),
    ('Flake (Australian Gummy)', 'https://tb-static.uber.com/prod/image-proc/processed_images/015893034fcaae0ef0bdaa5382021874/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Special Flake (Australian Gummy)', 'https://tb-static.uber.com/prod/image-proc/processed_images/a2304815c18ab9996da09fe8112e5ff8/70aa2a4db7f990373ca9c376323e3dea.jpeg'),
    ('Blue Grenadier (Hoki)', 'https://tb-static.uber.com/prod/image-proc/processed_images/ece17c40b7c0202df6dfa47d9a00c5b6/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Barramundi', 'https://tb-static.uber.com/prod/image-proc/processed_images/92bbf47f36d423cef62924c6bf2b06b6/a19bb09692310dfd41e49a96c424b3a6.jpeg'),
    ('Burger with the Lot', 'https://tb-static.uber.com/prod/image-proc/processed_images/036ade3ac5666db69246654a74f7aea0/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('Cheese Burger', 'https://tb-static.uber.com/prod/image-proc/processed_images/036ade3ac5666db69246654a74f7aea0/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('Onion Steak Sandwich', 'https://tb-static.uber.com/prod/image-proc/processed_images/54ba35fd666fead595f15f9dae2b32d6/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('Chicken Souvlaki', 'https://tb-static.uber.com/prod/image-proc/processed_images/85a562da2cb8a330cb92fa6c446443f5/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('Lamb Souvlaki', 'https://tb-static.uber.com/prod/image-proc/processed_images/85a562da2cb8a330cb92fa6c446443f5/58f691da9eaef86b0b51f9b2c483fe63.jpeg'),
    ('Soft Drinks 375mL', 'https://tb-static.uber.com/prod/image-proc/processed_images/f40c74b9bebf538d49c70e849be598bf/4218ca1d09174218364162cd0b1a8cc1.jpeg'),
    ('Soft Drinks 1.25L', 'https://tb-static.uber.com/prod/image-proc/processed_images/e9e4ac84c036f4ad0ec0d22c2547e594/4218ca1d09174218364162cd0b1a8cc1.jpeg'),
    ('River P0RT', 'https://tb-static.uber.com/prod/image-proc/processed_images/eb6f2372a2f9d301267cefc8e72eee87/7f4ae9ca0446cbc23e71d8d395a98428.jpeg')
) as v(name, image_url)
where p.shop_id = 'f17c0000-0000-4000-8000-000000000001'
  and p.name = v.name;

insert into shop_users (shop_id, user_id, role) values
  ('f17c0000-0000-4000-8000-000000000001', 'f17c0000-0000-4000-8000-000000000101', 'owner')
on conflict (shop_id, user_id) do update set
  role = excluded.role;
