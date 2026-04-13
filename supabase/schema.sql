-- ============================================================
-- CookNook — Supabase SQL Schema
-- Run this in your Supabase project: SQL Editor → New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Recipes ──────────────────────────────────────────────────────────────────
create table recipes (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  description          text,
  ingredients          text[]    default '{}',
  steps                text,
  notes                text,
  tags                 text[]    default '{}',
  season               text[]    default '{}',  -- 'spring','summer','autumn','winter','all'
  calories_per_portion integer,
  portions             integer,
  total_weight_grams   integer,
  calorie_source       text      default 'manual', -- 'manual' | 'ai_estimate' | 'ai_edited'
  last_cooked_at       timestamptz,
  cooked_count         integer   default 0,
  created_at           timestamptz default now()
);

-- ── Ingredients ───────────────────────────────────────────────────────────────
create table ingredients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  notes            text,
  tags             text[]  default '{}',
  season           text[]  default '{}',
  pantry_quantity  text    default 'some', -- 'lots' | 'some' | 'running low' | 'out'
  last_used_at     timestamptz,
  created_at       timestamptz default now()
);

-- ── Cook log ──────────────────────────────────────────────────────────────────
create table cook_log (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid references recipes(id) on delete set null,
  cooked_at   timestamptz default now(),
  notes       text,
  created_at  timestamptz default now()
);

-- ── RPC: increment cooked count + last_cooked_at ─────────────────────────────
create or replace function increment_cooked(recipe_id uuid)
returns void
language sql
as $$
  update recipes
  set
    cooked_count   = cooked_count + 1,
    last_cooked_at = now()
  where id = recipe_id;
$$;

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index on recipes (last_cooked_at);
create index on recipes (created_at);
create index on cook_log (cooked_at desc);
create index on cook_log (recipe_id);

-- ── Sample data (optional — delete if you prefer to start fresh) ──────────────
insert into recipes (name, description, ingredients, steps, tags, season, calories_per_portion, portions, calorie_source)
values
  (
    'Chili con carne',
    'A rich, warming beef and bean stew. Better the next day.',
    array['500g ground beef', '1 can kidney beans', '1 can chopped tomatoes', '2 tsp cumin', '1 tsp chili powder', '1 onion', '3 garlic cloves', 'salt & pepper'],
    '1. Brown the beef in a large pot over high heat.\n2. Add onion and garlic, cook until soft.\n3. Add spices and stir for 1 minute.\n4. Add tomatoes and beans. Simmer 30 minutes.\n5. Season to taste.',
    array['hearty', 'make-ahead'],
    array['autumn', 'winter'],
    480, 4, 'manual'
  ),
  (
    'Spring greens salad',
    'Light and fresh. Great with a lemon vinaigrette.',
    array['mixed leafy greens', '1 cucumber', '200g cherry tomatoes', 'radishes', 'lemon', 'olive oil', 'salt'],
    '1. Wash and dry greens.\n2. Slice cucumber and halve tomatoes.\n3. Make dressing: lemon juice, olive oil, salt.\n4. Toss and serve immediately.',
    array['light', 'quick', 'vegetarian'],
    array['spring', 'summer'],
    180, 2, 'manual'
  );

insert into ingredients (name, pantry_quantity, tags, season)
values
  ('Rice',            'lots',        array['staple', 'carb'],   array[]::text[]),
  ('Pasta',           'lots',        array['staple', 'carb'],   array[]::text[]),
  ('Canned tomatoes', 'lots',        array['staple'],           array[]::text[]),
  ('Kidney beans',    'some',        array['staple', 'protein'],array[]::text[]),
  ('Olive oil',       'lots',        array['staple'],           array[]::text[]),
  ('Chicken thighs',  'running low', array['protein'],          array[]::text[]),
  ('Leafy greens',    'some',        array['vegetable'],        array['spring', 'summer']);
