'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { AppointmentCalendar } from '@/components/dashboard/AppointmentCalendar';
import { PatientList } from '@/components/dashboard/PatientList';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import {
  Users,
  CalendarClock,
  ClipboardList,
  BadgeDollarSign,
  ArrowRight,
  Clock,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  lastVisit?: string;
}

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'canceled' | 'completed' | 'no_show';
}

interface AppointmentsByDate {
  [date: string]: Appointment[];
}

export default function DoctorDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    canceledAppointments: 0,
    totalPatients: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<AppointmentsByDate>({});

  useEffect(() => {
    // Check if user is authenticated and is a doctor
    if (!authLoading) {
      if (!user) {
        router.push('/auth/doctor/login');
        return;
      }

      if (profile?.role !== 'doctor') {
        router.push('/access-denied');
        return;
      }

      // Check if doctor is approved
      if (profile.is_approved === false) {
        // Redirect unapproved doctors to a pending approval page
        router.push('/auth/doctor/pending-approval');
        return;
      }

      // Only approved doctors can access this dashboard
      fetchDoctorData();
    }
  }, [user, profile, authLoading, router]);

  const fetchDoctorData = async () => {
    try {
      setIsLoading(true);

      // Fetch stats (simplified for pending doctors)
      setStats({
        totalAppointments: 124,
        upcomingAppointments: 15,
        completedAppointments: 98,
        canceledAppointments: 11,
        totalPatients: 85,
        totalRevenue: 12450,
        pendingPayments: 1250,
      });

      // Fetch mock patient data
      setPatients([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '(123) 456-7890',
          dateOfBirth: '1980-05-15',
          lastVisit: '2023-10-25',
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '(123) 456-7891',
          dateOfBirth: '1985-02-22',
          lastVisit: '2023-11-10',
        },
        {
          id: '3',
          firstName: 'Robert',
          lastName: 'Johnson',
          email: 'robert.j@example.com',
          phone: '(123) 456-7892',
          dateOfBirth: '1975-08-30',
          lastVisit: '2023-12-05',
        },
      ]);

      // Fetch mock appointment data
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      const todayStr = `${year}-${month}-${day}`;
      const tomorrowStr = `${year}-${month}-${String(
        today.getDate() + 1
      ).padStart(2, '0')}`;

      setAppointments({
        [todayStr]: [
          {
            id: '1',
            patientName: 'John Doe',
            time: '09:00 - 09:30',
            status: 'confirmed',
          },
          {
            id: '2',
            patientName: 'Jane Smith',
            time: '11:00 - 11:30',
            status: 'scheduled',
          },
          {
            id: '3',
            patientName: 'Robert Johnson',
            time: '14:30 - 15:00',
            status: 'confirmed',
          },
        ],
        [tomorrowStr]: [
          {
            id: '4',
            patientName: 'Emily Wilson',
            time: '10:00 - 10:30',
            status: 'scheduled',
          },
          {
            id: '5',
            patientName: 'Michael Brown',
            time: '13:00 - 13:30',
            status: 'scheduled',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading doctor dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Pending Approval Banner for Doctors */}
      {profile?.role === 'doctor' && profile?.is_approved === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Account Pending Approval
              </h3>
              <div className="mt-1 text-sm text-amber-700">
                <p>
                  Your doctor account is currently pending administrative
                  approval. Access to patient data and appointment scheduling is
                  restricted until your account is approved. Our team will
                  review your credentials and approve your account shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-2">
        <div className="flex items-center">
          <Stethoscope className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-3xl font-bold tracking-tight">
            Doctor Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground">
          Welcome, Dr. {profile?.first_name} {profile?.last_name}
        </p>
      </div>

      <DashboardStats stats={stats} isDoctor={true} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription>Shortcuts to common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-4 justify-start"
                  >
                    <Link href="/dashboard/doctor/appointments/create">
                      <CalendarClock className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">New Appointment</div>
                        <div className="text-xs text-muted-foreground">
                          Schedule a visit
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-4 justify-start"
                  >
                    <Link href="/dashboard/doctor/patients/add">
                      <Users className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Add Patient</div>
                        <div className="text-xs text-muted-foreground">
                          Create a new record
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-4 justify-start"
                  >
                    <Link href="/dashboard/doctor/medical-records/create">
                      <ClipboardList className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Medical Record</div>
                        <div className="text-xs text-muted-foreground">
                          Add diagnosis & notes
                        </div>
                      </div>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto py-4 justify-start"
                  >
                    <Link href="/dashboard/doctor/payments">
                      <BadgeDollarSign className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">Manage Payments</div>
                        <div className="text-xs text-muted-foreground">
                          Track & process
                        </div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      Today&apos;s Schedule
                    </CardTitle>
                    <CardDescription>
                      Your upcoming appointments
                    </CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="gap-1">
                    <Link href="/dashboard/doctor/appointments">
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.keys(appointments).length > 0 &&
                  appointments[Object.keys(appointments)[0]]?.length > 0 ? (
                    <>
                      {appointments[Object.keys(appointments)[0]]
                        .slice(0, 3)
                        .map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center p-3 border rounded"
                          >
                            <Clock className="h-9 w-9 text-muted-foreground mr-3" />
                            <div className="flex-1">
                              <div className="font-medium">
                                {appointment.patientName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {appointment.time}
                              </div>
                            </div>
                            <div>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  appointment.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : appointment.status === 'scheduled'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {appointment.status.charAt(0).toUpperCase() +
                                  appointment.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">
                        No appointments today
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your schedule is clear for the day
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <AppointmentCalendar appointments={appointments} isDoctor={true} />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <AppointmentCalendar appointments={appointments} isDoctor={true} />
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <PatientList patients={patients} />
        </TabsContent>

        <TabsContent value="finances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>
                Track your revenue, payments, and outstanding balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col p-4 border rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Total Revenue
                    </span>
                    <span className="text-2xl font-bold">
                      ${stats.totalRevenue.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      All time
                    </span>
                  </div>
                  <div className="flex flex-col p-4 border rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Pending Payments
                    </span>
                    <span className="text-2xl font-bold">
                      ${stats.pendingPayments.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Awaiting collection
                    </span>
                  </div>
                  <div className="flex flex-col p-4 border rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      This Month
                    </span>
                    <span className="text-2xl font-bold">$3,250</span>
                    <span className="text-xs text-green-600 mt-1">
                      +12% from last month
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">
                    Recent Transactions
                  </h3>

                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">John Doe</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            Consultation
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            May 15, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            $150.00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">Jane Smith</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            Follow-up
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            May 18, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            $85.00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">Robert Johnson</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            Procedure
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            May 20, 2023
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            $350.00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <Button asChild variant="outline">
                    <Link href="/dashboard/doctor/finances">
                      View Financial Reports
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
