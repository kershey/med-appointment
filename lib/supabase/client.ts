import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// WARNING: This client should only be used in environments where
// it's safe to expose the service role key, such as:
// 1. Server-side code (API routes, Edge functions)
// 2. Admin-only pages that are protected by authentication and authorization
// NEVER use this in publicly accessible client-side code
export function createAdminClient() {
  // We check if we're running in a server environment
  // The service role key should NEVER be exposed in the browser
  if (typeof window !== 'undefined') {
    console.error('Admin client should not be used in the browser');
    return createClient(); // Fallback to regular client
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
