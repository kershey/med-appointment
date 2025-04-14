import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type TableTestResult = {
  success: boolean;
  count?: number;
  error: string | null;
};

export async function GET() {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    // Check if we have an authenticated user
    const isAuthenticated = !!userData.user;
    const userId = userData.user?.id;

    // Test tables with different RLS policies
    const tables = [
      'profiles',
      'doctors',
      'appointments',
      'medical_records',
      'payments',
    ];

    const results: Record<string, TableTestResult> = {};

    // Try to access each table
    for (const table of tables) {
      try {
        // Use the correct syntax for counting rows in Supabase
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        results[table] = {
          success: !error,
          count: count || 0,
          error: error?.message || null,
        };
      } catch (err) {
        results[table] = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json({
      success: true,
      auth: {
        isAuthenticated,
        userId: userId || null,
      },
      rlsTests: results,
    });
  } catch (error) {
    console.error('RLS test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
