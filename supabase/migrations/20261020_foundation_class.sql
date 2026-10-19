-- Faith Connect: foundation class progress. Safe to run more than once.
-- Stages: not_started, class_1, class_2, class_3, completed (all three
-- classes done), graduated, not_applicable (visitors who belong to another
-- church). Null means nobody has recorded a stage yet.

alter table public.contacts
  add column if not exists foundation_stage text
    check (foundation_stage in ('not_started', 'class_1', 'class_2', 'class_3', 'completed', 'graduated', 'not_applicable')),
  add column if not exists foundation_stage_updated_at timestamptz,
  add column if not exists foundation_stage_updated_by uuid references public.counsellors (id) on delete set null;

create index if not exists contacts_foundation_stage_idx on public.contacts (foundation_stage);

-- Each feedback entry remembers the stage the counsellor recorded with it.
alter table public.feedback
  add column if not exists foundation_stage text
    check (foundation_stage in ('not_started', 'class_1', 'class_2', 'class_3', 'completed', 'graduated', 'not_applicable'));
