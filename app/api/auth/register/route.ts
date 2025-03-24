import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client with service role key (only on server)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // This is only available on the server
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a user with email already confirmed
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
      email_confirm: true, // Skip email verification
    });

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      role: 'patient',
    });

    if (profileError && profileError.code !== '23505') {
      console.error('Error creating profile:', profileError);
      return NextResponse.json(
        {
          warning: 'User created but profile creation failed',
          error: profileError.message,
        },
        { status: 207 } // Partial success
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
