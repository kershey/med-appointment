import { twMerge } from 'tailwind-merge';
import { type ClassValue, clsx } from 'clsx';
import { SupabaseClient } from '@supabase/supabase-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Tests the Supabase database connection with a simple query
 * Returns true if connection is successful, false otherwise
 */
export async function testDatabaseConnection(supabaseClient: SupabaseClient) {
  try {
    // Attempt a simple query - use correct Supabase count syntax
    const { count, error } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Database connection test failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: { count } };
  } catch (error) {
    console.error('Database connection test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Checks if the necessary Supabase environment variables are set
 */
export function checkSupabaseEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const issues = [];

  if (!url) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  } else if (!url.includes('supabase.co')) {
    issues.push(
      'NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL'
    );
  }

  if (!anonKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  } else if (anonKey.length < 20) {
    issues.push(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be too short to be valid'
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    vars: {
      url: url ? `${url.substring(0, 8)}...` : 'not set',
      anonKey: anonKey ? `${anonKey.substring(0, 5)}...` : 'not set',
    },
  };
}
