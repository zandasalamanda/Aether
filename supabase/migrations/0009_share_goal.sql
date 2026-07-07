-- Share-a-map: a public, read-only link to a goal. A random share_id gates access
-- (null = private). Reads go through a SECURITY DEFINER function so an anonymous
-- viewer can fetch ONLY the goal matching the token — no RLS opened, no enumeration.
alter table public.goals add column if not exists share_id text unique;

create or replace function public.get_shared_goal(p_token text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'goal', jsonb_build_object(
      'title', g.title,
      'description', g.description,
      'progress', g.progress,
      'icon', g.icon,
      'targetDate', g.target_date
    ),
    'nodes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id,
        'parentId', n.parent_id,
        'title', n.title,
        'status', n.status,
        'estimatedMinutes', n.estimated_minutes,
        'sortOrder', n.sort_order,
        'resourceKind', n.resource_kind,
        'resourceLabel', n.resource_label
      ) order by n.sort_order)
      from public.goal_nodes n where n.goal_id = g.id
    ), '[]'::jsonb)
  )
  from public.goals g
  where g.share_id = p_token and g.archived_at is null
  limit 1;
$$;

grant execute on function public.get_shared_goal(text) to anon, authenticated;
