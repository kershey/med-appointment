'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
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
import { Stethoscope, LockKeyhole } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function DoctorLogin() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);

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
    setShowResendButton(false);
    console.log('Doctor login attempt with email:', data.email);

    try {
      const result = await signIn(data.email, data.password);
      console.log('Sign-in result:', result);

      if (result?.error) {
        console.error('Login error:', result.error);

        // Check for email confirmation error
        if (result.error.isEmailConfirmationError) {
          setError(
            result.error.message ||
              'Please confirm your email address before signing in.'
          );
          setShowResendButton(true);
        }
        // Check for doctor approval error (403 status code)
        else if (
          result.error.status === 403 &&
          result.error.message.includes('pending approval')
        ) {
          setError(result.error.message);
          toast.error('Account pending approval');
        }
        // Check for empty error object
        else if (
          Object.keys(result.error).length === 0 ||
          !result.error.message
        ) {
          console.error('Empty login error object received');
          setError(
            'Authentication failed. Please try again or contact support if the problem persists.'
          );
        } else {
          setError(
            result.error.message ||
              'Invalid email or password. Please check your credentials and try again.'
          );
        }

        toast.error('Login failed');
        setIsLoading(false);
        return;
      } else {
        // Login was successful, now check if the user is a doctor
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
          setError('Error accessing user account. Please try again.');
          toast.error('Login failed');
          setIsLoading(false);
          return;
        }

        // Check if the user is a doctor by fetching their profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError('Error verifying account type. Please try again.');
          toast.error('Login failed');
          return;
        }

        // Check if the user has a doctor role
        if (profile?.role === 'doctor') {
          console.log('Doctor login successful, redirecting...');
          toast.success('Logged in successfully');
          router.push('/dashboard');
        } else {
          setError('Access denied. This login is for doctors only.');
          toast.error('Access denied');

          // Sign out the user since they're not a doctor
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Add resend verification email function
  const resendVerificationEmail = async () => {
    try {
      setIsLoading(true);
      const email = form.getValues('email');
      if (!email) {
        toast.error('Please enter your email address');
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error resending verification:', error);
        toast.error(`Failed to resend: ${error.message}`);
      } else {
        setShowResendButton(false);
        toast.success('Verification email resent. Please check your inbox');
      }
    } catch (err) {
      console.error('Error resending verification:', err);
      toast.error('Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF2FD] to-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border border-[#9BBEC8]">
          <CardHeader className="space-y-3 pb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-[#427D9D] flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-[#164863]">
              Doctor Login
            </CardTitle>
            <CardDescription className="text-center text-base text-[#427D9D]">
              Enter your credentials to access the doctor dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
                {showResendButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full bg-white hover:bg-gray-100"
                    onClick={resendVerificationEmail}
                    disabled={isLoading}
                  >
                    Resend verification email
                  </Button>
                )}
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
                      <FormLabel className="text-base text-[#164863]">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="doctor@example.com"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            className="pl-10 h-11 border-[#9BBEC8] focus:border-[#427D9D] focus:ring-[#427D9D]"
                            {...field}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#427D9D]">
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
                      <FormLabel className="text-base text-[#164863]">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="••••••••"
                            type="password"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="pl-10 h-11 border-[#9BBEC8] focus:border-[#427D9D] focus:ring-[#427D9D]"
                            {...field}
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#427D9D]">
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
                  className="w-full h-11 mt-2 text-base font-medium bg-[#164863] hover:bg-[#427D9D] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Log in'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-4 pb-8 border-t border-[#9BBEC8]">
            <div className="text-sm text-center">
              <Link
                href="/auth/forgot-password"
                className="text-[#427D9D] hover:text-[#164863] hover:underline font-medium"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="text-sm text-center">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/doctor/register"
                className="text-[#427D9D] hover:text-[#164863] hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>

            <div className="text-sm text-center pt-2">
              Are you a patient?{' '}
              <Link
                href="/auth/login"
                className="text-[#427D9D] hover:text-[#164863] hover:underline font-medium"
              >
                Patient login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
