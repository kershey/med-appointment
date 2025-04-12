import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Define a type for Supabase errors
interface ErrorWithMessage {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure environment variables are present
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Normalize the URL to ensure it's in the correct format
    // This handles both https://your-project.supabase.co and https://your-project.supabase.co/
    supabaseUrl = supabaseUrl.endsWith('/')
      ? supabaseUrl.slice(0, -1)
      : supabaseUrl;

    console.log(`Connecting to Supabase URL: ${supabaseUrl}`);

    // Initialize Supabase with admin powers
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false, // We're not using client side sessions
        persistSession: false, // We're not using client side sessions
      },
    });

    console.log('Attempting to create user...');

    try {
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
    } catch (supabaseError: unknown) {
      const errorWithMsg = supabaseError as ErrorWithMessage;
      console.error('Supabase operation error:', errorWithMsg);
      return NextResponse.json(
        {
          error:
            'Supabase operation failed: ' +
            (errorWithMsg.message || 'Unknown error'),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
