import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { testDatabaseConnection, checkSupabaseEnvVars } from '@/lib/utils';

export async function GET() {
  try {
    // Check environment variables first
    const envCheck = checkSupabaseEnvVars();

    if (!envCheck.isValid) {
      console.error('Environment variable issues:', envCheck.issues);
      return NextResponse.json(
        {
          success: false,
          error: 'Environment variable issues detected',
          envCheck,
        },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient();

    // Test connection
    const result = await testDatabaseConnection(supabase);

    if (!result.success) {
      console.error('Database connection test failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error, envCheck },
        { status: 500 }
      );
    }

    // Also check connection to auth schema
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth connection test failed:', authError);
      return NextResponse.json(
        {
          success: false,
          dbSuccess: true,
          authSuccess: false,
          error: authError.message,
          envCheck,
        },
        { status: 500 }
      );
    }

    // Test a specific table access based on RLS
    const { count: profileCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Return all test results
    return NextResponse.json({
      success: true,
      database: {
        connected: result.success,
        data: result.data,
      },
      auth: {
        connected: !authError,
        user: authData?.user ? 'exists' : 'none',
      },
      rls: {
        profiles: {
          success: !profilesError,
          error: profilesError?.message || null,
          count: profileCount || 0,
        },
      },
      env: {
        check: envCheck,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? 'configured'
          : 'missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? 'configured'
          : 'missing',
      },
    });
  } catch (error) {
    console.error('Database test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        envCheck: checkSupabaseEnvVars(),
      },
      { status: 500 }
    );
  }
}
