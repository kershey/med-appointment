'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Doctor } from '@/types/database.types';
import { toast } from 'sonner';

export default function BookAppointment() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const supabase = createClient();

  // Fetch doctors on component mount
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const { data, error } = await supabase.from('doctors').select(`
            id,
            specialty,
            consultation_fee,
            profiles(first_name, last_name)
          `);

        if (error) throw error;

        if (data) {
          // Transform the data to include the full name
          const formattedDoctors = data.map((doctor) => ({
            ...doctor,
            full_name: `Dr. ${doctor.profiles.first_name} ${doctor.profiles.last_name}`,
            profile: doctor.profiles,
          }));

          setDoctors(formattedDoctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error('Failed to load doctors');
      } finally {
        setLoadingDoctors(false);
      }
    }

    fetchDoctors();
  }, [supabase]);

  // Fetch available time slots when date and doctor change
  useEffect(() => {
    if (!date || !selectedDoctor) {
      setAvailableTimes([]);
      return;
    }

    async function fetchAvailableTimeSlots() {
      setLoadingTimes(true);
      try {
        // Format the date as YYYY-MM-DD for the query
        const formattedDate = format(date, 'yyyy-MM-dd');

        // First, check for any existing appointments on this date
        const { data: existingAppointments, error: appointmentsError } =
          await supabase
            .from('appointments')
            .select('start_time')
            .eq('doctor_id', selectedDoctor)
            .eq('appointment_date', formattedDate);

        if (appointmentsError) throw appointmentsError;

        // Get the day of week (0-6, 0 = Sunday)
        const dayOfWeek = date.getDay();

        // Get the doctor's schedule for this day of week
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('doctor_schedules')
          .select('start_time, end_time')
          .eq('doctor_id', selectedDoctor)
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true);

        if (scheduleError) throw scheduleError;

        if (scheduleData && scheduleData.length > 0) {
          // For simplicity, we'll just create 30-minute slots between start and end time
          // In a real app, you would need more sophisticated logic
          const slots = [];

          for (const schedule of scheduleData) {
            // Parse the start and end times
            const [startHour, startMinute] = schedule.start_time
              .split(':')
              .map(Number);
            const [endHour, endMinute] = schedule.end_time
              .split(':')
              .map(Number);

            // Create 30-minute slots
            for (
              let h = startHour;
              h < endHour || (h === endHour && startMinute < endMinute);
              h++
            ) {
              for (let m = h === startHour ? startMinute : 0; m < 60; m += 30) {
                if (h === endHour && m >= endMinute) break;

                const timeSlot = `${String(h).padStart(2, '0')}:${String(
                  m
                ).padStart(2, '0')}`;

                // Check if this slot is already booked
                const isBooked = existingAppointments?.some((appointment) =>
                  appointment.start_time.startsWith(timeSlot)
                );

                if (!isBooked) {
                  slots.push(timeSlot);
                }
              }
            }
          }

          setAvailableTimes(slots);
        } else {
          setAvailableTimes([]);
          toast.info('No available time slots for this day');
        }
      } catch (error) {
        console.error('Error fetching available times:', error);
        toast.error('Failed to load available time slots');
        setAvailableTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    }

    fetchAvailableTimeSlots();
  }, [date, selectedDoctor, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to book an appointment');
      router.push('/auth/login');
      return;
    }

    if (!date || !time || !selectedDoctor) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate end time (30 minutes after start time)
      const [hours, minutes] = time.split(':').map(Number);
      let endHours = hours;
      let endMinutes = minutes + 30;

      if (endMinutes >= 60) {
        endHours += 1;
        endMinutes -= 60;
      }

      const endTime = `${String(endHours).padStart(2, '0')}:${String(
        endMinutes
      ).padStart(2, '0')}`;

      // Create appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctor,
          appointment_date: format(date, 'yyyy-MM-dd'),
          start_time: time,
          end_time: endTime,
          reason,
          status: 'scheduled',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Find the doctor's fee for the payment record
      const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);
      const consultation_fee = selectedDoctorData?.consultation_fee || 0;

      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert({
        appointment_id: data.id,
        amount: consultation_fee,
        status: 'pending',
      });

      if (paymentError) throw paymentError;

      toast.success('Appointment booked successfully');
      router.push('/patient/appointments');
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      toast.error(error.message || 'Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Login Required</CardTitle>
              <CardDescription>
                You need to be logged in to book an appointment
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => router.push('/auth/login')}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Book an Appointment</h1>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Your Visit</CardTitle>
              <CardDescription>
                Fill in the details below to book your appointment
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="doctor">Select Doctor</Label>
                  <select
                    id="doctor"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loadingDoctors || isLoading}
                    required
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                  {loadingDoctors && (
                    <p className="text-sm text-muted-foreground">
                      Loading doctors...
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                          )}
                          disabled={!selectedDoctor || isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => {
                            // Disable past dates and dates more than 30 days in the future
                            const now = new Date();
                            now.setHours(0, 0, 0, 0);
                            const maxDate = new Date();
                            maxDate.setDate(maxDate.getDate() + 30);
                            return date < now || date > maxDate;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Select Time</Label>
                    <select
                      id="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!date || loadingTimes || isLoading}
                      required
                    >
                      <option value="">Select a time slot</option>
                      {availableTimes.map((timeSlot) => (
                        <option key={timeSlot} value={timeSlot}>
                          {timeSlot}
                        </option>
                      ))}
                    </select>
                    {loadingTimes && (
                      <p className="text-sm text-muted-foreground">
                        Loading available times...
                      </p>
                    )}
                    {date && availableTimes.length === 0 && !loadingTimes && (
                      <p className="text-sm text-muted-foreground">
                        No available time slots for this date
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly describe your symptoms or reason for consultation"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Booking...' : 'Book Appointment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
