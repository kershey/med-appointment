import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

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

    // Get the user by email first (from auth.users)
    const { data, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError || !data) {
      console.error('Error finding users:', getUserError);
      return NextResponse.json(
        { error: 'Could not retrieve users' },
        { status: 500 }
      );
    }

    // Find the user with the matching email
    const user = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      console.error('User not found with email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Now that we have the user ID, verify this is an admin account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error finding admin profile:', profileError);
      return NextResponse.json(
        { error: 'Admin account not found' },
        { status: 404 }
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'This endpoint is for admin accounts only' },
        { status: 403 }
      );
    }

    // Update the user to confirm their email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Error confirming email:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Admin email confirmed successfully',
    });
  } catch (err) {
    console.error('Unexpected error during admin email confirmation:', err);
    return NextResponse.json(
      { error: 'Email confirmation failed due to an unexpected error' },
      { status: 500 }
    );
  }
}
