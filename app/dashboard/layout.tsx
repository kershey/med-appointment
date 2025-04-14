'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Settings,
  LogOut,
  User,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const isPatient = profile.role === 'patient';
  const isDoctor = profile.role === 'doctor';
  const isStaff = profile.role === 'staff';
  const isAdmin = profile.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-50 border-r border-slate-200 p-4 hidden md:block">
          <div className="space-y-1">
            <div className="px-3 py-2">
              <div className="font-semibold">
                {profile.first_name} {profile.last_name}
              </div>
              <div className="text-sm text-slate-500 capitalize">
                {profile.role}
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              {/* Common Links for Everyone */}
              <Link
                href="/appointments"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
              >
                <Calendar className="h-4 w-4" />
                Appointments
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>

              {/* Patient-specific Links */}
              {isPatient && (
                <>
                  <Link
                    href="/patient/medical-records"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
                  >
                    <FileText className="h-4 w-4" />
                    Medical Records
                  </Link>
                </>
              )}

              {/* Doctor-specific Links */}
              {isDoctor && (
                <>
                  <Link
                    href="/doctor/schedule"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
                  >
                    <Clock className="h-4 w-4" />
                    My Schedule
                  </Link>
                  <Link
                    href="/doctor/patients"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
                  >
                    <Users className="h-4 w-4" />
                    Patients
                  </Link>
                </>
              )}

              {/* Admin-specific Links */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin/doctor-approval"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
                  >
                    <Users className="h-4 w-4" />
                    Doctor Approval
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
                  >
                    <Settings className="h-4 w-4" />
                    System Settings
                  </Link>
                </>
              )}

              {/* Staff-specific Links */}
              {isStaff && (
                <>
                  <Link
                    href="/staff/appointments"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
                  >
                    <Calendar className="h-4 w-4" />
                    Manage Appointments
                  </Link>
                  <Link
                    href="/staff/patients"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:bg-slate-100"
                  >
                    <Users className="h-4 w-4" />
                    Patients
                  </Link>
                </>
              )}

              {/* Logout Button */}
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-900 hover:bg-slate-100 px-3 py-2 h-auto"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
