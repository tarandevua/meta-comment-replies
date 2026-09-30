alter table response_sets
  add column if not exists selection_type text not null default 'number'
    check (selection_type in ('number')),
  add column if not exists updated_at timestamptz not null default now();

alter table campaigns
  add column if not exists updated_at timestamptz not null default now(),
  add constraint campaigns_has_platform_target
    check (facebook_post_id is not null or instagram_media_id is not null) not valid;

alter table responses
  drop constraint if exists responses_selection_check;

alter table responses
  alter column selection type bigint;

alter table responses
  add column if not exists updated_at timestamptz not null default now();

alter table processed_events
  add column if not exists campaign_id uuid references campaigns(id) on delete set null,
  add column if not exists reason text,
  add constraint processed_events_reason_check
    check (
      reason is null or reason in (
        'no_selection',
        'ambiguous_selection',
        'selection_not_found',
        'campaign_not_found'
      )
    ) not valid,
  add constraint processed_events_ignored_reason_check
    check (
      (status = 'ignored' and reason is not null)
      or (status <> 'ignored' and reason is null)
    ) not valid;

create unique index if not exists processed_events_platform_comment_uidx
  on processed_events(platform, comment_id);

create index if not exists campaigns_active_facebook_post_idx
  on campaigns(facebook_post_id) where status = 'active';

create index if not exists campaigns_active_instagram_media_idx
  on campaigns(instagram_media_id) where status = 'active';

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists response_sets_set_updated_at on response_sets;
create trigger response_sets_set_updated_at
before update on response_sets
for each row execute function set_updated_at();

drop trigger if exists campaigns_set_updated_at on campaigns;
create trigger campaigns_set_updated_at
before update on campaigns
for each row execute function set_updated_at();

drop trigger if exists responses_set_updated_at on responses;
create trigger responses_set_updated_at
before update on responses
for each row execute function set_updated_at();

drop function if exists claim_processed_event(text, text, text, text);

create function claim_processed_event(
  p_event_id text,
  p_platform text,
  p_comment_id text,
  p_post_id text,
  p_campaign_id uuid
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
    event_id,
    platform,
    comment_id,
    post_id,
    campaign_id,
    status,
    attempts,
    processing_started_at
  ) values (
    p_event_id,
    p_platform,
    p_comment_id,
    p_post_id,
    p_campaign_id,
    'processing',
    1,
    now()
  )
  on conflict do nothing
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function claim_processed_event(text, text, text, text, uuid) from public;
grant execute on function claim_processed_event(text, text, text, text, uuid) to service_role;
