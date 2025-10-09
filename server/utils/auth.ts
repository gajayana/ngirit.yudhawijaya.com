import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import type { H3Event } from 'h3';

/**
 * Get authenticated user ID from Supabase session
 * Centralizes user ID extraction to handle potential library changes
 */
export async function getAuthenticatedUserId(event: H3Event): Promise<string> {
  const user = await serverSupabaseUser(event);

  if (!user || !user.sub) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No user session',
    });
  }

  // @nuxtjs/supabase uses user.sub for user ID
  // If the library changes, update this single location
  return user.sub;
}

/**
 * Check if user has specific role with blocking status check
 */
export async function checkUserRole(
  event: H3Event,
  allowedRoles: string[]
): Promise<{ userId: string; role: string }> {
  const userId = await getAuthenticatedUserId(event);
  const supabase = await serverSupabaseClient(event);

  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role, is_blocked')
    .eq('user_id', userId)
    .single();

  if (roleError || !userRole) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - No role found',
    });
  }

  if (userRole.is_blocked) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Account blocked',
    });
  }

  if (!allowedRoles.includes(userRole.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden - Requires one of: ${allowedRoles.join(', ')}`,
    });
  }

  return { userId, role: userRole.role };
}
