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

    // Try direct sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          error: 'Sign in failed',
          message: error.message,
          status: error.status,
        },
        { status: 400 }
      );
    }

    // If successful login, let's check for the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json({
      success: true,
      user: data.user,
      profile: profileData || null,
      profileError: profileError ? profileError.message : null,
      session: data.session
        ? {
            accessToken: data.session.access_token?.substring(0, 10) + '...',
            expiresAt: data.session.expires_at,
            refreshToken: data.session.refresh_token?.substring(0, 5) + '...',
          }
        : null,
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: String(error) },
      { status: 500 }
    );
  }
}
