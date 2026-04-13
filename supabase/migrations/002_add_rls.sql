-- Enable RLS on all tables
alter table recipes     enable row level security;
alter table ingredients enable row level security;
alter table cook_log    enable row level security;

-- Allow all operations for any authenticated user
-- (single shared account model — no per-user ownership needed)

create policy "Authenticated users can do everything" on recipes
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything" on ingredients
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users can do everything" on cook_log
  for all using (auth.role() = 'authenticated');
