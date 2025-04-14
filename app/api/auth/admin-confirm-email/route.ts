import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Admin email confirmation API called');
    const { email } = await request.json();

    if (!email) {
      console.log('Email not provided in request');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Processing confirmation for email:', email);

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

    console.log('Supabase admin client created, looking up user...');

    // Get the user by email first (from auth.users)
    const { data, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      console.error('Error finding users:', getUserError);
      return NextResponse.json(
        {
          error: 'Could not retrieve users',
          details: getUserError.message,
        },
        { status: 500 }
      );
    }

    if (!data || !data.users || data.users.length === 0) {
      console.error('No users found in the system');
      return NextResponse.json(
        { error: 'User database is empty or inaccessible' },
        { status: 500 }
      );
    }

    console.log(
      `Found ${data.users.length} users, looking for match with email: ${email}`
    );

    // Find the user with the matching email
    const user = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      console.error('User not found with email:', email);
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
        },
        { status: 404 }
      );
    }

    console.log(
      'User found:',
      user.id,
      'Email confirmed:',
      user.email_confirmed_at ? 'Yes' : 'No'
    );

    // If email is already confirmed, just return success
    if (user.email_confirmed_at) {
      console.log('Email already confirmed, returning success');
      return NextResponse.json({
        success: true,
        message: 'Email was already confirmed',
      });
    }

    // Now that we have the user ID, verify this is an admin account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error finding admin profile:', profileError);
      return NextResponse.json(
        {
          error: 'Admin account not found',
          details: profileError.message,
          success: false,
        },
        { status: 404 }
      );
    }

    if (!profile) {
      console.log('No profile found for user, attempting to create one...');

      // Try to create a profile for the user
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (createProfileError) {
        console.error('Failed to create profile:', createProfileError);
        return NextResponse.json(
          {
            error: 'Failed to create admin profile',
            details: createProfileError.message,
            success: false,
          },
          { status: 500 }
        );
      }

      console.log('Created admin profile for user');
    } else if (profile.role !== 'admin') {
      console.log('User found but role is not admin:', profile.role);
      return NextResponse.json(
        {
          error: 'This endpoint is for admin accounts only',
          success: false,
        },
        { status: 403 }
      );
    }

    console.log('Confirming email for admin user...');

    // Update the user to confirm their email
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Error confirming email:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to confirm email',
          details: updateError.message,
          success: false,
        },
        { status: 500 }
      );
    }

    console.log('Email confirmed successfully');

    return NextResponse.json({
      success: true,
      message: 'Admin email confirmed successfully',
    });
  } catch (err) {
    console.error('Unexpected error during admin email confirmation:', err);
    return NextResponse.json(
      {
        error: 'Email confirmation failed due to an unexpected error',
        details: err instanceof Error ? err.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}
