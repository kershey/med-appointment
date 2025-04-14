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

    // Add timeout to prevent infinite loading state
    const loginTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Login timeout reached - cancelling login attempt');
        setIsLoading(false);
        setError('Login timed out. Please try again or use "Forgot Password".');
        toast.error('Login timeout');
      }
    }, 15000); // 15 seconds timeout

    try {
      const supabase = createClient();

      // Add logging for debugging
      console.log('Supabase client created, attempting login...');

      // First, try direct login without worrying about email confirmation
      console.log('Attempting direct signin with Supabase...');
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      // Add additional debugging for the sign-in response
      console.log(
        'Sign-in response received:',
        signInError ? 'Error occurred' : 'Success'
      );

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
            // Regular client can't use auth.admin - use the API endpoint instead
            console.log('Checking if admin via API endpoint...');

            // Call our server API to check and confirm the email
            const confirmResult = await confirmAdminEmail(data.email);
            console.log('Admin email confirmation result:', confirmResult);

            if (confirmResult.success) {
              console.log('Successfully confirmed admin email server-side');

              // Retry the login now
              console.log('Retrying login after email confirmation...');
              const { data: retrySignInData, error: retrySignInError } =
                await supabase.auth.signInWithPassword({
                  email: data.email,
                  password: data.password,
                });

              if (retrySignInError) {
                console.error('Retry login failed:', retrySignInError);
                setError(
                  'Login failed after email confirmation. Please try again or use "Forgot Password".'
                );
                toast.error('Login failed');
              } else if (retrySignInData?.user) {
                console.log('Login successful after email confirmation');
                // Proceed to admin dashboard
                toast.success('Welcome! Logged in as Administrator');
                router.push('/admin');
                return;
              }
            } else {
              // Email confirmation failed, suggest password reset
              console.log(
                'Email confirmation failed, suggesting password reset'
              );
              setError(
                'Your email is not confirmed. Please use the "Forgot Password" option to reset your password and verify your email.'
              );
              toast.error('Email verification required');
            }
          } catch (err) {
            console.error('Error during admin verification:', err);
            setError(
              'An error occurred while checking your account. Please try again later or use "Forgot Password".'
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
      clearTimeout(loginTimeout); // Clear the timeout when login completes
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
