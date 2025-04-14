'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle,
  Mail,
  ArrowRight,
  CalendarClock,
  Users,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';

export default function RegistrationSuccess() {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ensureSignedOut = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        console.log(
          'Found active session on registration success page, signing out'
        );
        await supabase.auth.signOut();
      }
    };

    ensureSignedOut();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF2FD] to-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className={`transition-all duration-700 transform ${
            animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <Card className="w-full max-w-lg shadow-xl border border-[#9BBEC8] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#164863] via-[#427D9D] to-[#9BBEC8]"></div>

            <div className="absolute top-0 left-0 w-full h-20 bg-[#164863]/5 -z-10"></div>

            <CardHeader className="space-y-3 pb-8 pt-6">
              <div className="flex flex-col items-center">
                <div
                  className={`h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4 transition-all duration-700 transform ${
                    animateIn ? 'scale-100' : 'scale-50'
                  }`}
                >
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div className="text-center">
                  <CardTitle className="text-2xl font-bold text-[#164863]">
                    Registration Successful!
                  </CardTitle>
                  <CardDescription className="text-base text-[#427D9D] mt-2">
                    Your doctor account has been created
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-[#DDF2FD] p-5 rounded-lg border border-[#9BBEC8] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#427D9D]/10 rounded-bl-xl"></div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Mail className="h-6 w-6 text-[#427D9D]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#164863] text-lg mb-2">
                      Verify Your Email
                    </h3>
                    <p className="text-sm text-[#427D9D] leading-relaxed">
                      We&apos;ve sent a verification link to your email address.
                      Please check your inbox and click the link to activate
                      your account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="font-medium text-[#164863] text-lg flex items-center">
                  <CalendarClock className="mr-2 h-5 w-5 text-[#427D9D]" />
                  What happens next?
                </h3>

                <div className="pl-2 border-l-2 border-[#9BBEC8] space-y-4">
                  <div className="flex items-start space-x-4 relative">
                    <div className="absolute -left-[17px] top-0 h-7 w-7 rounded-full bg-[#164863] flex items-center justify-center text-white text-xs font-bold border-4 border-white">
                      1
                    </div>
                    <div className="ml-4 pt-1">
                      <h4 className="font-medium text-[#164863]">
                        Email Verification
                      </h4>
                      <p className="text-sm text-[#427D9D] mt-1">
                        Click the verification link we sent to your email
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 relative">
                    <div className="absolute -left-[17px] top-0 h-7 w-7 rounded-full bg-[#427D9D] flex items-center justify-center text-white text-xs font-bold border-4 border-white">
                      2
                    </div>
                    <div className="ml-4 pt-1">
                      <h4 className="font-medium text-[#164863]">
                        Admin Approval Required
                      </h4>
                      <p className="text-sm text-[#427D9D] mt-1">
                        Our administrative team will review and approve your
                        account
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 relative">
                    <div className="absolute -left-[17px] top-0 h-7 w-7 rounded-full bg-[#427D9D] flex items-center justify-center text-white text-xs font-bold border-4 border-white">
                      3
                    </div>
                    <div className="ml-4 pt-1">
                      <h4 className="font-medium text-[#164863]">
                        Email Notification
                      </h4>
                      <p className="text-sm text-[#427D9D] mt-1">
                        You&apos;ll receive an email when your account has been
                        approved
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 relative">
                    <div className="absolute -left-[17px] top-0 h-7 w-7 rounded-full bg-[#427D9D] flex items-center justify-center text-white text-xs font-bold border-4 border-white">
                      4
                    </div>
                    <div className="ml-4 pt-1">
                      <h4 className="font-medium text-[#164863]">
                        Dashboard Access
                      </h4>
                      <p className="text-sm text-[#427D9D] mt-1">
                        Once approved, you&apos;ll gain full access to the
                        doctor dashboard
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                <div className="bg-white p-4 rounded-lg border border-[#9BBEC8]/30 text-center">
                  <div className="flex justify-center mb-2">
                    <Users className="h-6 w-6 text-[#427D9D]" />
                  </div>
                  <h4 className="text-sm font-medium text-[#164863]">
                    Manage Patients
                  </h4>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#9BBEC8]/30 text-center">
                  <div className="flex justify-center mb-2">
                    <CalendarClock className="h-6 w-6 text-[#427D9D]" />
                  </div>
                  <h4 className="text-sm font-medium text-[#164863]">
                    Schedule Appointments
                  </h4>
                </div>

                <div className="bg-white p-4 rounded-lg border border-[#9BBEC8]/30 text-center">
                  <div className="flex justify-center mb-2">
                    <ClipboardList className="h-6 w-6 text-[#427D9D]" />
                  </div>
                  <h4 className="text-sm font-medium text-[#164863]">
                    Track Medical Records
                  </h4>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6 pb-8 border-t border-[#9BBEC8]">
              <Button
                asChild
                className="w-full h-12 bg-[#164863] hover:bg-[#427D9D] text-white font-medium shadow-md transition-all transform hover:scale-[1.01]"
              >
                <Link href="/auth/doctor/login">
                  Continue to Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <div className="text-xs text-center text-[#427D9D] mt-4">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <Link
                  href="/auth/resend-verification"
                  className="text-[#164863] hover:underline font-medium"
                >
                  resend verification email
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
