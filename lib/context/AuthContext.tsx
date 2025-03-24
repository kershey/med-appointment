'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types/database.types';
import { useRouter } from 'next/navigation';
import { User, AuthError as SupabaseAuthError } from '@supabase/supabase-js';

type CustomAuthError = {
  message: string;
  status?: number;
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
    password: string
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
                first_name: data.user.user_metadata?.first_name || 'New',
                last_name: data.user.user_metadata?.last_name || 'User',
                role: 'patient',
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

  const signUp = async (email: string, password: string) => {
    try {
      // First attempt to create the auth user
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        console.error('Auth signup error:', error);
        return { error: { message: error.message, status: error.status } };
      }

      if (data?.user) {
        console.log('User created successfully:', data.user.id);

        // Now manually create a profile if one doesn't exist
        try {
          // Check if profile already exists (the trigger might have created it)
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!existingProfile) {
            console.log('No profile exists, creating one manually');
            // If no profile exists, create one with default values
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                first_name: 'New',
                last_name: 'User',
                role: 'patient',
              });

            if (profileError) {
              console.error('Error creating profile:', profileError);
              return {
                error: {
                  message:
                    'Account created but profile creation failed: ' +
                    profileError.message,
                },
              };
            }
          }
        } catch (profileCheckError) {
          console.error(
            'Error checking for existing profile:',
            profileCheckError
          );
        }
      }

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
