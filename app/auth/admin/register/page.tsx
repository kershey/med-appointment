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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Shield } from 'lucide-react';

// Admin registration schema
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters'),

    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters'),

    email: z.string().email('Please enter a valid email address'),

    password: z.string().min(8, 'Password must be at least 8 characters'),

    confirmPassword: z.string(),

    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AdminRegister() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const { firstName, lastName, email, password } = values;

      console.log(
        'Starting admin account creation process using server API...'
      );

      // Instead of directly using Supabase client, call our server-side API
      const response = await fetch('/api/auth/admin-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Admin registration error:', result.error);
        setError(result.error || 'Failed to register. Please try again.');
        toast.error('Registration failed');
        setIsLoading(false);
        return;
      }

      // Registration successful
      console.log(
        'Admin account created successfully without email confirmation'
      );
      toast.success('Admin account created successfully!');

      // Redirect to login page with success message
      toast.info('You can now log in with your admin credentials');

      setTimeout(() => {
        router.push('/auth/admin/login');
      }, 2000);
    } catch (err) {
      console.error('Unexpected error during registration:', err);
      setError(
        `Registration failed: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-lg shadow-lg border border-indigo-200 rounded-xl">
          <CardHeader className="text-center space-y-3 pb-4 border-b border-indigo-200/20">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-indigo-900">
              Admin Registration
            </CardTitle>
            <CardDescription className="text-indigo-600">
              Create your administrator account
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {error && (
              <Alert
                variant="destructive"
                className="mb-6 border border-red-200"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="mb-6 border border-indigo-200 bg-indigo-50">
              <AlertDescription className="text-indigo-900">
                Admin accounts have full control over the system. Please ensure
                this registration is authorized by your organization.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
              >
                <div>
                  <h3 className="text-base font-semibold text-indigo-900 mb-4">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="admin@example.com"
                              type="email"
                              disabled={isLoading}
                              {...field}
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-indigo-900 mb-4">
                    Security
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              disabled={isLoading}
                              {...field}
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              disabled={isLoading}
                              {...field}
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 bg-indigo-50/30 p-4 rounded-lg border border-indigo-200/30">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          id="terms"
                          className="h-4 w-4 rounded border-indigo-200"
                        />
                      </FormControl>
                      <div>
                        <FormLabel htmlFor="terms" className="text-sm">
                          I agree to the{' '}
                          <Link
                            href="/terms"
                            className="text-indigo-700 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link
                            href="/privacy"
                            className="text-indigo-700 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Privacy Policy
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-indigo-700 hover:bg-indigo-800 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Admin Account'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-sm text-center border-t border-indigo-200/30 p-6">
            <div>
              Already have an account?{' '}
              <Link
                href="/auth/admin/login"
                className="text-indigo-700 hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
            <div>
              <Link
                href="/"
                className="text-indigo-700 hover:underline font-medium"
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
