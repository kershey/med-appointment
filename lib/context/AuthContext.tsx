'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types/database.types';
import { useRouter } from 'next/navigation';
import { User, AuthError as SupabaseAuthError } from '@supabase/supabase-js';

type CustomAuthError = {
  message: string;
  status?: number;
  isEmailConfirmationError?: boolean;
};

type ProfileUpdateResult = {
  data?: Profile;
  error?: string | SupabaseAuthError | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: CustomAuthError | null } | undefined>;
  signUp: (
    email: string,
    password: string,
    skipEmailVerification?: boolean
  ) => Promise<{ error: CustomAuthError | null } | undefined>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<ProfileUpdateResult>;
  isRole: (role: UserRole) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data && !error) {
          setProfile(data as Profile);
        }
      }
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              setProfile(data as Profile);
            }
          });
      } else {
        setProfile(null);
      }

      router.refresh();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in process for email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign-in error:', error.message, error.status);

        // Special handling for unconfirmed email errors
        if (
          error.message.includes('not confirmed') ||
          error.message.includes('Email not confirmed')
        ) {
          console.log('User attempted to sign in with unconfirmed email');

          // Send another confirmation email to help the user
          try {
            await supabase.auth.resend({
              type: 'signup',
              email: email,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            });
            console.log('Sent new confirmation email to:', email);

            return {
              error: {
                message:
                  'Please confirm your email address before signing in. We have sent a new confirmation email to your address.',
                status: error.status,
                isEmailConfirmationError: true,
              },
            };
          } catch (resendError) {
            console.error('Failed to resend confirmation email:', resendError);
            return {
              error: {
                message:
                  'Your email address has not been confirmed. Please check your inbox for a confirmation email.',
                status: error.status,
                isEmailConfirmationError: true,
              },
            };
          }
        }

        return { error: { message: error.message, status: error.status } };
      }

      if (!data || !data.user) {
        console.error('No user returned from successful sign-in');
        return {
          error: {
            message: 'Authentication succeeded but no user was returned',
          },
        };
      }

      // Explicitly set the user state
      setUser(data.user);
      console.log('Auth user set successfully, searching for profile...');

      // Fetch and set the profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileData && !profileError) {
        console.log('Profile found and loaded:', profileData.id);

        // Check if user is a doctor and not approved
        if (
          profileData.role === 'doctor' &&
          profileData.is_approved === false
        ) {
          console.log(
            'Doctor account not yet approved by admin:',
            profileData.id
          );
          // Sign out the user immediately
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);

          return {
            error: {
              message:
                'Your doctor account is pending approval by an administrator. You will be notified once your account has been approved.',
              status: 403,
            },
          };
        }

        setProfile(profileData as Profile);
      } else if (profileError) {
        console.error('Error fetching profile after sign-in:', profileError);

        // This is important - if profile doesn't exist, try to create it
        if (profileError.code === 'PGRST116') {
          // No rows returned
          console.log('No profile found, attempting to create one...');
          try {
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                user_id: data.user.id, // Explicitly set user_id to match id
                first_name: data.user.user_metadata?.first_name || 'New',
                last_name: data.user.user_metadata?.last_name || 'User',
                role: 'patient',
                is_approved: true, // Patients are automatically approved
              });

            if (createError) {
              console.error('Failed to create missing profile:', createError);
              return {
                error: {
                  message: 'Login succeeded but failed to create user profile',
                },
              };
            } else {
              console.log('Successfully created missing profile');
              // Now try to fetch the profile again
              const { data: newProfileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

              if (newProfileData) {
                setProfile(newProfileData as Profile);
              }
            }
          } catch (createError) {
            console.error('Exception creating profile:', createError);
          }
        }
      }

      // Log successful authentication
      console.log('Sign-in successful:', data.user.id);

      // Explicitly return undefined for successful login
      return undefined;
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      return { error: { message: String(error) } };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    skipEmailVerification = false
  ) => {
    try {
      // Log the email being used for signup (for debugging)
      console.log('Attempting to sign up with email:', email);

      // Normalize the email to improve compatibility with Supabase
      // Remove any whitespace and convert to lowercase
      const normalizedEmail = email.trim().toLowerCase();

      // Apply sanitization - this can help with some validation issues
      // Remove any characters that might cause issues but preserve the basic email structure
      const sanitizedEmail = normalizedEmail.replace(/[^\w@.-]/g, '');

      console.log('Using normalized email:', sanitizedEmail);

      // If we want to skip email verification (for doctors), use the admin API
      // which gives us direct control over email confirmation
      if (skipEmailVerification) {
        console.log(
          'Using admin API to create user and skip email verification'
        );

        // Use the admin API to create a user with email confirmation disabled
        const { data, error } = await supabase.auth.admin.createUser({
          email: sanitizedEmail,
          password,
          email_confirm: true, // This immediately confirms the email
          user_metadata: {
            original_email: email,
            first_name: 'New',
            last_name: 'User',
          },
        });

        if (error) {
          console.error('Admin API signup error:', error);
          return { error: { message: error.message, status: error.status } };
        }

        console.log(
          'User created successfully with admin API:',
          data?.user?.id
        );
        return undefined; // Success
      }

      // Otherwise, use the standard signup flow for regular users
      // Try with the sanitized email
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          // Store original email in metadata to preserve user's input
          data: {
            original_email: email,
            // Add explicit first_name and last_name fields to help the trigger
            first_name: 'New',
            last_name: 'User',
          },
          // Keep the redirect for now
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // If we want to skip email verification and the signup was successful,
      // we can immediately sign in the user with the same credentials
      if (skipEmailVerification && data?.user && !error) {
        console.log(
          'Signup successful, attempting immediate sign-in to bypass verification...'
        );
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

        if (signInError) {
          console.log('Immediate sign-in failed:', signInError);
        } else {
          console.log(
            'Immediate sign-in successful, bypassing email verification'
          );
        }
      }

      // Special handling for validation errors
      if (error) {
        console.error('Auth signup error:', error);

        // Specifically check for database errors
        if (
          error.message.includes('Database error') ||
          error.message.includes('db error')
        ) {
          console.error('Database error during signup:', error);

          return {
            error: {
              message:
                'Unable to create your account due to a database error. Please try again later or contact support.',
              status: error.status,
            },
          };
        }

        // If it's an invalid email error, try our plus addressing workaround
        if (error.message.includes('invalid') && sanitizedEmail.includes('@')) {
          // Split email into local part and domain
          const [localPart, domain] = sanitizedEmail.split('@');

          // Create a modified email with a plus tag
          const modifiedEmail = `${localPart}+signup@${domain}`;

          console.log('Trying modified email:', modifiedEmail);

          // Try again with the modified email
          const secondAttempt = await supabase.auth.signUp({
            email: modifiedEmail,
            password,
            options: {
              data: {
                original_email: email,
                // Also add explicit first_name and last_name fields
                first_name: 'New',
                last_name: 'User',
              },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (!secondAttempt.error) {
            // Success with modified email, conform to the expected return type
            console.log(
              'Modified email accepted, user created:',
              secondAttempt.data?.user?.id
            );

            // If we need to skip email verification, do an immediate sign-in here too
            if (skipEmailVerification && secondAttempt.data?.user) {
              console.log(
                'Second attempt successful, attempting immediate sign-in to bypass verification...'
              );
              const { error: signInError } =
                await supabase.auth.signInWithPassword({
                  email: modifiedEmail,
                  password,
                });

              if (signInError) {
                console.log(
                  'Immediate sign-in failed after second attempt:',
                  signInError
                );
              } else {
                console.log(
                  'Immediate sign-in successful after second attempt'
                );
              }
            }

            return undefined; // Success = undefined
          }

          // Check if the second attempt also has database errors
          if (
            secondAttempt.error.message.includes('Database error') ||
            secondAttempt.error.message.includes('db error')
          ) {
            console.error(
              'Database error during secondary signup attempt:',
              secondAttempt.error
            );

            return {
              error: {
                message:
                  'Unable to create your account due to a database error. Please try again later or contact support.',
                status: secondAttempt.error.status,
              },
            };
          }

          // If still failing, provide a helpful error message
          return {
            error: {
              message: `This email address "${email}" is not accepted by our authentication system. Please try a different email address.`,
              status: error.status,
            },
          };
        }

        return { error: { message: error.message, status: error.status } };
      }

      // If we've made it here, the signup was successful
      if (data?.user) {
        console.log('User created successfully:', data?.user?.id);

        // Let's wait a moment for the database trigger to create the profile
        try {
          console.log('Waiting for database trigger to create profile...');

          // Wait for a short delay (500ms) to give the database trigger time to execute
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Check if profile was created
          const { data: profileData, error: profileCheckError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileCheckError || !profileData) {
            console.log(
              'Profile not created by trigger, attempting manual creation'
            );

            // If profile doesn't exist, try to create it manually
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                user_id: data.user.id,
                first_name: data.user.user_metadata?.first_name || 'New',
                last_name: data.user.user_metadata?.last_name || 'User',
                role: 'patient',
              });

            if (createError) {
              console.error(
                'Manual profile creation also failed:',
                createError
              );
              // Log detailed error for debugging
              console.error('Error details:', JSON.stringify(createError));

              // Try syncing profiles directly using our helper function
              try {
                const { data: syncData } = await supabase.rpc(
                  'sync_missing_profiles'
                );
                console.log('Attempted to sync profiles, result:', syncData);
              } catch (syncError) {
                console.error('Failed to sync profiles:', syncError);
              }
            } else {
              console.log('Successfully created profile manually');
            }
          } else {
            console.log('Profile was successfully created by database trigger');
          }
        } catch (profileError) {
          console.error('Error checking/creating profile:', profileError);
          // Continue with signup even if profile creation fails
        }

        // Signal success by returning undefined as per the type definition
        return undefined;
      }

      // If we have no user but also no error, likely a confirmation email was sent
      console.log('Signup successful, email confirmation required');
      // Signal success by returning undefined as per the type definition
      return undefined;
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { error: { message: String(error) } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const updateProfile = async (
    data: Partial<Profile>
  ): Promise<ProfileUpdateResult> => {
    if (!user) return { error: 'Not authenticated' };

    try {
      console.log('Updating profile for user:', user.id, 'with data:', data);

      const { error, data: updatedData } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .single();

      console.log('Profile update response:', { error, data: updatedData });

      if (!error && profile) {
        setProfile({ ...profile, ...data });
        return { data: updatedData };
      }

      return { error: error ? error.message : null };
    } catch (error) {
      console.error('Exception in updateProfile:', error);
      return { error: String(error) };
    }
  };

  const isRole = (role: UserRole) => {
    return profile?.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        isRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
