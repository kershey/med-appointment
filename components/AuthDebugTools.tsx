'use client';

import { useEffect } from 'react';

export default function AuthDebugTools() {
  // Add a global debug function for authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Adding a global debug function
      window.testAuth = async (email: string, password: string) => {
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          console.log('Testing authentication for:', email);

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('Authentication error:', error);
            return { success: false, error };
          }

          console.log('Authentication successful:', data);
          return { success: true, data };
        } catch (err) {
          console.error('Unexpected authentication error:', err);
          return { success: false, error: err };
        }
      };

      // @ts-expect-error - Adding a global diagnostic function
      window.diagAuth = async (email: string, password: string) => {
        try {
          const { testAuthentication } = await import(
            '@/lib/supabase/diagHelpers'
          );
          return testAuthentication(email, password);
        } catch (err) {
          console.error('Error running diagnostic:', err);
          return { success: false, error: err };
        }
      };

      console.log(
        'Auth debug helpers available:\n' +
          '1. testAuth(email, password) - Basic auth test\n' +
          '2. diagAuth(email, password) - Full diagnostic with fixes'
      );
    }
  }, []);

  // This component doesn't render anything visible
  return null;
}
