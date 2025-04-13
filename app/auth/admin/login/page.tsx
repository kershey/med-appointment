'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createClient } from '@/lib/supabase/client';
import { LockKeyhole, Shield } from 'lucide-react';

// Helper function to verify admin emails server-side
const confirmAdminEmail = async (email: string) => {
  try {
    const response = await fetch('/api/auth/admin-confirm-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error confirming admin email:', error);
    return { success: false, error: 'Failed to confirm email' };
  }
};

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    console.log('Admin login attempt with email:', data.email);

    try {
      const supabase = createClient();

      // First, try direct login without worrying about email confirmation
      console.log('Attempting direct signin with Supabase...');
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (signInError) {
        console.error('Admin login error details:', {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name,
        });

        // If the error is about email confirmation, try to bypass it
        if (signInError.message.includes('Email not confirmed')) {
          console.log(
            'Email not confirmed error - attempting to handle gracefully...'
          );

          // Check if this is an admin account
          try {
            // First get all users and find the one matching this email
            const { data: authUsers, error: authUsersError } =
              await supabase.auth.admin.listUsers();

            if (authUsersError) {
              console.error('Error accessing auth users:', authUsersError);
              throw new Error('Failed to verify admin status');
            }

            // Find the auth user with this email
            const authUser = authUsers?.users?.find(
              (u) => u.email?.toLowerCase() === data.email.toLowerCase()
            );

            if (!authUser) {
              console.error('Auth user not found with email:', data.email);
              setError(
                'Invalid email or password. Please check your credentials and try again.'
              );
              toast.error('Login failed');
              return;
            }

            // Now check if this user has an admin profile
            const { data: adminData, error: adminDataError } = await supabase
              .from('profiles')
              .select('id, role')
              .eq('id', authUser.id)
              .single();

            if (adminDataError) {
              console.error('Error fetching admin profile:', adminDataError);
              throw new Error('Failed to verify admin status');
            }

            if (adminData?.role === 'admin') {
              console.log('Admin account found with unconfirmed email');

              // Try to confirm the email server-side first
              const confirmResult = await confirmAdminEmail(data.email);

              if (confirmResult.success) {
                console.log('Successfully confirmed admin email server-side');

                // Try logging in again now that the email is confirmed
                const { data: retrySignInData, error: retrySignInError } =
                  await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                  });

                if (!retrySignInError && retrySignInData?.user) {
                  console.log('Login successful after email confirmation');

                  // Check if the user has an admin role
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, first_name, last_name')
                    .eq('id', retrySignInData.user.id)
                    .single();

                  if (!profileError && profile?.role === 'admin') {
                    console.log('Admin login successful, redirecting...');
                    toast.success(
                      `Welcome, ${profile.first_name}! Logged in as Administrator`
                    );
                    router.push('/admin');
                    return;
                  }
                }

                // If we're still here, something went wrong with the retry
                console.log('Login retry failed even after email confirmation');
              }

              // Fall back to password reset if server-side confirmation fails
              console.log('Falling back to password reset flow');

              // Throttle the password reset request to avoid rate limits
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Send a password reset link instead of trying to login directly
              const { error: resetError } =
                await supabase.auth.resetPasswordForEmail(data.email, {
                  redirectTo: `${window.location.origin}/auth/admin/reset-password`,
                });

              if (resetError) {
                console.error('Failed to send password reset:', resetError);

                // Check if we hit a rate limit
                if (
                  resetError.message.includes('rate limit') ||
                  resetError.message.includes('too many requests')
                ) {
                  setError(
                    'Email rate limit exceeded. Please wait a few minutes before requesting another password reset.'
                  );
                  toast.error('Rate limit exceeded');
                } else {
                  setError(
                    'Your email has not been verified. We tried sending a password reset link but encountered an error. Please try the "Forgot Password" option.'
                  );
                  toast.error('Email verification required');
                }
              } else {
                setError(
                  'Your admin account needs email verification. We have sent you a password reset link that will allow you to access your account immediately.'
                );
                toast.info('Password reset link sent');
              }
            } else {
              setError(
                'Invalid email or password. Please check your credentials and try again.'
              );
              toast.error('Login failed');
            }
          } catch (err) {
            console.error('Error during admin verification check:', err);
            setError(
              'The email or password you entered is incorrect. Please try again.'
            );
            toast.error('Login failed');
          }
        } else if (
          signInError.message.includes('rate limit') ||
          signInError.message.includes('too many requests')
        ) {
          // Handle rate limit errors clearly
          setError(
            'You have made too many requests. Please wait a few minutes before trying again.'
          );
          toast.error('Rate limit exceeded');
        } else if (signInError.message.includes('Invalid login credentials')) {
          setError(
            'The email or password you entered is incorrect. Please try again.'
          );
          toast.error('Login failed');
        } else {
          setError(signInError.message || 'Login failed. Please try again.');
          toast.error('Login failed');
        }

        setIsLoading(false);
        return;
      }

      console.log(
        'Login successful, user data:',
        signInData?.user?.id ? 'Available' : 'Not available'
      );

      // Login was successful, now check if the user is an admin
      const userId = signInData.user?.id;

      if (!userId) {
        setError(
          'Error: User ID not found after successful login. Please try again.'
        );
        toast.error('Login failed');
        setIsLoading(false);
        return;
      }

      // Check if the user is an admin by fetching their profile
      console.log('Checking if user is admin...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error(
          'Profile fetch error:',
          JSON.stringify(profileError, null, 2)
        );

        // Check for specific PostgreSQL error codes
        if (profileError.code === '42P17') {
          console.error('Infinite recursion detected in database policy');
          setError(
            'A database configuration issue was detected. Please contact the administrator and mention "infinite recursion in profile policies".'
          );
          toast.error('Database configuration error');
          return;
        }

        // Check if this is a "not found" error, indicating the profile doesn't exist
        if (
          profileError.code === 'PGRST116' ||
          profileError.message?.includes('not found')
        ) {
          console.log('Profile not found for user ID:', userId);

          // Create a basic profile for the user
          try {
            console.log('Attempting to create missing profile for user');
            const { error: createProfileError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                user_id: userId,
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (createProfileError) {
              console.error(
                'Failed to create missing profile:',
                createProfileError
              );
              setError(
                'Your account is missing profile information and we could not create one for you. Please contact support.'
              );
              toast.error('Profile setup required');
              return;
            }

            // Redirect to admin page after creating profile
            console.log('Created profile for admin, redirecting...');
            toast.success('Welcome! Your admin profile has been created.');
            router.push('/admin');
            return;
          } catch (createErr) {
            console.error('Unexpected error creating profile:', createErr);
            setError('Failed to setup your account. Please contact support.');
            toast.error('Profile setup failed');
            return;
          }
        } else {
          // For other profile errors
          setError(
            'Error retrieving your user profile. Please try again or contact support.'
          );
          toast.error('Login failed');
          return;
        }
      }

      // Check if profile exists but is empty (this can happen rarely)
      if (!profile) {
        console.error(
          'Profile is null or undefined after successful fetch with no error'
        );
        setError(
          'Your account profile could not be retrieved. Please contact support.'
        );
        toast.error('Profile error');
        return;
      }

      console.log('User profile found, role:', profile?.role);

      // Check if the user has an admin role
      if (profile?.role === 'admin') {
        console.log('Admin login successful, redirecting...');
        toast.success(
          `Welcome, ${profile.first_name}! Logged in as Administrator`
        );
        router.push('/admin');
      } else {
        setError(
          `Access denied. This login is for administrators only. Your role is: ${
            profile?.role || 'unknown'
          }`
        );
        toast.error('Access denied');

        // Sign out the user since they're not an admin
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border border-indigo-200">
          <CardHeader className="space-y-3 pb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-indigo-900">
              Admin Login
            </CardTitle>
            <CardDescription className="text-center text-base text-indigo-600">
              Secure access to the administration dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-indigo-900">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="admin@example.com"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            className="pl-10 h-11 border-indigo-200 focus:border-indigo-600 focus:ring-indigo-600"
                            {...field}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-600">
                            @
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-indigo-900">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type="password"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="pl-10 h-11 border-indigo-200 focus:border-indigo-600 focus:ring-indigo-600"
                            {...field}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-600">
                            <LockKeyhole className="h-4 w-4" />
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 mt-2 text-base font-medium bg-indigo-700 hover:bg-indigo-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Authenticating...' : 'Log in to Admin Panel'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-4 pb-8 border-t border-indigo-200">
            <div className="text-sm text-center">
              <Link
                href="/auth/forgot-password"
                className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="text-sm text-center">
              <Link
                href="/auth/admin/register"
                className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
              >
                Register new admin account
              </Link>
            </div>

            <div className="text-sm text-center pt-2">
              <Link
                href="/"
                className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
              >
                Back to main site
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
