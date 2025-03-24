import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Step 1: Sign in with credentials
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return NextResponse.json(
        {
          error: 'Sign in failed',
          message: authError.message,
          status: authError.status,
        },
        { status: 400 }
      );
    }

    // Step 2: Test select on profiles
    const { data: profileData, error: profileSelectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // Step 3: Test insert on profiles (will fail if profile exists, which is expected)
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name: 'Test',
        last_name: 'User',
        role: 'patient',
      });

    // Get RLS policies list to check
    const { data: rlsPolicies, error: rlsError } = await supabase.rpc(
      'get_policies_info'
    );

    return NextResponse.json({
      success: true,
      auth: {
        user: authData.user,
        session: {
          accessToken: authData.session?.access_token?.substring(0, 10) + '...',
          expiresAt: authData.session?.expires_at,
        },
      },
      profile: {
        data: profileData,
        selectError: profileSelectError,
        insertError: profileInsertError,
      },
      rlsPolicies: rlsPolicies,
      rlsError: rlsError,
    });
  } catch (error) {
    console.error('RLS test error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: String(error) },
      { status: 500 }
    );
  }
}
