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
import { createClient } from '@/lib/supabase/client';
import { Stethoscope } from 'lucide-react';

// Simplified validation schema
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

    email: z.string(),

    password: z.string().min(8, 'Password must be at least 8 characters'),

    confirmPassword: z.string(),

    phone: z.string().min(10, 'Please enter a valid phone number'),

    specialization: z.string().min(2, 'Please enter your specialization'),

    licenseNumber: z.string().min(2, 'Please enter your license number'),

    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function DoctorRegister() {
  const { signUp } = useAuth();
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
      phone: '',
      specialization: '',
      licenseNumber: '',
      agreeToTerms: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        specialization,
        licenseNumber,
      } = values;

      // Use the email as provided by the user
      console.log('Submitting registration with email:', email);

      // Create Supabase client for all operations
      const supabase = createClient();

      // Our improved signUp function handles email normalization internally
      const result = await signUp(email, password);

      if (result?.error) {
        setError(
          result.error.message || 'Failed to register. Please try again.'
        );
        console.error('Registration error details:', result.error);
        toast.error('Registration failed');
        setIsLoading(false);
        return;
      }

      // Wait a moment for Supabase to complete the registration process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the current session immediately after signup
      const { data: sessionData } = await supabase.auth.getSession();
      console.log(
        'Session after signup:',
        sessionData?.session ? 'Available' : 'Not available'
      );

      // Try to get user ID from session
      let userId = sessionData?.session?.user?.id;

      // If no session, check if we can get the user directly
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id;
        console.log(
          'User data after signup:',
          userData?.user ? 'Available' : 'Not available'
        );
      }

      // If still no userId, this likely means email confirmation is required
      if (!userId) {
        console.log(
          'No user ID available - likely requires email confirmation'
        );
        toast.success(
          'Registration successful! Please check your email to confirm your account.'
        );
        router.push('/auth/doctor/registration-success');
        setIsLoading(false);
        return;
      }

      console.log('Creating profile for user:', userId);

      // Create the profile with the user's information
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: email, // Original email from form
        phone: phone,
        role: 'doctor',
        specialization: specialization,
        license_number: licenseNumber,
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        setError('Error creating doctor profile. Please contact support.');
        toast.error('Registration incomplete');
        setIsLoading(false);
        return;
      }

      // Show a success message that works whether email confirmation is required or not
      if (sessionData?.session) {
        toast.success('Registration successful! Your account is ready to use.');
      } else {
        toast.success(
          'Registration successful! Please check your email to confirm your account.'
        );
      }

      router.push('/auth/doctor/registration-success');
    } catch (err) {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF2FD] to-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-lg shadow-lg border border-[#9BBEC8]/40 rounded-xl">
          <CardHeader className="text-center space-y-3 pb-4 border-b border-[#9BBEC8]/20">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-[#427D9D] flex items-center justify-center">
                <Stethoscope
                  className="h-6 w-6 text-white"
                  aria-hidden="true"
                />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#164863]">
              Doctor Registration
            </CardTitle>
            <CardDescription className="text-[#427D9D]">
              Create your account to join our medical platform
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

            <Alert className="mb-6 border border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                We support all standard email formats. If you encounter any
                validation issues, our system will automatically attempt to
                adjust your email format for compatibility with our
                authentication provider. Your original email will always be used
                for communication.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
              >
                <div>
                  <h3 className="text-base font-semibold text-[#164863] mb-4">
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
                              placeholder="doctor@example.com"
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

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+1 (555) 123-4567"
                              disabled={isLoading}
                              {...field}
                              autoComplete="tel"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#164863] mb-4">
                    Professional Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cardiology"
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
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="MD123456"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#164863] mb-4">
                    Account Security
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
                    <FormItem className="flex items-start space-x-3 bg-[#DDF2FD]/30 p-4 rounded-lg border border-[#9BBEC8]/30">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          id="terms"
                          className="h-4 w-4 rounded border-[#9BBEC8]"
                        />
                      </FormControl>
                      <div>
                        <FormLabel htmlFor="terms" className="text-sm">
                          I agree to the{' '}
                          <Link
                            href="/terms"
                            className="text-[#164863] hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link
                            href="/privacy"
                            className="text-[#164863] hover:underline"
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
                  className="w-full bg-[#164863] hover:bg-[#427D9D] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 text-sm text-center border-t border-[#9BBEC8]/30 p-6">
            <div>
              Already have an account?{' '}
              <Link
                href="/auth/doctor/login"
                className="text-[#164863] hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
            <div>
              Are you a patient?{' '}
              <Link
                href="/auth/register"
                className="text-[#164863] hover:underline font-medium"
              >
                Patient registration
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
