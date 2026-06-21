import { createBrowserClient } from '@supabase/ssr';

// Notice there is NO "default" keyword here. 
// This creates the "named export" that your page.tsx is looking for.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}