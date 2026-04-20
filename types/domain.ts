export type OrderStatus =
  | "pending_payment"
  | "received"
  | "making"
  | "ready"
  | "completed"
  | "cancelled";

export type Shop = {
  id: string;
  slug: string;
  name: string;
  currency: string;
  tax_rate_bps: number;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type ModifierOption = {
  id: string;
  name: string;
  price_delta_cents: number;
  is_active: boolean;
  sort_order: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  selection_type: "single" | "multi";
  min_select: number;
  max_select: number;
  is_required: boolean;
  sort_order: number;
  options: ModifierOption[];
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price_cents: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  modifier_groups: ModifierGroup[];
};

export type OrderItemModifier = {
  modifier_group_name: string;
  modifier_option_name: string;
  price_delta_cents: number;
};

export type OrderItem = {
  id: string;
  product_name_snapshot: string;
  base_price_cents_snapshot: number;
  quantity: number;
  line_total_cents: number;
  notes: string | null;
  order_item_modifiers: OrderItemModifier[];
};

export type Order = {
  id: string;
  short_code: string;
  order_number: number;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string | null;
  subtotal_cents: number;
  tax_cents: number;
  tip_cents: number;
  total_cents: number;
  paid_at: string | null;
  created_at: string;
  shop_id: string;
  order_items?: OrderItem[];
};
