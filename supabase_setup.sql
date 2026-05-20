-- ============================================================
-- MILLWORK360 OPS PORTAL — Supabase Setup
-- Run this in your Supabase SQL Editor (supabase.com)
-- ============================================================

-- 1. USER PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('office', 'shop_floor')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read all profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'shop_floor'));
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 2. VENDORS
create table public.vendors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_name text,
  email text,
  phone text,
  category text check (category in ('glass', 'hardware', 'lumber', 'other')),
  notes text,
  created_at timestamptz default now()
);
alter table public.vendors enable row level security;
create policy "Authenticated can read vendors" on public.vendors for select using (auth.role() = 'authenticated');
create policy "Office can manage vendors" on public.vendors for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'office')
);

-- Seed vendors
insert into public.vendors (name, category, email) values
  ('ArtVue Glass', 'glass', 'orders@artvueglass.com'),
  ('Oldcastle BuildingEnvelope', 'glass', 'orders@obe.com'),
  ('HOPPE North America', 'hardware', 'orders@hoppeusa.com'),
  ('Emtek', 'hardware', 'orders@emtek.com'),
  ('GU Ferco', 'hardware', null),
  ('INOX', 'hardware', null);

-- 3. INVENTORY
create table public.inventory (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text check (category in ('glass', 'hardware', 'lumber', 'other')),
  unit text not null default 'each',
  quantity numeric not null default 0,
  reorder_threshold numeric not null default 10,
  location text,
  notes text,
  updated_at timestamptz default now()
);
alter table public.inventory enable row level security;
create policy "Authenticated can read inventory" on public.inventory for select using (auth.role() = 'authenticated');
create policy "Office can manage inventory" on public.inventory for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'office')
);

-- Seed inventory
insert into public.inventory (name, category, unit, quantity, reorder_threshold, location) values
  ('Reeded glass', 'glass', 'sqft', 12, 50, 'Glass rack A'),
  ('Insulated units (std)', 'glass', 'units', 38, 20, 'Glass rack B'),
  ('HLS9000 multipoint lock', 'hardware', 'each', 4, 10, 'Bin H-12'),
  ('Hinges 3.5" (pairs)', 'hardware', 'pairs', 220, 100, 'Bin H-03'),
  ('Mahogany SDL bars', 'lumber', 'sets', 8, 15, 'Lumber rack 2'),
  ('GU Ferco multipoint (std)', 'hardware', 'each', 22, 10, 'Bin H-11'),
  ('Emtek pull bars', 'hardware', 'each', 31, 15, 'Bin H-20'),
  ('PVB interlayer', 'glass', 'sqft', 145, 50, 'Glass storage');

-- 4. ORDERS
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text not null unique,
  customer_name text not null,
  order_type text check (order_type in ('door_package', 'glass_only', 'hardware_only', 'sidelites_transom', 'custom')),
  status text not null default 'takeoff_review' check (status in (
    'takeoff_review', 'in_production', 'awaiting_glass', 'awaiting_hardware',
    'quality_check', 'ready_to_ship', 'shipped', 'complete', 'on_hold'
  )),
  due_date date,
  notes text,
  assigned_to uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Authenticated can read orders" on public.orders for select using (auth.role() = 'authenticated');
create policy "Office can manage orders" on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'office')
);
create policy "Shop floor can update status" on public.orders for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Auto-update updated_at
create or replace function update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger orders_updated_at before update on public.orders for each row execute procedure update_updated_at();

-- Seed orders
insert into public.orders (order_number, customer_name, order_type, status, due_date) values
  ('MX-4821', 'Coastal Homes LLC', 'door_package', 'in_production', current_date + 3),
  ('MX-4819', 'Rivera Builders', 'sidelites_transom', 'on_hold', current_date - 1),
  ('MX-4815', 'Tampa Bay Millwork', 'glass_only', 'awaiting_glass', current_date + 5),
  ('MX-4810', 'Suncoast Contracting', 'door_package', 'ready_to_ship', current_date),
  ('MX-4807', 'Pinnacle Custom Homes', 'hardware_only', 'takeoff_review', current_date + 7),
  ('MX-4803', 'DeSoto Construction', 'door_package', 'in_production', current_date + 9);

-- 5. PURCHASE ORDERS
create table public.purchase_orders (
  id uuid default gen_random_uuid() primary key,
  po_number text not null unique,
  vendor_id uuid references public.vendors(id),
  status text not null default 'draft' check (status in ('draft', 'sent', 'acknowledged', 'in_transit', 'received', 'cancelled')),
  total_amount numeric(10,2),
  expected_date date,
  received_date date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.purchase_orders enable row level security;
create policy "Authenticated can read POs" on public.purchase_orders for select using (auth.role() = 'authenticated');
create policy "Office can manage POs" on public.purchase_orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'office')
);
create trigger pos_updated_at before update on public.purchase_orders for each row execute procedure update_updated_at();

-- 6. PO LINE ITEMS
create table public.po_line_items (
  id uuid default gen_random_uuid() primary key,
  po_id uuid references public.purchase_orders(id) on delete cascade,
  inventory_id uuid references public.inventory(id),
  description text not null,
  quantity numeric not null,
  unit_price numeric(10,2),
  line_total numeric(10,2) generated always as (quantity * unit_price) stored
);
alter table public.po_line_items enable row level security;
create policy "Authenticated can read PO lines" on public.po_line_items for select using (auth.role() = 'authenticated');
create policy "Office can manage PO lines" on public.po_line_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'office')
);

-- Seed POs
with v as (select id, name from public.vendors)
insert into public.purchase_orders (po_number, vendor_id, status, total_amount, expected_date)
select po_number, v.id, status, amount, exp
from (values
  ('PO-0312', 'ArtVue Glass', 'sent', 6420, current_date + 14),
  ('PO-0311', 'Oldcastle BuildingEnvelope', 'in_transit', 9810, current_date + 8),
  ('PO-0310', 'HOPPE North America', 'received', 3240, current_date - 5),
  ('PO-0309', 'Emtek', 'received', 1890, current_date - 10)
) as t(po_number, vendor_name, status, amount, exp)
join v on v.name = t.vendor_name;
