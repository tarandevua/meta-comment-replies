alter table responses
  add column if not exists created_at timestamptz not null default now();

alter table processed_events
  add column if not exists attempts integer not null default 1 check (attempts between 1 and 5),
  add column if not exists processing_started_at timestamptz not null default now();

create or replace function claim_processed_event(
  p_event_id text,
  p_platform text,
  p_comment_id text,
  p_post_id text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  claimed boolean;
begin
  insert into processed_events (
    event_id, platform, comment_id, post_id, status, attempts, processing_started_at
  ) values (
    p_event_id, p_platform, p_comment_id, p_post_id, 'processing', 1, now()
  )
  on conflict (event_id) do update
    set status = 'processing',
        attempts = processed_events.attempts + 1,
        processing_started_at = now(),
        processed_at = null,
        error_message = null
    where processed_events.attempts < 5
      and (
        processed_events.status = 'failed'
        or (
          processed_events.status = 'processing'
          and processed_events.processing_started_at < now() - interval '2 minutes'
        )
      )
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function claim_processed_event(text, text, text, text) from public;
grant execute on function claim_processed_event(text, text, text, text) to service_role;
