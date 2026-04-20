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
insert into products (id, shop_id, category_id, name, description, base_price_cents, sort_order) values
  ('33333333-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'Classic Milk Tea', 'Black tea, milk, tapioca pearls', 650, 1),
  ('33333333-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'Taro Milk Tea', 'Creamy taro root and milk', 750, 2),
  ('33333333-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'Brown Sugar Milk', 'Brown sugar syrup, milk, pearls', 800, 3),
  ('33333333-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'Passionfruit Green Tea', 'Passionfruit, green tea', 700, 1),
  ('33333333-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'Mango Green Tea', 'Fresh mango, green tea', 700, 2),
  ('33333333-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000003', 'Matcha Latte', 'Ceremonial matcha, milk', 850, 1)
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
