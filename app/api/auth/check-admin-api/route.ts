import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create a Supabase client with explicit service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        'Missing Supabase URL or service role key in environment variables'
      );
      return NextResponse.json(
        {
          error:
            'Server configuration error: Missing required environment variables',
          env_check: {
            has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
        },
        { status: 500 }
      );
    }

    // Create client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Try to access an admin-only API
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Admin API access error:', error);
      return NextResponse.json(
        {
          error:
            'Failed to access Admin API. Check your SUPABASE_SERVICE_ROLE_KEY.',
          message: error.message,
          status: error.status,
          env_check: {
            has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            service_key_length:
              process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
          },
        },
        { status: 500 }
      );
    }

    // Check if profiles table is accessible
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    return NextResponse.json({
      success: true,
      users_count: data?.users?.length || 0,
      admin_api_working: true,
      profiles_accessible: !profilesError,
      profiles_error: profilesError ? profilesError.message : null,
      profiles_data:
        profiles && profiles.length > 0 ? 'Data found' : 'No profiles found',
      env_check: {
        has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_key_first_chars:
          process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 5) + '...' ||
          'none',
      },
    });
  } catch (err) {
    console.error('Unexpected error during API check:', err);
    return NextResponse.json(
      {
        error: 'API check failed due to an unexpected error',
        details: String(err),
      },
      { status: 500 }
    );
  }
}
