'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
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
  Shield,
  Users,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminRegistrationSuccess() {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className={`transition-all duration-700 transform ${
            animateIn ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <Card className="w-full max-w-lg shadow-xl border border-indigo-200 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-indigo-900 via-indigo-600 to-indigo-400"></div>

            <div className="absolute top-0 left-0 w-full h-20 bg-indigo-900/5 -z-10"></div>

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
                  <CardTitle className="text-2xl font-bold text-indigo-900">
                    Admin Registration Successful!
                  </CardTitle>
                  <CardDescription className="text-base text-indigo-600 mt-2">
                    Your administrator account has been created
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-600/10 rounded-bl-xl"></div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Mail className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-indigo-900 text-lg mb-2">
                      Verify Your Email
                    </h3>
                    <p className="text-sm text-indigo-700 leading-relaxed">
                      We&apos;ve sent a verification link to your email address.
                      Please check your inbox and click the link to activate
                      your administrator account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="font-medium text-indigo-900 text-lg flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-indigo-600" />
                  Admin Dashboard Features
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-lg border border-indigo-200/30 text-center">
                    <div className="flex justify-center mb-2">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-medium text-indigo-900">
                      User Management
                    </h4>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-indigo-200/30 text-center">
                    <div className="flex justify-center mb-2">
                      <Shield className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-medium text-indigo-900">
                      Doctor Approval
                    </h4>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-indigo-200/30 text-center">
                    <div className="flex justify-center mb-2">
                      <Settings className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-medium text-indigo-900">
                      System Settings
                    </h4>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-200">
                <h3 className="font-medium text-indigo-900 mb-2">
                  Important Security Notice
                </h3>
                <p className="text-sm text-indigo-700">
                  As an administrator, you have complete access to manage the
                  medical clinic system. Please keep your login credentials
                  secure and follow your organization&apos;s security protocols.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6 pb-8 border-t border-indigo-200">
              <Button
                asChild
                className="w-full h-12 bg-indigo-700 hover:bg-indigo-800 text-white font-medium shadow-md transition-all transform hover:scale-[1.01]"
              >
                <Link href="/auth/admin/login">
                  Continue to Admin Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <div className="text-xs text-center text-indigo-600 mt-4">
                Didn&apos;t receive the email? Check your spam folder or{' '}
                <Link
                  href="/auth/resend-verification"
                  className="text-indigo-900 hover:underline font-medium"
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
