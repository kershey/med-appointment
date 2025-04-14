'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DoctorPendingApprovalPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading) {
      // If not logged in, redirect to login page
      if (!user) {
        router.push('/auth/doctor/login');
        return;
      }

      // If not a doctor, redirect to access denied
      if (profile?.role !== 'doctor') {
        router.push('/access-denied');
        return;
      }

      // If doctor is approved, redirect to dashboard
      if (profile?.is_approved === true) {
        router.push('/dashboard/doctor');
        return;
      }
    }
  }, [user, profile, loading, router]);

  const handleSignOut = async () => {
    try {
      setIsRedirecting(true);
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsRedirecting(false);
    }
  };

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF2FD] to-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF2FD] to-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md shadow-lg border border-[#9BBEC8]/40 rounded-xl">
          <CardHeader className="text-center space-y-3 pb-6 border-b border-[#9BBEC8]/20">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle
                  className="h-8 w-8 text-amber-600"
                  aria-hidden="true"
                />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-[#164863]">
              Account Pending Approval
            </CardTitle>
            <CardDescription className="text-[#427D9D]">
              Your doctor account is awaiting administrative verification
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ClipboardCheck className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">
                    Thank you for registering as a doctor on our platform. For
                    quality assurance and verification purposes, all doctor
                    accounts require manual approval by our administrative team.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-[#164863]">What happens next?</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>
                  Our team will review your credentials and licensing
                  information
                </li>
                <li>
                  You will receive an email notification once your account is
                  approved
                </li>
                <li>Approval typically takes 1-2 business days</li>
                <li>
                  You can still access and update your profile information while
                  waiting
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-2 border-t border-[#9BBEC8]/20">
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
                className="w-full"
              >
                View Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
            <div className="text-sm text-center text-muted-foreground mt-2">
              <p>
                For assistance, please contact{' '}
                <Link
                  href="mailto:support@medclinic.com"
                  className="text-[#164863] hover:underline"
                >
                  support@medclinic.com
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
