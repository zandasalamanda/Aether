-- The public share view could only build a Google/YouTube SEARCH url from the
-- label, because the RPC never returned the resolved link. Sending a visitor to
-- a search results page is the job we said we would do for them, handed back.
-- The resolved resource is already stored per node; return it.
--
-- REMINDER: apply to production by hand before deploying code that reads it.
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
        'resourceLabel', n.resource_label,
        'resourceUrl', n.resource_resolved ->> 'url',
        'resourceSource', n.resource_resolved ->> 'source',
        'firstAction', nullif(n.first_action, '')
      ) order by n.sort_order)
      from public.goal_nodes n where n.goal_id = g.id
    ), '[]'::jsonb)
  )
  from public.goals g
  where g.share_id = p_token and g.archived_at is null
  limit 1;
$$;

grant execute on function public.get_shared_goal(text) to anon, authenticated;
