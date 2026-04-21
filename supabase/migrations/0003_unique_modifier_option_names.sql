-- Keep one option label per modifier group. Older local/dev databases may have
-- duplicates from rerunning seed.sql before this uniqueness guard existed.
with ranked_options as (
  select
    id,
    row_number() over (
      partition by group_id, lower(btrim(name))
      order by sort_order, id
    ) as duplicate_rank
  from modifier_options
)
delete from modifier_options
where id in (
  select id
  from ranked_options
  where duplicate_rank > 1
);

create unique index if not exists modifier_options_group_name_unique_idx
  on modifier_options (group_id, lower(btrim(name)));
