'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Search,
  Star,
  Clock,
  MapPin,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type DoctorWithProfile = {
  id: string;
  specialty: string;
  consultation_fee: number;
  bio?: string;
  profile: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  full_name: string;
  ratings?: number;
};

export default function BookAppointment() {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<DoctorWithProfile[]>(
    []
  );
  const [selectedDoctor, setSelectedDoctor] =
    useState<DoctorWithProfile | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors based on search term
  useEffect(() => {
    if (doctors) {
      const filtered = doctors.filter((doctor) => {
        const fullName = doctor.full_name.toLowerCase();
        const specialty = doctor.specialty?.toLowerCase() || '';

        return (
          fullName.includes(searchTerm.toLowerCase()) ||
          specialty.includes(searchTerm.toLowerCase())
        );
      });

      setFilteredDoctors(filtered);
    }
  }, [searchTerm, doctors]);

  async function fetchDoctors() {
    try {
      setLoadingDoctors(true);
      // Use a simpler join approach
      const { data, error } = await supabase
        .from('doctors')
        .select(
          `
          id,
          specialty,
          consultation_fee,
          bio,
          profiles!inner(first_name, last_name, avatar_url, is_approved)
        `
        )
        .eq('profiles.is_approved', true);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (data) {
        console.log('Raw doctor data:', JSON.stringify(data, null, 2));

        // Transform the data to include the full name
        const formattedDoctors = data.map((doctor) => {
          // Access the profile data correctly - handle both array and object formats
          let profileData;

          if (Array.isArray(doctor.profiles)) {
            // If profiles is an array, use the first item
            profileData = doctor.profiles[0] || {};
          } else {
            // If profiles is an object, use it directly
            profileData = doctor.profiles || {};
          }

          return {
            id: doctor.id,
            specialty: doctor.specialty,
            consultation_fee: doctor.consultation_fee,
            bio: doctor.bio,
            profile: {
              first_name: profileData.first_name || '',
              last_name: profileData.last_name || '',
              avatar_url: profileData.avatar_url,
            },
            full_name: `Dr. ${profileData.first_name || ''} ${profileData.last_name || ''}`,
            ratings: 4.6, // Mock rating for all doctors
          };
        });

        console.log('Formatted doctors:', formattedDoctors);
        setDoctors(formattedDoctors);
        setFilteredDoctors(formattedDoctors);
      } else {
        console.log('No data returned from the query');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  }

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
            .eq('doctor_id', selectedDoctor.id)
            .eq('appointment_date', formattedDate);

        if (appointmentsError) throw appointmentsError;

        // Get the day of week (0-6, 0 = Sunday)
        const dayOfWeek = date.getDay();

        // Get the doctor's schedule for this day of week
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('doctor_schedules')
          .select('start_time, end_time')
          .eq('doctor_id', selectedDoctor.id)
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

  const openBookingModal = (doctor: DoctorWithProfile) => {
    if (!user) {
      toast.error('Please log in to book an appointment');
      router.push('/auth/login');
      return;
    }

    setSelectedDoctor(doctor);
    setDate(undefined);
    setTime('');
    setReason('');
    setIsModalOpen(true);
  };

  const handleBookAppointment = async () => {
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
          doctor_id: selectedDoctor.id,
          appointment_date: format(date, 'yyyy-MM-dd'),
          start_time: time,
          end_time: endTime,
          reason,
          status: 'scheduled',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert({
        appointment_id: data.id,
        amount: selectedDoctor.consultation_fee,
        status: 'pending',
      });

      if (paymentError) throw paymentError;

      toast.success('Appointment booked successfully');
      setIsModalOpen(false);
      router.push('/patient/appointments');
    } catch (error: unknown) {
      console.error('Error booking appointment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to book appointment';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
          <Card className="w-full max-w-md shadow-lg border-0">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Login Required
              </CardTitle>
              <CardDescription className="text-center">
                Please login to book an appointment
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => router.push('/')}>
                Go Home
              </Button>
              <Button onClick={() => router.push('/auth/login')}>Login</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl font-medium mb-4 text-gray-900">
            Find a Doctor
          </h1>
          <p className="text-gray-600 mb-6">
            Book an appointment with a specialist that meets your needs.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>
        </div>

        {loadingDoctors ? (
          <div className="flex justify-center items-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center p-10 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              No doctors found. Please try a different search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="overflow-hidden border border-gray-100 shadow-sm hover:shadow transition-shadow duration-200"
              >
                <div className="aspect-w-3 aspect-h-2 bg-gray-50">
                  {doctor.profile.avatar_url ? (
                    <img
                      src={doctor.profile.avatar_url}
                      alt={`${doctor.full_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[150px] bg-gray-50">
                      <span className="text-3xl font-bold text-gray-300">
                        {doctor.profile.first_name[0]}
                        {doctor.profile.last_name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {doctor.full_name}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {doctor.specialty}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Star
                        className="h-3.5 w-3.5 text-yellow-500 mr-1"
                        fill="#EAB308"
                      />
                      <span className="text-sm font-medium text-gray-600">
                        {doctor.ratings}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                    onClick={() => openBookingModal(doctor)}
                  >
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Booking Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <DialogTitle className="text-xl font-medium text-gray-900">
              Book Appointment
            </DialogTitle>
            {selectedDoctor && (
              <div className="mt-2">
                <p className="text-gray-900">{selectedDoctor.full_name}</p>
                <p className="text-gray-500 text-sm">
                  {selectedDoctor.specialty}
                </p>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label
                  htmlFor="date"
                  className="text-sm font-medium text-gray-700"
                >
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-gray-400'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => {
                        const now = new Date();
                        const today = new Date(
                          now.getFullYear(),
                          now.getMonth(),
                          now.getDate()
                        );
                        return (
                          date < today ||
                          (date.getDate() === today.getDate() &&
                            date.getMonth() === today.getMonth() &&
                            date.getFullYear() === today.getFullYear() &&
                            now.getHours() >= 18)
                        );
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="time"
                  className="text-sm font-medium text-gray-700"
                >
                  Time
                </Label>
                <select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !date || loadingTimes || availableTimes.length === 0
                  }
                >
                  <option value="">Select a time</option>
                  {availableTimes.map((timeSlot) => (
                    <option key={timeSlot} value={timeSlot}>
                      {timeSlot}
                    </option>
                  ))}
                </select>
                {loadingTimes && (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
                    <p className="text-sm text-gray-500">Loading times...</p>
                  </div>
                )}
                {!loadingTimes && date && availableTimes.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No available times for this date
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="reason"
                  className="text-sm font-medium text-gray-700"
                >
                  Reason for Visit
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe your symptoms or reason"
                  className="resize-none min-h-[80px] border-gray-200"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookAppointment}
              disabled={!date || !time || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full mr-2"></div>
                  <span>Booking</span>
                </div>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
