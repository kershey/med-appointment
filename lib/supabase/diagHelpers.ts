import { createClient } from './client';

/**
 * Run a full diagnostic test on authentication and profile access
 */
export async function testAuthentication(email: string, password: string) {
  try {
    console.log('🔍 Starting authentication diagnostic test');
    const supabase = createClient();

    // Step 1: Test direct authentication
    console.log('Step 1: Testing authentication...');
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error('✖️ Authentication failed:', authError.message);
      return {
        success: false,
        step: 'authentication',
        error: authError,
        fixes: [
          'Check your email and password combination',
          'Make sure your email is confirmed if confirmation is required',
          'Try resetting your password',
        ],
      };
    }

    console.log('✓ Authentication successful!');
    console.log('User ID:', authData.user?.id);
    console.log('Email:', authData.user?.email);

    // Step 2: Test profile access
    console.log('\nStep 2: Testing profile access...');
    if (!authData.user) {
      console.error('✖️ No user returned from successful authentication');
      return {
        success: false,
        step: 'user_data',
        error: 'No user data returned',
        fixes: [
          'Try logging out and back in',
          'Clear browser cache and cookies',
        ],
      };
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('✖️ Profile access failed:', profileError.message);

      // Try to create a profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        // No rows returned
        console.log('No profile found, attempting to create one...');

        const { error: createError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          first_name: authData.user.user_metadata?.first_name || 'New',
          last_name: authData.user.user_metadata?.last_name || 'User',
          role: 'patient',
        });

        if (createError) {
          console.error('✖️ Failed to create profile:', createError.message);
          return {
            success: false,
            step: 'profile_creation',
            error: createError,
            authData: authData,
            fixes: [
              'Check RLS policies for the profiles table',
              'Make sure the authenticated user has permission to insert their own profile',
              'Verify that the database trigger is functioning correctly',
            ],
          };
        }

        // Try to fetch the profile again
        const { data: newProfileData, error: refetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (refetchError) {
          console.error(
            '✖️ Still cannot access profile after creation:',
            refetchError.message
          );
          return {
            success: false,
            step: 'profile_access_after_creation',
            error: refetchError,
            authData: authData,
            fixes: [
              'Check RLS policies for the profiles table',
              'Make sure auth.uid() is being used correctly in RLS policies',
            ],
          };
        }

        console.log('✓ Profile created and accessed successfully!');
        return {
          success: true,
          message: 'Authentication successful and profile created',
          authData: authData,
          profileData: newProfileData,
        };
      }

      return {
        success: false,
        step: 'profile_access',
        error: profileError,
        authData: authData,
        fixes: [
          'Check RLS policies for the profiles table',
          'Verify that a profile record exists for this user',
          'Make sure the user has permission to access their own profile',
        ],
      };
    }

    console.log('✓ Profile access successful!');
    console.log('Profile ID:', profileData.id);
    console.log('Name:', `${profileData.first_name} ${profileData.last_name}`);
    console.log('Role:', profileData.role);

    return {
      success: true,
      message: 'Authentication and profile access successful',
      authData: authData,
      profileData: profileData,
    };
  } catch (error) {
    console.error('✖️ Unexpected error during diagnostic:', error);
    return {
      success: false,
      step: 'unexpected',
      error: error,
      fixes: [
        'Check browser console for more details',
        'Verify Supabase configuration in environment variables',
      ],
    };
  }
}
