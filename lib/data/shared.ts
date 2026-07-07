import { getSupabaseServer } from "@/lib/supabase/server";
import type { NodeStatus, ResourceKind } from "@/types";

// Public read of a shared goal. Goes through the SECURITY DEFINER RPC
// get_shared_goal(token), so an anonymous viewer gets ONLY the goal matching the
// token — no auth, no RLS opened, no way to enumerate other people's goals.

export interface SharedNode {
  id: string;
  parentId: string | null;
  title: string;
  status: NodeStatus;
  estimatedMinutes: number;
  sortOrder: number;
  resourceKind: ResourceKind | null;
  resourceLabel: string | null;
}
export interface SharedGoal {
  goal: { title: string; description: string; progress: number; icon: string | null; targetDate: string | null };
  nodes: SharedNode[];
}

export async function getSharedGoal(token: string): Promise<SharedGoal | null> {
  const supabase = getSupabaseServer();
  if (!supabase || !token) return null;
  const { data, error } = await supabase.rpc("get_shared_goal", { p_token: token });
  if (error || !data) return null;
  return data as SharedGoal;
}
