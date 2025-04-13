import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

    console.log('Checking if admin user exists with email:', email);

    try {
      // Check if user with this email already exists using the admin API
      const { data, error: getUsersError } =
        await supabase.auth.admin.listUsers();

      if (getUsersError) {
        console.error('Error checking auth users:', getUsersError);
        return NextResponse.json(
          {
            error: `Failed to check for existing users: ${getUsersError.message}`,
          },
          { status: 500 }
        );
      }

      // Filter the users manually
      const existingUser = data?.users?.find(
        (user) => user.email?.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        console.log(
          'User already exists in auth system, checking if admin profile exists'
        );

        // Check if this user already has an admin profile
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', existingUser.id)
          .single();

        if (!profileError && existingProfile?.role === 'admin') {
          console.log('User already has an admin profile');
          return NextResponse.json(
            { error: 'An admin account with this email already exists' },
            { status: 409 }
          );
        }

        // If we're here, user exists but doesn't have an admin profile
        // Update the user metadata and create an admin profile
        console.log('User exists but is not an admin, updating to admin role');

        // Update user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              first_name: firstName,
              last_name: lastName,
              role: 'admin',
            },
            email_confirm: true,
          }
        );

        if (updateError) {
          console.error('Error updating existing user:', updateError);
          return NextResponse.json(
            { error: `Failed to update user: ${updateError.message}` },
            { status: 500 }
          );
        }

        // Create or update the profile with admin role
        const { error: upsertProfileError } = await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            user_id: existingUser.id,
            first_name: firstName,
            last_name: lastName,
            role: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (upsertProfileError) {
          console.error('Profile creation error:', upsertProfileError);
          return NextResponse.json(
            {
              error: `Error creating admin profile: ${upsertProfileError.message}`,
            },
            { status: 500 }
          );
        }

        console.log('Existing user updated to admin role successfully');
        return NextResponse.json({
          success: true,
          message: 'Existing account upgraded to admin successfully',
        });
      }

      console.log('No existing user found, proceeding with creation');
    } catch (authCheckError) {
      console.error('Exception during auth users check:', authCheckError);
      // Continue with creation anyway, as we'll get a conflict error if the user exists
    }

    // Create the admin user with email_confirm = true to skip verification
    console.log('Creating admin user with email_confirm=true');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This is the key setting - skip email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
      },
    });

    if (error) {
      console.error('Admin user creation error:', error);
      return NextResponse.json(
        { error: `Failed to create admin user: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data?.user) {
      return NextResponse.json(
        { error: 'Failed to create user - no user data returned' },
        { status: 500 }
      );
    }

    console.log('User created, now creating profile with ID:', data.user.id);

    // Create the profile with admin role matching exact schema fields
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      user_id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: `Error creating admin profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log('Admin user and profile created successfully');
    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
    });
  } catch (err) {
    console.error('Unexpected error during admin registration:', err);
    return NextResponse.json(
      {
        error: `Registration failed due to an unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
