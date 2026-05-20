-- ============================================================
-- Millwork360 Operations Portal — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read all profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Admins can insert profiles" on public.profiles for insert with check (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New User'), coalesce(new.raw_user_meta_data->>'role', 'staff'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Vendors
create table public.vendors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz default now()
);
alter table public.vendors enable row level security;
create policy "Authenticated users can manage vendors" on public.vendors for all using (auth.role() = 'authenticated');

-- Orders
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text not null unique,
  customer text not null,
  description text,
  status text not null default 'Takeoff' check (status in ('Takeoff','Ordered','In Production','Ready to Ship','Completed','On Hold')),
  due_date date,
  assigned_to uuid references public.profiles(id),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Authenticated users can manage orders" on public.orders for all using (auth.role() = 'authenticated');

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger orders_updated_at before update on public.orders for each row execute procedure public.set_updated_at();

-- Purchase Orders
create table public.purchase_orders (
  id uuid default gen_random_uuid() primary key,
  po_number text not null unique,
  vendor_id uuid references public.vendors(id) on delete set null,
  status text not null default 'Draft' check (status in ('Draft','Sent','Ordered','Partially Received','Received','Cancelled')),
  order_date date default current_date,
  expected_date date,
  total_amount numeric(10,2) default 0,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.purchase_orders enable row level security;
create policy "Authenticated users can manage POs" on public.purchase_orders for all using (auth.role() = 'authenticated');
create trigger pos_updated_at before update on public.purchase_orders for each row execute procedure public.set_updated_at();

-- PO Line Items
create table public.po_items (
  id uuid default gen_random_uuid() primary key,
  po_id uuid references public.purchase_orders(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit text default 'ea',
  unit_price numeric(10,2) not null default 0,
  received_qty numeric(10,2) default 0
);
alter table public.po_items enable row level security;
create policy "Authenticated users can manage PO items" on public.po_items for all using (auth.role() = 'authenticated');

-- Inventory
create table public.inventory (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text,
  sku text,
  unit text default 'ea',
  quantity_on_hand numeric(10,2) default 0,
  reorder_point numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.inventory enable row level security;
create policy "Authenticated users can manage inventory" on public.inventory for all using (auth.role() = 'authenticated');
create trigger inventory_updated_at before update on public.inventory for each row execute procedure public.set_updated_at();

-- Inventory Transactions (audit log)
create table public.inventory_transactions (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.inventory(id) on delete cascade,
  type text not null check (type in ('adjustment','received','used','returned')),
  quantity numeric(10,2) not null,
  reference text,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.inventory_transactions enable row level security;
create policy "Authenticated users can manage transactions" on public.inventory_transactions for all using (auth.role() = 'authenticated');
