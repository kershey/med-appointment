'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Appointment } from '@/types/database.types';
import {
  Calendar,
  Clock,
  User,
  Users,
  FileText,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState({
    appointments: 0,
    upcomingAppointments: 0,
    doctors: 0,
    patients: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !profile) return;

      setIsLoading(true);
      const supabase = createClient();

      try {
        // Fetch different stats based on user role
        if (profile.role === 'patient') {
          // Get appointment stats for patient
          const { data: appointmentsData, error: appointmentsError } =
            await supabase
              .from('appointments')
              .select('*')
              .eq('patient_id', user.id);

          const { data: upcomingData, error: upcomingError } = await supabase
            .from('appointments')
            .select('*')
            .eq('patient_id', user.id)
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .in('status', ['scheduled', 'confirmed']);

          const { data: doctorsData, error: doctorsError } = await supabase
            .from('doctors')
            .select('*');

          if (!appointmentsError && !upcomingError && !doctorsError) {
            setStats({
              appointments: appointmentsData?.length || 0,
              upcomingAppointments: upcomingData?.length || 0,
              doctors: doctorsData?.length || 0,
              patients: 0,
            });
          }

          // Get recent appointments
          const { data: recentData, error: recentError } = await supabase
            .from('appointments')
            .select('*, doctor(*, profile(*))')
            .eq('patient_id', user.id)
            .order('appointment_date', { ascending: false })
            .limit(5);

          if (!recentError && recentData) {
            setRecentAppointments(recentData as unknown as Appointment[]);
          }
        } else if (profile.role === 'doctor') {
          // Get doctor ID
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('id')
            .eq('profile_id', user.id)
            .single();

          if (doctorData) {
            const doctorId = doctorData.id;

            // Get appointment stats for doctor
            const { data: appointmentsData } = await supabase
              .from('appointments')
              .select('*')
              .eq('doctor_id', doctorId);

            const { data: upcomingData } = await supabase
              .from('appointments')
              .select('*')
              .eq('doctor_id', doctorId)
              .gte('appointment_date', new Date().toISOString().split('T')[0])
              .in('status', ['scheduled', 'confirmed']);

            const { data: patientsData } = await supabase
              .from('appointments')
              .select('patient_id')
              .eq('doctor_id', doctorId)
              .limit(1000);

            // Count unique patients
            const uniquePatients = new Set(
              patientsData?.map((a) => a.patient_id)
            );

            setStats({
              appointments: appointmentsData?.length || 0,
              upcomingAppointments: upcomingData?.length || 0,
              doctors: 0,
              patients: uniquePatients.size,
            });

            // Get recent appointments
            const { data: recentData } = await supabase
              .from('appointments')
              .select('*, patient:profiles(*)')
              .eq('doctor_id', doctorId)
              .order('appointment_date', { ascending: false })
              .limit(5);

            if (recentData) {
              setRecentAppointments(recentData as unknown as Appointment[]);
            }
          }
        } else if (profile.role === 'admin' || profile.role === 'staff') {
          // Get system-wide stats
          const { data: appointmentsData } = await supabase
            .from('appointments')
            .select('*');

          const { data: upcomingData } = await supabase
            .from('appointments')
            .select('*')
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .in('status', ['scheduled', 'confirmed']);

          const { data: doctorsData } = await supabase
            .from('doctors')
            .select('*');

          const { data: patientsData } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'patient');

          setStats({
            appointments: appointmentsData?.length || 0,
            upcomingAppointments: upcomingData?.length || 0,
            doctors: doctorsData?.length || 0,
            patients: patientsData?.length || 0,
          });

          // Get recent appointments
          const { data: recentData } = await supabase
            .from('appointments')
            .select('*, doctor(*, profile(*)), patient:profiles(*)')
            .order('appointment_date', { ascending: false })
            .limit(5);

          if (recentData) {
            setRecentAppointments(recentData as unknown as Appointment[]);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && profile && !loading) {
      fetchDashboardData();
    }
  }, [user, profile, loading]);

  // Show loading state while data is being fetched
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user/profile, this should be handled by the layout
  if (!user || !profile) {
    return null;
  }

  // Format the appointment date and time
  const formatAppointment = (appointment: Appointment) => {
    const date = new Date(appointment.appointment_date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return {
      date: formattedDate,
      time: `${appointment.start_time} - ${appointment.end_time}`,
      status: appointment.status,
    };
  };

  // Different greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {profile.first_name}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your medical dashboard
        </p>
      </div>

      {/* Dashboard cards based on user role */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Appointments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.upcomingAppointments}
            </div>
          </CardContent>
        </Card>

        {(profile.role === 'admin' ||
          profile.role === 'staff' ||
          profile.role === 'patient') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Doctors
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.doctors}</div>
            </CardContent>
          </Card>
        )}

        {(profile.role === 'admin' ||
          profile.role === 'staff' ||
          profile.role === 'doctor') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.patients}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Appointments */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>Your most recent appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => {
                  const formatted = formatAppointment(appointment);
                  const statusColorMap: Record<string, string> = {
                    scheduled: 'text-blue-500',
                    confirmed: 'text-green-500',
                    canceled: 'text-red-500',
                    completed: 'text-gray-500',
                    no_show: 'text-amber-500',
                  };

                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between border-b border-gray-100 pb-4"
                    >
                      <div>
                        <div className="font-medium">
                          {profile.role === 'patient' &&
                            appointment.doctor &&
                            `Dr. ${appointment.doctor.profile?.first_name} ${appointment.doctor.profile?.last_name}`}
                          {(profile.role === 'doctor' ||
                            profile.role === 'admin' ||
                            profile.role === 'staff') &&
                            appointment.patient &&
                            `${appointment.patient.first_name} ${appointment.patient.last_name}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatted.date} • {formatted.time}
                        </div>
                      </div>
                      <div
                        className={`capitalize text-sm font-medium ${
                          statusColorMap[appointment.status] || 'text-gray-500'
                        }`}
                      >
                        {appointment.status.replace('_', ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No recent appointments found
              </div>
            )}

            <div className="mt-4">
              <Link
                href="/appointments"
                className="text-sm text-primary hover:underline"
              >
                View all appointments →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific action buttons */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profile.role === 'patient' && (
          <>
            <Link href="/appointments/new">
              <Card className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-base font-medium">
                    Book Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Schedule a new appointment with a doctor
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/patient/medical-records">
              <Card className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <FileText className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-base font-medium">
                    Medical Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View your medical history and records
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/payment/history">
              <Card className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <DollarSign className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-base font-medium">
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View your payment history and receipts
                  </p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}

        {profile.role === 'doctor' && (
          <>
            <Link href="/doctor/schedule">
              <Card className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Clock className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-base font-medium">
                    Manage Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Set your availability and working hours
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/doctor/patients">
              <Card className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-base font-medium">
                    My Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage your patient list
                  </p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}

        {(profile.role === 'admin' || profile.role === 'staff') && (
          <>
            <Link href="/admin/users">
              <Card className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-base font-medium">
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Manage users, doctors, and patients
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/appointments">
              <Card className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  <CardTitle className="text-base font-medium">
                    Appointment Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage all appointments
                  </p>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
