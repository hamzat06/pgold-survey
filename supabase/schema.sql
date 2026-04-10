-- Employee Questionnaire Schema
-- Run this in your Supabase SQL editor to set up the database

-- Questions table: stores all survey questions
create table if not exists questions (
  id          serial primary key,
  text        text not null,
  type        text not null check (type in ('rating', 'multiple_choice', 'text')),
  options     jsonb,           -- array of strings for multiple_choice
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Responses table: one row per survey submission (anonymous)
create table if not exists responses (
  id            uuid primary key default gen_random_uuid(),
  session_token uuid not null,   -- random token generated client-side, not tied to any identity
  submitted_at  timestamptz not null default now()
);

-- Answers table: one row per question answered per response
create table if not exists answers (
  id          bigserial primary key,
  response_id uuid not null references responses(id) on delete cascade,
  question_id integer not null references questions(id) on delete cascade,
  value       text not null,
  created_at  timestamptz not null default now()
);

-- Indexes for fast lookups
create index if not exists answers_response_id_idx on answers(response_id);
create index if not exists answers_question_id_idx on answers(question_id);

-- Row Level Security: allow anonymous inserts, block reads from client
alter table questions  enable row level security;
alter table responses  enable row level security;
alter table answers    enable row level security;

-- Anyone (including anonymous) can read active questions
create policy "Public can read active questions"
  on questions for select
  using (is_active = true);

-- Anyone can insert a response
create policy "Public can insert responses"
  on responses for insert
  with check (true);

-- Anyone can insert answers
create policy "Public can insert answers"
  on answers for insert
  with check (true);

-- Only service_role (used by admin API route) can read responses and answers
-- The anon key cannot read results — anonymity is enforced at DB level
create policy "Service role can read responses"
  on responses for select
  using (auth.role() = 'service_role');

create policy "Service role can read answers"
  on answers for select
  using (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────────────────
-- Seed: default survey questions (optional — admins can manage questions via
-- the /admin dashboard instead of editing this file directly)
-- ────────────────────────────────────────────────────────────────────────────
insert into questions (text, type, options, sort_order) values
  ('How satisfied are you with working at this company overall?',         'rating',          null,                                                                                 1),
  ('How would you rate your work-life balance?',                          'rating',          null,                                                                                 2),
  ('How satisfied are you with the support from your direct manager?',    'rating',          null,                                                                                 3),
  ('How effective is communication within the company?',                  'rating',          null,                                                                                 4),
  ('How would you rate the opportunities for growth and career development?', 'rating',      null,                                                                                 5),
  ('How well does the team collaborate and support each other?',          'rating',          null,                                                                                 6),
  ('How fairly are employees treated regardless of background?',          'rating',          null,                                                                                 7),
  ('Would you recommend this company as a great place to work?',          'multiple_choice', '["Definitely yes", "Probably yes", "Not sure", "Probably not", "Definitely not"]',   8),
  ('What do you enjoy most about working here?',                          'text',            null,                                                                                 9),
  ('What is one thing you would change or improve about the company?',    'text',            null,                                                                                10),
  ('Any other comments or suggestions for leadership?',                   'text',            null,                                                                                11)
on conflict do nothing;
