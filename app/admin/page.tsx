'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Doctor } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter, usePathname } from 'next/navigation';
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  RefreshCw,
  Settings,
  FileText,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

type DashboardStats = {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  pendingDoctorApprovals: number;
};

type DoctorWithProfile = Doctor & {
  profile: Profile;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    pendingDoctorApprovals: 0,
  });
  const [pendingDoctors, setPendingDoctors] = useState<DoctorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchDashboardData();

    // Refresh data every 5 minutes
    const intervalId = setInterval(
      () => {
        fetchDashboardData(false);
      },
      5 * 60 * 1000
    );

    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const supabase = createClient();

    try {
      // Get total doctors count
      const { count: doctorsCount, error: doctorsError } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true });

      // Get total patients count
      const { count: patientsCount, error: patientsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'patient');

      // Get total appointments count
      const { count: appointmentsCount, error: appointmentsError } =
        await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true });

      // Get pending doctor approvals count
      const { count: pendingDoctorsCount, error: pendingDoctorsError } =
        await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'doctor')
          .eq('is_approved', false);

      // Get pending doctor details
      const { data: pendingDoctorsData, error: pendingDoctorsDataError } =
        await supabase
          .from('doctors')
          .select(
            `
          *,
          profile:profiles(*)
        `
          )
          .eq('profile.role', 'doctor')
          .eq('profile.is_approved', false)
          .order('created_at', { ascending: false })
          .limit(5);

      if (
        doctorsError ||
        patientsError ||
        appointmentsError ||
        pendingDoctorsError ||
        pendingDoctorsDataError
      ) {
        console.error('Error fetching dashboard data:', {
          doctorsError,
          patientsError,
          appointmentsError,
          pendingDoctorsError,
          pendingDoctorsDataError,
        });
      } else {
        setStats({
          totalDoctors: doctorsCount || 0,
          totalPatients: patientsCount || 0,
          totalAppointments: appointmentsCount || 0,
          pendingDoctorApprovals: pendingDoctorsCount || 0,
        });

        // Format the pending doctors data
        if (pendingDoctorsData) {
          const formattedPendingDoctors = pendingDoctorsData.map((doc) => ({
            ...doc,
            profile: doc.profile as Profile,
          })) as DoctorWithProfile[];

          setPendingDoctors(formattedPendingDoctors);
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const navigateToDoctorApproval = () => {
    router.push('/admin/doctor-approval');
  };

  const handleRefresh = () => {
    fetchDashboardData(false);
  };

  // Admin sidebar links
  const adminSidebarLinks = [
    { href: '/admin', label: 'Dashboard', icon: <Users size={18} /> },
    {
      href: '/admin/doctor-approval',
      label: 'Doctor Approvals',
      icon: <UserCheck size={18} />,
    },
    {
      href: '/admin/users',
      label: 'User Management',
      icon: <Shield size={18} />,
    },
    {
      href: '/admin/appointments',
      label: 'Appointments',
      icon: <Calendar size={18} />,
    },
    { href: '/admin/reports', label: 'Reports', icon: <FileText size={18} /> },
    {
      href: '/admin/settings',
      label: 'Settings',
      icon: <Settings size={18} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Admin Sidebar */}
      <div className="hidden lg:block w-64 border-r min-h-[calc(100vh-73px)]">
        <div className="p-4">
          <h2 className="text-lg font-medium mb-4">Admin Panel</h2>
          <nav className="space-y-1">
            {adminSidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors`}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Overview of your medical clinic system
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>

          {/* Dashboard Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Doctors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDoctors}</div>
                <p className="text-xs text-muted-foreground">
                  Active healthcare providers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground">
                  Registered patients
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalAppointments}
                </div>
                <p className="text-xs text-muted-foreground">
                  All scheduled sessions
                </p>
              </CardContent>
            </Card>

            <Card
              className={
                stats.pendingDoctorApprovals > 0
                  ? 'border-orange-300 bg-orange-50'
                  : ''
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approvals
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendingDoctorApprovals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Doctor accounts awaiting review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Doctor Approvals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Doctor Approval Requests</CardTitle>
                  <CardDescription>
                    Recently registered doctors waiting for account approval
                  </CardDescription>
                </div>
                <Button onClick={navigateToDoctorApproval}>View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingDoctors.length > 0 ? (
                <div className="space-y-4">
                  {pendingDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <h3 className="font-medium">
                          Dr. {doctor.profile.first_name}{' '}
                          {doctor.profile.last_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{doctor.specialty}</span>
                          <span>•</span>
                          <span>License: {doctor.license_number}</span>
                        </div>
                        <div className="mt-2">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/doctor-approval?id=${doctor.id}`)
                        }
                      >
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No pending doctor approvals
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => router.push('/admin/users')}
                >
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Manage Users</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => router.push('/admin/reports')}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span>View Reports</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => router.push('/admin/settings')}
                >
                  <Settings className="h-6 w-6 mb-2" />
                  <span>System Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
