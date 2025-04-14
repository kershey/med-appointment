import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      specialization,
      licenseNumber,
    } = await request.json();

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !phone ||
      !specialization ||
      !licenseNumber
    ) {
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

    console.log('Checking if doctor user exists with email:', email);

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
        console.log('User already exists in auth system');

        // Check if this user already has a doctor profile
        const { data: existingProfile, error: profileCheckError } =
          await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', existingUser.id)
            .single();

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
          // PGRST116 means not found, any other error is a real error
          console.error('Error checking profile:', profileCheckError);
          return NextResponse.json(
            {
              error: `Error checking user profile: ${profileCheckError.message}`,
            },
            { status: 500 }
          );
        }

        // If user already has a doctor profile, prevent duplicate registration
        if (existingProfile && existingProfile.role === 'doctor') {
          return NextResponse.json(
            { error: 'A doctor account with this email already exists' },
            { status: 409 }
          );
        }

        // If user exists but doesn't have a doctor profile, update them
        console.log('Existing user found, updating to doctor role');

        // Update user metadata to reflect doctor role
        const { error: updateUserError } =
          await supabase.auth.admin.updateUserById(existingUser.id, {
            user_metadata: {
              first_name: firstName,
              last_name: lastName,
              role: 'doctor',
              phone: phone,
              specialization: specialization,
              licenseNumber: licenseNumber,
            },
            email_confirm: false, // Set to false to prevent auto login
          });

        if (updateUserError) {
          console.error('Error updating user:', updateUserError);
          return NextResponse.json(
            { error: `Failed to update user: ${updateUserError.message}` },
            { status: 500 }
          );
        }

        // Continue with the existing user ID for creating/updating profiles and doctor records
        const existingUserId = existingUser.id;
        console.log(
          'Using existing user ID for doctor profile:',
          existingUserId
        );

        // Create/update the profile with doctor role
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: existingUserId,
          user_id: existingUserId,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          role: 'doctor',
          is_approved: false, // Doctors need admin approval
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error('Profile update error:', profileError);
          return NextResponse.json(
            {
              error: `Error updating to doctor profile: ${profileError.message}`,
            },
            { status: 500 }
          );
        }

        // Check if a doctor record already exists for this user
        const { data: existingDoctor, error: checkDoctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', existingUserId)
          .single();

        if (checkDoctorError && checkDoctorError.code !== 'PGRST116') {
          // PGRST116 means no rows returned, any other error is a real error
          console.error(
            'Error checking for existing doctor record:',
            checkDoctorError
          );
          return NextResponse.json(
            {
              error: `Error checking for existing doctor record: ${checkDoctorError.message}`,
            },
            { status: 500 }
          );
        }

        if (existingDoctor) {
          console.log(
            'Existing doctor record found, will update it:',
            existingDoctor.id
          );
        } else {
          console.log('No existing doctor record found, will create a new one');
        }

        // Create/update the doctor record
        const { error: doctorError } = await supabase.from('doctors').upsert(
          {
            id: existingUserId,
            specialty: specialization,
            license_number: licenseNumber,
            consultation_fee: 0, // Set a default value since this is required
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        );

        if (doctorError) {
          console.error('Doctor record update error:', doctorError);
          return NextResponse.json(
            { error: `Error updating doctor record: ${doctorError.message}` },
            { status: 500 }
          );
        }

        // Return success for existing user updated to doctor
        const response = NextResponse.json({
          success: true,
          user: {
            id: existingUserId,
            email: existingUser.email,
          },
          message: 'Existing account converted to doctor successfully',
        });

        // Clear any auth cookies that might have been set
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');

        return response;
      }

      console.log('No existing user found, proceeding with creation');
    } catch (authCheckError) {
      console.error('Exception during auth users check:', authCheckError);
      // Continue with creation anyway, as we'll get a conflict error if the user exists
    }

    // Create the doctor user with email_confirm = false to prevent auto-login
    console.log('Creating doctor user with email_confirm=false');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Set to false to prevent auto login after registration
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'doctor',
        phone: phone,
        specialization: specialization,
        licenseNumber: licenseNumber,
      },
    });

    if (error) {
      console.error('Doctor user creation error:', error);
      return NextResponse.json(
        { error: `Failed to create doctor user: ${error.message}` },
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

    // Create the profile with doctor role matching exact schema fields
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      user_id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      role: 'doctor',
      is_approved: false, // Doctors need admin approval
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: `Error creating doctor profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Check if a doctor record already exists for this user
    const { data: existingDoctor, error: checkDoctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (checkDoctorError && checkDoctorError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, any other error is a real error
      console.error(
        'Error checking for existing doctor record:',
        checkDoctorError
      );
      return NextResponse.json(
        {
          error: `Error checking for existing doctor record: ${checkDoctorError.message}`,
        },
        { status: 500 }
      );
    }

    if (existingDoctor) {
      console.log(
        'Existing doctor record found, will update it:',
        existingDoctor.id
      );
    } else {
      console.log('No existing doctor record found, will create a new one');
    }

    // Now create or update the doctor record in the doctors table
    // Use upsert instead of insert to handle cases where the record might already exist
    const { error: doctorError } = await supabase.from('doctors').upsert(
      {
        id: data.user.id,
        specialty: specialization,
        license_number: licenseNumber,
        consultation_fee: 0, // Set a default value since this is required
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
        ignoreDuplicates: false,
      }
    );

    if (doctorError) {
      console.error('Doctor record creation error:', doctorError);
      return NextResponse.json(
        { error: `Error creating doctor record: ${doctorError.message}` },
        { status: 500 }
      );
    }

    console.log('Doctor user and profile created successfully');

    // Create a response without session cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: 'Doctor account created successfully',
    });

    // Clear any auth cookies that might have been set
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');

    return response;
  } catch (err) {
    console.error('Unexpected error during doctor registration:', err);

    // Create error response with cleared cookies
    const errorResponse = NextResponse.json(
      {
        error: `Registration failed due to an unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );

    // Clear any auth cookies that might have been set
    errorResponse.cookies.delete('sb-access-token');
    errorResponse.cookies.delete('sb-refresh-token');

    return errorResponse;
  }
}
