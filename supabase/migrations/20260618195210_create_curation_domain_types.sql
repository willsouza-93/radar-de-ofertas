create type public.approval_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.approval_decision_type as enum (
  'approved',
  'rejected'
);
